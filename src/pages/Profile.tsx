import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { PRODUCTS } from '../data';
import { 
  User, Calendar, ShoppingBag, MapPin, Heart, 
  Settings, LogOut, Award, Percent, Trash2, ShoppingCart, 
  Clock, CheckCircle, ChevronRight, FileText, ArrowUpRight, Plus 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthModal } from '../components/AuthModal';
import { auth } from '../firebase';
import { formatDateToDMY } from '../utils/dateHelpers';

interface ProfileProps {
  initialTab?: 'profile' | 'orders' | 'subscriptions' | 'wishlist' | 'addresses' | 'rewards';
}

export const Profile: React.FC<ProfileProps> = ({ initialTab: propInitialTab }) => {
  const location = useLocation();
  const stateInitialTab = (location.state as any)?.activeTab;
  const computedInitialTab = propInitialTab || stateInitialTab || 'profile';

  const { 
    currentUser, orders, subscriptions, wishlist, addresses, 
    updateSubscriptionStatus, deleteSubscription, removeAddress, 
    toggleWishlist, addToCart, logout, updateProfile, showToast, cancelOrder
  } = useApp();

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Tab selections
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'subscriptions' | 'wishlist' | 'addresses' | 'rewards'>(computedInitialTab);
  const [orderFilterTab, setOrderFilterTab] = useState<'active' | 'cancelled'>('active');

  React.useEffect(() => {
    if (propInitialTab) {
      setActiveTab(propInitialTab);
    } else if (stateInitialTab) {
      setActiveTab(stateInitialTab);
    }
  }, [propInitialTab, stateInitialTab]);

  // Edit profile states
  const [editName, setEditName] = useState(currentUser ? currentUser.name : '');
  const [editEmail, setEditEmail] = useState(currentUser ? currentUser.email : '');
  const [editPhone, setEditPhone] = useState(currentUser ? currentUser.phone : '');

  // Invoice modal preview state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950">
        <User className="w-16 h-16 text-neutral-300 animate-pulse mb-4" />
        <h2 className="text-xl font-black text-neutral-800 dark:text-neutral-200">Unlock Your VIP Dashboard</h2>
        <p className="text-neutral-500 text-xs mt-1.5 max-w-xs">Sign in to schedule repeating milk drops, manage vacation pauses, earn reward points, and track order histories.</p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-8 py-3 rounded-full shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
        >
          SIGN IN / CREATE ACCOUNT
        </button>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(editName, editEmail, editPhone);
  };

  const handleMoveToCart = (productId: string) => {
    const p = PRODUCTS.find((product) => product.id === productId);
    if (p) {
      addToCart(p, 1);
      toggleWishlist(productId); // Remove from wishlist
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24">
      
      {/* Upper Profile Greeting Banner */}
      <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row items-center gap-6 justify-between mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/50"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              {currentUser.name}
            </h1>
            <span className="text-xs text-neutral-400 font-bold block mt-0.5">
              Pune Member • {currentUser.email}
            </span>
          </div>
        </div>

        {/* Loyalty reward points bubble */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-md shrink-0 w-full md:w-auto justify-center">
          <Award className="w-6 h-6 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest leading-none">Loyalty Club Points</span>
            <span className="text-lg font-black font-mono leading-none mt-1">{currentUser.rewardPoints} points</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR TABS SELECTION MENU */}
        <div className="lg:col-span-1 bg-white dark:bg-neutral-900 rounded-[28px] p-5 border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-5">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'orders', label: 'Order History', icon: ShoppingBag },
            { id: 'subscriptions', label: 'Active Subscriptions', icon: Calendar },
            { id: 'wishlist', label: 'My Wishlist', icon: Heart },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'rewards', label: 'Coupons & Loyalty', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black transition-colors shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 shrink-0 cursor-pointer mt-0 lg:mt-6"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>

        {/* DETAILS PANEL COMPONENT PANEL */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            
            {/* TAB: PROFILE UPDATE FORM */}
            {activeTab === 'profile' && (
              <motion.div
                key="profile-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6"
              >
                <h2 className="text-base font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider pb-4 border-b">
                  Profile Information Settings
                </h2>

                <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-black uppercase text-neutral-400 tracking-wider">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl focus:outline-hidden"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-black uppercase text-neutral-400 tracking-wider">Your Registered Email</label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl focus:outline-hidden"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-black uppercase text-neutral-400 tracking-wider">Contact Phone Number</label>
                    <input
                      type="text"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-black px-6 py-2.5 rounded-xl shadow-xs"
                  >
                    SAVE PROFILE UPDATE
                  </button>
                </form>
              </motion.div>
            )}

            {/* TAB: ORDERS TIMELINE AND HISTORY */}
            {activeTab === 'orders' && (() => {
              const currentUid = auth.currentUser?.uid;
              const currentEmail = auth.currentUser?.email || currentUser?.email;
              const userOrders = orders.filter((o) => {
                if (currentUid && o.userId) return o.userId === currentUid;
                if (currentEmail && o.customerEmail) return o.customerEmail.toLowerCase() === currentEmail.toLowerCase();
                return true;
              });

              const activeOrders = userOrders.filter((o) => (o.status || '').toLowerCase() !== 'cancelled');
              const cancelledOrders = userOrders.filter((o) => (o.status || '').toLowerCase() === 'cancelled');

              const displayedOrders = orderFilterTab === 'active' ? activeOrders : cancelledOrders;

              return (
                <motion.div
                  key="orders-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Order Filter Sub-tabs */}
                  <div className="flex bg-neutral-100 dark:bg-neutral-900/80 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 gap-1">
                    <button
                      onClick={() => setOrderFilterTab('active')}
                      className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        orderFilterTab === 'active'
                          ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                      }`}
                    >
                      Active Orders ({activeOrders.length})
                    </button>
                    <button
                      onClick={() => setOrderFilterTab('cancelled')}
                      className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                        orderFilterTab === 'cancelled'
                          ? 'bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                      }`}
                    >
                      Cancelled Orders ({cancelledOrders.length})
                    </button>
                  </div>

                  {displayedOrders.length === 0 ? (
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 text-center border border-neutral-100 dark:border-neutral-800">
                      <span className="text-xs text-neutral-400 font-bold block">
                        {orderFilterTab === 'active' ? 'No active orders currently.' : 'No cancelled orders.'}
                      </span>
                    </div>
                  ) : (
                    displayedOrders.map((ord) => {
                      const st = (ord.status || 'processing').toLowerCase().replace(/_/g, ' ');
                      const isDelivered = st === 'delivered';
                      const isCancelled = st === 'cancelled';
                      const isOutForDelivery = st === 'out for delivery' || st === 'shipped';

                      const isCancellable = ['pending', 'confirmed', 'processing', 'order placed'].includes(st);
                      const isNonCancellableInTransit = ['packed', 'shipped', 'out for delivery', 'delivered'].includes(st);

                      let badgeStyle = 'bg-blue-50 text-blue-600 border-blue-200';
                      if (isDelivered) badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                      else if (isCancelled) badgeStyle = 'bg-rose-50 text-rose-600 border-rose-200';
                      else if (isOutForDelivery) badgeStyle = 'bg-amber-50 text-amber-600 border-amber-200';

                      let timelineWidth = 'w-[25%]';
                      if (isDelivered) timelineWidth = 'w-[75%]';
                      else if (isOutForDelivery) timelineWidth = 'w-[50%]';
                      else if (isCancelled) timelineWidth = 'w-[0%]';

                      return (
                        <div 
                          key={ord.id}
                          className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-5"
                        >
                          {/* Order Title and Receipt trigger */}
                          <div className="flex flex-wrap gap-4 justify-between items-center pb-4 border-b">
                            <div className="flex flex-col">
                              <span className="text-xs font-extrabold text-blue-600 font-mono">{ord.id}</span>
                              <span className="text-[10px] text-neutral-400 font-bold mt-0.5">Ordered date: {formatDateToDMY(ord.date)}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedInvoiceOrder(ord)}
                                className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 text-[11px] font-black px-3.5 py-2 rounded-xl border flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>INVOICE</span>
                              </button>
                              <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${badgeStyle}`}>
                                {ord.status}
                              </span>
                            </div>
                          </div>

                          {/* Items mapping */}
                          <div className="space-y-3">
                            {ord.items.map((item) => (
                              <div key={item.product.id} className="flex items-center gap-3 justify-between text-xs">
                                <span className="font-extrabold text-neutral-700 dark:text-neutral-300">
                                  {item.product.name} <span className="text-neutral-400 font-bold">x{item.quantity}</span>
                                </span>
                                <span className="font-mono text-neutral-500">₹{item.product.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* Visual Status Timeline Progress Bar */}
                          <div className="bg-neutral-50 dark:bg-neutral-950/20 p-4 rounded-2xl border space-y-4">
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Delivery Status Timeline</span>
                            <div className="grid grid-cols-4 text-center relative pt-4 text-[10px] font-black">
                              {/* Timeline horizontal background lines */}
                              <div className="absolute top-1.5 left-[12.5%] right-[12.5%] h-1 bg-neutral-200 dark:bg-neutral-850 z-0" />
                              <div className={`absolute top-1.5 left-[12.5%] ${timelineWidth} h-1 ${isCancelled ? 'bg-rose-500' : 'bg-emerald-500'} z-0 transition-all duration-500`} />

                              {/* Node 1: Order Placed */}
                              <div className="flex flex-col items-center gap-1">
                                <span className={`w-4 h-4 ${isCancelled ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'} rounded-full flex items-center justify-center text-[8px] relative z-10 font-bold`}>✓</span>
                                <span className="text-neutral-600 dark:text-neutral-300">Order Placed</span>
                              </div>
                              {/* Node 2: Packed */}
                              <div className="flex flex-col items-center gap-1">
                                <span className={`w-4 h-4 ${isCancelled ? 'bg-neutral-200 text-neutral-400' : (isDelivered || isOutForDelivery ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white animate-pulse')} rounded-full flex items-center justify-center text-[8px] relative z-10 font-bold`}>
                                  {isCancelled ? '✕' : (isDelivered || isOutForDelivery ? '✓' : '•')}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-300">Packed</span>
                              </div>
                              {/* Node 3: Out for Delivery */}
                              <div className="flex flex-col items-center gap-1">
                                <span className={`w-4 h-4 ${isCancelled ? 'bg-neutral-200 text-neutral-400' : (isDelivered ? 'bg-emerald-500 text-white' : (isOutForDelivery ? 'bg-amber-500 text-white animate-pulse' : 'bg-neutral-200 text-neutral-400'))} rounded-full flex items-center justify-center text-[8px] relative z-10 font-bold`}>
                                  {isCancelled ? '✕' : (isDelivered ? '✓' : (isOutForDelivery ? '•' : '•'))}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-300">Out for Drop</span>
                              </div>
                              {/* Node 4: Delivered */}
                              <div className="flex flex-col items-center gap-1">
                                <span className={`w-4 h-4 ${isCancelled ? 'bg-neutral-200 text-neutral-400' : (isDelivered ? 'bg-emerald-500 text-white' : 'bg-neutral-200 text-neutral-400')} rounded-full flex items-center justify-center text-[8px] relative z-10 font-bold`}>
                                  {isCancelled ? '✕' : (isDelivered ? '✓' : '•')}
                                </span>
                                <span className="text-neutral-600 dark:text-neutral-300">Delivered</span>
                              </div>
                            </div>
                          </div>

                          {/* Delivery timings & Action Buttons */}
                          <div className="flex flex-wrap gap-4 justify-between items-center pt-2">
                            <span className="text-[11px] font-medium text-neutral-400 leading-normal">
                              Delivery Slot: <span className="font-extrabold text-neutral-500">{ord.deliverySlot}</span>
                            </span>
                            <div className="flex flex-wrap gap-2 items-center">
                              {isCancellable && (
                                <button
                                  onClick={async () => {
                                    const confirmCancel = window.confirm(`Are you sure you want to cancel Order ${ord.id}?`);
                                    if (confirmCancel) {
                                      await cancelOrder(ord.id);
                                    }
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black px-4 py-2 rounded-xl border border-rose-200 cursor-pointer transition-colors"
                                >
                                  CANCEL ORDER
                                </button>
                              )}
                              {isNonCancellableInTransit && !isCancelled && (
                                <span className="text-[10px] text-neutral-400 font-bold bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                  Order is {ord.status} & cannot be cancelled
                                </span>
                              )}
                              {isCancelled && (
                                <span className="text-[10px] text-rose-600 font-extrabold bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                                  Cancelled {ord.cancelledBy ? `by ${ord.cancelledBy}` : ''}
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  showToast(`Status: ${ord.status.toUpperCase()} for Order ${ord.id}.`, 'info');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                              >
                                TRACK ORDER
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              );
            })()}

            {/* TAB: ACTIVE DAIRY SUBSCRIPTIONS */}
            {activeTab === 'subscriptions' && (
              <motion.div
                key="subs-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6"
              >
                <h2 className="text-base font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider pb-4 border-b">
                  Active Scheduled Delivery Plans
                </h2>

                {subscriptions.length === 0 ? (
                  <div className="text-center py-10 text-neutral-400 text-xs">
                    No active delivery subscription schedules found. Set one up from the Subscriptions menu!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub, idx) => (
                      <div 
                        key={sub.id ? `${sub.id}_${idx}` : idx} 
                        className="p-5 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-150/40 flex flex-col gap-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 pb-4">
                          <div className="flex items-center gap-3">
                            <img src={sub.product.image} alt={sub.product.name} className="w-12 h-12 rounded-xl object-cover bg-white animate-pulse" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-neutral-850 dark:text-neutral-100 block leading-tight">{sub.product.name}</span>
                              <span className="text-[10px] text-neutral-450 block mt-0.5 font-bold">
                                Schedule: <span className="text-neutral-600 dark:text-neutral-300 uppercase font-black">{sub.schedule.type}</span> • Qty: <span className="text-neutral-600 dark:text-neutral-300 font-black">{sub.schedule.quantity} {sub.product.unit}</span>
                              </span>
                              <span className="text-[9px] text-neutral-400 block mt-0.5 font-black">
                                Delivery Slot: <span className="text-neutral-600 dark:text-neutral-300">{sub.schedule.timeSlot === 'morning' ? '🌅 Sunrise Morning' : '🌇 Sunset Evening'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:self-center">
                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                              sub.status === 'active' 
                                ? 'bg-emerald-55/15 text-emerald-600 border border-emerald-200' 
                                : 'bg-amber-55/15 text-amber-600 border border-amber-200'
                            }`}>
                              ● {sub.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          {/* Left Details column - Address */}
                          <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200/40 space-y-1">
                            <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider block">Delivery Destination</span>
                            {(() => {
                              const subAddress = sub.deliveryAddressId ? addresses.find(a => a.id === sub.deliveryAddressId) : addresses.find(a => a.isDefault) || addresses[0];
                              return subAddress ? (
                                <div className="space-y-0.5 font-medium text-neutral-600 dark:text-neutral-450">
                                  <p className="font-black text-neutral-800 dark:text-neutral-200">{subAddress.name}</p>
                                  <p>{subAddress.flatNo}, {subAddress.area}</p>
                                  <p>{subAddress.city} - {subAddress.pincode}</p>
                                  <p className="text-[10px] text-neutral-400 font-bold mt-1">📞 {subAddress.phone}</p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-neutral-450 italic">No delivery address found. Please add one.</p>
                              );
                            })()}
                          </div>

                          {/* Right Details column - Addons & Days */}
                          <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-xl border border-neutral-200/40 space-y-2">
                            <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider block">Add-ons & Secondary Products</span>
                            {sub.additionalProducts && sub.additionalProducts.length > 0 ? (
                              <div className="space-y-2">
                                {sub.additionalProducts.map((addon, index) => (
                                  <div key={index} className="flex flex-col gap-1 bg-neutral-50/50 dark:bg-neutral-950/20 p-2 rounded-lg border border-neutral-100/60">
                                    <div className="flex justify-between items-center text-[10px] font-black">
                                      <span className="text-neutral-800 dark:text-neutral-200">{addon.product.name}</span>
                                      <span className="text-neutral-500">Qty: {addon.quantity}</span>
                                    </div>
                                    {addon.days && (
                                      <div className="flex flex-wrap gap-1 mt-0.5 items-center">
                                        <span className="text-[8px] text-neutral-450 font-black uppercase">Days:</span>
                                        {addon.days.map(d => (
                                          <span key={d} className="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 text-[8px] px-1 rounded font-black">{d}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-[10px] text-neutral-400 font-semibold py-4">
                                No secondary product add-ons scheduled.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Control actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-neutral-200/60 justify-end">
                          {sub.status === 'active' ? (
                            <button
                              onClick={() => updateSubscriptionStatus(sub.id, 'paused')}
                              className="bg-white text-neutral-600 text-[10px] font-black px-4 py-2 rounded-xl border hover:bg-amber-55/20 hover:text-amber-600 cursor-pointer shadow-xs transition-colors"
                            >
                              PAUSE DELIVERIES
                            </button>
                          ) : (
                            <button
                              onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                              className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-4 py-2 rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white cursor-pointer shadow-xs transition-colors"
                            >
                              RESUME PLAN
                            </button>
                          )}
                          <button
                            onClick={() => deleteSubscription(sub.id)}
                            className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white text-[10px] font-black px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                          >
                            CANCEL SUBSCRIPTION
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: MY WISHLIST GRID WITH MOVE TO BASKET TRIGGERS */}
            {activeTab === 'wishlist' && (
              <motion.div
                key="wishlist-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6"
              >
                <h2 className="text-base font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider pb-4 border-b">
                  My Dairy Wishlist ({wishlist.length})
                </h2>

                {wishlist.length === 0 ? (
                  <div className="text-center py-12 text-neutral-400 text-xs">
                    Your wishlist is completely empty. Explore fresh milk, Vedic ghee, and probiotic dahi!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map((productId) => {
                      const p = PRODUCTS.find((p) => p.id === productId);
                      if (!p) return null;
                      return (
                        <div 
                          key={p.id}
                          className="p-3 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-neutral-100/50 flex gap-3 items-center justify-between"
                        >
                          <div className="flex items-center gap-3 shrink-0">
                            <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-white" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 line-clamp-1 max-w-[120px]">{p.name}</span>
                              <span className="text-[10px] text-neutral-400 font-mono">₹{p.price} / {p.unit}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleMoveToCart(p.id)}
                              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                              title="Move to Basket"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleWishlist(p.id)}
                              className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-rose-500"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: DELIVERY ADDRESS MANAGEMENT */}
            {activeTab === 'addresses' && (
              <motion.div
                key="addresses-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6"
              >
                <h2 className="text-base font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider pb-4 border-b">
                  Saved Delivery Address Book
                </h2>

                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border flex items-center justify-between gap-4"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">{addr.name}</span>
                          {addr.isDefault && (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">
                              Default Home
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 font-bold mt-0.5">{addr.phone}</span>
                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                          {addr.flatNo}, {addr.area}, {addr.city} - {addr.pincode}
                        </p>
                      </div>

                      <button
                        onClick={() => removeAddress(addr.id)}
                        disabled={addr.isDefault}
                        className={`p-2.5 rounded-xl transition-all ${
                          addr.isDefault 
                            ? 'text-neutral-200 dark:text-neutral-800 cursor-not-allowed' 
                            : 'text-neutral-400 hover:text-rose-500 hover:bg-rose-50'
                        }`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: REWARDS POINTS AND AVAILABLE COUPONS */}
            {activeTab === 'rewards' && (
              <motion.div
                key="rewards-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6"
              >
                <h2 className="text-base font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider pb-4 border-b">
                  Saved Rewards & Active Promotions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rewards description */}
                  <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-200 block">Parag Club Points Balance</span>
                      <span className="text-3xl font-black font-mono block mt-2">{currentUser.rewardPoints} Loyalty Points</span>
                      <p className="text-amber-100 text-[11px] mt-4 leading-relaxed font-semibold">
                        Earn 1 point for every ₹10 spent on pure dairy purchases. Redeem points on checkout for cash discounts or free high-protein milkshakes!
                      </p>
                    </div>
                    <button
                      onClick={() => showToast('Rewards redemption system under development! Direct conversion active on checkout soon.', 'info')}
                      className="bg-white text-amber-600 font-extrabold text-[11px] py-2.5 rounded-xl mt-6 text-center cursor-pointer shadow-md"
                    >
                      REDEEM CLUB POINTS
                    </button>
                  </div>

                  {/* Available coupons */}
                  <div className="space-y-4">
                    <span className="text-xs font-black text-neutral-400 uppercase tracking-widest block">Available Coupons</span>
                    
                    {[{ code: 'PARAGNEW', desc: 'Flat 15% discount on checkout.' }, { code: 'FRESHDAIRY', desc: '10% discount on fresh milkpacks.' }].map((c) => (
                      <div 
                        key={c.code}
                        className="p-4 bg-neutral-50 dark:bg-neutral-850 rounded-2xl border border-dashed border-neutral-200 flex justify-between items-center"
                      >
                        <div>
                          <span className="text-xs font-extrabold text-blue-600 font-mono block">{c.code}</span>
                          <span className="text-[11px] text-neutral-500 leading-normal block mt-1">{c.desc}</span>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(c.code);
                            showToast(`Coupon code '${c.code}' copied! Paste it in the cart drawer on checkout.`, 'success');
                          }}
                          className="text-[10px] font-black text-neutral-500 hover:text-blue-600 border px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 cursor-pointer"
                        >
                          COPY CODE
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* MODAL PREVIEW INVOICE DOCUMENT */}
      <AnimatePresence>
        {selectedInvoiceOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setSelectedInvoiceOrder(null)} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full max-w-xl bg-white dark:bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 z-10 space-y-6"
            >
              <div className="text-center pb-4 border-b">
                <span className="text-[11px] font-black tracking-widest uppercase text-neutral-400">Tax Invoice / Delivery Bill</span>
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">Parag Milk Dairy</h3>
                <span className="text-xs font-bold text-neutral-400 block mt-1">Licence No: 11522034000318</span>
              </div>

              {/* Bill to */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                <div>
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Delivered To</span>
                  <span className="text-neutral-850 dark:text-neutral-200 font-bold">{selectedInvoiceOrder.address.name}</span>
                  <p className="mt-1 leading-relaxed text-[11px]">
                    {selectedInvoiceOrder.address.flatNo}, {selectedInvoiceOrder.address.area}, {selectedInvoiceOrder.address.city}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Invoice Details</span>
                  <span className="text-neutral-850 dark:text-neutral-200 font-bold block">{selectedInvoiceOrder.id}</span>
                  <span className="block mt-0.5">Date: {formatDateToDMY(selectedInvoiceOrder.date)}</span>
                  <span className="block mt-0.5">Payment: {selectedInvoiceOrder.paymentMethod}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3 pt-4 border-t">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Purchased Items</span>
                {selectedInvoiceOrder.items.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between text-xs font-semibold text-neutral-700">
                    <span>{item.product.name} (x{item.quantity})</span>
                    <span className="font-mono">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-4 border-t flex justify-between items-baseline font-extrabold text-neutral-900 dark:text-neutral-100">
                <span className="text-xs">Final Bill Amount (Inc. GST)</span>
                <span className="text-lg font-mono text-emerald-600">₹{selectedInvoiceOrder.totalAmount}</span>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  onClick={() => setSelectedInvoiceOrder(null)}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-700 text-xs font-black rounded-xl cursor-pointer"
                >
                  CLOSE INVOICE
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer"
                >
                  PRINT BILL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
