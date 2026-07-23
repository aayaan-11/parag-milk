import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, Search, Star, X, Scale, 
  ArrowUpDown, Eye, Trash, Milk, Check, ShieldAlert 
} from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../data';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchCategory = searchParams.get('category') || 'all';
  const searchUrlQuery = searchParams.get('search') || '';

  // Local filtering states
  const [activeCategory, setActiveCategory] = useState(searchCategory);
  const [searchQuery, setSearchQuery] = useState(searchUrlQuery);
  const [maxPrice, setMaxPrice] = useState(150);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [proteinOnly, setProteinOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'price-desc' | 'popular'>('popular');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Compare products state
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Sync category & search from URL
  useEffect(() => {
    setActiveCategory(searchCategory);
  }, [searchCategory]);

  useEffect(() => {
    setSearchQuery(searchUrlQuery);
  }, [searchUrlQuery]);

  // Filtering Logic
  const filteredProducts = PRODUCTS.filter((product) => {
    // 1. Category Filter
    if (activeCategory !== 'all' && product.category !== activeCategory) {
      return false;
    }
    // 2. Search Text
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = product.name.toLowerCase().includes(q) || 
                    product.description.toLowerCase().includes(q) ||
                    product.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    // 3. Price Filter
    if (product.price > maxPrice) {
      return false;
    }
    // 4. Rating Filter
    if (selectedRating && product.rating < selectedRating) {
      return false;
    }
    // 5. Speciality Filter
    if (organicOnly && !product.organic) {
      return false;
    }
    if (proteinOnly && !product.proteinRich) {
      return false;
    }

    return true;
  });

  // Sorting Logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    if (sortBy === 'price-asc') {
      return a.price - b.price;
    }
    if (sortBy === 'price-desc') {
      return b.price - a.price;
    }
    return b.reviewsCount - a.reviewsCount; // popular
  });

  // Handle Compare actions
  const toggleCompare = (product: Product) => {
    setCompareList((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 items at a time!');
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeCompareItem = (id: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== id));
  };

  const resetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setMaxPrice(150);
    setSelectedRating(null);
    setOrganicOnly(false);
    setProteinOnly(false);
    setSortBy('popular');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-all duration-300 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24 relative">
      
      {/* Banner / Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
          <Milk className="w-8 h-8 text-blue-600 shrink-0" />
          Fresh Dairy Yard
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm mt-1">
          Showing {sortedProducts.length} certified unadulterated pasture dairy items.
        </p>
      </div>

      {/* Main Grid Layout: Left filters sidebar, right catalog items */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* FILTERS COLUMN - DESKTOP SIDEBAR */}
        <div className="hidden lg:flex flex-col gap-6 bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800/60 sticky top-28 h-fit max-h-[85vh] overflow-y-auto shadow-xs">
          <div className="flex justify-between items-center pb-4 border-b">
            <span className="font-extrabold text-sm text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Filters</span>
            <button 
              onClick={resetFilters}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Reset All
            </button>
          </div>

          {/* Search inside catalog */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Search Catalog</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Type keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 dark:bg-neutral-950/40 text-xs py-2.5 pl-3 pr-9 rounded-xl border border-neutral-100 dark:border-neutral-800 focus:outline-hidden focus:border-blue-500 text-neutral-800 dark:text-neutral-100 font-medium"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Category</span>
            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearchParams({ category: 'all' });
                }}
                className={`text-left text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                }`}
              >
                All Categories ({PRODUCTS.length})
              </button>
              {CATEGORIES.map((cat) => {
                const totalInCat = PRODUCTS.filter((p) => p.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchParams({ category: cat.id });
                    }}
                    className={`text-left text-xs font-bold px-3 py-2 rounded-xl transition-colors flex justify-between items-center ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-white/20' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                      {totalInCat}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-black text-neutral-400 uppercase tracking-widest">
              <span>Max Price</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">₹{maxPrice}</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 font-mono font-bold">
              <span>₹10</span>
              <span>₹150</span>
            </div>
          </div>

          {/* Customer Reviews Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Customer Rating</span>
            <div className="flex flex-col gap-1.5">
              {[4.5, 4.7, 4.9].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                  className={`text-left text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                    selectedRating === rating
                      ? 'bg-amber-500 text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-850'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${selectedRating === rating ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                  <span>{rating}+ Star Rating</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary filters */}
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Dietary Preference</span>
            <label className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={organicOnly}
                onChange={(e) => setOrganicOnly(e.target.checked)}
                className="rounded-md border-neutral-300 accent-emerald-600 w-4.5 h-4.5"
              />
              <span>Organic Dairy Products</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={proteinOnly}
                onChange={(e) => setProteinOnly(e.target.checked)}
                className="rounded-md border-neutral-300 accent-blue-600 w-4.5 h-4.5"
              />
              <span>High-Protein Milk / Shakes</span>
            </label>
          </div>
        </div>

        {/* PRODUCTS LIST GRID */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Top sorting menu / Mobile toggle */}
          <div className="bg-white dark:bg-neutral-900 px-6 py-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 flex flex-wrap gap-4 items-center justify-between">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowFiltersMobile(true)}
              className="lg:hidden p-2.5 px-4 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-black border border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>

            {/* Total count indicator */}
            <span className="text-xs font-extrabold text-neutral-500 dark:text-neutral-400">
              Showing <span className="text-neutral-800 dark:text-neutral-200">{sortedProducts.length}</span> results
            </span>

            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 shrink-0">Sort By:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold focus:outline-hidden"
                >
                  <option value="popular">Popularity / Sells</option>
                  <option value="rating">Top Rated</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog products mapping */}
          {sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 p-8 text-center">
              <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce mb-4" />
              <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200">No matching products found</h4>
              <p className="text-neutral-500 text-xs mt-1.5 max-w-sm">
                Try loosening your filters, reducing your budget boundary, or widening the product category. All items are certified pure.
              </p>
              <button
                onClick={resetFilters}
                className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-full shadow-md cursor-pointer"
              >
                CLEAR FILTER RULES
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCompareToggle={toggleCompare}
                  isCompared={!!compareList.find((p) => p.id === product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE RESPONSIVE FILTERS DRAWER */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setShowFiltersMobile(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />
          {/* Form */}
          <div className="absolute left-0 bottom-0 top-0 w-80 bg-white dark:bg-neutral-900 p-6 flex flex-col z-10 overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b mb-6">
              <span className="font-extrabold text-neutral-800 dark:text-neutral-200">Filter Sourcing</span>
              <button onClick={() => setShowFiltersMobile(false)} className="p-2 bg-neutral-100 rounded-full">
                <X className="w-4.5 h-4.5 text-neutral-500" />
              </button>
            </div>

            {/* Copy of desktop filters inside drawer */}
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Search Catalog</span>
                <input
                  type="text"
                  placeholder="Keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-950/40 text-xs py-2.5 px-3.5 rounded-xl border"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full ${activeCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-neutral-100'}`}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-neutral-100'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Price Boundary</span>
                  <span className="text-blue-600">₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Preferences</span>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={organicOnly} onChange={(e) => setOrganicOnly(e.target.checked)} />
                  <span>Organic Sourced Only</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" checked={proteinOnly} onChange={(e) => setProteinOnly(e.target.checked)} />
                  <span>High-Protein Only</span>
                </label>
              </div>

              <button
                onClick={() => {
                  resetFilters();
                  setShowFiltersMobile(false);
                }}
                className="w-full py-2.5 bg-neutral-100 text-neutral-800 text-xs font-bold rounded-xl"
              >
                RESET ALL FILTERS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT COMPARTATIVE DRAWER FOOTER PANEL */}
      {compareList.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-150 dark:border-neutral-800 p-4 md:p-5 z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-sky-950/40 text-blue-600 flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                  Compare Dairy Items ({compareList.length}/3)
                </h5>
                <span className="text-[10px] text-neutral-400 font-medium block">
                  Select up to 3 items to check nutritional benefits side-by-side.
                </span>
              </div>
            </div>

            {/* List of currently compared */}
            <div className="flex gap-3">
              {compareList.map((p) => (
                <div
                  key={p.id}
                  className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-3 py-1.5 border border-neutral-100/50 flex items-center gap-2"
                >
                  <img src={p.image} alt={p.name} className="w-8 h-8 rounded-md object-cover bg-white" referrerPolicy="no-referrer" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black max-w-[100px] truncate leading-tight">{p.name}</span>
                    <span className="text-[9px] font-mono text-neutral-400">₹{p.price} / {p.unit}</span>
                  </div>
                  <button 
                    onClick={() => removeCompareItem(p.id)}
                    className="p-1 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Actions button */}
            <div className="flex gap-2">
              <button
                onClick={() => setCompareList([])}
                className="text-xs font-black text-neutral-500 hover:text-rose-500 px-4 py-2 rounded-xl"
              >
                CLEAR
              </button>
              <button
                disabled={compareList.length < 2}
                onClick={() => setCompareModalOpen(true)}
                className={`text-xs font-black px-6 py-2.5 rounded-xl shadow-md ${
                  compareList.length < 2
                    ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }`}
              >
                COMPARE NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED COMPARISON POPUP MODAL */}
      {compareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setCompareModalOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800 z-10 max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                Comparison Matrix (Nutritional & Value Promise)
              </span>
              <button onClick={() => setCompareModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Matrix Table */}
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="py-4 text-xs font-black text-neutral-400 uppercase tracking-wider w-1/4">Criteria</th>
                    {compareList.map((p) => (
                      <th key={p.id} className="py-4 px-4 text-center w-1/4">
                        <div className="flex flex-col items-center">
                          <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover bg-neutral-50 mb-2 border" referrerPolicy="no-referrer" />
                          <span className="text-xs font-black text-neutral-800 dark:text-neutral-200 line-clamp-1 max-w-[150px]">{p.name}</span>
                          <span className="text-[10px] font-bold text-blue-600 font-mono mt-1">₹{p.price} / {p.unit}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  <tr>
                    <td className="py-4 text-neutral-400 uppercase tracking-wider text-[10px]">Pure Category</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-4 px-4 text-center uppercase tracking-widest text-[9px] text-blue-600">{p.category}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-neutral-400 uppercase tracking-wider text-[10px]">Purity Standard</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-4 px-4 text-center text-emerald-600">
                        {p.organic ? 'Certified Organic A2' : 'Double Tested Pure'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-neutral-400 uppercase tracking-wider text-[10px]">Protein Content</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-4 px-4 text-center font-mono">{p.nutrition.protein}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-neutral-400 uppercase tracking-wider text-[10px]">Energy Rating</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-4 px-4 text-center font-mono">{p.nutrition.energy}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-neutral-400 uppercase tracking-wider text-[10px]">Calcium Count</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-4 px-4 text-center font-mono text-blue-500">{p.nutrition.calcium}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-neutral-400 uppercase tracking-wider text-[10px]">Fat Content</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-4 px-4 text-center font-mono">{p.nutrition.fat}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-4 text-neutral-400 uppercase tracking-wider text-[10px]">Storage Directive</td>
                    {compareList.map((p) => (
                      <td key={p.id} className="py-4 px-4 text-center text-[10px] text-neutral-500 leading-normal max-w-[180px] mx-auto">{p.storage}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
