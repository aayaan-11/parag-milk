import { 
  collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, updateDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Address, SubscriptionItem, Order, Product } from '../types';
import { PRODUCTS } from '../data';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', errInfo.error, 'at path:', path);
}

export function cleanUndefined(obj: any): any {
  if (obj === undefined || obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      } else {
        cleaned[key] = null;
      }
    }
    return cleaned;
  }
  return obj;
}

// Distance & Shop Operations
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface Shop {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  email: string;
  uid: string;
  address: string;
  latitude: number;
  longitude: number;
  deliveryRadius: number;
}

export async function findNearestShop(customerLat: number, customerLng: number): Promise<Shop | null> {
  let nearestShop: Shop | null = null;
  let minDistance = Infinity;

  // 1. Try approved shopOwners collection (no radius restriction)
  try {
    const shopOwnersSnapshot = await getDocs(collection(db, 'shopOwners'));
    shopOwnersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status !== 'Approved') return;

      const shopLat = Number(data.latitude ?? data.lat);
      const shopLng = Number(data.longitude ?? data.lng);

      const distance = (!isNaN(shopLat) && !isNaN(shopLng) && !isNaN(customerLat) && !isNaN(customerLng))
        ? calculateDistance(customerLat, customerLng, shopLat, shopLng)
        : 0;

      if (distance < minDistance || !nearestShop) {
        minDistance = distance;
        nearestShop = {
          id: data.shopId || docSnap.id,
          shopName: data.shopName || 'PARAG Milk Franchise',
          ownerName: data.ownerName || '',
          phone: data.phone || '',
          email: data.email || '',
          uid: data.uid || data.firebaseUid || docSnap.id,
          address: data.address || data.shopAddress || '',
          latitude: isNaN(shopLat) ? 18.5204 : shopLat,
          longitude: isNaN(shopLng) ? 73.8567 : shopLng,
          deliveryRadius: 999999
        };
      }
    });
  } catch (err) {
    console.warn("Could not query shopOwners collection:", err);
  }

  // 2. Try shops collection if none found yet
  if (!nearestShop) {
    try {
      const querySnapshot = await getDocs(collection(db, 'shops'));
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const shopLat = Number(data.latitude ?? data.lat);
        const shopLng = Number(data.longitude ?? data.lng);

        const distance = (!isNaN(shopLat) && !isNaN(shopLng) && !isNaN(customerLat) && !isNaN(customerLng))
          ? calculateDistance(customerLat, customerLng, shopLat, shopLng)
          : 0;

        if (distance < minDistance || !nearestShop) {
          minDistance = distance;
          nearestShop = {
            id: docSnap.id,
            shopName: data.shopName || 'PARAG Milk Hub',
            ownerName: data.ownerName || '',
            phone: data.phone || '',
            email: data.email || '',
            uid: data.uid || docSnap.id,
            address: data.address || '',
            latitude: isNaN(shopLat) ? 18.5204 : shopLat,
            longitude: isNaN(shopLng) ? 73.8567 : shopLng,
            deliveryRadius: 999999
          };
        }
      });
    } catch (err) {
      console.warn("Could not query shops collection:", err);
    }
  }

  // 3. Fallback shop so EVERY location is deliverable without failing
  if (!nearestShop) {
    nearestShop = {
      id: 'SHOP-DEFAULT-101',
      shopName: 'PARAG Milk Central Hub',
      ownerName: 'PARAG Dairy Operations',
      phone: '+91 1800 120 2688',
      email: 'admin@paragmilk.com',
      uid: 'parag_central_hub',
      address: 'Parag Dairy Main Plant & Distribution Center',
      latitude: 18.5204,
      longitude: 73.8567,
      deliveryRadius: 999999
    };
  }

  return nearestShop;
}

// User Profile Operations
export async function saveUserProfile(userId: string, data: { name: string; email: string; phone: string; avatar: string; rewardPoints: number }) {
  const path = `users/${userId}`;
  try {
    await setDoc(doc(db, 'users', userId), cleanUndefined(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserProfile(userId: string) {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as { name: string; email: string; phone: string; avatar: string; rewardPoints: number };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// Address Operations
export async function saveAddress(userId: string, address: Address) {
  const path = `addresses/${address.id}`;
  try {
    await setDoc(doc(db, 'addresses', address.id), cleanUndefined({
      ...address,
      userId
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAddressFromDb(addressId: string) {
  const path = `addresses/${addressId}`;
  try {
    await deleteDoc(doc(db, 'addresses', addressId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchAddressesFromDb(userId: string): Promise<Address[]> {
  const path = 'addresses';
  try {
    const q = query(collection(db, 'addresses'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const results: Address[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        id: data.id,
        name: data.name,
        phone: data.phone,
        flatNo: data.flatNo,
        area: data.area,
        landmark: data.landmark,
        city: data.city,
        pincode: data.pincode,
        isDefault: data.isDefault
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Subscription Operations
export async function saveSubscriptionToDb(userId: string, subscription: SubscriptionItem) {
  const path = `subscriptions/${subscription.id}`;
  try {
    const rawSub: any = {
      id: subscription.id,
      userId,
      customerName: subscription.customerName || null,
      customerEmail: subscription.customerEmail || null,
      productId: subscription.product.id,
      schedule: subscription.schedule,
      status: subscription.status,
      pausedUntil: subscription.pausedUntil || null,
      timestamp: subscription.timestamp || new Date().toISOString(),
      nextDeliveryDate: subscription.nextDeliveryDate || null,
      shopId: subscription.shopId || null,
      shopName: subscription.shopName || null,
      shopUid: subscription.shopUid || null
    };

    if (subscription.additionalProducts) {
      rawSub.additionalProducts = subscription.additionalProducts.map(ap => ({
        productId: ap.product.id,
        quantity: ap.quantity,
        days: ap.days || null
      }));
    } else {
      rawSub.additionalProducts = null;
    }

    if (subscription.deliveryAddressId) {
      rawSub.deliveryAddressId = subscription.deliveryAddressId;
    } else {
      rawSub.deliveryAddressId = null;
    }

    await setDoc(doc(db, 'subscriptions', subscription.id), cleanUndefined(rawSub));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateSubscriptionStatusInDb(subscriptionId: string, status: 'active' | 'paused' | 'skipped', pausedUntil?: string) {
  const path = `subscriptions/${subscriptionId}`;
  try {
    const docRef = doc(db, 'subscriptions', subscriptionId);
    await updateDoc(docRef, cleanUndefined({
      status,
      pausedUntil: pausedUntil || null
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteSubscriptionFromDb(subscriptionId: string) {
  const path = `subscriptions/${subscriptionId}`;
  try {
    await deleteDoc(doc(db, 'subscriptions', subscriptionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchSubscriptionsFromDb(userId: string): Promise<SubscriptionItem[]> {
  const path = 'subscriptions';
  try {
    const q = query(collection(db, 'subscriptions'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const results: SubscriptionItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const product = PRODUCTS.find((p) => p.id === data.productId);
      if (product) {
        const additionalProductsMapped = (data.additionalProducts || []).map((ap: any) => {
          if (!ap) return null;
          const prod = PRODUCTS.find((p) => p.id === ap.productId);
          return prod ? { product: prod, quantity: ap.quantity, days: ap.days || undefined } : null;
        }).filter(Boolean);

        results.push({
          id: data.id,
          product,
          schedule: data.schedule,
          status: data.status,
          pausedUntil: data.pausedUntil || undefined,
          additionalProducts: additionalProductsMapped.length > 0 ? additionalProductsMapped : undefined,
          deliveryAddressId: data.deliveryAddressId || undefined,
          userId: data.userId,
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
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Order Operations
export async function saveOrderToDb(userId: string, order: Order) {
  const path = `orders/${order.id}`;
  try {
    // Simplify items to save raw format or exact mapping
    const savedItems = order.items.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));
    await setDoc(doc(db, 'orders', order.id), cleanUndefined({
      id: order.id,
      userId,
      date: order.date,
      items: savedItems,
      totalAmount: order.totalAmount,
      status: order.status,
      deliverySlot: order.deliverySlot,
      address: order.address,
      paymentMethod: order.paymentMethod,
      customerName: order.customerName || null,
      customerEmail: order.customerEmail || null,
      customerPhone: order.customerPhone || null,
      timestamp: order.timestamp || new Date().toISOString(),
      shopId: order.shopId || null,
      shopName: order.shopName || null,
      shopUid: order.shopUid || null
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchOrdersFromDb(userId: string): Promise<Order[]> {
  const path = 'orders';
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const results: Order[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const itemsMapped = (data.items || []).map((savedItem: any) => {
        const prod = PRODUCTS.find((p) => p.id === savedItem.productId);
        return prod ? { product: prod, quantity: savedItem.quantity } : null;
      }).filter(Boolean);

      results.push({
        id: data.id,
        date: data.date,
        items: itemsMapped,
        totalAmount: data.totalAmount,
        status: data.status,
        deliverySlot: data.deliverySlot,
        address: data.address,
        paymentMethod: data.paymentMethod,
        userId: data.userId,
        customerName: data.customerName || undefined,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        timestamp: data.timestamp || undefined,
        cancelledBy: data.cancelledBy || undefined,
        cancelledAt: data.cancelledAt || undefined,
        shopId: data.shopId || undefined,
        shopName: data.shopName || undefined,
        shopUid: data.shopUid || undefined
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Fetch All Subscriptions (Admin only)
export async function fetchAllSubscriptionsFromDb(): Promise<(SubscriptionItem & { userId: string })[]> {
  const path = 'subscriptions';
  try {
    const q = collection(db, 'subscriptions');
    const snap = await getDocs(q);
    const results: (SubscriptionItem & { userId: string })[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const product = PRODUCTS.find((p) => p.id === data.productId);
      if (product) {
        const additionalProductsMapped = (data.additionalProducts || []).map((ap: any) => {
          if (!ap) return null;
          const prod = PRODUCTS.find((p) => p.id === ap.productId);
          return prod ? { product: prod, quantity: ap.quantity, days: ap.days || undefined } : null;
        }).filter(Boolean);

        results.push({
          id: data.id,
          userId: data.userId,
          product,
          schedule: data.schedule,
          status: data.status,
          pausedUntil: data.pausedUntil || undefined,
          additionalProducts: additionalProductsMapped.length > 0 ? additionalProductsMapped : undefined,
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
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Fetch All Orders (Admin only)
export async function fetchAllOrdersFromDb(): Promise<(Order & { userId: string })[]> {
  const path = 'orders';
  try {
    const q = collection(db, 'orders');
    const snap = await getDocs(q);
    const results: (Order & { userId: string })[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const itemsMapped = (data.items || []).map((savedItem: any) => {
        const prod = PRODUCTS.find((p) => p.id === savedItem.productId);
        return prod ? { product: prod, quantity: savedItem.quantity } : null;
      }).filter(Boolean);

      results.push({
        id: data.id,
        userId: data.userId,
        date: data.date,
        items: itemsMapped,
        totalAmount: data.totalAmount,
        status: data.status,
        deliverySlot: data.deliverySlot,
        address: data.address,
        paymentMethod: data.paymentMethod,
        customerName: data.customerName || undefined,
        customerEmail: data.customerEmail || undefined,
        customerPhone: data.customerPhone || undefined,
        timestamp: data.timestamp || undefined,
        cancelledBy: data.cancelledBy || undefined,
        cancelledAt: data.cancelledAt || undefined,
        shopId: data.shopId || undefined,
        shopName: data.shopName || undefined,
        shopUid: data.shopUid || undefined
      });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// Fetch All Users (Admin only)
export async function fetchAllUsersFromDb(): Promise<{ [userId: string]: { name: string; email: string; phone: string; avatar: string; rewardPoints: number } }> {
  const path = 'users';
  try {
    const q = collection(db, 'users');
    const snap = await getDocs(q);
    const results: { [userId: string]: { name: string; email: string; phone: string; avatar: string; rewardPoints: number } } = {};
    snap.forEach((docSnap) => {
      results[docSnap.id] = docSnap.data() as any;
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

// Fetch All Addresses (Admin only)
export async function fetchAllAddressesFromDb(): Promise<{ [id: string]: Address & { userId?: string } }> {
  const path = 'addresses';
  try {
    const q = collection(db, 'addresses');
    const snap = await getDocs(q);
    const results: { [id: string]: Address & { userId?: string } } = {};
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
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

// Admin Action: Update Order Status
export async function updateOrderStatusInDb(orderId: string, status: string, updatedBy?: string) {
  const collectionName = 'orders';
  const path = `${collectionName}/${orderId}`;

  if (!orderId) {
    const errorMsg = 'Invalid Order ID passed to updateOrderStatusInDb';
    console.warn(`[Firestore Order Update Notice]`, errorMsg);
    return;
  }

  const currentUserIdentifier = auth.currentUser?.email || auth.currentUser?.uid || 'Admin';
  const updatePayload = cleanUndefined({
    status,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || currentUserIdentifier
  });

  console.log(`[Firestore Order Update Attempt] Collection: '${collectionName}', Document ID: '${orderId}', Payload:`, updatePayload);

  try {
    const docRef = doc(db, collectionName, orderId);
    await setDoc(docRef, updatePayload, { merge: true });
    console.log(`[Firestore Order Update Success] Order ID: ${orderId} updated to status: ${status}`);
  } catch (error: any) {
    const errorCode = error?.code || 'unknown';
    const errorMessage = error?.message || String(error);

    console.warn(`[Firestore Order Update Notice]`, {
      code: errorCode,
      message: errorMessage,
      documentId: orderId,
      collectionName,
      updatePayload
    });

    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// User/Admin Action: Cancel Order
export async function cancelOrderInDb(orderId: string, cancelledBy: string = 'User') {
  const collectionName = 'orders';
  const path = `${collectionName}/${orderId}`;
  if (!orderId) return;

  const now = new Date().toISOString();
  const updatePayload = {
    status: 'Cancelled',
    cancelledBy,
    cancelledAt: now,
    updatedAt: now,
    updatedBy: cancelledBy
  };

  try {
    const docRef = doc(db, collectionName, orderId);
    await setDoc(docRef, updatePayload, { merge: true });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
