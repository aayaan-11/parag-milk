export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  rating: number;
  reviewsCount: number;
  image: string;
  description: string;
  benefits: string[];
  ingredients: string[];
  nutrition: {
    energy: string;
    protein: string;
    fat: string;
    carbohydrates: string;
    calcium: string;
  };
  storage: string;
  available: boolean;
  bestSeller: boolean;
  featured: boolean;
  organic: boolean;
  proteinRich: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SubscriptionSchedule {
  type: 'daily' | 'alternate' | 'weekdays' | 'weekends' | 'weekly' | 'monthly' | 'custom';
  customDays?: string[]; // e.g., ['Mon', 'Wed', 'Fri']
  timeSlot: 'morning' | 'evening';
  quantity: number;
  startDate: string;
}

export interface SubscriptionItem {
  id: string;
  product: Product;
  schedule: SubscriptionSchedule;
  status: 'active' | 'paused' | 'skipped';
  pausedUntil?: string;
  additionalProducts?: { product: Product; quantity: number; days?: string[] }[];
  deliveryAddressId?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  timestamp?: string;
  nextDeliveryDate?: string;
  shopId?: string;
  shopName?: string;
  shopUid?: string;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  totalAmount: number;
  status: string;
  deliverySlot: string;
  address: Address;
  paymentMethod: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  timestamp?: string;
  shopId?: string;
  shopName?: string;
  shopUid?: string;
  cancelledBy?: string;
  cancelledAt?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  flatNo: string;
  area: string;
  landmark?: string;
  city: string;
  pincode: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
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
  deliveryRadius: number; // in km
}

export type UserRole = 'customer' | 'shop_admin' | 'super_admin';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  rewardPoints: number;
  role?: UserRole;
  shopId?: string;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface Blog {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
  category: 'recipes' | 'wellness' | 'dairy-science';
  readTime: string;
}
