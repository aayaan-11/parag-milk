import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Eye, ShoppingCart, Zap, Star, Scale, X, Check, ShieldCheck } from 'lucide-react';
import { Product } from '../types';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onCompareToggle?: (product: Product) => void;
  isCompared?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onCompareToggle, isCompared }) => {
  const { addToCart, wishlist, toggleWishlist, showToast } = useApp();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center' });
  const [selectedQty, setSelectedQty] = useState(1);
  const navigate = useNavigate();

  const isWishlisted = wishlist.includes(product.id);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const multiplier = 10;
    const rX = -((y - height / 2) / (height / 2)) * multiplier;
    const rY = ((x - width / 2) / (width / 2)) * multiplier;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleCardMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const handleBuyNow = () => {
    addToCart(product, selectedQty);
    navigate('/cart');
  };

  const openProductDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewOpen(false);
    navigate(`/product/${product.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        style={{
          perspective: 1000,
          rotateX: rotateX,
          rotateY: rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        className="group relative bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full"
      >
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 pointer-events-none">
          {product.bestSeller && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Bestseller
            </span>
          )}
          {product.organic && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Organic
            </span>
          )}
          {product.proteinRich && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Protein Rich
            </span>
          )}
        </div>

        {/* Action buttons hover list */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => toggleWishlist(product.id)}
            className={`p-2.5 rounded-full border shadow-md transition-all duration-200 ${
              isWishlisted
                ? 'bg-rose-50 border-rose-100 text-rose-500'
                : 'bg-white/90 hover:bg-white border-neutral-100 text-neutral-600 hover:text-rose-500'
            }`}
            title="Add to Wishlist"
          >
            <Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>
          <button
            onClick={() => setQuickViewOpen(true)}
            className="p-2.5 rounded-full bg-white/90 hover:bg-white border border-neutral-100 shadow-md text-neutral-600 hover:text-blue-600 transition-all duration-200"
            title="Quick View"
          >
            <Eye className="w-4.5 h-4.5" />
          </button>
          {onCompareToggle && (
            <button
              onClick={() => onCompareToggle(product)}
              className={`p-2.5 rounded-full border shadow-md transition-all duration-200 ${
                isCompared
                  ? 'bg-blue-50 border-blue-100 text-blue-600'
                  : 'bg-white/90 hover:bg-white border-neutral-100 text-neutral-600 hover:text-blue-600'
              }`}
              title="Compare Product"
            >
              <Scale className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Product Image Area */}
        <div 
          className="relative aspect-square overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/20 cursor-pointer"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />
          {!product.available && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider border border-white/20">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="p-5 flex flex-col flex-grow">
          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-neutral-200 dark:text-neutral-800'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 font-mono">
              {product.rating} ({product.reviewsCount})
            </span>
          </div>

          {/* Title */}
          <h4 
            className="font-bold text-neutral-800 dark:text-neutral-200 text-sm md:text-base leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 cursor-pointer line-clamp-2 min-h-[40px]"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            {product.name}
          </h4>

          {/* Unit size */}
          <span className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400 mt-1">
            Pack size: <span className="font-semibold text-neutral-600 dark:text-neutral-300">{product.unit}</span>
          </span>

          <div className="mt-auto pt-4 flex items-center justify-between">
            {/* Pricing block */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100 font-sans">
                  ₹{product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-neutral-400 line-through font-medium">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Save ₹{product.originalPrice - product.price}
                </span>
              )}
            </div>

            {/* Quick Add To Cart Button */}
            {product.available ? (
              <button
                onClick={() => addToCart(product, 1)}
                className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white p-2.5 rounded-2xl border border-emerald-100 hover:border-emerald-600 shadow-xs transition-all duration-200 flex items-center gap-1.5 text-xs font-bold"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>ADD</span>
              </button>
            ) : (
              <button
                disabled
                className="bg-neutral-100 dark:bg-neutral-850 text-neutral-400 p-2.5 rounded-2xl text-xs font-bold cursor-not-allowed border border-neutral-200 dark:border-neutral-800"
              >
                UNAVAILABLE
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* QUICK VIEW INTERACTIVE MODAL */}
      <AnimatePresence>
        {quickViewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800 z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setQuickViewOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 dark:text-neutral-400 transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                {/* Left Side: Large Zoom Gallery */}
                <div className="flex flex-col gap-4">
                  <div
                    className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-950/20 border border-neutral-100 dark:border-neutral-800 cursor-zoom-in"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setZoomStyle({ transformOrigin: 'center' })}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      style={zoomStyle}
                      className="w-full h-full object-cover hover:scale-150 transition-transform duration-250 ease-out"
                    />
                  </div>
                  <span className="text-[11px] text-center text-neutral-400 font-medium">
                    Hover image to magnify details
                  </span>
                </div>

                {/* Right Side: Description, Nutrition, Add Action */}
                <div className="flex flex-col">
                  {/* Category Link */}
                  <span className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-widest">
                    PARAG {product.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-neutral-100 mt-1">
                    {product.name}
                  </h3>

                  {/* Unit size and rating */}
                  <div className="flex items-center gap-3 mt-2 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 rounded-full">
                      {product.unit}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 font-mono">
                        {product.rating}
                      </span>
                      <span className="text-xs text-neutral-400">
                        ({product.reviewsCount} verified reviews)
                      </span>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-neutral-400 line-through">
                        ₹{product.originalPrice}
                      </span>
                    )}
                    {product.originalPrice && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Save ₹{product.originalPrice - product.price}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-3 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Quick Nutrition Highlights */}
                  <div className="mt-4 bg-blue-50/40 dark:bg-sky-950/20 p-3.5 rounded-2xl">
                    <span className="text-xs font-extrabold text-blue-800 dark:text-blue-300 block mb-1.5 uppercase tracking-wider">
                      Nutrition highlights (per 100g)
                    </span>
                    <div className="grid grid-cols-5 gap-2 text-center">
                      {Object.entries(product.nutrition).map(([key, value]) => (
                        <div key={key} className="bg-white/80 dark:bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-100/50 dark:border-neutral-800">
                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                            {key}
                          </span>
                          <span className="block text-xs font-extrabold text-neutral-800 dark:text-neutral-200 font-mono mt-0.5">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits highlights */}
                  <div className="mt-4 flex flex-col gap-1">
                    {product.benefits.slice(0, 2).map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Quantity and Actions Builder */}
                  <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-3 items-center">
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
                      <button
                        onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-xs transition-all font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-extrabold text-neutral-800 dark:text-neutral-200 font-mono">
                        {selectedQty}
                      </span>
                      <button
                        onClick={() => setSelectedQty(selectedQty + 1)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-xs transition-all font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Cart & Buy buttons */}
                    <div className="flex gap-2.5 flex-grow">
                      <button
                        onClick={() => {
                          addToCart(product, selectedQty);
                          setQuickViewOpen(false);
                        }}
                        className="flex-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 py-3 rounded-2xl text-xs md:text-sm font-extrabold transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        ADD TO CART
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-2xl text-xs md:text-sm font-extrabold transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        BUY NOW
                      </button>
                    </div>
                  </div>

                  {/* Advanced details router redirect */}
                  <button
                    onClick={openProductDetails}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline text-center mt-5 uppercase tracking-widest cursor-pointer"
                  >
                    View All Details, Reviews & Ingredients →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
