import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Sparkles, User, HelpCircle, Compass } from 'lucide-react';
import { useApp } from '../AppContext';

export const MobileBottomNav: React.FC = () => {
  const { cart, isAdmin } = useApp();
  const totalItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-t border-neutral-100 dark:border-neutral-800 py-2 px-3 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      
      {/* Home link */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-black tracking-tight transition-colors cursor-pointer ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'
          }`
        }
      >
        <Home className="w-5 h-5 stroke-[2.2]" />
        <span>Home</span>
      </NavLink>

      {/* Catalog / Products */}
      <NavLink
        to="/products"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-black tracking-tight transition-colors cursor-pointer ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'
          }`
        }
      >
        <Compass className="w-5 h-5 stroke-[2.2]" />
        <span>Products</span>
      </NavLink>

      {/* Subscriptions */}
      <NavLink
        to="/subscription"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-black tracking-tight transition-colors cursor-pointer relative ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'
          }`
        }
      >
        <Sparkles className="w-5 h-5 stroke-[2.2] text-amber-500 animate-pulse" />
        <span>Daily Sub</span>
      </NavLink>

      {/* Cart (Special highlights) */}
      <NavLink
        to="/checkout"
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-black tracking-tight transition-colors cursor-pointer relative ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'
          }`
        }
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
          {totalItemsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white rounded-full text-[8px] font-black w-4 h-4 flex items-center justify-center">
              {totalItemsCount}
            </span>
          )}
        </div>
        <span>Checkout</span>
      </NavLink>

      {/* Profile / Admin */}
      <NavLink
        to={isAdmin ? "/admin" : "/profile"}
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 text-[10px] font-black tracking-tight transition-colors cursor-pointer ${
            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'
          }`
        }
      >
        <User className="w-5 h-5 stroke-[2.2]" />
        <span>{isAdmin ? "Admin" : "Profile"}</span>
      </NavLink>

    </div>
  );
};
