import React, { useState } from 'react';
import { 
  X, Mail, Lock, User, Phone, ArrowRight, Sparkles, Check, Info, AlertTriangle, ShieldCheck, Home as HomeIcon, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  updateProfile as fbUpdateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useApp } from '../AppContext';
import { OSMAddressInput, OSMAddress } from './OSMAddressInput';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  title = "Unlock Premium Cow Milk Subscriptions", 
  subtitle = "Join Parag Milk VIP Club to schedule automated milk drops, manage vacation pauses, and unlock loyalty rewards." 
}) => {
  const { showToast } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<{ code: string; message: string } | null>(null);

  // Shop Owner Registration/Login specific state variables
  const [loginRole, setLoginRole] = useState<'customer' | 'shop_owner'>('customer');
  const [signupRole, setSignupRole] = useState<'customer' | 'shop_owner'>('customer');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [deliveryRadius, setDeliveryRadius] = useState('25');

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all credentials.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        if (signupRole === 'shop_owner') {
          if (!fullName || !phone || !shopName || !shopAddress || shopLat === null || shopLng === null) {
            showToast('Please fill in all shop owner details including address.', 'error');
            setIsLoading(false);
            return;
          }

          // Sign Up with Firebase
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          await fbUpdateProfile(credential.user, {
            displayName: fullName
          });

          const shopId = `SHOP-${Math.floor(100000 + Math.random() * 900000)}`;
          const now = new Date().toISOString();

          // Create Shop Owner document
          await setDoc(doc(db, 'shopOwners', credential.user.uid), {
            shopId,
            uid: credential.user.uid,
            shopName,
            ownerName: fullName,
            email,
            phone,
            shopAddress,
            address: shopAddress,
            latitude: shopLat,
            longitude: shopLng,
            lat: shopLat,
            lng: shopLng,
            deliveryRadius: Number(deliveryRadius) || 25,
            status: 'Pending',
            createdAt: now,
            createdDate: now,
            lastLogin: now
          });

          // Create user profile in users collection
          await setDoc(doc(db, 'users', credential.user.uid), {
            name: fullName,
            email,
            phone,
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
            rewardPoints: 100,
            role: 'customer',
            status: 'Pending',
            shopId,
            shopName
          });

          // Log out immediately since they are pending approval
          await signOut(auth);

          showToast('Your account is awaiting approval.', 'info');
          onClose();
        } else {
          // Standard customer signup
          if (!fullName || !phone) {
            showToast('Please provide your name and contact number for delivery validation.', 'error');
            setIsLoading(false);
            return;
          }
          // Sign Up with Firebase
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          await fbUpdateProfile(credential.user, {
            displayName: fullName
          });
          
          // Pass temp registration details to localStorage so AppContext can load them into the Firestore profile doc
          localStorage.setItem('parag_pending_signup_phone', phone);
          localStorage.setItem('parag_pending_signup_name', fullName);

          showToast('Welcome to the Parag Milk Club!', 'success');
          onClose();
        }
      } else {
        // Sign In with Firebase
        try {
          const credential = await signInWithEmailAndPassword(auth, email, password);
          
          if (loginRole === 'shop_owner') {
            // Fetch shopOwner details
            const shopOwnerSnap = await getDoc(doc(db, 'shopOwners', credential.user.uid));
            if (!shopOwnerSnap.exists()) {
              await signOut(auth);
              showToast('This account is not registered as a shop owner.', 'error');
              setIsLoading(false);
              return;
            }

            const shopOwnerData = shopOwnerSnap.data();
            if (shopOwnerData.status !== 'Approved') {
              await signOut(auth);
              if (shopOwnerData.status === 'Suspended') {
                showToast('Your account has been suspended.', 'error');
              } else if (shopOwnerData.status === 'Rejected') {
                showToast('Your registration was rejected.', 'error');
              } else {
                showToast('Your account is awaiting approval.', 'info');
              }
              setIsLoading(false);
              return;
            }

            // Approved! Update users table to set role and last login
            await setDoc(doc(db, 'users', credential.user.uid), {
              name: shopOwnerData.ownerName || credential.user.displayName || 'Shop Admin',
              email: credential.user.email || '',
              phone: shopOwnerData.phone || '',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
              rewardPoints: 0,
              role: 'shop_admin',
              shopId: shopOwnerData.shopId,
              shopName: shopOwnerData.shopName
            }, { merge: true });

            // Update last login in shopOwners
            await setDoc(doc(db, 'shopOwners', credential.user.uid), {
              lastLogin: new Date().toISOString()
            }, { merge: true });

            showToast(`Welcome back, ${shopOwnerData.ownerName}!`, 'success');
            onClose();
          } else {
            showToast('Logged in successfully! Welcome back.', 'success');
            onClose();
          }
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
              onClose();
            } catch (createErr) {
              console.error("Auto-creating admin failed:", createErr);
              throw err;
            }
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = 'Authentication failed. Please verify your details.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email address is already registered.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = 'Incorrect email address or password.';
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'Email/Password login is not enabled in your Firebase console. Please enable it under Authentication > Sign-in method.';
      }
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      showToast('Logged in with Google successfully!', 'success');
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain' || (err.message && err.message.includes('auth/unauthorized-domain'))) {
        setAuthError({
          code: 'auth/unauthorized-domain',
          message: `This domain (${window.location.hostname}) is not authorized for OAuth redirects in your Firebase project.`
        });
      } else {
        let errMsg = 'Google login failed.';
        if (err.code === 'auth/operation-not-allowed') {
          errMsg = 'Google Provider is not enabled in your Firebase console. Please enable it under Authentication > Sign-in method.';
        }
        showToast(errMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        id="auth-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
      />

      {/* Modal Box */}
      <motion.div 
        id="auth-modal-box"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Banner header */}
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 p-6 text-white relative">
          <button 
            type="button"
            id="auth-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-1.5 rounded-full text-white cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              Direct Dispatch
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug">{title}</h3>
          <p className="text-[11px] text-blue-50/90 leading-normal mt-1.5 font-medium">{subtitle}</p>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Tabs Selector */}
          <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-2xl">
            <button
              type="button"
              id="auth-tab-signin"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                !isSignUp 
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                isSignUp 
                  ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-black uppercase text-neutral-400 tracking-wider mb-0.5">I want to log in / register as:</label>
            <div className="flex bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  if (isSignUp) setSignupRole('customer');
                  else setLoginRole('customer');
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  ((isSignUp && signupRole === 'customer') || (!isSignUp && loginRole === 'customer'))
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isSignUp) setSignupRole('shop_owner');
                  else setLoginRole('shop_owner');
                }}
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  ((isSignUp && signupRole === 'shop_owner') || (!isSignUp && loginRole === 'shop_owner'))
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Shop Owner</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {isSignUp && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">
                    {signupRole === 'shop_owner' ? 'Owner Name' : 'Full Name'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="auth-signup-name"
                      required
                      placeholder={signupRole === 'shop_owner' ? 'e.g. Ramesh Kumar' : 'e.g. Aayaan Ali Khan'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs pl-10 pr-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      id="auth-signup-phone"
                      required
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs pl-10 pr-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                {signupRole === 'shop_owner' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Shop Name</label>
                      <div className="relative">
                        <HomeIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          id="auth-signup-shopname"
                          required
                          placeholder="e.g. Parag Milk Lucknow Junction"
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs pl-10 pr-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Shop Address</label>
                      <OSMAddressInput
                        id="auth-signup-shopaddress"
                        placeholder="Search address using OpenStreetMap..."
                        onSelectAddress={(addr) => {
                          setShopAddress(addr.fullAddress);
                          setShopLat(addr.latitude);
                          setShopLng(addr.longitude);
                        }}
                      />
                    </div>

                    {shopAddress && (
                      <div className="bg-neutral-50 dark:bg-neutral-950/50 p-2.5 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl space-y-1">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Location Found</p>
                        <p className="text-[10px] text-neutral-600 dark:text-neutral-300 font-medium">{shopAddress}</p>
                        <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                          <span>Lat: {shopLat?.toFixed(5)}</span>
                          <span>Lng: {shopLng?.toFixed(5)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Delivery Radius (km)</label>
                      <div className="relative">
                        <input
                          type="number"
                          id="auth-signup-radius"
                          required
                          placeholder="Default is 25 km"
                          value={deliveryRadius}
                          onChange={(e) => setDeliveryRadius(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500 font-medium"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="auth-email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs pl-10 pr-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="auth-password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs pl-10 pr-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              id="auth-submit-btn"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:opacity-95 text-white py-3 rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
            >
              <span>
                {isLoading 
                  ? 'Verifying...' 
                  : isSignUp 
                    ? (signupRole === 'shop_owner' ? 'REGISTER AS SHOP OWNER' : 'CREATE VIP ACCOUNT') 
                    : (loginRole === 'shop_owner' ? 'SHOP OWNER SIGN IN' : 'SECURE SIGN IN')}
              </span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {authError && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1.5 leading-normal">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Unauthorized Domain Setup Required</span>
              </div>
              <p>
                To enable Google Login on this preview environment, please authorize this domain in your Firebase console:
              </p>
              <div className="bg-white dark:bg-neutral-950 p-2 rounded-lg font-mono text-[10px] break-all border border-amber-100 dark:border-amber-900/30 flex items-center justify-between gap-2">
                <span className="select-all">{window.location.hostname}</span>
                <button 
                  type="button" 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.hostname);
                    showToast('Domain copied!', 'success');
                  }}
                  className="text-[9px] bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200 font-sans font-bold hover:opacity-80"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] opacity-80">
                <strong>Instructions:</strong> Open <em>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</em>, click "Add domain" and paste the copied domain.
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">or continue with</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>

          {/* Social Sign-In */}
          <button
            type="button"
            id="auth-google-btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 py-3 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Login with Google Account</span>
          </button>

          {/* Setup Console Help Info */}
          <div className="bg-neutral-50 dark:bg-neutral-950 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400 space-y-1">
            <div className="flex gap-1.5 font-bold text-neutral-600 dark:text-neutral-300">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Note for Firebase project administrators:</span>
            </div>
            <p className="leading-normal">
              Make sure to enable <strong>Email/Password</strong> and/or <strong>Google</strong> authentication providers in your Firebase console under <em>Authentication &gt; Sign-in method</em>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
