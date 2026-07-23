import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, Heart, ShoppingBag, User, Sun, Moon, 
  Menu, X, ChevronDown, Trash2, ArrowRight, Compass,
  HelpCircle, Percent, Sparkles, MapPin, Milk, ShoppingCart
} from 'lucide-react';
import { useApp } from '../AppContext';
import { PRODUCTS, CATEGORIES } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { DeliveryCoverageModal } from './DeliveryCoverageModal';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const { 
    cart, wishlist, currentUser, isAdmin, darkMode, toggleDarkMode, 
    updateCartQuantity, removeFromCart, activeCoupon, applyCoupon, removeCoupon
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Delivery coverage checker state
  const [coverageModalOpen, setCoverageModalOpen] = useState(false);
  const [verifiedLocation, setVerifiedLocation] = useState<{ city: string; area: string } | null>(null);

  const loadLocation = () => {
    const saved = localStorage.getItem('parag_verified_location');
    if (saved) {
      try {
        setVerifiedLocation(JSON.parse(saved));
      } catch (e) {
        setVerifiedLocation(null);
      }
    } else {
      setVerifiedLocation(null);
    }
  };

  useEffect(() => {
    loadLocation();
    window.addEventListener('parag_location_updated', loadLocation);
    return () => {
      window.removeEventListener('parag_location_updated', loadLocation);
    };
  }, []);

  // Cart quick summaries
  const totalItemsCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = activeCoupon ? (cartSubtotal * activeCoupon.discount) / 100 : 0;
  const deliveryCharge = cartSubtotal > 200 || cartSubtotal === 0 ? 0 : 25;
  const cartTotal = cartSubtotal - discountAmount + deliveryCharge;

  // Search logic
  const [suggestions, setSuggestions] = useState<typeof PRODUCTS>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('parag_recent_searches');
    return saved ? JSON.parse(saved) : ['A2 Cow Ghee', 'Full Cream Milk', 'Malai Paneer'];
  });

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestions([]);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      ).slice(0, 5);
      setSuggestions(filtered);
    }
  }, [searchQuery]);

  // Handle outside clicks for search popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      // Save to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())].slice(0, 5);
        localStorage.setItem('parag_recent_searches', JSON.stringify(updated));
        return updated;
      });
      setSearchFocused(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const selectSuggestion = (productName: string) => {
    setSearchQuery(productName);
    setSearchFocused(false);
    navigate(`/products?search=${encodeURIComponent(productName)}`);
  };

  const handleRecentSearchClick = (term: string) => {
    setSearchQuery(term);
    setSearchFocused(false);
    navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  const [couponInput, setCouponInput] = useState('');
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCoupon(couponInput);
      setCouponInput('');
    }
  };

  return (
    <>
      {/* Utility Top Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 text-white text-xs py-2 px-4 font-semibold flex justify-between items-center z-40 relative">
        <div className="flex items-center gap-3">
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] animate-pulse">FLASH OFFER</span>
          <span>🚚 Free Delivery on orders above ₹200!</span>
        </div>
        <div className="hidden md:flex items-center gap-5">
          <Link to="/about" className="hover:text-blue-100 transition-colors">Our Quality Guarantee</Link>
          <Link to="/contact" className="hover:text-blue-100 transition-colors">24/7 Support Helpline</Link>
          <button
            type="button"
            onClick={() => setCoverageModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-emerald-200 transition-colors cursor-pointer bg-white/10 px-3 py-1 rounded-full border border-white/20 font-bold text-[11px]"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
            <span>
              {verifiedLocation 
                ? `Deliver: ${verifiedLocation.area}, ${verifiedLocation.city}` 
                : 'Check Delivery Coverage'}
            </span>
          </button>
        </div>
      </div>

      <DeliveryCoverageModal 
        isOpen={coverageModalOpen} 
        onClose={() => setCoverageModalOpen(false)} 
      />

      {/* Main Sticky Navbar */}
      <nav className="sticky top-0 bg-white/90 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-800 py-3.5 px-4 md:px-8 z-40 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform">
              <Milk className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-100 leading-none">
                PARAG
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest leading-none mt-0.5">
                MILK & DAIRY
              </span>
            </div>
          </Link>

          {/* Nav Links - Desktop */}
          <div className="hidden lg:flex items-center gap-6 text-[14px] font-bold text-neutral-700 dark:text-neutral-300">
            <Link 
              to="/" 
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : ''}`}
            >
              Home
            </Link>
            
            {/* Category Mega Menu Trigger */}
            <div 
              className="relative"
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer py-1">
                <span>Products</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Mega Menu Portal Dropdown */}
              <AnimatePresence>
                {megaMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full w-[640px] bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-6 border border-neutral-100 dark:border-neutral-800 grid grid-cols-3 gap-5 mt-2"
                  >
                    {/* COLUMN 1: MILK */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <Link 
                          to="/products?category=milk" 
                          className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider hover:text-blue-600 transition-colors"
                          onClick={() => setMegaMenuOpen(false)}
                        >
                          Milk
                        </Link>
                      </div>
                      <div className="flex flex-col gap-1">
                        {PRODUCTS.filter(p => p.category === 'milk').map((p) => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            className="group flex flex-col hover:bg-neutral-50 dark:hover:bg-neutral-800/40 p-2 rounded-xl transition-all"
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {p.unit} • ₹{p.price}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* COLUMN 2: DAHI */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <Link 
                          to="/products?category=dahi" 
                          className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider hover:text-emerald-600 transition-colors"
                          onClick={() => setMegaMenuOpen(false)}
                        >
                          Dahi
                        </Link>
                      </div>
                      <div className="flex flex-col gap-1">
                        {PRODUCTS.filter(p => p.category === 'dahi').map((p) => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            className="group flex flex-col hover:bg-neutral-50 dark:hover:bg-neutral-800/40 p-2 rounded-xl transition-all"
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {p.unit} • ₹{p.price}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* COLUMN 3: SWEETS */}
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <Link 
                          to="/products?category=sweets" 
                          className="text-xs font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider hover:text-amber-600 transition-colors"
                          onClick={() => setMegaMenuOpen(false)}
                        >
                          Sweets
                        </Link>
                      </div>
                      <div className="flex flex-col gap-1">
                        {PRODUCTS.filter(p => p.category === 'sweets').map((p) => (
                          <Link
                            key={p.id}
                            to={`/product/${p.id}`}
                            className="group flex flex-col hover:bg-neutral-50 dark:hover:bg-neutral-800/40 p-2 rounded-xl transition-all"
                            onClick={() => setMegaMenuOpen(false)}
                          >
                            <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-amber-500 dark:group-hover:text-amber-400 line-clamp-1">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {p.unit} • ₹{p.price}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link 
              to="/subscription" 
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 ${location.pathname === '/subscription' ? 'text-blue-600 dark:text-blue-400' : ''}`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              Daily Subscriptions
            </Link>
            
            <Link 
              to="/about" 
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${location.pathname === '/about' ? 'text-blue-600 dark:text-blue-400' : ''}`}
            >
              About Farm
            </Link>
            
            <Link 
              to="/contact" 
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${location.pathname === '/contact' ? 'text-blue-600 dark:text-blue-400' : ''}`}
            >
              Contact
            </Link>

            {isAdmin && (
              <Link 
                to="/admin" 
                className={`bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-extrabold px-3.5 py-1.5 rounded-xl border border-blue-600/20 transition-all ${location.pathname === '/admin' ? 'bg-blue-600 text-white dark:text-white' : ''}`}
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Search Bar - Instant suggestions */}
          <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search premium cow ghee, organic milk, dahi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-100 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
              />
              <button 
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>

            {/* Instant Search Dropdown UI */}
            <AnimatePresence>
              {searchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden z-50 p-4"
                >
                  {searchQuery.trim() === '' ? (
                    <div>
                      {/* Popular / Recent searches */}
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-2">
                        Popular Searches
                      </span>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {['A2 Vedic Cow Ghee', 'Full Cream Milk', 'Malai Paneer', 'Lassi', 'Ice Cream'].map((term) => (
                          <button
                            key={term}
                            onClick={() => handleRecentSearchClick(term)}
                            className="bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800/40 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>

                      {recentSearches.length > 0 && (
                        <>
                          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-2">
                            Recent Searches
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {recentSearches.map((term, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleRecentSearchClick(term)}
                                className="text-left text-neutral-600 dark:text-neutral-400 text-xs hover:text-blue-600 dark:hover:text-blue-400 py-1 flex items-center gap-2 cursor-pointer"
                              >
                                <Compass className="w-3.5 h-3.5 text-neutral-400" />
                                {term}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider block mb-2">
                        Suggested Products
                      </span>
                      <div className="flex flex-col gap-2">
                        {suggestions.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSearchFocused(false);
                              navigate(`/product/${p.id}`);
                            }}
                            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-neutral-100"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex flex-col flex-grow">
                              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 leading-snug">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-neutral-500 font-medium">
                                {p.unit} • ₹{p.price}
                              </span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-neutral-400 text-xs">
                      No matching fresh products found
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Wishlist Link */}
            <Link
              to="/profile"
              state={{ activeTab: 'wishlist' }}
              className="p-2.5 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-300 relative transition-colors"
              title="My Wishlist"
            >
              <Heart className="w-4.5 h-4.5" />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="p-2.5 md:px-4 md:py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 font-bold relative"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              <span className="hidden md:inline text-xs">₹{cartTotal}</span>
              {totalItemsCount > 0 && (
                <span className="absolute md:static top-1 right-1 w-4.5 h-4.5 bg-emerald-600 md:bg-white text-white md:text-emerald-600 rounded-full text-[9px] md:text-[10px] font-black flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            {currentUser ? (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2 p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-neutral-100"
                />
                <span className="text-xs font-bold hidden md:inline max-w-[80px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden sm:flex items-center gap-2 p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                  <User className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-bold hidden md:inline max-w-[80px] truncate">
                  Sign In
                </span>
              </button>
            )}

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-850 text-neutral-600 dark:text-neutral-300 lg:hidden cursor-pointer"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE DRAWER MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-neutral-900 p-6 flex flex-col z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-extrabold text-neutral-900 dark:text-neutral-100">Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex flex-col gap-5 text-base font-bold text-neutral-800 dark:text-neutral-200">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">Home</Link>
                <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">All Products</Link>
                <Link to="/subscription" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Subscription Packages
                </Link>
                <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">About Farm</Link>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600">Contact & FAQs</Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="hover:text-blue-600 border-t pt-4">My Account</Link>
              </div>

              {currentUser && (
                <div className="mt-auto bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl flex items-center gap-3">
                  <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{currentUser.name}</span>
                    <span className="text-[10px] text-amber-500 font-extrabold">{currentUser.rewardPoints} Loyalty Points</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CART SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Cart Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 h-full flex flex-col shadow-2xl z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-neutral-900 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <span className="font-extrabold text-neutral-900 dark:text-neutral-100 text-lg">My Basket</span>
                  <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">
                    {totalItemsCount} items
                  </span>
                </div>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    {/* Empty cart vector simulation */}
                    <div className="w-24 h-24 bg-neutral-50 dark:bg-neutral-800/20 rounded-full flex items-center justify-center text-neutral-300 dark:text-neutral-700 mb-4 animate-bounce">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                    <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200">Your Basket is Empty</h4>
                    <p className="text-neutral-500 text-xs mt-1 max-w-[240px]">
                      Add fresh pasture milk, rich Vedic ghee, or soft paneer to begin!
                    </p>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        navigate('/products');
                      }}
                      className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-full shadow-md"
                    >
                      BROWSE DAIRY ITEMS
                    </button>
                  </div>
                ) : (
                  <>
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-100/50 dark:border-neutral-800/40 hover:shadow-xs transition-shadow duration-200"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover bg-white border"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-grow">
                          <h5 className="text-xs font-black text-neutral-800 dark:text-neutral-200 line-clamp-1">
                            {item.product.name}
                          </h5>
                          <span className="text-[10px] text-neutral-400 font-medium block">
                            {item.product.unit} • ₹{item.product.price}
                          </span>
                          <span className="text-[11px] font-black text-neutral-700 dark:text-neutral-300 mt-1 block">
                            Subtotal: ₹{item.product.price * item.quantity}
                          </span>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-0.5 rounded-xl">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center font-mono text-neutral-800 dark:text-neutral-200">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center font-bold text-xs text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Active Promo Coupon Display */}
                    <div className="border-t border-dashed border-neutral-200 dark:border-neutral-800 pt-4 mt-4">
                      {activeCoupon ? (
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl flex items-center justify-between border border-emerald-100 dark:border-emerald-900">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-emerald-600" />
                            <div>
                              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block">
                                Coupon '{activeCoupon.code}' Applied
                              </span>
                              <span className="text-[10px] font-medium text-emerald-600 block">
                                Saved {activeCoupon.discount}% on subtotal
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={removeCoupon}
                            className="text-xs font-extrabold text-rose-500 hover:underline"
                          >
                            REMOVE
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Promo Code (e.g. PARAGNEW)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="flex-grow bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 focus:outline-hidden"
                          />
                          <button
                            type="submit"
                            className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-black px-4 py-2.5 rounded-xl"
                          >
                            APPLY
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer Checkout details inside Drawer */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 space-y-4">
                  <div className="space-y-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-neutral-800 dark:text-neutral-200 font-mono">₹{cartSubtotal}</span>
                    </div>
                    {activeCoupon && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Coupon Discount ({activeCoupon.discount}%)</span>
                        <span className="font-mono">- ₹{Math.round(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      {deliveryCharge === 0 ? (
                        <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">FREE</span>
                      ) : (
                        <span className="text-neutral-800 dark:text-neutral-200 font-mono">₹{deliveryCharge}</span>
                      )}
                    </div>
                    <div className="flex justify-between text-base font-extrabold text-neutral-900 dark:text-neutral-100 pt-2 border-t">
                      <span>Total Amount</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">₹{cartTotal}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCartOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3.5 rounded-2xl text-xs md:text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>PROCEED TO CHECKOUT</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
