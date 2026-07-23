import React, { useState } from 'react';
import { useApp } from '../AppContext';
import { ShieldAlert, Copy, Check, ExternalLink, ChevronDown, ChevronUp, X, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create, update: if isOwner(userId)
        && isValidId(userId)
        && request.resource.data.keys().hasAll(['name', 'email', 'phone'])
        && request.resource.data.name is string && request.resource.data.name.size() <= 128
        && request.resource.data.email is string && request.resource.data.email.size() <= 128
        && request.resource.data.phone is string && request.resource.data.phone.size() <= 20;
      allow delete: if false;
    }

    match /addresses/{addressId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() 
        && isValidId(addressId)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.id == addressId
        && request.resource.data.keys().hasAll(['id', 'userId', 'name', 'flatNo', 'area', 'city', 'pincode', 'isDefault'])
        && request.resource.data.name is string && request.resource.data.name.size() <= 128
        && request.resource.data.flatNo is string && request.resource.data.flatNo.size() <= 256
        && request.resource.data.area is string && request.resource.data.area.size() <= 128
        && request.resource.data.city is string && request.resource.data.city.size() <= 64
        && request.resource.data.pincode is string && request.resource.data.pincode.size() <= 12;
      allow update: if isSignedIn() 
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.id == addressId;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    match /subscriptions/{subscriptionId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() 
        && isValidId(subscriptionId)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.id == subscriptionId
        && request.resource.data.keys().hasAll(['id', 'userId', 'productId', 'schedule', 'status'])
        && request.resource.data.productId is string && request.resource.data.productId.size() <= 128
        && request.resource.data.status in ['active', 'paused', 'skipped'];
      allow update: if isSignedIn() 
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.id == subscriptionId
        && request.resource.data.status in ['active', 'paused', 'skipped'];
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    match /orders/{orderId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn() 
        && isValidId(orderId)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.id == orderId
        && request.resource.data.keys().hasAll(['id', 'userId', 'date', 'items', 'totalAmount', 'status', 'deliverySlot', 'address', 'paymentMethod'])
        && request.resource.data.totalAmount is number;
      allow update: if false;
      allow delete: if false;
    }
  }
}`;

export const FirebaseTroubleshooter: React.FC = () => {
  const { firebaseError, clearFirebaseError, showToast } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!firebaseError) return null;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_TEXT);
    setCopied(true);
    showToast('Firestore Rules copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div id="firebase-troubleshooter" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100vw-2rem)]">
      <AnimatePresence>
        <motion.div
          id="troubleshooter-card"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 border-2 border-red-200 dark:border-red-900/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-red-50 dark:bg-red-950/20 p-4 flex items-center justify-between gap-3 border-b border-red-100 dark:border-red-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-red-900 dark:text-red-200 flex items-center gap-1.5 leading-tight">
                  Firebase Action Required
                  <span className="bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300 text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">Setup Help</span>
                </h4>
                <p className="text-[10px] text-red-700/80 dark:text-red-400/80 mt-0.5 font-medium">Fix Firestore Permission / Rules Errors</p>
              </div>
            </div>
            
            <button
              onClick={clearFirebaseError}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="text-[11px] text-neutral-600 dark:text-neutral-300 space-y-1.5 leading-relaxed">
              <p>
                Your connected custom Firebase database is currently throwing a 
                <strong className="text-red-600 dark:text-red-400"> Missing or insufficient permissions</strong> error.
              </p>
              <p>
                Since you are utilizing your own custom external Firebase project (<span className="font-mono bg-neutral-100 dark:bg-neutral-950 px-1 py-0.5 rounded text-[10px] text-neutral-800 dark:text-neutral-200">parag-milk-3f4f9</span>), security rules must be enabled manually in your Firebase Console.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 text-[11px]">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex-1 bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{expanded ? 'Hide Instructions' : 'How to Fix This'}</span>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleCopyRules}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:opacity-95 text-white py-2.5 px-3 rounded-xl font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Rules Copied!' : 'Copy Firestore Rules'}</span>
              </button>
            </div>

            {/* Expanded Steps */}
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3 overflow-hidden text-[10.5px] leading-relaxed"
              >
                <div className="space-y-2 text-neutral-500 dark:text-neutral-400">
                  <div className="flex gap-2">
                    <span className="w-4 h-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full font-black flex items-center justify-center text-[9px] shrink-0">1</span>
                    <p>
                      Open your{' '}
                      <a 
                        href="https://console.firebase.google.com/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-0.5 font-bold"
                      >
                        Firebase Console
                        <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      and select your project <strong>parag-milk-3f4f9</strong>.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-4 h-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full font-black flex items-center justify-center text-[9px] shrink-0">2</span>
                    <p>
                      Click on <strong>Firestore Database</strong> in the left-hand navigation sidebar, and click on the <strong>Rules</strong> tab at the top.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-4 h-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full font-black flex items-center justify-center text-[9px] shrink-0">3</span>
                    <p>
                      Click the button above to <strong>Copy Firestore Rules</strong>, paste them entirely into the code editor on your screen, replacing the current default rules.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <span className="w-4 h-4 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-full font-black flex items-center justify-center text-[9px] shrink-0">4</span>
                    <p>
                      Click the <strong>Publish</strong> button. The app will immediately start syncing and working successfully!
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Security Rules Code
                    </span>
                    <button 
                      onClick={handleCopyRules}
                      className="text-[9.5px] text-red-600 dark:text-red-400 hover:underline font-bold"
                    >
                      {copied ? 'Rules Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="bg-neutral-50 dark:bg-neutral-950 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 font-mono text-[8px] max-h-36 overflow-y-auto text-neutral-600 dark:text-neutral-400">
                    {FIRESTORE_RULES_TEXT}
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
