import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast } from './components/Toast';
import { ScrollToTop } from './components/ScrollToTop';
import { FirebaseTroubleshooter } from './components/FirebaseTroubleshooter';

// Pages
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetails } from './pages/ProductDetails';
import { Subscription } from './pages/Subscription';
import { Checkout } from './pages/Checkout';
import { Profile } from './pages/Profile';
import { AboutContact } from './pages/AboutContact';
import { Blog } from './pages/Blog';
import { ErrorPage } from './pages/ErrorPage';
import { Admin } from './pages/Admin';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 transition-colors duration-300">
          
          {/* Main header navbar navigation */}
          <Navbar />

          {/* Main content viewport */}
          <main className="flex-grow pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/cart" element={<Checkout />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Profile initialTab="orders" />} />
              <Route path="/subscriptions" element={<Profile initialTab="subscriptions" />} />
              <Route path="/about" element={<AboutContact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/error" element={<ErrorPage />} />
              
              {/* Fallback 404 Route */}
              <Route path="*" element={<ErrorPage type="404" />} />
            </Routes>
          </main>

          {/* Core bottom navigation rail (mobile only) */}
          <MobileBottomNav />

          {/* Global Footer component */}
          <Footer />

          {/* Global Toast portal notification panel */}
          <Toast />

          {/* Interactive Firebase database troubleshooter helper */}
          <FirebaseTroubleshooter />

        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
