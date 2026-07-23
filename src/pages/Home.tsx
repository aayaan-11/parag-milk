import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Sparkles, ArrowRight, ShieldCheck, Truck, HelpCircle, 
  ChevronRight, Star, Quote, Calendar, Plus, ChevronDown, Check,
  Activity, Users, Award, Trees
} from 'lucide-react';
import { MilkSplashAnimation } from '../components/MilkSplashAnimation';
import { PRODUCTS, CATEGORIES, TESTIMONIALS, BLOGS, FAQS } from '../data';
import { ProductCard } from '../components/ProductCard';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Statistics counters animation simulation
  const [familiesServed, setFamiliesServed] = useState(12000);
  const [certifiedFarms, setCertifiedFarms] = useState(15);
  const [purityPercentage, setPurityPercentage] = useState(95);

  useEffect(() => {
    const familiesTimer = setInterval(() => {
      setFamiliesServed((prev) => (prev < 15400 ? prev + 85 : 15400));
    }, 40);
    const farmsTimer = setInterval(() => {
      setCertifiedFarms((prev) => (prev < 42 ? prev + 1 : 42));
    }, 60);
    const purityTimer = setInterval(() => {
      setPurityPercentage((prev) => (prev < 100 ? prev + 1 : 100));
    }, 50);

    return () => {
      clearInterval(familiesTimer);
      clearInterval(farmsTimer);
      clearInterval(purityTimer);
    };
  }, []);

  const featuredProducts = PRODUCTS.filter(p => p.featured).slice(0, 4);
  const bestSellers = PRODUCTS.filter(p => p.bestSeller).slice(0, 4);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 pb-16 md:pb-0">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left column: Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-sky-950/30 text-blue-700 dark:text-blue-300 px-4 py-1.5 rounded-full text-xs font-black self-start uppercase tracking-wider border border-blue-100/50">
            <Sparkles className="w-4 h-4 animate-spin text-amber-500" />
            <span>Zero-Middlemen Pasture Milk</span>
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-neutral-900 dark:text-neutral-100 leading-[1.1] tracking-tight">
            Freshness in Every Drop, <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600 bg-clip-text text-transparent">
              Direct to Your Door
            </span>
          </h1>

          <p className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base leading-relaxed max-w-lg font-medium">
            Experience unadulterated pasture-fresh dairy. Labeled with transparency, our cow milk undergoes 24 automated safety filters and cold-delivery before 7:30 AM daily.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => navigate('/products')}
              className="bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>SHOP ONE-TIME</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => navigate('/subscription')}
              className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:opacity-95 text-white px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>SUBSCRIBE DAILY</span>
              <Calendar className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Micro badges */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-neutral-200/60 dark:border-neutral-800/60 max-w-md">
            <div>
              <span className="text-2xl font-black text-neutral-800 dark:text-neutral-200 block font-mono">
                {familiesServed.toLocaleString()}+
              </span>
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
                Happy Families
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-neutral-800 dark:text-neutral-200 block font-mono">
                {certifiedFarms}+
              </span>
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
                Pasture Farms
              </span>
            </div>
            <div>
              <span className="text-2xl font-black text-neutral-800 dark:text-neutral-200 block font-mono">
                {purityPercentage}%
              </span>
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-wider">
                Certified Pure
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right column: Interactive Animated Milk Bottle Centerpiece */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative flex items-center justify-center"
        >
          <MilkSplashAnimation />
        </motion.div>
      </section>

      {/* 2. CATEGORIES SECTION */}
      <section className="bg-white dark:bg-neutral-900/40 py-16 px-4 md:px-8 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
                DAIRY CATALOGUE
              </span>
              <h2 className="text-2xl md:text-3.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Browse Fresh Dairy
              </h2>
            </div>
            <Link 
              to="/products" 
              className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline uppercase tracking-wider"
            >
              <span>View All Categories</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Scrolling category grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {CATEGORIES.slice(0, 6).map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/products?category=${cat.id}`)}
                className="group relative bg-neutral-50 dark:bg-neutral-900 p-5 rounded-3xl border border-neutral-100 dark:border-neutral-800/80 cursor-pointer flex flex-col items-center justify-center text-center hover:bg-gradient-to-b hover:from-white hover:to-blue-50/30 dark:hover:to-sky-950/10 shadow-xs hover:shadow-md transition-all duration-300"
              >
                {/* Visual Circle indicator for category icon */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-sky-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <span className="text-base font-black uppercase font-mono">{cat.name.slice(0, 2)}</span>
                </div>
                <h4 className="font-extrabold text-neutral-800 dark:text-neutral-200 text-sm leading-tight">
                  {cat.name}
                </h4>
                <span className="text-[11px] font-medium text-neutral-400 mt-1">
                  {cat.count} products
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">
              FARM HARVEST
            </span>
            <h2 className="text-2xl md:text-3.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
              Featured Best Sellers
            </h2>
          </div>
          <Link 
            to="/products" 
            className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline uppercase tracking-wider"
          >
            <span>VIEW CATALOGUE</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. SUBSCRIPTION CALL TO ACTION BANNER */}
      <section className="relative my-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-emerald-600 rounded-[32px] overflow-hidden p-8 md:p-14 text-white shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-10">
          {/* Wave Background decoration */}
          <div className="absolute right-0 bottom-0 left-0 h-full opacity-10 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.8)_0%,transparent_70%)] pointer-events-none" />

          <div className="space-y-4 max-w-2xl text-center lg:text-left z-10">
            <span className="bg-white/20 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-white/25 inline-block">
              📅 SAVE TIME & MONEY
            </span>
            <h2 className="text-3xl sm:text-4.5xl font-black leading-tight tracking-tight">
              No More Morning Milk Runs. <br />
              Subscribe & Save Up to 20%!
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed max-w-xl">
              Get fresh, hormone-free cow milk delivered automatically by 7:30 AM. Visually schedule, skip deliveries, activate vacation pause, and enjoy cash benefits on all standard orders.
            </p>
            <div className="flex flex-wrap gap-3 pt-3 justify-center lg:justify-start text-xs font-black">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Check className="w-3.5 h-3.5" /> No Delivery Fee</span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Check className="w-3.5 h-3.5" /> Vacation Pause</span>
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full"><Check className="w-3.5 h-3.5" /> Flexible Schedule</span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-3 z-10 w-full lg:w-auto">
            <button
              onClick={() => navigate('/subscription')}
              className="w-full lg:w-auto bg-white hover:bg-neutral-100 text-blue-700 px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>BUILD MY SCHEDULE</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
            <span className="text-[11px] text-blue-100 font-medium">
              Subscriptions start at just ₹56/litre!
            </span>
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US (BENTO GRID STYLE) */}
      <section className="bg-neutral-100/50 dark:bg-neutral-900/20 py-20 px-4 md:px-8 border-y border-neutral-100 dark:border-neutral-850">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
              THE PARAG PLEDGE
            </span>
            <h2 className="text-3xl md:text-4.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
              Purity Sourced Ethically
            </h2>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Leading the nation in clean dairy processing, we guarantee freshness at every checkpoint from feed to delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Box 1: 24 Checks */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="text-lg font-black text-neutral-800 dark:text-neutral-100">
                24 Automated Pure Checks
              </h4>
              <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                Our high-speed labs filter every single raw milking cycle. We test for standard milk-adulterations such as detergent, urea, starch, water-dilution, and trace antibiotics.
              </p>
            </motion.div>

            {/* Bento Box 2: Sourcing */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-sky-950/20 text-blue-600 flex items-center justify-center">
                <Award className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="text-lg font-black text-neutral-800 dark:text-neutral-100">
                Certified A2 Vedic Sourcing
              </h4>
              <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                Our premium range features grass-fed cow breeds. Our ghee is prepared utilizing Vedic Bilona techniques where butter is churned directly from curd.
              </p>
            </motion.div>

            {/* Bento Box 3: Cold Chain */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center">
                <Truck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h4 className="text-lg font-black text-neutral-800 dark:text-neutral-100">
                Under-4°C Cold Delivery
              </h4>
              <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed">
                From the moment of collection to processing, storage, transport, and final doorstep drop-off, the milk is securely kept cold under 4°C to minimize bacterial counts.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 6. VERIFIED REVIEWS SECTION */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">
            CUSTOMER LOVE
          </span>
          <h2 className="text-3xl md:text-4.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
            What Families Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((review) => (
            <div 
              key={review.id}
              className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-neutral-100 dark:text-neutral-800/60 stroke-[1.5]" />
              
              <div className="flex text-amber-400 gap-1 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6 italic">
                "{review.comment}"
              </p>

              <div className="flex items-center gap-3 mt-auto">
                <img 
                  src={review.avatar} 
                  alt={review.name} 
                  className="w-10 h-10 rounded-full object-cover border"
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {review.name}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-bold">
                    {review.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. BLOG & PARENTING CORNER PREVIEW */}
      <section className="bg-white dark:bg-neutral-900/30 py-20 px-4 md:px-8 border-t border-neutral-150 dark:border-neutral-850">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1">
                PARENTHOOD & HEALTH
              </span>
              <h2 className="text-2xl md:text-3.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                Our Dairy Chronicles
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BLOGS.map((blog) => (
              <div 
                key={blog.id}
                className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden bg-neutral-200">
                  <img 
                    src={blog.image} 
                    alt={blog.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-black text-neutral-800 px-3 py-1 rounded-full">
                    {blog.date}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    {blog.author}
                  </span>
                  <h4 className="font-extrabold text-neutral-900 dark:text-neutral-100 mt-2 text-sm sm:text-base leading-snug hover:text-blue-600 cursor-pointer">
                    {blog.title}
                  </h4>
                  <p className="text-neutral-500 text-xs mt-2 leading-relaxed">
                    {blog.excerpt}
                  </p>
                  <button className="text-xs font-bold text-blue-600 hover:underline text-left mt-4 uppercase tracking-wider flex items-center gap-1">
                    <span>Read Article</span>
                    <ChevronRight className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="py-20 px-4 md:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
            SUPPORT CENTER
          </span>
          <h2 className="text-2xl md:text-3.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
            Common Inquiries
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full flex justify-between items-center p-5 font-extrabold text-neutral-800 dark:text-neutral-200 text-sm sm:text-base text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-850"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              
              {activeFaq === idx && (
                <div className="p-5 pt-0 border-t border-neutral-100 dark:border-neutral-800 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed bg-neutral-50/30 dark:bg-neutral-950/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
