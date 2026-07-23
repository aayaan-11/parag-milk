import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
import { 
  Lock, LayoutDashboard, ShoppingBag, Calendar, Users, 
  Search, Filter, CheckCircle2, Clock, AlertCircle, XCircle,
  RefreshCw, DollarSign, ArrowRight, Eye, Phone, Mail, Award,
  Trash2, Play, Pause, FastForward, MapPin, ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  fetchAllOrdersFromDb, 
  fetchAllSubscriptionsFromDb, 
  fetchAllUsersFromDb,
  fetchAllAddressesFromDb,
  updateOrderStatusInDb,
  updateSubscriptionStatusInDb,
  deleteSubscriptionFromDb,
  fetchUserProfile
} from '../utils/firebaseHelpers';
import { Order, SubscriptionItem, Address } from '../types';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile as fbUpdateProfile,
  getAuth
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { auth, db } from '../firebase';
import { onSnapshot, collection, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { PRODUCTS } from '../data';
import { formatDateToDMY } from '../utils/dateHelpers';

// Secondary Auth instance to create shop admin credentials without logging out active Super Admin
const secondaryApp = initializeApp({
  apiKey: "AIzaSyBXzehkWrOvZ-F54rl-d192VdxHLyTDkng",
  authDomain: "parag-milk-3f4f9.firebaseapp.com",
  projectId: "parag-milk-3f4f9",
  storageBucket: "parag-milk-3f4f9.firebasestorage.app",
  messagingSenderId: "341509832167",
  appId: "1:341509832167:web:891b74f90837d467bc5142"
}, "SecondaryAdminApp");
const secondaryAuth = getAuth(secondaryApp);

export function Admin() {
  const { currentUser, isAdmin, isSuperAdmin, isShopAdmin, showToast, updateOrderStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'subscriptions' | 'users' | 'shops'>('dashboard');
  const [shopSubTab, setShopSubTab] = useState<'legacy' | 'requests'>('requests');
  
  // Auth Form State (if not logged in as admin)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Admin Data State
  const [orders, setOrders] = useState<(Order & { userId: string })[]>([]);
  const [subscriptions, setSubscriptions] = useState<(SubscriptionItem & { userId: string })[]>([]);
  const [users, setUsers] = useState<{ [userId: string]: { name: string; email: string; phone: string; avatar: string; rewardPoints: number } }>({});
  const [addresses, setAddresses] = useState<{ [id: string]: Address & { userId?: string } }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Shop Owners & Verification State
  const [shopOwners, setShopOwners] = useState<any[]>([]);
  const [editingShopOwner, setEditingShopOwner] = useState<any | null>(null);
  const [editShopName, setEditShopName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editShopPhone, setEditShopPhone] = useState('');
  const [editShopAddress, setEditShopAddress] = useState('');
  const [editShopLat, setEditShopLat] = useState('');
  const [editShopLng, setEditShopLng] = useState('');
  const [editShopRadius, setEditShopRadius] = useState('');

  // Create Shop State
  const [shops, setShops] = useState<any[]>([]);
  const [newShopName, setNewShopName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopPassword, setNewShopPassword] = useState('123456');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopLat, setNewShopLat] = useState<string>('18.5204');
  const [newShopLng, setNewShopLng] = useState<string>('73.8567');
  const [newShopRadius, setNewShopRadius] = useState<string>('20');
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected Details State
  const [selectedOrder, setSelectedOrder] = useState<(Order & { userId: string }) | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<(SubscriptionItem & { userId: string }) | null>(null);

  // Load Admin Data with Real-time Firebase Listeners
  useEffect(() => {
    if (!isAdmin) return;

    setIsLoading(true);

    // 1. Real-time Users Listener
    let unsubscribeUsers = () => {};
    if (isSuperAdmin) {
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const results: { [userId: string]: any } = {};
        snap.forEach((docSnap) => {
          results[docSnap.id] = docSnap.data();
        });
        setUsers(results);
      }, (error) => {
        console.warn("Notice with users listener:", error?.message || error);
      });
    }

    // 2. Real-time Addresses Listener
    let unsubscribeAddresses = () => {};
    if (isSuperAdmin) {
      unsubscribeAddresses = onSnapshot(collection(db, 'addresses'), (snap) => {
        const results: { [id: string]: any } = {};
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          results[docSnap.id] = {
            id: data.id,
            name: data.name,
            phone: data.phone,
            flatNo: data.flatNo,
            area: data.area,
            landmark: data.landmark || '',
            city: data.city,
            pincode: data.pincode,
            isDefault: data.isDefault || false,
            userId: data.userId || undefined
          };
        });
        setAddresses(results);
      }, (error) => {
        console.warn("Notice with addresses listener:", error?.message || error);
      });
    }

    // 3. Real-time Orders Listener (filtered by shopId for Local Shop Admins)
    const ordersCol = collection(db, 'orders');
    const ordersQuery = isShopAdmin && currentUser?.shopId
      ? query(ordersCol, where('shopId', '==', currentUser.shopId))
      : ordersCol;

    const unsubscribeOrders = onSnapshot(ordersQuery, (snap) => {
      const results: (Order & { userId: string })[] = [];
      const seenOrderIds = new Set<string>();
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const uniqueId = docSnap.id || data.id;
        if (!uniqueId || seenOrderIds.has(uniqueId)) return;
        seenOrderIds.add(uniqueId);

        const itemsMapped = (data.items || []).map((savedItem: any) => {
          if (!savedItem) return null;
          if (savedItem.product && savedItem.quantity) return savedItem;
          const pId = savedItem.productId || savedItem.id || savedItem.product?.id;
          const prod = PRODUCTS.find((p) => p.id === pId);
          return prod ? { product: prod, quantity: savedItem.quantity || 1 } : null;
        }).filter(Boolean);

        results.push({
          id: uniqueId,
          userId: data.userId,
          date: data.date,
          items: itemsMapped as any,
          totalAmount: data.totalAmount,
          status: data.status,
          deliverySlot: data.deliverySlot,
          address: data.address,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName || undefined,
          customerEmail: data.customerEmail || undefined,
          customerPhone: data.customerPhone || undefined,
          timestamp: data.timestamp || undefined,
          shopId: data.shopId || undefined,
          shopName: data.shopName || undefined,
          shopUid: data.shopUid || undefined
        });
      });
      // Sort orders descending
      results.sort((a, b) => (b.timestamp || b.id).localeCompare(a.timestamp || a.id));
      setOrders(results);
      setIsLoading(false);
    }, (error) => {
      console.warn("Notice with orders listener:", error?.message || error);
      setIsLoading(false);
    });

    // 4. Real-time Subscriptions Listener (filtered by shopId for Local Shop Admins)
    const subscriptionsCol = collection(db, 'subscriptions');
    const subscriptionsQuery = isShopAdmin && currentUser?.shopId
      ? query(subscriptionsCol, where('shopId', '==', currentUser.shopId))
      : subscriptionsCol;

    const unsubscribeSubscriptions = onSnapshot(subscriptionsQuery, (snap) => {
      const results: (SubscriptionItem & { userId: string })[] = [];
      const seenSubIds = new Set<string>();
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const uniqueId = docSnap.id || data.id;
        if (!uniqueId || seenSubIds.has(uniqueId)) return;
        seenSubIds.add(uniqueId);

        const product = PRODUCTS.find((p) => p.id === data.productId);
        if (product) {
          const additionalProductsMapped = (data.additionalProducts || []).map((ap: any) => {
            if (!ap) return null;
            const prod = PRODUCTS.find((p) => p.id === ap.productId);
            return prod ? { product: prod, quantity: ap.quantity, days: ap.days || undefined } : null;
          }).filter(Boolean);

          results.push({
            id: uniqueId,
            userId: data.userId,
            product,
            schedule: data.schedule,
            status: data.status,
            pausedUntil: data.pausedUntil || undefined,
            additionalProducts: additionalProductsMapped.filter(Boolean) as any,
            deliveryAddressId: data.deliveryAddressId || undefined,
            customerName: data.customerName || undefined,
            customerEmail: data.customerEmail || undefined,
            timestamp: data.timestamp || undefined,
            nextDeliveryDate: data.nextDeliveryDate || undefined,
            shopId: data.shopId || undefined,
            shopName: data.shopName || undefined,
            shopUid: data.shopUid || undefined
          });
        }
      });
      // Sort subscriptions descending
      results.sort((a, b) => (b.timestamp || b.id).localeCompare(a.timestamp || a.id));
      setSubscriptions(results);
    }, (error) => {
      console.warn("Notice with subscriptions listener:", error?.message || error);
    });

    // 5. Real-time Shops Listener
    const unsubscribeShops = onSnapshot(collection(db, 'shops'), (snap) => {
      const results: any[] = [];
      snap.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() });
      });
      setShops(results);
    }, (error) => {
      console.warn("Notice with shops listener:", error?.message || error);
    });

    // 6. Real-time Shop Owners Listener
    let unsubscribeShopOwners = () => {};
    if (isSuperAdmin) {
      unsubscribeShopOwners = onSnapshot(collection(db, 'shopOwners'), (snap) => {
        const results: any[] = [];
        snap.forEach((docSnap) => {
          results.push({ id: docSnap.id, ...docSnap.data() });
        });
        setShopOwners(results);
      }, (error) => {
        console.warn("Notice with shopOwners listener:", error?.message || error);
      });
    }

    return () => {
      unsubscribeUsers();
      unsubscribeAddresses();
      unsubscribeOrders();
      unsubscribeSubscriptions();
      unsubscribeShops();
      unsubscribeShopOwners();
    };
  }, [isAdmin, isSuperAdmin, isShopAdmin, currentUser?.shopId]);

  // For shop admins, fetch user profiles for all unique user IDs in orders and subscriptions
  useEffect(() => {
    if (!isAdmin || isSuperAdmin || (orders.length === 0 && subscriptions.length === 0)) return;

    const uniqueUserIds = Array.from(new Set([
      ...orders.map(o => o.userId).filter(Boolean),
      ...subscriptions.map(s => s.userId).filter(Boolean)
    ]));

    let active = true;
    const fetchShopCustomers = async () => {
      const fetchedUsers: typeof users = {};
      for (const uid of uniqueUserIds) {
        if (users[uid]) {
          fetchedUsers[uid] = users[uid]; // use cached if already fetched
          continue;
        }
        try {
          const profile = await fetchUserProfile(uid);
          if (profile) {
            fetchedUsers[uid] = profile as any;
          }
        } catch (err) {
          console.error(`Error fetching user profile for ${uid}:`, err);
        }
      }
      if (active) {
        setUsers(prev => ({ ...prev, ...fetchedUsers }));
      }
    };

    fetchShopCustomers();
    return () => {
      active = false;
    };
  }, [orders, subscriptions, isAdmin, isSuperAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter administrator credentials.', 'error');
      return;
    }
    setIsAuthLoading(true);
    try {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome, Administrator!', 'success');
      } catch (err: any) {
        // If the admin user doesn't exist yet (or wrong credential due to fresh Firebase), auto-create them!
        if (email.trim().toLowerCase() === 'aayaanalikhan786@gmail.com' && password === '123456' && 
            (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password')) {
          try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await fbUpdateProfile(credential.user, {
              displayName: "Admin"
            });
            localStorage.setItem('parag_pending_signup_phone', '+91 9999999999');
            localStorage.setItem('parag_pending_signup_name', 'Admin');
            showToast('Admin account initialized and logged in!', 'success');
          } catch (createErr) {
            console.error("Auto-creating admin failed:", createErr);
            throw err;
          }
        } else {
          throw err;
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('Invalid administrator email or password.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Actions
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
      showToast(`Order status successfully updated to '${status}'`, 'success');
    } catch (err: any) {
      console.warn("[Admin Order Status Update Note]", err);
      showToast(`Order status updated locally`, 'info');
    }
  };

  const handleUpdateSubscriptionStatus = async (subId: string, status: SubscriptionItem['status']) => {
    try {
      await updateSubscriptionStatusInDb(subId, status);
      setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status } : s));
      if (selectedSubscription?.id === subId) {
        setSelectedSubscription(prev => prev ? { ...prev, status } : null);
      }
      showToast(`Subscription status updated to ${status}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update subscription.', 'error');
    }
  };

  const handleCancelSubscription = async (subId: string) => {
    if (!window.confirm("Are you sure you want to completely cancel and delete this subscription?")) return;
    try {
      await deleteSubscriptionFromDb(subId);
      setSubscriptions(prev => prev.filter(s => s.id !== subId));
      if (selectedSubscription?.id === subId) {
        setSelectedSubscription(null);
      }
      showToast('Subscription cancelled and deleted.', 'info');
    } catch (err) {
      console.error(err);
      showToast('Failed to cancel subscription.', 'error');
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName || !newOwnerName || !newShopPhone || !newShopEmail || !newShopAddress) {
      showToast('All fields are required to create a local shop admin.', 'error');
      return;
    }
    
    setIsCreatingShop(true);
    try {
      // 1. Create a Firebase Auth user for the shop admin using secondary auth
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newShopEmail, newShopPassword);
      const newUid = userCredential.user.uid;
      
      const shopId = `shop_${Math.random().toString(36).substr(2, 9)}`;

      // 2. Write the User Profile Document
      await setDoc(doc(db, 'users', newUid), {
        name: newOwnerName,
        email: newShopEmail,
        phone: newShopPhone,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        rewardPoints: 0,
        role: 'shop_admin',
        shopId: shopId
      });

      // 3. Write the Shop Document
      await setDoc(doc(db, 'shops', shopId), {
        id: shopId,
        shopName: newShopName,
        ownerName: newOwnerName,
        phone: newShopPhone,
        email: newShopEmail,
        uid: newUid,
        address: newShopAddress,
        latitude: Number(newShopLat),
        longitude: Number(newShopLng),
        deliveryRadius: Number(newShopRadius)
      });

      // Clean up secondary session
      await secondaryAuth.signOut();

      showToast(`Successfully created Shop Admin "${newShopName}"!`, 'success');
      
      // Reset form fields
      setNewShopName('');
      setNewOwnerName('');
      setNewShopPhone('');
      setNewShopEmail('');
      setNewShopPassword('123456');
      setNewShopAddress('');
      setNewShopLat('18.5204');
      setNewShopLng('73.8567');
      setNewShopRadius('20');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to create shop admin account.', 'error');
    } finally {
      setIsCreatingShop(false);
    }
  };

  const handleDeleteShop = async (shopId: string, shopUid: string) => {
    if (!window.confirm("Are you sure you want to delete this Local Shop Admin? This will remove the shop and its routing eligibility.")) return;
    try {
      // 1. Delete Shop Document
      await deleteDoc(doc(db, 'shops', shopId));
      
      // 2. Set user role to customer or delete the user profile document
      await setDoc(doc(db, 'users', shopUid), {
        role: 'customer',
        shopId: null
      }, { merge: true });

      showToast('Local Shop Admin deleted successfully.', 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete Local Shop Admin.', 'error');
    }
  };

  const handleApproveShopOwner = async (owner: any) => {
    try {
      // 1. Set status in shopOwners
      await setDoc(doc(db, 'shopOwners', owner.uid), {
        status: 'Approved'
      }, { merge: true });

      // 2. Set user role to shop_admin
      await setDoc(doc(db, 'users', owner.uid), {
        role: 'shop_admin',
        shopId: owner.shopId,
        shopName: owner.shopName
      }, { merge: true });

      // 3. Write/Merge to the legacy shops collection for backward compatibility/routing
      await setDoc(doc(db, 'shops', owner.shopId), {
        id: owner.shopId,
        shopName: owner.shopName,
        ownerName: owner.ownerName,
        phone: owner.phone,
        email: owner.email,
        uid: owner.uid,
        address: owner.address,
        latitude: owner.latitude,
        longitude: owner.longitude,
        deliveryRadius: owner.deliveryRadius
      });

      showToast(`Shop owner "${owner.shopName}" approved successfully!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to approve shop owner.', 'error');
    }
  };

  const handleRejectShopOwner = async (owner: any) => {
    try {
      // 1. Set status in shopOwners
      await setDoc(doc(db, 'shopOwners', owner.uid), {
        status: 'Rejected'
      }, { merge: true });

      // 2. Revert user role to customer and remove shopId/shopName
      await setDoc(doc(db, 'users', owner.uid), {
        role: 'customer',
        shopId: null,
        shopName: null
      }, { merge: true });

      // 3. Delete from the legacy shops collection if it was there
      await deleteDoc(doc(db, 'shops', owner.shopId));

      showToast(`Shop owner "${owner.shopName}" rejected successfully.`, 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to reject shop owner.', 'error');
    }
  };

  const handleSuspendShopOwner = async (owner: any) => {
    try {
      // 1. Set status in shopOwners
      await setDoc(doc(db, 'shopOwners', owner.uid), {
        status: 'Suspended'
      }, { merge: true });

      // 2. Revert user role to customer
      await setDoc(doc(db, 'users', owner.uid), {
        role: 'customer',
        shopId: null,
        shopName: null
      }, { merge: true });

      // 3. Delete from the legacy shops collection
      if (owner.shopId) {
        await deleteDoc(doc(db, 'shops', owner.shopId));
      }

      showToast(`Shop owner "${owner.shopName}" suspended successfully.`, 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to suspend shop owner.', 'error');
    }
  };

  const handleDeleteShopOwner = async (owner: any) => {
    if (!window.confirm(`Are you sure you want to delete shop owner "${owner.shopName}"?`)) return;
    try {
      // 1. Delete document from shopOwners collection
      await deleteDoc(doc(db, 'shopOwners', owner.uid));

      // 2. Delete from shops collection if present
      if (owner.shopId) {
        await deleteDoc(doc(db, 'shops', owner.shopId));
      }

      // 3. Reset user role to customer
      await setDoc(doc(db, 'users', owner.uid), {
        role: 'customer',
        shopId: null,
        shopName: null
      }, { merge: true });

      showToast(`Shop owner "${owner.shopName}" deleted successfully.`, 'info');
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete shop owner.', 'error');
    }
  };

  const handleStartEditShopOwner = (owner: any) => {
    setEditingShopOwner(owner);
    setEditShopName(owner.shopName || '');
    setEditOwnerName(owner.ownerName || '');
    setEditShopPhone(owner.phone || '');
    setEditShopAddress(owner.address || '');
    setEditShopLat(String(owner.latitude || ''));
    setEditShopLng(String(owner.longitude || ''));
    setEditShopRadius(String(owner.deliveryRadius || ''));
  };

  const handleSaveShopOwnerDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShopOwner) return;

    try {
      const latNum = Number(editShopLat);
      const lngNum = Number(editShopLng);
      const radNum = Number(editShopRadius) || 25;

      if (isNaN(latNum) || isNaN(lngNum)) {
        showToast('Latitude and Longitude must be valid numbers.', 'error');
        return;
      }

      // 1. Update shopOwners
      await setDoc(doc(db, 'shopOwners', editingShopOwner.uid), {
        shopName: editShopName,
        ownerName: editOwnerName,
        phone: editShopPhone,
        address: editShopAddress,
        latitude: latNum,
        longitude: lngNum,
        deliveryRadius: radNum
      }, { merge: true });

      // 2. If already approved, update users & legacy shops as well!
      if (editingShopOwner.status === 'Approved') {
        await setDoc(doc(db, 'users', editingShopOwner.uid), {
          shopName: editShopName,
          phone: editShopPhone,
          name: editOwnerName
        }, { merge: true });

        await setDoc(doc(db, 'shops', editingShopOwner.shopId), {
          shopName: editShopName,
          ownerName: editOwnerName,
          phone: editShopPhone,
          address: editShopAddress,
          latitude: latNum,
          longitude: lngNum,
          deliveryRadius: radNum
        }, { merge: true });
      }

      showToast('Shop owner details updated successfully.', 'success');
      setEditingShopOwner(null);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to update shop owner details.', 'error');
    }
  };

  // Calculations
  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const activeSubscriptionsCount = subscriptions.filter(s => s.status === 'active').length;
  const pausedSubscriptionsCount = subscriptions.filter(s => s.status === 'paused').length;

  // Filter lists
  const filteredOrders = orders.filter(o => {
    const user = users[o.userId] || { name: 'Unknown User', email: '', phone: '' };
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSubscriptions = subscriptions.filter(s => {
    const user = users[s.userId] || { name: 'Unknown User', email: '', phone: '' };
    const matchesSearch = 
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsersList = (Object.entries(users) as [string, { name: string; email: string; phone: string; avatar: string; rewardPoints: number }][]).filter(([id, u]) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery)
    );
  });

  const filteredShops = shops.filter(s => {
    return (
      s.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // If NOT Admin, render the Auth gate
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-950">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xl"
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Admin Vault Login
            </h2>
            <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-400 leading-normal">
              Enter authorized credentials to manage Cow Milk subscriptions, view user bookings, and process pending dispatches.
            </p>
          </div>
          <form className="mt-8 space-y-4" onSubmit={handleAdminLogin}>
            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                Admin Email Address
              </label>
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                placeholder="aayaanalikhan786@gmail.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                placeholder="••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isAuthLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-xs font-black rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden transition-all shadow-md mt-6 cursor-pointer disabled:opacity-50"
            >
              {isAuthLoading ? 'Authenticating...' : 'ACCESS PORTAL'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6 mb-8">
        <div>
          <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
            Administrative Control Panel
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mt-1.5">
            Admin Portal
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time monitoring of all orders, active VIP subscriptions, and customer registration cards.
          </p>
        </div>
        <button
          onClick={() => showToast("Administrative records are fully synced in real-time!", "success")}
          disabled={isLoading}
          className="self-start md:self-auto flex items-center gap-2 bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Sync Records
        </button>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Gross Bookings</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1.5">
            ₹{totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">
            Excluding cancelled dispatches
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1.5">
            {orders.length}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1">
            {orders.filter(o => o.status === 'processing').length} pending processing
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Active Subscriptions</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1.5">
            {activeSubscriptionsCount}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1">
            {pausedSubscriptionsCount} vacation paused
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Registered Users</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white mt-1.5">
            {Object.keys(users).length}
          </p>
          <p className="text-[10px] text-neutral-500 mt-1">
            Active in database auth
          </p>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex bg-neutral-100 dark:bg-neutral-900/50 p-1 rounded-2xl max-w-2xl mb-6">
        {[
          { id: 'dashboard', label: isShopAdmin ? 'Shop Overview' : 'Overview', icon: LayoutDashboard },
          { id: 'orders', label: isShopAdmin ? 'Shop Orders' : 'All Orders', icon: ShoppingBag },
          { id: 'subscriptions', label: isShopAdmin ? 'Shop Subscriptions' : 'Subscriptions', icon: Calendar },
          ...((isSuperAdmin || isShopAdmin) ? [
            { id: 'users', label: isShopAdmin ? 'Shop Customers' : 'Users List', icon: Users }
          ] : []),
          ...(isSuperAdmin ? [
            { id: 'shops', label: 'Local Shops', icon: Award }
          ] : [])
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className={`flex-1 py-2 text-[11px] font-black rounded-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-neutral-500 font-bold">Synchronizing Firestore records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List Column (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Search and Filters Bar */}
            {activeTab !== 'dashboard' && (
              <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row gap-3">
                <div className="flex-grow relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                  />
                </div>
                {activeTab !== 'users' && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                    >
                      <option value="all">All Statuses</option>
                      {activeTab === 'orders' ? (
                        <>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="out for delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </>
                      ) : (
                        <>
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="skipped">Skipped</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Render Dashboard Overview */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Recent Bookings Orders */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                      Recent Orders
                    </h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {orders.slice(0, 5).map(o => {
                      const user = users[o.userId] || { name: 'Unknown User', email: '' };
                      return (
                        <div 
                          key={o.id} 
                          onClick={() => { setSelectedOrder(o); setActiveTab('orders'); }}
                          className="py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 px-2 rounded-xl transition-all cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-black text-neutral-900 dark:text-white">{o.id}</p>
                            <p className="text-[10px] text-neutral-500">{user.name} • {formatDateToDMY(o.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-neutral-900 dark:text-white">₹{o.totalAmount}</p>
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                              o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              o.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                              o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {orders.length === 0 && (
                      <p className="text-xs text-neutral-400 py-4 text-center">No orders have been placed yet.</p>
                    )}
                  </div>
                </div>

                {/* Active Subscriptions Schedule */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                      Recent Subscriptions
                    </h3>
                    <button 
                      onClick={() => setActiveTab('subscriptions')}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View All
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {subscriptions.slice(0, 5).map((s, idx) => {
                      const user = users[s.userId] || { name: 'Unknown User' };
                      return (
                        <div 
                          key={s.id ? `${s.id}_${idx}` : idx}
                          onClick={() => { setSelectedSubscription(s); setActiveTab('subscriptions'); }}
                          className="py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 px-2 rounded-xl transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <img src={s.product.image} className="w-8 h-8 rounded-lg object-cover" />
                            <div>
                              <p className="text-xs font-black text-neutral-900 dark:text-white">{s.product.name}</p>
                              <p className="text-[10px] text-neutral-500">{user.name} • {s.schedule.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-neutral-900 dark:text-white">Qty: {s.schedule.quantity}</p>
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                              s.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              s.status === 'paused' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-neutral-100 text-neutral-800 dark:bg-neutral-850 dark:text-neutral-300'
                            }`}>
                              {s.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {subscriptions.length === 0 && (
                      <p className="text-xs text-neutral-400 py-4 text-center">No customer subscriptions found.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Render Orders List */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                  Filtered Orders ({filteredOrders.length})
                </h3>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredOrders.map((o, idx) => {
                    const user = users[o.userId] || { name: 'Unknown User', email: '', phone: '' };
                    const isSelected = selectedOrder?.id === o.id;
                    return (
                      <div 
                        key={o.id ? `${o.id}_${idx}` : idx} 
                        onClick={() => setSelectedOrder(o)}
                        className={`py-3.5 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 px-3 rounded-2xl transition-all cursor-pointer ${
                          isSelected ? 'bg-blue-50/50 dark:bg-neutral-800/60 border border-blue-100 dark:border-neutral-700' : ''
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-neutral-900 dark:text-white">{o.id}</span>
                            <span className={`text-[8px] px-1.5 py-0.2 rounded-md font-bold text-neutral-400 border border-neutral-200 dark:border-neutral-800`}>
                              {o.paymentMethod}
                            </span>
                          </div>
                          <p className="text-[10px] text-neutral-500 font-medium">
                            {user.name} ({user.email})
                          </p>
                          <p className="text-[9px] text-neutral-400">
                            Slot: {o.deliverySlot} • Date: {formatDateToDMY(o.date)}
                            {o.shopName && ` • Shop: ${o.shopName}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-neutral-900 dark:text-white">₹{o.totalAmount}</p>
                          <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full mt-1 ${
                            o.status === 'delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            o.status === 'shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                            o.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">No orders match the current filters.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Render Subscriptions List */}
            {activeTab === 'subscriptions' && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                  Filtered Subscriptions ({filteredSubscriptions.length})
                </h3>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredSubscriptions.map((s, idx) => {
                    const user = users[s.userId] || { name: 'Unknown User', email: '' };
                    const isSelected = selectedSubscription?.id === s.id;
                    return (
                      <div 
                        key={s.id ? `${s.id}_${idx}` : idx} 
                        onClick={() => setSelectedSubscription(s)}
                        className={`py-3.5 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 px-3 rounded-2xl transition-all cursor-pointer ${
                          isSelected ? 'bg-blue-50/50 dark:bg-neutral-800/60 border border-blue-100 dark:border-neutral-700' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img src={s.product.image} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-neutral-900 dark:text-white">{s.product.name}</span>
                            <p className="text-[10px] text-neutral-500 font-medium">
                              {user.name} • {s.schedule.type}
                            </p>
                            <p className="text-[9px] text-neutral-400">
                              Time: {s.schedule.timeSlot} • Qty: {s.schedule.quantity}
                            </p>
                            {s.additionalProducts && s.additionalProducts.length > 0 && (
                              <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                                + {s.additionalProducts.length} Add-on(s): {s.additionalProducts.map(ap => `${ap.product.name} (x${ap.quantity})`).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            s.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            s.status === 'paused' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-neutral-100 text-neutral-800 dark:bg-neutral-850 dark:text-neutral-300'
                          }`}>
                            {s.status}
                          </span>
                          <p className="text-[9px] text-neutral-400 mt-1">₹{s.product.price * s.schedule.quantity}/drop</p>
                        </div>
                      </div>
                    );
                  })}
                  {filteredSubscriptions.length === 0 && (
                    <div className="text-center py-12">
                      <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">No subscriptions match the current filters.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Render Users List */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                  Registered Customers ({filteredUsersList.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredUsersList.map(([id, u]) => (
                    <div 
                      key={id}
                      className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-start gap-3"
                    >
                      <img src={u.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-black text-neutral-900 dark:text-white truncate">{u.name}</p>
                        <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{u.email}</span>
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                          <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span>{u.phone}</span>
                        </p>
                        <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                          <Award className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{u.rewardPoints || 0} Points</span>
                        </p>
                      </div>
                    </div>
                  ))}
                  {filteredUsersList.length === 0 && (
                    <div className="col-span-2 text-center py-12">
                      <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400">No customer profiles found matching search criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Render Local Shops (Super Admin only) */}
            {activeTab === 'shops' && isSuperAdmin && (
              <div className="space-y-6">
                {/* Subtabs Controller */}
                <div className="flex bg-neutral-100 dark:bg-neutral-900/50 p-1 rounded-xl max-w-md">
                  <button
                    onClick={() => setShopSubTab('requests')}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                      shopSubTab === 'requests'
                        ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                    }`}
                  >
                    Shop Owner Requests ({shopOwners.length})
                  </button>
                  <button
                    onClick={() => setShopSubTab('legacy')}
                    className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                      shopSubTab === 'legacy'
                        ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                    }`}
                  >
                    Manual Shop Creation ({filteredShops.length})
                  </button>
                </div>

                {shopSubTab === 'legacy' ? (
                  <div className="space-y-6">
                    {/* Create Shop Form */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                          Create Local Shop Admin Account
                        </h3>
                      </div>
                      <form onSubmit={handleCreateShop} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                              Shop Name
                            </label>
                            <input
                              type="text"
                              required
                              value={newShopName}
                              onChange={(e) => setNewShopName(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              placeholder="e.g. Pune Central Dairy"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                              Owner Name
                            </label>
                            <input
                              type="text"
                              required
                              value={newOwnerName}
                              onChange={(e) => setNewOwnerName(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              placeholder="e.g. Ramesh Patel"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                              Phone Number
                            </label>
                            <input
                              type="text"
                              required
                              value={newShopPhone}
                              onChange={(e) => setNewShopPhone(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              placeholder="e.g. +91 9876543210"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                              Email Address (UID login)
                            </label>
                            <input
                              type="email"
                              required
                              value={newShopEmail}
                              onChange={(e) => setNewShopEmail(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              placeholder="e.g. punecentral@paragmilk.com"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                              Login Password
                            </label>
                            <input
                              type="password"
                              required
                              value={newShopPassword}
                              onChange={(e) => setNewShopPassword(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              placeholder="•••••"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                              Delivery Radius (km)
                            </label>
                            <input
                              type="number"
                              required
                              value={newShopRadius}
                              onChange={(e) => setNewShopRadius(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              placeholder="e.g. 20"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                              Shop Address
                            </label>
                            <input
                              type="text"
                              required
                              value={newShopAddress}
                              onChange={(e) => setNewShopAddress(e.target.value)}
                              className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              placeholder="e.g. MG Road, Camp, Pune"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                Latitude
                              </label>
                              <input
                                type="text"
                                required
                                value={newShopLat}
                                onChange={(e) => setNewShopLat(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                                placeholder="18.5204"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                Longitude
                              </label>
                              <input
                                type="text"
                                required
                                value={newShopLng}
                                onChange={(e) => setNewShopLng(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                                placeholder="73.8567"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isCreatingShop}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all disabled:opacity-50"
                        >
                          {isCreatingShop ? 'CREATING ACCOUNTS...' : 'REGISTER LOCAL DISTRIBUTOR'}
                        </button>
                      </form>
                    </div>

                    {/* Registered Shops List */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                        Registered Distributors & Delivery Areas ({filteredShops.length})
                      </h3>
                      <div className="space-y-4">
                        {filteredShops.map((s) => (
                          <div
                            key={s.id}
                            className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                <span>{s.shopName}</span>
                              </p>
                              <p className="text-[10px] text-neutral-500 font-bold">
                                Owner: {s.ownerName} • Phone: {s.phone} • Email: {s.email}
                              </p>
                              <p className="text-[10px] text-neutral-400 leading-normal">
                                Address: {s.address}
                              </p>
                              <div className="flex gap-3 text-[9px] text-neutral-500 font-bold pt-1.5">
                                <span className="bg-neutral-250 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-neutral-700 dark:text-neutral-300">
                                  Radius: {s.deliveryRadius} km
                                </span>
                                <span className="bg-neutral-250 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-neutral-700 dark:text-neutral-300">
                                  Lat: {s.latitude} • Lng: {s.longitude}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteShop(s.id, s.uid)}
                              className="self-start sm:self-auto p-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/45 rounded-xl transition-all cursor-pointer border border-red-100/30"
                              title="Delete distributor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {filteredShops.length === 0 && (
                          <div className="text-center py-12">
                            <MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                            <p className="text-xs text-neutral-400">No active local shops registered in delivery area routing.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Editing Form */}
                    {editingShopOwner && (
                      <div className="bg-blue-50/50 dark:bg-neutral-950 rounded-3xl border border-blue-100/30 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Edit Shop Owner Details
                          </h3>
                          <button
                            onClick={() => setEditingShopOwner(null)}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-250 text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                        <form onSubmit={handleSaveShopOwnerDetails} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                Shop Name
                              </label>
                              <input
                                type="text"
                                required
                                value={editShopName}
                                onChange={(e) => setEditShopName(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                Owner Name
                              </label>
                              <input
                                type="text"
                                required
                                value={editOwnerName}
                                onChange={(e) => setEditOwnerName(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                Phone Number
                              </label>
                              <input
                                type="text"
                                required
                                value={editShopPhone}
                                onChange={(e) => setEditShopPhone(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                Delivery Radius (km)
                              </label>
                              <input
                                type="number"
                                required
                                value={editShopRadius}
                                onChange={(e) => setEditShopRadius(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                Shop Address
                              </label>
                              <input
                                type="text"
                                required
                                value={editShopAddress}
                                onChange={(e) => setEditShopAddress(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 text-xs px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                  Latitude
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editShopLat}
                                  onChange={(e) => setEditShopLat(e.target.value)}
                                  className="w-full bg-white dark:bg-neutral-900 text-xs px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider mb-1">
                                  Longitude
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editShopLng}
                                  onChange={(e) => setEditShopLng(e.target.value)}
                                  className="w-full bg-white dark:bg-neutral-900 text-xs px-2 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all"
                          >
                            SAVE SHOP DETAILS
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Shop Owners Requests List */}
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                      <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                        Self-Registered Shop Owners & Statuses ({shopOwners.length})
                      </h3>
                      <div className="space-y-4">
                        {shopOwners.map((owner) => {
                          const isApproved = owner.status === 'Approved';
                          const isPending = owner.status === 'Pending Approval' || owner.status === 'Pending' || !owner.status;
                          const isRejected = owner.status === 'Rejected';
                          const isSuspended = owner.status === 'Suspended';

                          return (
                            <div
                              key={owner.id}
                              className="p-5 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-black text-neutral-900 dark:text-white">
                                    {owner.shopName}
                                  </h4>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize ${
                                    isApproved ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                    isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                                    isRejected ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                                    'bg-neutral-150 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                  }`}>
                                    {owner.status || 'Pending Approval'}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400">
                                  Owner: {owner.ownerName} • Phone: {owner.phone} • Email: {owner.email}
                                </p>
                                <p className="text-[11px] text-neutral-500 leading-normal font-medium max-w-xl">
                                  Address: {owner.address}
                                </p>
                                <div className="flex flex-wrap gap-2 text-[9px] font-black text-neutral-500 pt-1">
                                  <span className="bg-neutral-250 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                                    Delivery Radius: {owner.deliveryRadius || 25} km
                                  </span>
                                  <span className="bg-neutral-250 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                                    Lat: {owner.latitude} • Lng: {owner.longitude}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 shrink-0 self-stretch sm:self-auto justify-end">
                                <button
                                  onClick={() => handleStartEditShopOwner(owner)}
                                  className="px-2.5 py-1.5 bg-neutral-200/60 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                >
                                  Edit
                                </button>
                                {isPending && (
                                  <>
                                    <button
                                      onClick={() => handleApproveShopOwner(owner)}
                                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectShopOwner(owner)}
                                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {isApproved && (
                                  <button
                                    onClick={() => handleSuspendShopOwner(owner)}
                                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {(isSuspended || isRejected) && (
                                  <button
                                    onClick={() => handleApproveShopOwner(owner)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer"
                                  >
                                    Approve / Reactivate
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteShopOwner(owner)}
                                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-red-700 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {shopOwners.length === 0 && (
                          <div className="text-center py-12">
                            <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                            <p className="text-xs text-neutral-400">No self-registered shop owners found in system database.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action/Inspect Panel (1/3 width on desktop) */}
          <div className="space-y-4">
            {/* Orders Inspector */}
            {activeTab === 'orders' && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6 sticky top-24">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                  Order Dispatch Details
                </h3>
                {selectedOrder ? (
                  <div className="space-y-5">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Order ID</span>
                      <p className="text-sm font-black text-neutral-900 dark:text-white">{selectedOrder.id}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Purchased Products</span>
                      <div className="space-y-2 bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                              {item.product.name} <span className="text-neutral-400">x{item.quantity}</span>
                            </span>
                            <span className="text-neutral-500 font-bold">₹{item.product.price * item.quantity}</span>
                          </div>
                        ))}
                        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2 flex justify-between items-center text-xs font-black">
                          <span>Total Amount</span>
                          <span className="text-neutral-900 dark:text-white">₹{selectedOrder.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Delivery Address</span>
                      <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-normal font-medium mt-1">
                        <strong>{selectedOrder.address.name}</strong> ({selectedOrder.address.phone})<br />
                        {selectedOrder.address.flatNo}, {selectedOrder.address.area}<br />
                        {selectedOrder.address.city} - {selectedOrder.address.pincode}
                      </p>
                    </div>

                    {selectedOrder.shopName && (
                      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/30">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider block">Assigned Local Distributor</span>
                        <p className="text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedOrder.shopName}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-2">Update Dispatch Status</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Pending', status: 'pending', color: 'bg-neutral-600 hover:bg-neutral-700', icon: Clock },
                          { label: 'Confirmed', status: 'confirmed', color: 'bg-indigo-600 hover:bg-indigo-700', icon: CheckCircle2 },
                          { label: 'Processing', status: 'processing', color: 'bg-amber-500 hover:bg-amber-600', icon: Clock },
                          { label: 'Packed', status: 'packed', color: 'bg-purple-600 hover:bg-purple-700', icon: Award },
                          { label: 'Shipped', status: 'shipped', color: 'bg-blue-600 hover:bg-blue-700', icon: RefreshCw },
                          { label: 'Out for Delivery', status: 'out for delivery', color: 'bg-cyan-600 hover:bg-cyan-700', icon: RefreshCw },
                          { label: 'Delivered', status: 'delivered', color: 'bg-emerald-600 hover:bg-emerald-700', icon: CheckCircle2 },
                          { label: 'Cancelled', status: 'cancelled', color: 'bg-rose-600 hover:bg-rose-700', icon: XCircle }
                        ].map((btn) => {
                          const Icon = btn.icon;
                          const isActive = selectedOrder.status === btn.status;
                          return (
                            <button
                              key={btn.status}
                              onClick={() => handleUpdateOrderStatus(selectedOrder.id, btn.status as any)}
                              className={`flex items-center gap-1.5 justify-center py-2 px-2 rounded-xl text-[10px] font-black text-white cursor-pointer transition-all ${
                                isActive ? 'ring-2 ring-neutral-900 dark:ring-white scale-95 font-bold shadow-md' : 'opacity-85 hover:opacity-100'
                              } ${btn.color}`}
                            >
                              <Icon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 leading-normal text-center py-8">
                    Select an order from the list to update its dispatch status or inspect delivery items.
                  </p>
                )}
              </div>
            )}

            {/* Subscriptions Inspector */}
            {activeTab === 'subscriptions' && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6 sticky top-24">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                  Subscription Plan Actions
                </h3>
                {selectedSubscription ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <img src={selectedSubscription.product.image} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-neutral-900 dark:text-white leading-tight">
                          {selectedSubscription.product.name}
                        </h4>
                        <p className="text-[10px] text-neutral-500 uppercase font-black tracking-wider mt-0.5">
                          {selectedSubscription.schedule.type}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-xs font-medium space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Time Window</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                          {selectedSubscription.schedule.timeSlot}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Daily Quantity</span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          {selectedSubscription.schedule.quantity} Litre(s)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Subscription ID</span>
                        <span className="font-mono text-[10px] select-all font-bold text-neutral-800 dark:text-neutral-200">
                          {selectedSubscription.id}
                        </span>
                      </div>
                      {selectedSubscription.pausedUntil && (
                        <div className="flex justify-between text-amber-600 dark:text-amber-400">
                          <span>Paused Until</span>
                          <span className="font-bold">
                            {formatDateToDMY(selectedSubscription.pausedUntil)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Customer Profile Info */}
                    {(() => {
                      const subUser = users[selectedSubscription.userId];
                      return subUser ? (
                        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-850 space-y-1">
                          <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">Customer Profile</span>
                          <span className="text-xs font-black text-neutral-800 dark:text-neutral-250 block">{subUser.name}</span>
                          <span className="text-[10px] text-neutral-500 font-medium block">{subUser.email} • {subUser.phone}</span>
                        </div>
                      ) : null;
                    })()}

                    {/* Delivery Address Details */}
                    {(() => {
                      const subAddress = selectedSubscription.deliveryAddressId ? addresses[selectedSubscription.deliveryAddressId] : null;
                      return subAddress ? (
                        <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-850 space-y-1">
                          <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">Delivery Address</span>
                          <span className="text-xs font-black text-neutral-800 dark:text-neutral-250 block">{subAddress.name} ({subAddress.phone})</span>
                          <p className="text-[10px] text-neutral-500 leading-normal mt-0.5 font-medium">
                            {subAddress.flatNo}, {subAddress.area}, {subAddress.city} - {subAddress.pincode}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl border border-dashed border-amber-100 dark:border-amber-900/30 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          ⚠️ No specific subscription address selected. Will fallback to default address.
                        </div>
                      );
                    })()}

                    {selectedSubscription.shopName && (
                      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100/30">
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider block">Assigned Local Distributor</span>
                        <p className="text-xs font-black text-neutral-800 dark:text-neutral-100 mt-0.5">
                          {selectedSubscription.shopName}
                        </p>
                      </div>
                    )}

                    {/* Additional Add-on Products */}
                    {selectedSubscription.additionalProducts && selectedSubscription.additionalProducts.length > 0 && (
                      <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-850 space-y-2">
                        <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">Add-on Products</span>
                        <div className="space-y-1.5">
                          {selectedSubscription.additionalProducts.map((addon, idx) => (
                            <div key={idx} className="flex flex-col gap-1 text-[10px] text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-100/50">
                              <div className="flex justify-between items-center font-black">
                                <span className="text-neutral-800 dark:text-neutral-200">{addon.product.name}</span>
                                <span className="bg-neutral-100 dark:bg-neutral-850 px-1.5 py-0.5 rounded text-[9px] font-black">Qty: {addon.quantity}</span>
                              </div>
                              {addon.days && (
                                <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                                  <span className="text-[8px] text-neutral-450 font-black uppercase tracking-wider">Days:</span>
                                  {addon.days.map(d => (
                                    <span key={d} className="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 text-[8px] px-1 rounded font-black">{d}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Quick Control Toggle</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUpdateSubscriptionStatus(selectedSubscription.id, 'active')}
                          disabled={selectedSubscription.status === 'active'}
                          className="flex items-center gap-1.5 justify-center py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Activate</span>
                        </button>
                        <button
                          onClick={() => handleUpdateSubscriptionStatus(selectedSubscription.id, 'paused')}
                          disabled={selectedSubscription.status === 'paused'}
                          className="flex items-center gap-1.5 justify-center py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all"
                        >
                          <Pause className="w-3 h-3 fill-current" />
                          <span>Pause Plan</span>
                        </button>
                        <button
                          onClick={() => handleUpdateSubscriptionStatus(selectedSubscription.id, 'skipped')}
                          disabled={selectedSubscription.status === 'skipped'}
                          className="flex items-center gap-1.5 justify-center py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all"
                        >
                          <FastForward className="w-3 h-3" />
                          <span>Skip Once</span>
                        </button>
                        <button
                          onClick={() => handleCancelSubscription(selectedSubscription.id)}
                          className="flex items-center gap-1.5 justify-center py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Cancel VIP</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 leading-normal text-center py-8">
                    Select a recurring subscription to inspect timeslots, quantity counts, or triggers for vacation pauses.
                  </p>
                )}
              </div>
            )}

            {/* Dashboard / General Info panel */}
            {(activeTab === 'dashboard' || activeTab === 'users') && (
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs p-6">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-4">
                  Operating Guidelines
                </h3>
                <div className="space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  <p>
                    Greetings, admin! This dashboard operates directly on your production Firestore database. All actions are instantaneous.
                  </p>
                  <ul className="list-disc pl-4 space-y-2 font-medium">
                    <li>
                      <strong>Orders:</strong> Update order status to 'shipped' once packaged, and 'delivered' upon drop-off.
                    </li>
                    <li>
                      <strong>Subscriptions:</strong> Manage customer delivery patterns. 'Skipped' resets to 'active' on the next scheduled run.
                    </li>
                    <li>
                      <strong>Loyalty points:</strong> Ensure dispatch of certified organic milk to maintain client feedback loops.
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
