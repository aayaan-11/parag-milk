import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 max-w-sm md:max-w-md pointer-events-auto"
        >
          {toast.type === 'success' && (
            <CheckCircle className="w-5.5 h-5.5 text-emerald-500 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5.5 h-5.5 text-blue-500 shrink-0" />
          )}
          {toast.type === 'error' && (
            <AlertTriangle className="w-5.5 h-5.5 text-rose-500 shrink-0" />
          )}

          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            {toast.message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
