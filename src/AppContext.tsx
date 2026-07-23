import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, SubscriptionItem, Order, Address } from './types';
import { PRODUCTS, COUPONS } from './data';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot, query, collection, where, doc, setDoc } from 'firebase/firestore';
import { 
  saveUserProfile, 
  fetchUserProfile, 
  saveAddress, 
  deleteAddressFromDb, 
  fetchAddressesFromDb,
  saveSubscriptionToDb, 
  updateSubscriptionStatusInDb, 
  deleteSubscriptionFromDb, 
  saveOrderToDb, 
  updateOrderStatusInDb,
  cancelOrderInDb,
  findNearestShop
} from './utils/firebaseHelpers';

interface AppContextProps {
  products: Product[];
  cart: CartItem[];
  wishlist: string[]; // Product IDs
  subscriptions: SubscriptionItem[];
  orders: Order[];
  addresses: Address[];
  currentUser: {
    name: string;
    email: string;
    phone: string;
    avatar: string;
    rewardPoints: number;
    role?: 'customer' | 'shop_admin' | 'super_admin';
    shopId?: string;
  } | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isShopAdmin: boolean;
  darkMode: boolean;
  activeCoupon: { code: string; discount: number } | null;
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  recentlyViewed: string[]; // Product IDs
  
  // Cart Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Wishlist Actions
  toggleWishlist: (productId: string) => void;
  
  // Subscription Actions
  addSubscription: (subscription: Omit<SubscriptionItem, 'id' | 'status'>) => void;
  updateSubscriptionStatus: (subscriptionId: string, status: 'active' | 'paused' | 'skipped', pausedUntil?: string) => void;
  deleteSubscription: (subscriptionId: string) => void;
  updateSubscriptionDetails: (
    subscriptionId: string,
    details: {
      quantity?: number;
      deliveryAddressId?: string;
      scheduleType?: 'daily' | 'alternate' | 'weekdays' | 'weekends' | 'weekly' | 'monthly' | 'custom';
      customDays?: string[];
      additionalProducts?: { product: Product; quantity: number; days?: string[] }[];
      timeSlot?: 'morning' | 'evening';
    }
  ) => Promise<void>;
  
  // Order Actions
  placeOrder: (addressId: string, deliverySlot: string, paymentMethod: string) => Promise<Order | null>;
  reorder: (orderId: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  
  // Address Actions
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (address: Address) => void;
  removeAddress: (addressId: string) => void;
  
  // Auth Actions
  login: (emailOrPhone: string, password?: string) => boolean;
  signup: (userData: { name: string; email: string; phone: string }) => void;
  logout: () => void;
  updateProfile: (name: string, email: string, phone: string) => void;
  
  // Coupon Actions
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  
  // Global Features
  toggleDarkMode: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  addToRecentlyViewed: (productId: string) => void;
  
  // Firebase Trouble-shooting helper state
  firebaseError: { code: string; message: string; type: 'firestore' | 'auth'; details?: string } | null;
  clearFirebaseError: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 'a1',
    name: 'Aayaan Ali Khan',
    phone: '+91 9876543210',
    flatNo: 'Penthouse B-12, Royal Palms',
    area: 'Koregaon Park, near Starbucks',
    city: 'Pune',
    pincode: '411001',
    latitude: 18.5362,
    longitude: 73.8930,
    isDefault: true
  },
  {
    id: 'a2',
    name: 'Aayaan Ali Khan (Office)',
    phone: '+91 9876543210',
    flatNo: '6th Floor, Tech Hub Tower A',
    area: 'Viman Nagar, Business District',
    city: 'Pune',
    pincode: '411014',
    latitude: 18.5679,
    longitude: 73.9143,
    isDefault: false
  },
  {
    id: 'a3',
    name: 'Aayaan Ali Khan (Lucknow Hazratganj)',
    phone: '+91 9876543210',
    flatNo: '14, Shahnajaf Road, Near Hazratganj Crossing',
    area: 'Hazratganj',
    city: 'Lucknow',
    pincode: '226001',
    latitude: 26.8467,
    longitude: 80.9462,
    isDefault: false
  },
  {
    id: 'a4',
    name: 'Aayaan Ali Khan (Lucknow Gomti Nagar)',
    phone: '+91 9876543210',
    flatNo: 'House 52/12, Vipul Khand',
    area: 'Gomti Nagar',
    city: 'Lucknow',
    pincode: '226010',
    latitude: 26.8496,
    longitude: 80.9924,
    isDefault: false
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const activeUid = auth.currentUser?.uid || 'guest';
      const saved = localStorage.getItem(`parag_cart_${activeUid}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const activeUid = auth.currentUser?.uid || 'guest';
      const saved = localStorage.getItem(`parag_wishlist_${activeUid}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const activeUid = auth.currentUser?.uid;
      if (!activeUid) return [];
      const saved = localStorage.getItem(`parag_orders_${activeUid}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    phone: string;
    avatar: string;
    rewardPoints: number;
    role?: 'customer' | 'shop_admin' | 'super_admin';
    shopId?: string;
  } | null>(null);

  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'aayaanalikhan786@gmail.com' || currentUser?.role === 'super_admin';
  const isShopAdmin = currentUser?.role === 'shop_admin';
  const isAdmin = isSuperAdmin || isShopAdmin;

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('parag_dark_mode');
    return saved === 'true';
  });
  const [activeCoupon, setActiveCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    const saved = localStorage.getItem('parag_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });
  const [firebaseError, setFirebaseError] = useState<{ code: string; message: string; type: 'firestore' | 'auth'; details?: string } | null>(null);

  const clearFirebaseError = () => {
    setFirebaseError(null);
  };

  const handleFirebaseException = (err: any, type: 'firestore' | 'auth') => {
    console.error(`Firebase exception caught [${type}]:`, err);
    let errorMsg = err.message || String(err);
    let isPermissionError = errorMsg.includes("Missing or insufficient permissions") || errorMsg.includes("permission-denied");
    let isUnauthorizedDomain = errorMsg.includes("unauthorized-domain") || errorMsg.includes("auth/unauthorized-domain");
    
    setFirebaseError({
      type,
      code: isPermissionError ? 'permission-denied' : isUnauthorizedDomain ? 'unauthorized-domain' : 'unknown',
      message: isPermissionError 
        ? 'Firestore Permission Denied (Security Rules Issue)' 
        : isUnauthorizedDomain
          ? 'Unauthorized Domain for Authentication'
          : `Firebase ${type === 'firestore' ? 'Database' : 'Auth'} Error`,
      details: errorMsg
    });
  };

  // Sync cart & wishlist to user-scoped localStorage
  useEffect(() => {
    const userKey = auth.currentUser ? `parag_cart_${auth.currentUser.uid}` : 'parag_cart_guest';
    localStorage.setItem(userKey, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const userKey = auth.currentUser ? `parag_wishlist_${auth.currentUser.uid}` : 'parag_wishlist_guest';
    localStorage.setItem(userKey, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('parag_recently_viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem('parag_dark_mode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Firebase Auth state listener
  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeSubscriptions: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      // Clean up previous listeners
      if (unsubscribeOrders) {
        unsubscribeOrders();
        unsubscribeOrders = null;
      }
      if (unsubscribeSubscriptions) {
        unsubscribeSubscriptions();
        unsubscribeSubscriptions = null;
      }

      if (fbUser) {
        try {
          // Load user-scoped state from localStorage first for smooth UX
          try {
            const savedCart = localStorage.getItem(`parag_cart_${fbUser.uid}`);
            if (savedCart) setCart(JSON.parse(savedCart));
            const savedWishlist = localStorage.getItem(`parag_wishlist_${fbUser.uid}`);
            if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
            const savedOrders = localStorage.getItem(`parag_orders_${fbUser.uid}`);
            if (savedOrders) setOrders(JSON.parse(savedOrders));
            else setOrders([]);
          } catch (e) {}

          let profile = await fetchUserProfile(fbUser.uid);
          if (!profile) {
            // New user signed up - gather pending profile details
            const pendingName = localStorage.getItem('parag_pending_signup_name') || fbUser.displayName || 'Valued Customer';
            const pendingPhone = localStorage.getItem('parag_pending_signup_phone') || '+91 9876543210';
            localStorage.removeItem('parag_pending_signup_name');
            localStorage.removeItem('parag_pending_signup_phone');

            profile = {
              name: pendingName,
              email: fbUser.email || '',
              phone: pendingPhone,
              avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
              rewardPoints: 100 // Welcome points
            };
            await saveUserProfile(fbUser.uid, profile);
          }
          setCurrentUser(profile);

          // Sync addresses
          const dbAddresses = await fetchAddressesFromDb(fbUser.uid);
          if (dbAddresses.length === 0) {
            // Seed defaults for easy onboarding
            for (const addr of DEFAULT_ADDRESSES) {
              const seedAddr = { ...addr, id: `addr_${Math.random().toString(36).substr(2, 9)}` };
              await saveAddress(fbUser.uid, seedAddr);
            }
            const seeded = await fetchAddressesFromDb(fbUser.uid);
            setAddresses(seeded);
          } else {
            setAddresses(dbAddresses);
          }

          // Real-time Subscriptions Listener
          const subQuery = query(collection(db, 'subscriptions'), where('userId', '==', fbUser.uid));
          unsubscribeSubscriptions = onSnapshot(subQuery, (snap) => {
            const results: SubscriptionItem[] = [];
            const seenIds = new Set<string>();
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              const uniqueId = docSnap.id || data.id;
              if (!uniqueId || seenIds.has(uniqueId)) return;
              seenIds.add(uniqueId);
              const product = PRODUCTS.find((p) => p.id === data.productId);
              if (product) {
                const additionalProductsMapped = (data.additionalProducts || []).map((ap: any) => {
                  if (!ap) return null;
                  const prod = PRODUCTS.find((p) => p.id === ap.productId);
                  return prod ? { product: prod, quantity: ap.quantity, days: ap.days || undefined } : null;
                }).filter(Boolean);

                results.push({
                  id: uniqueId,
                  product,
                  schedule: data.schedule,
                  status: data.status,
                  pausedUntil: data.pausedUntil || undefined,
                  additionalProducts: additionalProductsMapped.length > 0 ? additionalProductsMapped : undefined,
                  deliveryAddressId: data.deliveryAddressId || undefined
                });
              }
            });
            setSubscriptions(results);
          }, (error) => {
            handleFirebaseException(error, 'firestore');
          });

          // Real-time Orders Listener for this user
          const orderQuery = query(collection(db, 'orders'), where('userId', '==', fbUser.uid));
          unsubscribeOrders = onSnapshot(orderQuery, (snap) => {
            const results: Order[] = [];
            const seenIds = new Set<string>();
            snap.forEach((docSnap) => {
              const data = docSnap.data();
              const uniqueId = docSnap.id || data.id;
              if (!uniqueId || seenIds.has(uniqueId)) return;
              seenIds.add(uniqueId);
              const itemsMapped = (data.items || []).map((savedItem: any) => {
                if (!savedItem) return null;
                if (savedItem.product && savedItem.quantity) return savedItem;
                const pId = savedItem.productId || savedItem.id || savedItem.product?.id;
                const prod = PRODUCTS.find((p) => p.id === pId);
                return prod ? { product: prod, quantity: savedItem.quantity || 1 } : null;
              }).filter(Boolean);

              results.push({
                id: uniqueId,
                date: data.date,
                items: itemsMapped,
                totalAmount: data.totalAmount,
                status: data.status,
                deliverySlot: data.deliverySlot,
                address: data.address,
                paymentMethod: data.paymentMethod,
                userId: data.userId,
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                timestamp: data.timestamp,
                shopId: data.shopId,
                shopName: data.shopName,
                shopUid: data.shopUid,
                cancelledBy: data.cancelledBy,
                cancelledAt: data.cancelledAt
              });
            });
            
            results.sort((a, b) => (b.timestamp || b.id).localeCompare(a.timestamp || a.id));
            setOrders(results);
            try {
              localStorage.setItem(`parag_orders_${fbUser.uid}`, JSON.stringify(results));
            } catch (e) {}
          }, (error) => {
            handleFirebaseException(error, 'firestore');
          });

        } catch (err: any) {
          handleFirebaseException(err, 'firestore');
        }
      } else {
        // Logged out: clear user-sensitive state and reset to guest
        setCurrentUser(null);
        setAddresses([]);
        setSubscriptions([]);
        setOrders([]);
        try {
          const guestCart = localStorage.getItem('parag_cart_guest');
          setCart(guestCart ? JSON.parse(guestCart) : []);
          const guestWishlist = localStorage.getItem('parag_wishlist_guest');
          setWishlist(guestWishlist ? JSON.parse(guestWishlist) : []);
        } catch (e) {
          setCart([]);
          setWishlist([]);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeSubscriptions) unsubscribeSubscriptions();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const addToRecentlyViewed = (productId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, 6);
      return updated;
    });
  };

  // Cart Functions
  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product.available) {
      showToast(`${product.name} is currently out of stock`, 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        showToast(`Increased quantity of ${product.name} in cart`, 'success');
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      showToast(`Added ${product.name} to cart`, 'success');
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (item) {
      showToast(`Removed ${item.product.name} from cart`, 'info');
    }
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Wishlist Functions
  const toggleWishlist = (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    
    setWishlist((prev) => {
      const isWishlisted = prev.includes(productId);
      if (isWishlisted) {
        showToast(`Removed ${product.name} from wishlist`, 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast(`Added ${product.name} to wishlist`, 'success');
        return [...prev, productId];
      }
    });
  };

  // Subscription Functions
  const addSubscription = async (subscription: Omit<SubscriptionItem, 'id' | 'status'>) => {
    const hasActiveSubscription = subscriptions.some(s => s.status === 'active' || s.status === 'paused');
    if (hasActiveSubscription) {
      showToast('You already have an active subscription. Please modify your existing subscription instead.', 'error');
      return;
    }

    const subAddressId = subscription.deliveryAddressId;
    const address = addresses.find(a => a.id === subAddressId) || addresses.find(a => a.isDefault) || addresses[0];
    const lat = address?.latitude || 18.5362;
    const lng = address?.longitude || 73.8930;

    const assignedShop = (await findNearestShop(lat, lng)) || {
      id: 'SHOP-DEFAULT-101',
      shopName: 'PARAG Milk Central Hub',
      ownerName: 'PARAG Dairy Operations',
      phone: '+91 1800 120 2688',
      email: 'admin@paragmilk.com',
      uid: 'parag_central_hub',
      address: 'Parag Dairy Main Plant',
      latitude: 18.5204,
      longitude: 73.8567,
      deliveryRadius: 999999
    };

    const newSub: SubscriptionItem = {
      ...subscription,
      id: `sub_${Math.random().toString(36).substr(2, 9)}`,
      status: 'active',
      userId: auth.currentUser?.uid,
      customerName: currentUser?.name || 'Valued Customer',
      customerEmail: currentUser?.email || 'customer@example.com',
      timestamp: new Date().toISOString(),
      nextDeliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      shopId: assignedShop.id,
      shopName: assignedShop.shopName,
      shopUid: assignedShop.uid
    };
    
    if (auth.currentUser) {
      try {
        await saveSubscriptionToDb(auth.currentUser.uid, newSub);
      } catch (err) {
        console.error("Failed to write subscription to Firestore:", err);
        showToast('Subscription creation failed on server. Please try again.', 'error');
        return;
      }
    } else {
      showToast('You must be logged in to create a subscription.', 'error');
      return;
    }

    setSubscriptions((prev) => [newSub, ...prev]);
    showToast(`Successfully subscribed to ${subscription.product.name}!`, 'success');
  };

  const updateSubscriptionStatus = async (
    subscriptionId: string,
    status: 'active' | 'paused' | 'skipped',
    pausedUntil?: string
  ) => {
    if (auth.currentUser) {
      await updateSubscriptionStatusInDb(subscriptionId, status, pausedUntil);
    }
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id === subscriptionId) {
          return { ...sub, status, pausedUntil };
        }
        return sub;
      })
    );
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    if (sub) {
      if (status === 'paused') {
        showToast(`Paused subscription for ${sub.product.name}`, 'info');
      } else if (status === 'skipped') {
        showToast(`Skipped next delivery for ${sub.product.name}`, 'info');
      } else {
        showToast(`Resumed subscription for ${sub.product.name}`, 'success');
      }
    }
  };

  const deleteSubscription = async (subscriptionId: string) => {
    if (auth.currentUser) {
      await deleteSubscriptionFromDb(subscriptionId);
    }
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionId));
    if (sub) {
      showToast(`Cancelled subscription to ${sub.product.name}`, 'info');
    }
  };

  const updateSubscriptionDetails = async (
    subscriptionId: string,
    details: {
      quantity?: number;
      deliveryAddressId?: string;
      scheduleType?: 'daily' | 'alternate' | 'weekdays' | 'weekends' | 'weekly' | 'monthly' | 'custom';
      customDays?: string[];
      additionalProducts?: { product: Product; quantity: number; days?: string[] }[];
      timeSlot?: 'morning' | 'evening';
    }
  ) => {
    const sub = subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) return;

    const updatedSub: SubscriptionItem = {
      ...sub,
      schedule: {
        ...sub.schedule,
        quantity: details.quantity !== undefined ? details.quantity : sub.schedule.quantity,
        type: details.scheduleType !== undefined ? details.scheduleType : sub.schedule.type,
        customDays: details.customDays !== undefined ? details.customDays : sub.schedule.customDays,
        timeSlot: details.timeSlot !== undefined ? details.timeSlot : sub.schedule.timeSlot,
      },
      deliveryAddressId: details.deliveryAddressId !== undefined ? details.deliveryAddressId : sub.deliveryAddressId,
      additionalProducts: details.additionalProducts !== undefined ? details.additionalProducts : sub.additionalProducts,
    };

    if (auth.currentUser) {
      await saveSubscriptionToDb(auth.currentUser.uid, updatedSub);
    }
    
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === subscriptionId ? updatedSub : s))
    );
    showToast('Subscription modified successfully!', 'success');
  };

  // Address Functions
  const addAddress = async (address: Omit<Address, 'id'>) => {
    let lat = address.latitude;
    let lng = address.longitude;

    if (lat === undefined || lng === undefined) {
      const cityLower = address.city.toLowerCase();
      const areaLower = address.area.toLowerCase();
      if (cityLower.includes('lucknow')) {
        if (areaLower.includes('gomti')) {
          lat = 26.8496;
          lng = 80.9924;
        } else {
          lat = 26.8467;
          lng = 80.9462;
        }
      } else {
        if (areaLower.includes('viman')) {
          lat = 18.5679;
          lng = 73.9143;
        } else {
          lat = 18.5362;
          lng = 73.8930;
        }
      }
    }

    const newAddress: Address = {
      ...address,
      latitude: lat,
      longitude: lng,
      id: `addr_${Math.random().toString(36).substr(2, 9)}`,
      isDefault: address.isDefault || addresses.length === 0
    };
    
    if (auth.currentUser) {
      await saveAddress(auth.currentUser.uid, newAddress);
    }
    setAddresses((prev) => {
      if (newAddress.isDefault) {
        return prev.map((a) => ({ ...a, isDefault: false })).concat(newAddress);
      }
      return [...prev, newAddress];
    });
    showToast('New delivery address added', 'success');
  };

  const updateAddress = async (updated: Address) => {
    if (auth.currentUser) {
      await saveAddress(auth.currentUser.uid, updated);
    }
    setAddresses((prev) => {
      let filtered = prev;
      if (updated.isDefault) {
        filtered = prev.map((a) => ({ ...a, isDefault: false }));
      }
      return filtered.map((a) => (a.id === updated.id ? updated : a));
    });
    showToast('Delivery address updated', 'success');
  };

  const removeAddress = async (addressId: string) => {
    if (auth.currentUser) {
      await deleteAddressFromDb(addressId);
    }
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== addressId);
      if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
    showToast('Address removed', 'info');
  };

  // Order Functions
  const placeOrder = async (addressId: string, deliverySlot: string, paymentMethod: string): Promise<Order | null> => {
    if (cart.length === 0) {
      showToast('Your shopping cart is empty!', 'error');
      return null;
    }
    const hasActiveOrder = orders.some((o) => {
      const status = (o.status || '').toLowerCase().replace(/_/g, ' ');
      return ['pending', 'processing', 'packed', 'shipped', 'out for delivery'].includes(status);
    });
    if (hasActiveOrder) {
      showToast('You already have an active order. Please wait until it is delivered or cancelled before placing another order.', 'error');
      return null;
    }
    const address = addresses.find((a) => a.id === addressId) || addresses[0];
    if (!address) {
      showToast('Please select a shipping address!', 'error');
      return null;
    }

    const lat = address.latitude || 18.5362;
    const lng = address.longitude || 73.8930;

    const assignedShop = (await findNearestShop(lat, lng)) || {
      id: 'SHOP-DEFAULT-101',
      shopName: 'PARAG Milk Central Hub',
      ownerName: 'PARAG Dairy Operations',
      phone: '+91 1800 120 2688',
      email: 'admin@paragmilk.com',
      uid: 'parag_central_hub',
      address: 'Parag Dairy Main Plant',
      latitude: 18.5204,
      longitude: 73.8567,
      deliveryRadius: 999999
    };

    const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
    const discountAmount = activeCoupon ? (subtotal * activeCoupon.discount) / 100 : 0;
    const deliveryCharge = subtotal > 200 ? 0 : 25;
    const totalAmount = subtotal - discountAmount + deliveryCharge;

    const newOrder: Order = {
      id: `ORD-${Math.floor(10000 + Math.random() * 90000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cart],
      totalAmount: Math.round(totalAmount),
      status: 'processing',
      deliverySlot,
      address,
      paymentMethod,
      userId: auth.currentUser?.uid,
      customerName: currentUser?.name || 'Valued Customer',
      customerEmail: currentUser?.email || 'customer@example.com',
      customerPhone: currentUser?.phone || '+91 9876543210',
      timestamp: new Date().toISOString(),
      shopId: assignedShop.id,
      shopName: assignedShop.shopName,
      shopUid: assignedShop.uid
    };

    if (auth.currentUser) {
      try {
        await saveOrderToDb(auth.currentUser.uid, newOrder);
      } catch (err) {
        console.error("Failed to write order to Firestore:", err);
        showToast('Order creation failed on server. Please try again.', 'error');
        return null;
      }
    } else {
      showToast('You must be logged in to place an order.', 'error');
      return null;
    }

    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      try {
        if (auth.currentUser) {
          localStorage.setItem(`parag_orders_${auth.currentUser.uid}`, JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });

    if (currentUser && auth.currentUser) {
      const pointsEarned = Math.floor(totalAmount / 10);
      const updatedProfile = {
        ...currentUser,
        rewardPoints: currentUser.rewardPoints + pointsEarned
      };
      saveUserProfile(auth.currentUser.uid, updatedProfile).catch(console.error);
      setCurrentUser(updatedProfile);
    }

    clearCart();
    setActiveCoupon(null);
    showToast('Woohoo! Order placed successfully!', 'success');
    return newOrder;
  };

  const reorder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    
    order.items.forEach((item) => {
      addToCart(item.product, item.quantity);
    });
    showToast('All items added to your cart!', 'success');
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders((prev) => {
      const updated = prev.map((o) => o.id === orderId ? { ...o, status } : o);
      try {
        if (auth.currentUser) {
          localStorage.setItem(`parag_orders_${auth.currentUser.uid}`, JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });

    try {
      const updatedBy = currentUser?.name || currentUser?.email || 'Admin';
      await updateOrderStatusInDb(orderId, status, updatedBy);
    } catch (err) {
      console.warn('DB update order status note:', err);
    }
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    const cancelTimestamp = new Date().toISOString();
    const cancelledBy = currentUser?.name || 'User';
    try {
      if (auth.currentUser) {
        await cancelOrderInDb(orderId, cancelledBy);
      } else {
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, {
          status: 'Cancelled',
          cancelledBy,
          cancelledAt: cancelTimestamp
        }, { merge: true });
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'Cancelled', cancelledBy, cancelledAt: cancelTimestamp }
            : o
        )
      );
      showToast('Order cancelled successfully.', 'info');
      return true;
    } catch (err: any) {
      console.error('Failed to cancel order in Firestore:', err);
      showToast('Could not cancel order. Please try again.', 'error');
      return false;
    }
  };

  // Auth Functions
  const login = (_emailOrPhone: string, _password?: string): boolean => {
    return true;
  };

  const signup = (_userData: { name: string; email: string; phone: string }) => {
  };

  const logout = () => {
    signOut(auth).then(() => {
      showToast('Logged out of your profile.', 'info');
    }).catch((err) => {
      console.error(err);
      showToast('Error logging out.', 'error');
    });
  };

  const updateProfile = async (name: string, email: string, phone: string) => {
    if (currentUser && auth.currentUser) {
      const updatedProfile = {
        ...currentUser,
        name,
        email,
        phone
      };
      await saveUserProfile(auth.currentUser.uid, updatedProfile);
      setCurrentUser(updatedProfile);
      showToast('Profile information updated successfully!', 'success');
    }
  };

  // Coupon Functions
  const applyCoupon = (code: string): boolean => {
    const normalized = code.toUpperCase().trim();
    const coupon = COUPONS.find((c) => c.code === normalized);
    if (!coupon) {
      showToast('Invalid Coupon Code!', 'error');
      return false;
    }
    
    const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
    if (subtotal < coupon.minSpend) {
      showToast(`Minimum order of ₹${coupon.minSpend} required for this coupon!`, 'error');
      return false;
    }

    setActiveCoupon({ code: coupon.code, discount: coupon.discount });
    showToast(`Coupon applied! Saved ${coupon.discount}%`, 'success');
    return true;
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
    showToast('Coupon removed', 'info');
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        products: PRODUCTS,
        cart,
        wishlist,
        subscriptions,
        orders,
        addresses,
        currentUser,
        isAdmin,
        isSuperAdmin,
        isShopAdmin,
        darkMode,
        activeCoupon,
        toast,
        recentlyViewed,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        addSubscription,
        updateSubscriptionStatus,
        deleteSubscription,
        updateSubscriptionDetails,
        placeOrder,
        reorder,
        updateOrderStatus,
        cancelOrder,
        addAddress,
        updateAddress,
        removeAddress,
        login,
        signup,
        logout,
        updateProfile,
        applyCoupon,
        removeCoupon,
        toggleDarkMode,
        showToast,
        addToRecentlyViewed,
        firebaseError,
        clearFirebaseError
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
