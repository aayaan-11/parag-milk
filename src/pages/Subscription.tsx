import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { PRODUCTS } from '../data';
import { 
  Sparkles, Calendar, Clock, AlertCircle, Play, Pause, 
  Trash2, Plus, Check, ShieldCheck, HelpCircle, ArrowRight, Sunset, Sunrise,
  Lock, User, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkDeliveryEligibility } from '../utils/delivery';
import { DeliveryCoverageModal } from '../components/DeliveryCoverageModal';
import { AuthModal } from '../components/AuthModal';
import { formatDateToDMY } from '../utils/dateHelpers';
import { findNearestShop } from '../utils/firebaseHelpers';
import { OSMAddressInput, OSMAddress } from '../components/OSMAddressInput';

export const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { 
    subscriptions, addSubscription, updateSubscriptionStatus, deleteSubscription, 
    updateSubscriptionDetails, showToast, currentUser, addresses, addAddress
  } = useApp();

  const hasActiveSubscription = subscriptions.some(s => s.status === 'active' || s.status === 'paused');

  // Subscription edit state
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<number>(1);
  const [editingTimeSlot, setEditingTimeSlot] = useState<'morning' | 'evening'>('morning');
  const [editingAddressId, setEditingAddressId] = useState<string>('');
  const [editingAddons, setEditingAddons] = useState<{ productId: string; quantity: number; days?: string[] }[]>([]);

  const startEditingSub = (sub: any) => {
    setEditingSubId(sub.id);
    setEditingQty(sub.schedule.quantity);
    setEditingTimeSlot(sub.schedule.timeSlot || 'morning');
    setEditingAddressId(sub.deliveryAddressId || (addresses.find(a => a.isDefault) || addresses[0])?.id || '');
    const currentAddons = (sub.additionalProducts || []).map((ap: any) => ({
      productId: ap.product.id,
      quantity: ap.quantity,
      days: ap.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }));
    setEditingAddons(currentAddons);
  };

  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Active product selector
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]); // Default to first (milk)
  const [qty, setQty] = useState(1);
  const [scheduleType, setScheduleType] = useState<'daily' | 'alternate' | 'weekdays' | 'weekends' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<string[]>(['Mon', 'Wed', 'Fri']);
  const [timeSlot, setTimeSlot] = useState<'morning' | 'evening'>('morning');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // New Address States
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newFlat, setNewFlat] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('Pune');
  const [newPincode, setNewPincode] = useState('');
  const [newLat, setNewLat] = useState<number | undefined>(undefined);
  const [newLng, setNewLng] = useState<number | undefined>(undefined);

  // Delivery Address validation states
  const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddr ? defaultAddr.id : '');
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);

  // Shop coverage states
  const [checkingShop, setCheckingShop] = useState<boolean>(false);
  const [shopCoverageError, setShopCoverageError] = useState<string | null>(null);
  const [assignedShop, setAssignedShop] = useState<any | null>(null);

  // Sync address selection state if user logs in or addresses list changes
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  // Sync edit name/phone when user signs in
  useEffect(() => {
    if (currentUser) {
      setNewName(currentUser.name || '');
      setNewPhone(currentUser.phone || '');
    }
  }, [currentUser]);

  // Find active address eligibility
  const activeAddress = addresses.find(a => a.id === selectedAddressId);
  const eligibility = activeAddress 
    ? checkDeliveryEligibility(activeAddress.city, activeAddress.area) 
    : null;

  // Real-time nearest shop lookup for subscriptions
  useEffect(() => {
    const activeAddr = addresses.find(a => a.id === selectedAddressId) || defaultAddr;
    if (!activeAddr) return;
    
    let active = true;
    const checkCoverage = async () => {
      setCheckingShop(true);
      setShopCoverageError(null);
      try {
        const lat = activeAddr.latitude || 18.5362;
        const lng = activeAddr.longitude || 73.8930;
        const shop = (await findNearestShop(lat, lng)) || {
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
        if (active) {
          setAssignedShop(shop);
          setShopCoverageError(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setCheckingShop(false);
      }
    };
    
    checkCoverage();
    return () => {
      active = false;
    };
  }, [selectedAddressId, addresses, defaultAddr]);

  const isSubscriptionDisabled = !eligibility || !eligibility.isDeliverable || checkingShop || !!shopCoverageError;


  // Vacation pause state
  const [vacationStart, setVacationStart] = useState('');
  const [vacationEnd, setVacationEnd] = useState('');
  const [vacationActive, setVacationActive] = useState(false);

  const toggleCustomDay = (day: string) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFlat && newArea && newPincode) {
      const isFirst = addresses.length === 0;
      addAddress({
        name: newName || currentUser?.name || 'Home',
        phone: newPhone || currentUser?.phone || '',
        flatNo: newFlat,
        area: newArea,
        city: newCity,
        pincode: newPincode,
        latitude: newLat,
        longitude: newLng,
        isDefault: isFirst
      });
      setNewFlat('');
      setNewArea('');
      setNewPincode('');
      setNewLat(undefined);
      setNewLng(undefined);
      setShowNewAddressForm(false);
      showToast('New delivery address added successfully!', 'success');
    } else {
      showToast('Please fill in all required address fields.', 'error');
    }
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setAuthModalOpen(true);
      showToast('Please sign in first to schedule your milk subscription.', 'error');
      return;
    }

    if (addresses.length === 0) {
      showToast('Please add a delivery address first to start automation!', 'error');
      setShowNewAddressForm(true);
      const addrElem = document.getElementById('subscription-address-section');
      if (addrElem) {
        addrElem.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (!selectedAddressId) {
      showToast('Please select a delivery address for your subscription!', 'error');
      return;
    }

    if (!activeAddress) {
      showToast('Selected address was not found. Please select or add an address.', 'error');
      return;
    }

    if (!eligibility || !eligibility.isDeliverable) {
      showToast(eligibility?.reason || 'The selected address is not in our delivery coverage zone.', 'error');
      return;
    }

    addSubscription({
      product: selectedProduct,
      schedule: {
        type: scheduleType,
        customDays: scheduleType === 'custom' ? customDays : undefined,
        timeSlot,
        quantity: qty,
        startDate
      }
    });
    setQty(1);
    showToast(`Successfully created active automated cycle for ${selectedProduct.name}!`, 'success');
  };

  const handleVacationApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (vacationStart && vacationEnd) {
      // Pause all active subscriptions during this range
      subscriptions.forEach((sub) => {
        if (sub.status === 'active') {
          updateSubscriptionStatus(sub.id, 'paused', vacationEnd);
        }
      });
      setVacationActive(true);
      showToast(`Vacation mode activated from ${vacationStart} to ${vacationEnd}!`, 'info');
    }
  };

  const handleVacationCancel = () => {
    subscriptions.forEach((sub) => {
      if (sub.status === 'paused') {
        updateSubscriptionStatus(sub.id, 'active');
      }
    });
    setVacationActive(false);
    setVacationStart('');
    setVacationEnd('');
    showToast('Vacation mode deactivated. All deliveries resumed!', 'success');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
          📅 PRE-SCHEDULED FRESHNESS
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
          Parag Milk Subscriptions
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm mt-3 leading-relaxed">
          Setup custom repeating dairy schedules. Modify, pause, or skip tomorrow's drop easily. Includes free early morning delivery!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN (Lg: 7/12): SUBSCRIPTION BUILDER FORM */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6">
          <h2 className="text-base md:text-lg font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            1. Build repeating dairy cycle
          </h2>

          <form onSubmit={handleSubscribeSubmit} className="space-y-6">
            {/* Step A: Select Product */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">Select product</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ perspective: '1000px' }}>
                {PRODUCTS.map((p) => {
                  const isSelected = selectedProduct.id === p.id;
                  return (
                    <motion.div
                      key={p.id}
                      whileHover={{ 
                        scale: 1.03, 
                        rotateX: isSelected ? 4 : 8, 
                        rotateY: isSelected ? -4 : -8,
                        z: 15
                      }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      onClick={() => setSelectedProduct(p)}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all shadow-xs ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/20 dark:border-blue-500 dark:bg-sky-950/20 ring-2 ring-blue-500/20 shadow-md'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border bg-white" referrerPolicy="no-referrer" />
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 line-clamp-1">{p.name}</span>
                        <span className="text-[10px] text-neutral-400 font-mono mt-0.5">₹{p.price} / {p.unit}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Step B: Select Quantity, Schedule, Timeslot, Start Date and Submit */}
            {currentUser ? (
              <>
                {/* Step B: Select Quantity */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 tracking-wider block">Quantity per delivery drop</label>
                  <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-2xl border w-fit">
                    <button
                      type="button"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="w-10 h-10 rounded-xl hover:bg-white dark:hover:bg-neutral-800 font-bold flex items-center justify-center text-neutral-500 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-black font-mono text-neutral-800 dark:text-neutral-200">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(qty + 1)}
                      className="w-10 h-10 rounded-xl hover:bg-white dark:hover:bg-neutral-800 font-bold flex items-center justify-center text-neutral-500 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Step C: Schedule selector */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 tracking-wider block">Select Delivery Schedule Model</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'daily', label: 'Daily drop' },
                      { id: 'alternate', label: 'Alternate Days' },
                      { id: 'weekdays', label: 'Weekdays' },
                      { id: 'weekends', label: 'Weekends' },
                      { id: 'weekly', label: 'Weekly' },
                      { id: 'monthly', label: 'Monthly' },
                      { id: 'custom', label: 'Custom Days' }
                    ].map((sched) => (
                      <button
                        key={sched.id}
                        type="button"
                        onClick={() => setScheduleType(sched.id as any)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          scheduleType === sched.id
                            ? 'bg-neutral-900 border-neutral-950 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : 'border-neutral-150 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50'
                        }`}
                      >
                        {sched.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Days selection panels */}
                  {scheduleType === 'custom' && (
                    <div className="bg-neutral-50 dark:bg-neutral-950/20 p-4 rounded-2xl border border-dashed mt-3">
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest block mb-2">Toggle target week days</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                          const selected = customDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleCustomDay(day)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                                selected 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white hover:bg-neutral-100 border text-neutral-600'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step D: Timeslot Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-neutral-400 tracking-wider block">Target Delivery Window</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setTimeSlot('morning')}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                        timeSlot === 'morning'
                          ? 'border-blue-600 bg-blue-50/20'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-50'
                      }`}
                    >
                      <Sunrise className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 block">Morning Delivery</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">⏱️ 05:00 AM - 07:30 AM (FREE)</span>
                      </div>
                    </div>
                    <div
                      onClick={() => setTimeSlot('evening')}
                      className={`p-4 rounded-2xl border cursor-pointer flex items-center gap-3 transition-all ${
                        timeSlot === 'evening'
                          ? 'border-blue-600 bg-blue-50/20'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-50'
                      }`}
                    >
                      <Sunset className="w-5 h-5 text-indigo-500 shrink-0" />
                      <div>
                        <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 block">Evening Delivery</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">⏱️ 06:00 PM - 08:30 PM (FREE)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step E: Subscription Delivery Location */}
                <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 animate-bounce" />
                      Subscription Drop Location
                    </label>
                    <button
                      type="button"
                      onClick={() => setCoverageModalOpen(true)}
                      className="text-[10px] font-black text-blue-600 hover:underline cursor-pointer"
                    >
                      Check All Coverages
                    </button>
                  </div>

                  <div id="subscription-address-section" className="scroll-mt-20">
                    {addresses.length === 0 ? (
                      <div className="bg-rose-50/50 dark:bg-rose-950/10 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/30 text-center space-y-4">
                        <div>
                          <p className="text-xs font-bold text-rose-700 dark:text-rose-400">
                            No delivery address found. Add a Pune or Lucknow address below to unlock automated milk delivery!
                          </p>
                        </div>
                        
                        {/* Inline address creation form */}
                        <div className="bg-white dark:bg-neutral-950 p-5 rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/40 text-left space-y-4">
                          <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest block border-b pb-2">Quick Add Delivery Address</span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-neutral-400">Recipient Name</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Rahul Sharma"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-neutral-50 dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl text-neutral-800 dark:text-neutral-100"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-neutral-400">Phone Number</label>
                              <input
                                type="tel"
                                required
                                placeholder="e.g. 9876543210"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                className="bg-neutral-50 dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl text-neutral-800 dark:text-neutral-100"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-neutral-400">Flat / House / Tower No.</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Apt 405, Building A"
                                value={newFlat}
                                onChange={(e) => setNewFlat(e.target.value)}
                                className="bg-neutral-50 dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl text-neutral-800 dark:text-neutral-100"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-neutral-400">Area / Locality / Street</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Kalyani Nagar, Near Park"
                                value={newArea}
                                onChange={(e) => setNewArea(e.target.value)}
                                className="bg-neutral-50 dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl text-neutral-800 dark:text-neutral-100"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-neutral-400">City</label>
                              <select
                                value={newCity}
                                onChange={(e) => setNewCity(e.target.value)}
                                className="bg-neutral-50 dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl font-bold text-neutral-800 dark:text-neutral-100"
                              >
                                <option value="Pune">Pune</option>
                                <option value="Lucknow">Lucknow</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-neutral-400">Pincode</label>
                              <input
                                type="text"
                                required
                                maxLength={6}
                                placeholder="e.g. 411006"
                                value={newPincode}
                                onChange={(e) => setNewPincode(e.target.value)}
                                className="bg-neutral-50 dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl text-neutral-800 dark:text-neutral-100"
                              />
                            </div>
                            <div className="flex flex-col justify-end pt-1">
                              <button
                                type="button"
                                onClick={handleAddNewAddress}
                                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black py-2 rounded-xl cursor-pointer shadow-md transition-all active:scale-[0.98]"
                              >
                                SAVE ADDRESS
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Address options selector list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {addresses.map((addr) => {
                            const result = checkDeliveryEligibility(addr.city, addr.area);
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <motion.div
                                key={addr.id}
                                whileHover={{ scale: 1.02, rotateY: isSelected ? 1 : 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={() => {
                                  setSelectedAddressId(addr.id);
                                  if (result.isDeliverable) {
                                    localStorage.setItem('parag_verified_location', JSON.stringify({
                                      city: result.city,
                                      area: result.area,
                                      isEligible: true,
                                      checkedAt: new Date().toISOString()
                                    }));
                                    window.dispatchEvent(new Event('parag_location_updated'));
                                  }
                                }}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between shadow-xs ${
                                  isSelected
                                    ? result.isDeliverable
                                      ? 'border-emerald-500 bg-emerald-55/10 dark:border-emerald-600 dark:bg-emerald-950/10 ring-2 ring-emerald-500/20'
                                      : 'border-rose-500 bg-rose-55/10 dark:border-rose-600 dark:bg-rose-950/10 ring-2 ring-rose-500/20'
                                    : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                              >
                                <div className="space-y-1">
                                  <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 block truncate">{addr.name}</span>
                                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
                                    {addr.flatNo}, {addr.area}, {addr.city}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between">
                                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                    result.isDeliverable
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                  }`}>
                                    {result.isDeliverable ? 'Deliverable ✓' : 'Blocked ❌'}
                                  </span>
                                  {isSelected && (
                                    <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Button to toggle adding a new address even when there are existing addresses */}
                        {!showNewAddressForm ? (
                          <button
                            type="button"
                            onClick={() => setShowNewAddressForm(true)}
                            className="text-xs text-blue-600 dark:text-blue-400 font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer py-1"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Another Delivery Address</span>
                          </button>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-neutral-50 dark:bg-neutral-950/30 p-5 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-4"
                          >
                            <div className="flex justify-between items-center border-b pb-2">
                              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">New Delivery Address Form</span>
                              <button 
                                type="button" 
                                onClick={() => setShowNewAddressForm(false)}
                                className="text-xs text-neutral-400 hover:text-neutral-600 font-bold"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-black uppercase text-neutral-400">Search & Autocomplete Address</label>
                              <OSMAddressInput
                                onSelectAddress={(address: OSMAddress) => {
                                  setNewArea(address.fullAddress);
                                  setNewCity(address.city.toLowerCase().includes('lucknow') ? 'Lucknow' : 'Pune');
                                  setNewPincode(address.postcode || '');
                                  setNewLat(address.latitude);
                                  setNewLng(address.longitude);
                                }}
                                placeholder="Search address (e.g. Kalyani Nagar, Pune or Gomti Nagar, Lucknow)"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-neutral-400">Recipient Name</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Home Address"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  className="bg-white dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-neutral-400">Phone Number</label>
                                <input
                                  type="tel"
                                  required
                                  placeholder="e.g. 9876543210"
                                  value={newPhone}
                                  onChange={(e) => setNewPhone(e.target.value)}
                                  className="bg-white dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-neutral-400">Flat / House No.</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. 501, Tulip Tower"
                                  value={newFlat}
                                  onChange={(e) => setNewFlat(e.target.value)}
                                  className="bg-white dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-neutral-400">Area / Locality</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Kalyani Nagar"
                                  value={newArea}
                                  onChange={(e) => setNewArea(e.target.value)}
                                  className="bg-white dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-neutral-400">City</label>
                                <select
                                  value={newCity}
                                  onChange={(e) => setNewCity(e.target.value)}
                                  className="bg-white dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl font-bold text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                                >
                                  <option value="Pune">Pune</option>
                                  <option value="Lucknow">Lucknow</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase text-neutral-400">Pincode</label>
                                <input
                                  type="text"
                                  required
                                  maxLength={6}
                                  placeholder="e.g. 411006"
                                  value={newPincode}
                                  onChange={(e) => setNewPincode(e.target.value)}
                                  className="bg-white dark:bg-neutral-900 text-xs px-3 py-2 border rounded-xl"
                                />
                              </div>
                              <div className="flex flex-col justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={handleAddNewAddress}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2.5 rounded-xl cursor-pointer shadow-md transition-all active:scale-[0.98]"
                                >
                                  SAVE ADDRESS
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Explicit Coverage Result Box */}
                        {eligibility && (
                          <div className={`p-4 rounded-2xl border text-xs font-semibold leading-relaxed ${
                            eligibility.isDeliverable
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                              : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400'
                          }`}>
                          <div className="flex items-start gap-2.5">
                            {eligibility.isDeliverable ? (
                              <Check className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className="font-black uppercase text-[9px] tracking-wider block mb-0.5">
                                {eligibility.isDeliverable ? 'Dispatch Verification Successful' : 'Delivery coverage warning'}
                              </span>
                              {eligibility.reason}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

                {/* Step F: Start Date */}
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <label className="text-xs font-black uppercase text-neutral-400 tracking-wider">Start delivery date</label>
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-bold font-mono">
                    Scheduled start: {formatDateToDMY(startDate)}
                  </div>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 rounded-xl border text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Active Subscription Warning */}
                {hasActiveSubscription && (
                  <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900 p-4 rounded-2xl text-xs font-semibold text-amber-850 dark:text-amber-400 leading-relaxed flex gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black uppercase text-[10px] block mb-0.5 tracking-wider">ACTIVE SUBSCRIPTION EXISTENT</span>
                      You already have an active subscription. Please modify your existing subscription instead.
                    </div>
                  </div>
                )}

                {/* Shop Coverage Error */}
                {shopCoverageError && (
                  <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900 p-4 rounded-2xl text-xs font-semibold text-rose-800 dark:text-rose-400 leading-relaxed flex gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black uppercase text-[10px] block mb-0.5 tracking-wider">NO COVERAGE</span>
                      {shopCoverageError}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={hasActiveSubscription || isSubscriptionDisabled}
                  whileHover={(hasActiveSubscription || isSubscriptionDisabled) ? {} : { scale: 1.02 }}
                  whileTap={(hasActiveSubscription || isSubscriptionDisabled) ? {} : { scale: 0.98 }}
                  className={`w-full py-4 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                    (hasActiveSubscription || isSubscriptionDisabled)
                      ? 'bg-neutral-150 dark:bg-neutral-850 text-neutral-450 dark:text-neutral-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-600 hover:opacity-95 text-white'
                  }`}
                >
                  <span>
                    {hasActiveSubscription
                      ? 'ACTIVE SUBSCRIPTION EXISTENT'
                      : checkingShop
                        ? 'CALCULATING NEAREST SHOP...'
                        : isSubscriptionDisabled
                          ? 'DISPATCH ZONE NOT DELIVERABLE'
                          : 'CONFIRM SUBSCRIPTION & START AUTOMATION'}
                  </span>
                  <ArrowRight className="w-4.5 h-4.5 animate-pulse" />
                </motion.button>

                <DeliveryCoverageModal 
                  isOpen={coverageModalOpen} 
                  onClose={() => setCoverageModalOpen(false)} 
                />
              </>
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-950/40 p-6 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center space-y-4 pt-8">
                <div className="w-14 h-14 bg-blue-50 dark:bg-sky-950/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-neutral-800 dark:text-neutral-200">Sign In to Customize Schedules</h4>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-xs mx-auto leading-relaxed">
                    You can view item details and pricing above. To build recurring delivery plans, pause during vacations, or skip days, please sign in.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="mx-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 text-white text-xs font-black px-6 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>SIGN IN TO START SUBSCRIPTION</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* RIGHT COLUMN (Lg: 5/12): ACTIVE SUBSCRIPTIONS & VACATION CONTROLS */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Section A: Active repetitive cycles list */}
          <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-xs">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">
              My Active repetetive cycles ({subscriptions.length})
            </h3>

            {!currentUser ? (
              <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs font-semibold">
                Please sign in to view active repeating cycles.
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs font-medium">
                No active repeating cycles yet. Build one on the left!
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub, idx) => (
                  <div
                    key={sub.id ? `${sub.id}_${idx}` : idx}
                    className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-100/50 flex flex-col gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img src={sub.product.image} alt={sub.product.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-grow">
                        <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 block leading-tight">{sub.product.name}</span>
                        <span className="text-[10px] font-bold text-neutral-400 block mt-0.5">
                          Qty: <span className="text-neutral-700 dark:text-neutral-300">{sub.schedule.quantity}</span> • Sched: <span className="text-neutral-700 dark:text-neutral-300 capitalize">{sub.schedule.type}</span> • Starts: <span className="text-neutral-700 dark:text-neutral-300">{formatDateToDMY(sub.schedule.startDate)}</span>
                        </span>
                      </div>
                      
                      {/* Active status bubble */}
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        sub.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    {/* Secondary Products Drop list */}
                    {sub.additionalProducts && sub.additionalProducts.length > 0 && (
                      <div className="pt-2 border-t border-dashed border-neutral-200/50 space-y-1">
                        <span className="text-[9px] font-black uppercase text-neutral-400 tracking-wider block">Add-ons / Secondary Products</span>
                        {sub.additionalProducts.map((addon: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[10px] text-neutral-600 dark:text-neutral-400 font-semibold bg-white/50 dark:bg-neutral-900/30 p-1.5 rounded-lg border border-neutral-100/50">
                            <span className="flex items-center gap-1">
                              <span className="font-extrabold text-neutral-800 dark:text-neutral-200">{addon.product.name}</span>
                              <span className="text-neutral-400 text-[9px]">x{addon.quantity}</span>
                            </span>
                            <span className="font-mono text-neutral-500 dark:text-neutral-400 text-[9px]">₹{addon.product.price * addon.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Modify Settings Form */}
                    {editingSubId === sub.id && (
                      <div className="p-3.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl space-y-4 mt-2 text-left">
                        <span className="text-[10px] font-black uppercase text-blue-600 block border-b pb-1">Modify Settings</span>
                        
                        {/* 1. Update Quantity */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-neutral-450 uppercase block">Delivery Quantity</label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingQty(Math.max(1, editingQty - 1))}
                              className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer text-neutral-600 dark:text-neutral-300"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-neutral-850 dark:text-neutral-150">{editingQty}</span>
                            <button
                              type="button"
                              onClick={() => setEditingQty(editingQty + 1)}
                              className="w-7 h-7 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 rounded-lg font-bold text-xs flex items-center justify-center cursor-pointer text-neutral-600 dark:text-neutral-300"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* 1b. Update Delivery Time Slot */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-neutral-450 uppercase block">Delivery Time Slot</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingTimeSlot('morning')}
                              className={`py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                editingTimeSlot === 'morning'
                                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                                  : 'bg-neutral-50/50 border-neutral-200 text-neutral-600'
                              }`}
                            >
                              <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                              MORNING (6-7:30 AM)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTimeSlot('evening')}
                              className={`py-1.5 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                                editingTimeSlot === 'evening'
                                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                                  : 'bg-neutral-50/50 border-neutral-200 text-neutral-600'
                              }`}
                            >
                              <Sunset className="w-3.5 h-3.5 text-blue-500" />
                              EVENING (5-7:00 PM)
                            </button>
                          </div>
                        </div>

                        {/* 2. Update Delivery Address */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-neutral-450 uppercase block">Delivery Address</label>
                          <select
                            value={editingAddressId}
                            onChange={(e) => setEditingAddressId(e.target.value)}
                            className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-2.5 py-2 border rounded-lg text-neutral-800 dark:text-neutral-100 font-semibold"
                          >
                            {addresses.length === 0 ? (
                              <option value="">No addresses saved</option>
                            ) : (
                              addresses.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.name} - {a.flatNo}, {a.area}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* 3. Secondary/Additional Products */}
                        <div className="space-y-2 pt-2 border-t border-dashed">
                          <label className="text-[10px] font-black text-neutral-450 uppercase block">Add Secondary Products</label>
                          <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                            {PRODUCTS.filter(p => p.id !== sub.product.id).map(addonProd => {
                              const existingAddon = editingAddons.find(a => a.productId === addonProd.id);
                              const addonQty = existingAddon ? existingAddon.quantity : 0;
                              return (
                                <div key={addonProd.id} className="flex flex-col gap-1 border-b border-neutral-100/50 dark:border-neutral-850 pb-2.5 last:border-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <img src={addonProd.image} alt={addonProd.name} className="w-8 h-8 rounded-md object-cover border bg-white" referrerPolicy="no-referrer" />
                                      <div>
                                        <span className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300 block leading-tight">{addonProd.name}</span>
                                        <span className="text-[8px] text-neutral-400 font-mono">₹{addonProd.price} / {addonProd.unit}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingAddons(prev => {
                                            const exist = prev.find(a => a.productId === addonProd.id);
                                            if (exist) {
                                              if (exist.quantity <= 1) {
                                                return prev.filter(a => a.productId !== addonProd.id);
                                              }
                                              return prev.map(a => a.productId === addonProd.id ? { ...a, quantity: a.quantity - 1 } : a);
                                            }
                                            return prev;
                                          });
                                        }}
                                        className="w-5 h-5 bg-neutral-150 hover:bg-neutral-200 dark:bg-neutral-800 rounded-md font-bold text-[10px] flex items-center justify-center cursor-pointer"
                                      >
                                        -
                                      </button>
                                      <span className="w-5 text-center text-[10px] font-mono font-bold">{addonQty}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingAddons(prev => {
                                            const exist = prev.find(a => a.productId === addonProd.id);
                                            if (exist) {
                                              return prev.map(a => a.productId === addonProd.id ? { ...a, quantity: a.quantity + 1 } : a);
                                            }
                                            return [...prev, { productId: addonProd.id, quantity: 1, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }];
                                          });
                                        }}
                                        className="w-5 h-5 bg-neutral-150 hover:bg-neutral-200 dark:bg-neutral-800 rounded-md font-bold text-[10px] flex items-center justify-center cursor-pointer"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>

                                  {/* Custom days select for secondary product */}
                                  {addonQty > 0 && (
                                    <div className="flex flex-col gap-1 mt-1 pl-1">
                                      <span className="text-[8px] font-black uppercase text-neutral-450 tracking-wider">Delivery Days:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                                          const currentDays = existingAddon?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                          const isDaySelected = currentDays.includes(day);
                                          return (
                                            <button
                                              key={day}
                                              type="button"
                                              onClick={() => {
                                                setEditingAddons(prev => prev.map(a => {
                                                  if (a.productId === addonProd.id) {
                                                    const days = a.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                                    const newDays = days.includes(day)
                                                      ? days.filter(d => d !== day)
                                                      : [...days, day];
                                                    return { ...a, days: newDays.length > 0 ? newDays : ['Mon'] };
                                                  }
                                                  return a;
                                                }));
                                              }}
                                              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider transition-all cursor-pointer ${
                                                isDaySelected
                                                  ? 'bg-blue-600 text-white shadow-xs'
                                                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800'
                                              }`}
                                            >
                                              {day}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 4. Edit Actions */}
                        <div className="flex gap-2 pt-2 border-t border-dashed">
                          <button
                            type="button"
                            onClick={() => setEditingSubId(null)}
                            className="flex-1 py-1.5 border border-neutral-200 dark:border-neutral-700 text-neutral-500 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            CANCEL
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const finalAddons = editingAddons.map(a => {
                                const p = PRODUCTS.find(prod => prod.id === a.productId);
                                return p ? { product: p, quantity: a.quantity, days: a.days } : null;
                              }).filter(Boolean) as any[];

                              await updateSubscriptionDetails(sub.id, {
                                quantity: editingQty,
                                deliveryAddressId: editingAddressId || undefined,
                                additionalProducts: finalAddons,
                                timeSlot: editingTimeSlot
                              });
                              setEditingSubId(null);
                            }}
                            className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-sm"
                          >
                            SAVE CHANGES
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Operational togglers: pause, resume, skip, delete */}
                    <div className="flex gap-2 pt-2 border-t border-dashed border-neutral-200/50 flex-wrap items-center">
                      {editingSubId !== sub.id && (
                        <button
                          onClick={() => startEditingSub(sub)}
                          className="bg-white dark:bg-neutral-900 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-extrabold border text-neutral-500 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          ⚙️ MODIFY SETTINGS
                        </button>
                      )}

                      {sub.status === 'active' ? (
                        <>
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'paused')}
                            className="bg-white dark:bg-neutral-900 hover:bg-amber-50 hover:text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-extrabold border text-neutral-500 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Pause className="w-3 h-3" />
                            PAUSE
                          </button>
                          <button
                            onClick={() => updateSubscriptionStatus(sub.id, 'skipped')}
                            className="bg-white dark:bg-neutral-900 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-extrabold border text-neutral-500 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <AlertCircle className="w-3 h-3" />
                            SKIP TOMORROW
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                          className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-emerald-600" />
                          RESUME DELIVERIES
                        </button>
                      )}

                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-extrabold ml-auto transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        CANCEL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Vacation mode scheduler */}
          <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-xs">
            <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>✈️ Vacation hold mode</span>
              {vacationActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
            </h3>
            <p className="text-[11px] text-neutral-500 mb-4">
              Going out of town? Set hold schedules so you never pay for undelivered milk.
            </p>

            {!currentUser ? (
              <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs font-semibold border border-dashed rounded-2xl p-4 bg-neutral-50/50 dark:bg-neutral-950/20">
                Please sign in to configure vacation pauses.
              </div>
            ) : vacationActive ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900 space-y-3">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                  ✈️ Vacation Mode Active!
                </span>
                <span className="text-xs text-emerald-600 block leading-relaxed font-semibold">
                  All repeating milk deliveries are paused automatically. Resume drops by deactivating vacation mode.
                </span>
                <button
                  type="button"
                  onClick={handleVacationCancel}
                  className="w-full bg-emerald-600 text-white font-extrabold text-xs py-2 rounded-xl shadow-xs cursor-pointer"
                >
                  DEACTIVATE VACATION HOLD
                </button>
              </div>
            ) : (
              <form onSubmit={handleVacationApply} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Pause start</label>
                    {vacationStart && (
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold font-mono">
                        Selected: {formatDateToDMY(vacationStart)}
                      </span>
                    )}
                    <input
                      type="date"
                      required
                      value={vacationStart}
                      onChange={(e) => setVacationStart(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 rounded-xl border text-neutral-800 dark:text-neutral-200 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Pause end</label>
                    {vacationEnd && (
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold font-mono">
                        Selected: {formatDateToDMY(vacationEnd)}
                      </span>
                    )}
                    <input
                      type="date"
                      required
                      value={vacationEnd}
                      onChange={(e) => setVacationEnd(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 rounded-xl border text-neutral-800 dark:text-neutral-200 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-extrabold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  ACTIVATE VACATION HOLD
                </button>
              </form>
            )}
          </div>

          {/* Section C: Comparative benefits card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-[32px] p-6 shadow-md">
            <h4 className="text-xs font-black uppercase tracking-widest text-blue-200 block mb-3">Subscription Privileges</h4>
            <div className="space-y-2.5 text-xs font-semibold">
              <div className="flex items-start gap-2 text-white/95">
                <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Flat 15% - 20% savings against market pricing.</span>
              </div>
              <div className="flex items-start gap-2 text-white/95">
                <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Zero Delivery Charges on repeating drops.</span>
              </div>
              <div className="flex items-start gap-2 text-white/95">
                <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Hold deliveries during vacations via vacation mode.</span>
              </div>
              <div className="flex items-start gap-2 text-white/95">
                <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Cancel repeat cycles anytime with absolute zero penalties.</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Auth Modal gating */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

    </div>
  );
};
