import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Star, ShoppingCart, Zap, Heart, Check, HelpCircle, 
  ChevronRight, Sparkles, MessageSquare, AlertCircle, RefreshCw 
} from 'lucide-react';
import { PRODUCTS } from '../data';
import { useApp } from '../AppContext';
import { ProductCard } from '../components/ProductCard';
import { Review } from '../types';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, wishlist, toggleWishlist, addToRecentlyViewed } = useApp();

  const product = PRODUCTS.find((p) => p.id === id);

  // States
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center' });
  const [selectedQty, setSelectedQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'benefits' | 'ingredients' | 'nutrition' | 'storage'>('benefits');
  
  // Reviews state - locally extendable
  const [reviews, setReviews] = useState<Review[]>([
    { id: 'r1', userName: 'Kabir Sengupta', rating: 5, date: '2026-07-12', comment: 'Extremely fresh and thick. Tastes exactly like the milk we used to get at my grandparents’ village farm.', verified: true },
    { id: 'r2', userName: 'Priya Pillai', rating: 4, date: '2026-07-08', comment: 'Consistent delivery in Pune. Very satisfied with the glass bottle cleanliness. Tastes delicious with espresso.', verified: true }
  ]);
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Bundle offers state: frequently bought together
  const [bundleProduct, setBundleProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [bundleChecked, setBundleChecked] = useState(true);

  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product.id);
      // Select another dairy item for frequently bought together bundle
      const alternative = PRODUCTS.find((p) => p.id !== product.id && p.category !== product.category);
      setBundleProduct(alternative || null);
    }
  }, [product, id]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950">
        <AlertCircle className="w-14 h-14 text-rose-500 animate-pulse mb-4" />
        <h2 className="text-xl font-black text-neutral-800 dark:text-neutral-200">Product Not Found</h2>
        <p className="text-neutral-500 text-xs mt-1 max-w-sm">The dairy product you are trying to view does not exist or has been discontinued.</p>
        <Link to="/products" className="mt-6 bg-blue-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-full shadow-md">
          RETURN TO CATALOGUE
        </Link>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product.id);

  // Zoom magnifier function
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

  const handleAddBundle = () => {
    addToCart(product, selectedQty);
    if (bundleProduct && bundleChecked) {
      addToCart(bundleProduct, 1);
    }
    navigate('/cart');
  };

  const handlePostReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReviewName.trim() && newReviewComment.trim()) {
      const added: Review = {
        id: `rev_${Date.now()}`,
        userName: newReviewName.trim(),
        rating: newReviewRating,
        date: new Date().toISOString().split('T')[0],
        comment: newReviewComment.trim(),
        verified: false
      };
      setReviews((prev) => [added, ...prev]);
      setNewReviewName('');
      setNewReviewComment('');
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 4000);
    }
  };

  // Related products (same category)
  const relatedProducts = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24">
      
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 mb-6">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-neutral-600 dark:text-neutral-300 truncate max-w-[150px]">{product.name}</span>
      </nav>

      {/* Main product showcase split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-10 border border-neutral-100 dark:border-neutral-800/60 shadow-xs mb-10">
        
        {/* LEFT GALLERY: Zoom image frame */}
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
              className="w-full h-full object-cover hover:scale-150 transition-transform duration-200 ease-out"
            />
          </div>
          <span className="text-[11px] text-center text-neutral-400 font-bold uppercase tracking-wider">
            🔎 Move your cursor over the bottle to magnify pure layers
          </span>
        </div>

        {/* RIGHT METADATA: Attributes and Purchase triggers */}
        <div className="flex flex-col">
          {/* Header Badges */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-blue-600 tracking-widest bg-blue-50 dark:bg-sky-950/40 px-3 py-1 rounded-full">
              Parag {product.category} Sourced
            </span>
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-2.5 rounded-full border transition-all ${
                isWishlisted 
                  ? 'bg-rose-50 text-rose-500 border-rose-100' 
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-400 border-neutral-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          <h1 className="text-2xl md:text-3.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight mt-3">
            {product.name}
          </h1>

          {/* Unit Size and Rating */}
          <div className="flex items-center gap-3 mt-2 pb-5 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full">
              {product.unit} pack size
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 font-mono">
                {product.rating}
              </span>
              <span className="text-xs text-neutral-400">
                ({product.reviewsCount} verified households)
              </span>
            </div>
          </div>

          {/* Pricing area */}
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
              ₹{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-base text-neutral-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
            {product.originalPrice && (
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
                SAVE ₹{product.originalPrice - product.price} NOW
              </span>
            )}
          </div>

          <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed mt-4">
            {product.description}
          </p>

          {/* Dynamic tabs: Benefits, Ingredients, Nutrition, Storage */}
          <div className="mt-8 border-b flex gap-1.5 text-xs font-bold text-neutral-400">
            {['benefits', 'ingredients', 'nutrition', 'storage'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2.5 capitalize border-b-2 -mb-[1px] cursor-pointer transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400 font-extrabold'
                    : 'hover:text-neutral-600 border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content panel */}
          <div className="py-5 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed min-h-[140px]">
            {activeTab === 'benefits' && (
              <ul className="space-y-2">
                {product.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            {activeTab === 'ingredients' && (
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ingredient, idx) => (
                  <span key={idx} className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-xl font-bold">
                    {ingredient}
                  </span>
                ))}
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-md">
                {Object.entries(product.nutrition).map(([key, value]) => (
                  <div key={key} className="bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-2xl border text-center">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">{key}</span>
                    <span className="text-sm font-extrabold text-neutral-800 dark:text-neutral-200 mt-1 block font-mono">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 text-xs flex items-start gap-2">
                <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-amber-500 animate-spin" />
                <span>{product.storage}</span>
              </div>
            )}
          </div>

          {/* Quantity selector and checkout triggers */}
          <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-4 items-center mt-auto">
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
              <button
                onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                className="w-10 h-10 rounded-xl hover:bg-white dark:hover:bg-neutral-700 font-bold flex items-center justify-center cursor-pointer text-neutral-500"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-black font-mono text-neutral-800 dark:text-neutral-200">
                {selectedQty}
              </span>
              <button
                onClick={() => setSelectedQty(selectedQty + 1)}
                className="w-10 h-10 rounded-xl hover:bg-white dark:hover:bg-neutral-700 font-bold flex items-center justify-center cursor-pointer text-neutral-500"
              >
                +
              </button>
            </div>

            <button
              onClick={() => addToCart(product, selectedQty)}
              className="flex-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              ADD TO BASKET
            </button>
            <button
              onClick={handleBuyNow}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              BUY NOW
            </button>
          </div>
        </div>
      </div>

      {/* FREQUENTLY BOUGHT TOGETHER BUNDLE BUILDER */}
      {bundleProduct && (
        <section className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-6 md:p-8 rounded-[32px] shadow-xs mb-10">
          <h3 className="text-base md:text-lg font-black text-neutral-800 dark:text-neutral-200 mb-6 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            Frequently Bought Together
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="flex flex-wrap items-center gap-4 text-center md:text-left">
              {/* Item 1 */}
              <div className="flex items-center gap-3">
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-50 border" referrerPolicy="no-referrer" />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 line-clamp-1 max-w-[120px]">{product.name}</span>
                  <span className="text-[11px] font-bold text-neutral-400 font-mono">₹{product.price}</span>
                </div>
              </div>

              {/* PLUS SIGN */}
              <span className="text-lg font-black text-neutral-300 font-mono">+</span>

              {/* Item 2 */}
              <div className="flex items-center gap-3">
                <img src={bundleProduct.image} alt={bundleProduct.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-50 border" referrerPolicy="no-referrer" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      id="bundle-check"
                      checked={bundleChecked}
                      onChange={(e) => setBundleChecked(e.target.checked)}
                      className="rounded accent-blue-600"
                    />
                    <label htmlFor="bundle-check" className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200 line-clamp-1 max-w-[120px] cursor-pointer">{bundleProduct.name}</label>
                  </div>
                  <span className="text-[11px] font-bold text-neutral-400 font-mono pl-5">₹{bundleProduct.price}</span>
                </div>
              </div>
            </div>

            {/* Price Bundle calculations */}
            <div className="bg-neutral-50 dark:bg-neutral-950 p-5 rounded-2xl border text-center md:text-right shrink-0 w-full md:w-auto">
              <span className="text-xs text-neutral-400 font-bold block">Combined Price</span>
              <span className="text-xl font-black text-neutral-900 dark:text-neutral-100 font-sans block mt-1">
                ₹{product.price + (bundleChecked ? bundleProduct.price : 0)}
              </span>
              <button
                onClick={handleAddBundle}
                className="mt-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-full shadow-md w-full md:w-auto"
              >
                ADD BUNDLE TO CART
              </button>
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS SECTION: VERIFIED RATINGS AND USER REVIEWS INPUT FORM */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-10 bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-6 md:p-8 rounded-[32px] shadow-xs mb-10">
        
        {/* Review Highlights */}
        <div>
          <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-200 mb-4 uppercase tracking-wider">
            Verified Ratings
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-neutral-900 dark:text-neutral-100 font-sans">{product.rating}</span>
            <span className="text-neutral-400 font-bold text-sm">/ 5.0</span>
          </div>
          <div className="flex text-amber-400 gap-1 mt-2 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-xs text-neutral-400 font-bold block mb-4">
            Based on {product.reviewsCount} verified Pune households.
          </span>

          {/* Rating Bars */}
          <div className="space-y-2">
            {[[5, 85], [4, 10], [3, 3], [2, 1], [1, 1]].map(([stars, pct]) => (
              <div key={stars} className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                <span className="w-3 font-mono">{stars}★</span>
                <div className="flex-grow h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right font-mono">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Existing verified reviews list */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Community Feedback ({reviews.length})
            </h3>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-100/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">{rev.userName}</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">{rev.date}</span>
                </div>
                <div className="flex text-amber-400 gap-0.5 mt-1">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-2 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>

          {/* Add Review Form */}
          <form onSubmit={handlePostReview} className="border-t pt-6 space-y-4">
            <h4 className="text-xs font-black uppercase text-neutral-400 tracking-widest">Share Your Pure Experience</h4>
            
            {reviewSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl text-emerald-600 text-xs font-bold border border-emerald-100">
                🎉 Your review is published successfully! Thank you for the sweet feedback.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black uppercase text-neutral-400 tracking-wider">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Deshmukh"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-black uppercase text-neutral-400 tracking-wider">Product Rating</label>
                <select
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(Number(e.target.value))}
                  className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl font-bold text-neutral-700"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Perfect Dairy)</option>
                  <option value={4}>⭐⭐⭐⭐ (Very Good)</option>
                  <option value={3}>⭐⭐⭐ (Average)</option>
                  <option value={2}>⭐⭐ (Needs Improvement)</option>
                  <option value={1}>⭐ (Bad)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-black uppercase text-neutral-400 tracking-wider">Your Comment</label>
              <textarea
                required
                rows={3}
                placeholder="How was the taste? Was the packaging chilled? Let other families know..."
                value={newReviewComment}
                onChange={(e) => setNewReviewComment(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
            >
              PUBLISH MY REVIEW
            </button>
          </form>
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">RECOMMENDED</span>
              <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Related Fresh Products
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
