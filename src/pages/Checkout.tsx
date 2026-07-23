import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, ShoppingBag, MapPin, Clock, CreditCard, 
  Trash2, Plus, Check, Percent, ArrowRight, ArrowLeft,
  ChevronRight, Sparkles, CheckCircle, Smartphone, Award, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkDeliveryEligibility } from '../utils/delivery';
import { AuthModal } from '../components/AuthModal';
import { findNearestShop } from '../utils/firebaseHelpers';
import { OSMAddressInput, OSMAddress } from '../components/OSMAddressInput';

export const Checkout: React.FC = () => {
  const { 
    cart, updateCartQuantity, removeFromCart, activeCoupon, 
    applyCoupon, removeCoupon, addresses, addAddress, placeOrder, showToast, currentUser, orders 
  } = useApp();

  const hasActiveOrder = orders.some((o) => {
    const status = o.status.toLowerCase().replace(/_/g, ' ');
    return ['pending', 'processing', 'packed', 'shipped', 'out for delivery'].includes(status);
  });

  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Cart, 2: Address & Slots, 3: Success
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Address selection
  const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddr ? defaultAddr.id : '');
  const [deliverySlot, setDeliverySlot] = useState('06:00 AM - 07:30 AM');
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [assignedShop, setAssignedShop] = useState<any | null>(null);
  const [checkingShop, setCheckingShop] = useState<boolean>(false);
  const [shopCoverageError, setShopCoverageError] = useState<string | null>(null);

  React.useEffect(() => {
    if (defaultAddr && !selectedAddressId) {
      setSelectedAddressId(defaultAddr.id);
    }
  }, [defaultAddr, selectedAddressId]);

  React.useEffect(() => {
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

  // Address creation form states
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newFlat, setNewFlat] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newCity, setNewCity] = useState('Pune');
  const [newPincode, setNewPincode] = useState('');
  const [newName, setNewName] = useState('Aayaan Ali Khan');
  const [newPhone, setNewPhone] = useState('+91 9876543210');
  const [newLat, setNewLat] = useState<number | undefined>(undefined);
  const [newLng, setNewLng] = useState<number | undefined>(undefined);

  // Coupon input
  const [couponCode, setCouponCode] = useState('');

  // Placed Order feedback
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Totals calculations
  const totalItemsCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = activeCoupon ? (cartSubtotal * activeCoupon.discount) / 100 : 0;
  const deliveryCharge = cartSubtotal > 200 || cartSubtotal === 0 ? 0 : 25;
  const cartTotal = cartSubtotal - discountAmount + deliveryCharge;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyCoupon(couponCode);
      setCouponCode('');
    }
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFlat && newArea && newPincode) {
      addAddress({
        name: newName,
        phone: newPhone,
        flatNo: newFlat,
        area: newArea,
        city: newCity,
        pincode: newPincode,
        latitude: newLat,
        longitude: newLng,
        isDefault: false
      });
      setNewFlat('');
      setNewArea('');
      setNewPincode('');
      setNewLat(undefined);
      setNewLng(undefined);
      setShowNewAddressForm(false);
    }
  };

  // Find currently selected address and compute coverage
  const activeCheckoutAddress = addresses.find(a => a.id === selectedAddressId) || defaultAddr;
  const checkoutEligibility = activeCheckoutAddress
    ? checkDeliveryEligibility(activeCheckoutAddress.city, activeCheckoutAddress.area)
    : null;
  const isCheckoutDisabled = !checkoutEligibility || !checkoutEligibility.isDeliverable || checkingShop || !!shopCoverageError;

  const handlePlaceOrderSubmit = async () => {
    if (isCheckoutDisabled) {
      showToast(shopCoverageError || checkoutEligibility?.reason || 'Selected address is not in our delivery coverage zone.', 'error');
      return;
    }
    const order = await placeOrder(selectedAddressId || (defaultAddr ? defaultAddr.id : ''), deliverySlot, paymentMethod);
    if (order) {
      setPlacedOrder(order);
      setStep(3); // Success Screen
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24">
      
      {/* Checkout wizard steps indicator */}
      <div className="flex items-center justify-center gap-3 md:gap-6 mb-12">
        <div className="flex items-center gap-1.5">
          <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
            step >= 1 ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-500'
          }`}>1</span>
          <span className={`text-xs font-black uppercase tracking-wider ${
            step >= 1 ? 'text-blue-600' : 'text-neutral-400'
          }`}>My Cart</span>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-300" />
        <div className="flex items-center gap-1.5">
          <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
            step >= 2 ? 'bg-blue-600 text-white' : 'bg-neutral-200 text-neutral-500'
          }`}>2</span>
          <span className={`text-xs font-black uppercase tracking-wider ${
            step >= 2 ? 'text-blue-600' : 'text-neutral-400'
          }`}>Delivery Details</span>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-300" />
        <div className="flex items-center gap-1.5">
          <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${
            step === 3 ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
          }`}>3</span>
          <span className={`text-xs font-black uppercase tracking-wider ${
            step === 3 ? 'text-emerald-600' : 'text-neutral-400'
          }`}>Confirmation</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: SHOPPING BASKET SUMMARY */}
        {step === 1 && (
          <motion.div
            key="cart-step"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Basket Items (Lg: 8/12) */}
            <div className="lg:col-span-8 bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6">
              <h2 className="text-lg font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Review Shopping Basket
              </h2>

              {cart.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800/30 rounded-full flex items-center justify-center text-neutral-300 dark:text-neutral-700 mb-4 animate-bounce">
                    <ShoppingBag className="w-10 h-10" />
                  </div>
                  <h3 className="font-extrabold text-neutral-800 dark:text-neutral-200 text-base">Your Basket is Currently Empty</h3>
                  <p className="text-neutral-400 text-xs mt-1 max-w-xs">Fill it with fresh cow milk, creamy curd, or hand-churned Vedic A2 Ghee!</p>
                  <Link to="/products" className="mt-6 bg-blue-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-full shadow-md">
                    SHOP DAIRY ESSENTIALS
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                  {cart.map((item) => (
                    <div 
                      key={item.product.id}
                      className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-center gap-5 justify-between"
                    >
                      <div className="flex items-center gap-4 self-start">
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-16 h-16 rounded-xl object-cover border bg-neutral-50 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col">
                          <h4 className="text-sm font-black text-neutral-800 dark:text-neutral-200 leading-tight">
                            {item.product.name}
                          </h4>
                          <span className="text-xs text-neutral-400 mt-1">
                            Pack size: <span className="font-bold text-neutral-500">{item.product.unit}</span> • ₹{item.product.price}
                          </span>
                          <span className="text-xs font-black text-blue-600 mt-1 block">
                            Subtotal: ₹{item.product.price * item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Quantity operations */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800 p-1 rounded-xl">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-neutral-700 font-bold flex items-center justify-center text-neutral-500 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold font-mono text-neutral-800 dark:text-neutral-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-neutral-700 font-bold flex items-center justify-center text-neutral-500 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Calculations Column (Lg: 4/12) */}
            {cart.length > 0 && (
              <div className="lg:col-span-4 flex flex-col gap-6">
                
                {/* Coupon Box */}
                <div className="bg-white dark:bg-neutral-900 rounded-[24px] p-5 border border-neutral-100 dark:border-neutral-800 shadow-xs">
                  <span className="text-xs font-black text-neutral-400 uppercase tracking-widest block mb-3">Coupons & Promo Codes</span>
                  
                  {activeCoupon ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3.5 rounded-xl flex items-center justify-between border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4.5 h-4.5 text-emerald-600" />
                        <div>
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">
                            '{activeCoupon.code}' APPLIED
                          </span>
                          <span className="text-[10px] text-emerald-600 block mt-0.5">
                            Flat {activeCoupon.discount}% savings on subtotal
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={removeCoupon}
                        className="text-xs font-black text-rose-500 hover:underline cursor-pointer"
                      >
                        REMOVE
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. PARAGNEW"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-grow bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-150 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-black px-4 py-2.5 rounded-xl cursor-pointer"
                      >
                        APPLY
                      </button>
                    </form>
                  )}
                  <span className="text-[10px] text-neutral-400 font-bold block mt-3">
                    💡 Tip: Try code <span className="text-blue-600 font-bold">PARAGNEW</span> for 15% discount on checkout.
                  </span>
                </div>

                {/* Price Breakdown */}
                <div className="bg-white dark:bg-neutral-900 rounded-[24px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-4">
                  <h3 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-200 uppercase tracking-wider border-b pb-3">
                    Order Summary
                  </h3>

                  <div className="space-y-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono text-neutral-800 dark:text-neutral-200">₹{cartSubtotal}</span>
                    </div>
                    {activeCoupon && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Coupon Savings ({activeCoupon.discount}%)</span>
                        <span className="font-mono">- ₹{Math.round(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Estimated Delivery Fees</span>
                      {deliveryCharge === 0 ? (
                        <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">FREE</span>
                      ) : (
                        <span className="font-mono text-neutral-800 dark:text-neutral-200">₹{deliveryCharge}</span>
                      )}
                    </div>
                    
                    {deliveryCharge > 0 && (
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-md block text-center font-bold">
                        Add ₹{200 - cartSubtotal} more items to unlock FREE delivery!
                      </span>
                    )}

                    <div className="flex justify-between text-base font-extrabold text-neutral-900 dark:text-neutral-100 pt-3 border-t">
                      <span>Estimated Total</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">₹{cartTotal}</span>
                    </div>
                  </div>

                  {hasActiveOrder && (
                    <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900 p-4 rounded-2xl text-xs font-semibold text-amber-850 dark:text-amber-400 leading-relaxed flex gap-2 mb-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black uppercase text-[10px] block mb-0.5 tracking-wider">ACTIVE ORDER IN PROGRESS</span>
                        You already have an active order. Please wait until it is delivered or cancelled before placing another order.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!currentUser) {
                        setAuthModalOpen(true);
                        showToast('Please sign in to proceed with your delivery details.', 'info');
                      } else {
                        setStep(2);
                      }
                    }}
                    disabled={hasActiveOrder}
                    className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      hasActiveOrder
                        ? 'bg-neutral-150 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    }`}
                  >
                    <span>NEXT: DELIVERY DETAILS</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: SHIPPING ADDRESSES AND delivery TIMELINES */}
        {step === 2 && (
          <motion.div
            key="details-step"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Delivery address & Slots selection (Lg: 8/12) */}
            <div className="lg:col-span-8 bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6">
              
              {/* Back trigger */}
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back to Shopping Basket</span>
              </button>

              <h2 className="text-lg font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Select Delivery Address
              </h2>

              {/* Address selector options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const check = checkDeliveryEligibility(addr.city, addr.area);
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                        isSelected
                          ? check.isDeliverable
                            ? 'border-emerald-500 bg-emerald-50/10'
                            : 'border-rose-500 bg-rose-50/10'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-black text-neutral-850 dark:text-neutral-150">{addr.name}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            check.isDeliverable
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                              : 'bg-rose-50 text-rose-500 dark:bg-rose-950/20'
                          }`}>
                            {check.isDeliverable ? 'Active Zone ✓' : 'No Coverage ❌'}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-400 mt-0.5">{addr.phone}</span>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                          {addr.flatNo}, {addr.area}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                      
                      {isSelected && (
                        <span className={`text-[9px] font-black self-end mt-2.5 uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          check.isDeliverable
                            ? 'bg-emerald-100/60 text-emerald-700'
                            : 'bg-rose-100/60 text-rose-700'
                        }`}>
                          {check.isDeliverable ? '✓ Selected Address' : '⚠️ Area Restrained'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Toggle new address form */}
              {!showNewAddressForm ? (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="bg-neutral-50 hover:bg-neutral-100 text-neutral-700 dark:bg-neutral-800/40 dark:text-neutral-300 text-xs font-extrabold px-5 py-3 rounded-2xl border border-dashed border-neutral-200 flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD NEW PUNE DELIVERY ADDRESS</span>
                </button>
              ) : (
                <form onSubmit={handleAddNewAddress} className="bg-neutral-50 dark:bg-neutral-950/20 p-5 rounded-2xl border border-dashed space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-neutral-400 tracking-widest">New Delivery Address Form</span>
                    <button 
                      type="button" 
                      onClick={() => setShowNewAddressForm(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-600 font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Search & Autocomplete Address</label>
                    <OSMAddressInput
                      onSelectAddress={(address: OSMAddress) => {
                        setNewArea(address.fullAddress);
                        setNewCity(address.city.toLowerCase().includes('lucknow') ? 'Lucknow' : 'Pune');
                        setNewPincode(address.postcode || '');
                        setNewLat(address.latitude);
                        setNewLng(address.longitude);
                      }}
                      placeholder="Search address (e.g. Kalyani Nagar, Pune or Hazratganj, Lucknow)"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Flat / House No.</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Flat 304, Tower B"
                        value={newFlat}
                        onChange={(e) => setNewFlat(e.target.value)}
                        className="bg-white dark:bg-neutral-900 text-xs px-3.5 py-2 border rounded-xl"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Area / Locality</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kalyani Nagar, near Central Park"
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        className="bg-white dark:bg-neutral-900 text-xs px-3.5 py-2 border rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">City</label>
                      <select
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        className="bg-white dark:bg-neutral-900 text-xs px-3.5 py-2 border rounded-xl font-bold text-neutral-800 dark:text-neutral-100 focus:outline-hidden"
                      >
                        <option value="Pune">Pune</option>
                        <option value="Lucknow">Lucknow</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Pincode</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 411006"
                        value={newPincode}
                        onChange={(e) => setNewPincode(e.target.value)}
                        className="bg-white dark:bg-neutral-900 text-xs px-3.5 py-2 border rounded-xl"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2.5 rounded-xl cursor-pointer shadow-xs"
                      >
                        SAVE ADDRESS
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Delivery slot timing selection */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-base font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Select Delivery Slot
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: '06:00 AM - 07:30 AM', label: 'Early Morning Slot', desc: '⏱️ 6:00 AM - 7:30 AM (Best for Milk)' },
                    { id: '09:00 AM - 11:00 AM', label: 'Late Morning Slot', desc: '⏱️ 9:00 AM - 11:00 AM (Best for Curd)' },
                    { id: '06:00 PM - 08:30 PM', label: 'Evening Drop Slot', desc: '⏱️ 6:00 PM - 8:30 PM (Dinner prep)' }
                  ].map((slot) => (
                    <div
                      key={slot.id}
                      onClick={() => setDeliverySlot(slot.id)}
                      className={`p-4 rounded-2xl border cursor-pointer text-center flex flex-col justify-center transition-all ${
                        deliverySlot === slot.id
                          ? 'border-emerald-600 bg-emerald-50/20 text-emerald-800'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="text-xs font-black">{slot.label}</span>
                      <span className="text-[10px] text-neutral-400 mt-1 block leading-relaxed">{slot.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment selection UI */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-base font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Select Payment Method
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'UPI', label: 'Instant UPI (Blinkit GPay)' },
                    { id: 'Credit Card', label: 'Credit / Debit Card' },
                    { id: 'Net Banking', label: 'Net Banking' },
                    { id: 'Cash On Delivery', label: 'Cash on Delivery (COD)' }
                  ].map((pay) => (
                    <div
                      key={pay.id}
                      onClick={() => setPaymentMethod(pay.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-center flex flex-col justify-center transition-all ${
                        paymentMethod === pay.id
                          ? 'border-blue-600 bg-blue-50/20 text-blue-800'
                          : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="text-xs font-black">{pay.label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Checkout Pricing breakdown column (Lg: 4/12) */}
            <div className="lg:col-span-4 bg-white dark:bg-neutral-900 rounded-[32px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6">
              <h3 className="font-extrabold text-xs text-neutral-800 dark:text-neutral-200 uppercase tracking-wider border-b pb-3">
                Final Order Summary
              </h3>

              <div className="space-y-3 border-b pb-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs font-bold text-neutral-600">
                    <span className="truncate max-w-[150px]">{item.product.name} (x{item.quantity})</span>
                    <span className="font-mono text-neutral-800">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-neutral-800">₹{cartSubtotal}</span>
                </div>
                {activeCoupon && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Coupon '{activeCoupon.code}'</span>
                    <span className="font-mono">- ₹{Math.round(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fees</span>
                  {deliveryCharge === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">FREE</span>
                  ) : (
                    <span className="font-mono text-neutral-850">₹{deliveryCharge}</span>
                  )}
                </div>
                <div className="flex justify-between text-base font-extrabold text-neutral-900 dark:text-neutral-100 pt-3 border-t">
                  <span>Total Payable</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">₹{cartTotal}</span>
                </div>
              </div>

              {/* Active Delivery Eligibility Warning */}
              {checkoutEligibility && !checkoutEligibility.isDeliverable && (
                <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900 p-4 rounded-2xl text-xs font-semibold text-rose-800 dark:text-rose-400 leading-relaxed flex gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase text-[10px] block mb-0.5 tracking-wider">LOCKED: REGION OUTSIDE DISPATCH GRID</span>
                    {checkoutEligibility.reason}
                  </div>
                </div>
              )}

              {/* Shop Coverage Error */}
              {shopCoverageError && (
                <div className="bg-rose-50/50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900 p-4 rounded-2xl text-xs font-semibold text-rose-800 dark:text-rose-400 leading-relaxed flex gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600 dark:text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase text-[10px] block mb-0.5 tracking-wider">NO COVERAGE</span>
                    {shopCoverageError}
                  </div>
                </div>
              )}

              {/* Active Order Warning */}
              {hasActiveOrder && (
                <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-900 p-4 rounded-2xl text-xs font-semibold text-amber-850 dark:text-amber-400 leading-relaxed flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase text-[10px] block mb-0.5 tracking-wider">ACTIVE ORDER IN PROGRESS</span>
                    You already have an active order. Please wait until it is delivered or cancelled before placing another order.
                  </div>
                </div>
              )}

              {/* Place Order Trigger */}
              <button
                onClick={handlePlaceOrderSubmit}
                disabled={isCheckoutDisabled || hasActiveOrder}
                className={`w-full py-4 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  (isCheckoutDisabled || hasActiveOrder)
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-200 dark:border-neutral-700 shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white'
                }`}
              >
                <span>
                  {hasActiveOrder
                    ? 'ACTIVE ORDER OUTSTANDING'
                    : checkingShop
                      ? 'CALCULATING NEAREST SHOP...'
                      : isCheckoutDisabled 
                        ? 'DISPATCH ZONE NOT DELIVERABLE' 
                        : `PLACE ORDER (₹${cartTotal})`}
                </span>
                <Check className="w-4.5 h-4.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: ORDER SUCCESS SCREEN WITH ANIMATIONS */}
        {step === 3 && placedOrder && (
          <motion.div
            key="success-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 rounded-[32px] p-8 md:p-12 border border-neutral-100 dark:border-neutral-800 shadow-2xl text-center space-y-6"
          >
            {/* Success animated checkmark */}
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 relative shadow-lg">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <CheckCircle className="w-12 h-12 stroke-[2.5]" />
              </motion.div>
              {/* Ping glow waves */}
              <span className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
            </div>

            <span className="bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-100">
              ⚡ Order Confirmed (Instant delivery pipeline)
            </span>

            <h2 className="text-2xl md:text-4xl font-black text-neutral-950 dark:text-neutral-100 tracking-tight leading-none">
              Thank You for Ordering!
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto">
              Your unadulterated dairy batch has been dispatched from Parag Farms to the Pune sorting hub. Your items are scheduled for cold delivery inside your chosen slot!
            </p>

            {/* Receipt Summary card */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-2xl border text-left space-y-3 font-semibold text-xs text-neutral-600">
              <div className="flex justify-between border-b pb-2">
                <span>Order Reference ID</span>
                <span className="font-mono font-bold text-neutral-850 text-blue-600">{placedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Chosen Delivery Window</span>
                <span className="text-neutral-850 dark:text-neutral-200">{placedOrder.deliverySlot}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Address</span>
                <span className="text-neutral-850 dark:text-neutral-200 max-w-[200px] truncate">{placedOrder.address.flatNo}, {placedOrder.address.area}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode Selected</span>
                <span className="text-neutral-850 dark:text-neutral-200 uppercase">{placedOrder.paymentMethod}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                <span>Total Paid Amount</span>
                <span className="font-mono text-emerald-600">₹{placedOrder.totalAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={() => {
                  navigate('/');
                  setStep(1);
                }}
                className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-black py-3.5 rounded-2xl transition-all cursor-pointer"
              >
                RETURN TO HOME
              </button>
              <button
                onClick={() => {
                  navigate('/profile');
                  setStep(1);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3.5 rounded-2xl transition-all shadow-md cursor-pointer"
              >
                TRACK ACTIVE ORDER TIMELINE
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

    </div>
  );
};
