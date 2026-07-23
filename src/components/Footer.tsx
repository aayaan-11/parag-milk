import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Milk, Facebook, Twitter, Instagram, ArrowRight, 
  MapPin, Phone, Mail, Award, ShieldCheck, RefreshCw, Send 
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-neutral-900 text-neutral-400 pt-16 pb-8 border-t border-neutral-800 z-10 relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Core Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-neutral-850">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-neutral-800 rounded-2xl text-emerald-500 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">24 Strict Tests</h4>
              <p className="text-xs text-neutral-500 mt-1">Every batch is tested automatedly for urea, dilution, starch and antibiotic residues.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-neutral-800 rounded-2xl text-blue-500 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Direct Farm Sourced</h4>
              <p className="text-xs text-neutral-500 mt-1">Zero middlemen. Sourced directly from our family dairy farms and certified pastoral partners.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-neutral-800 rounded-2xl text-amber-500 shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Eco-Conscious Cold Chain</h4>
              <p className="text-xs text-neutral-500 mt-1">100% sustainable glass bottles and electric vehicle delivery fleet maintaining cold chain below 4°C.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-neutral-800 rounded-2xl text-emerald-500 shrink-0">
              <Milk className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-white text-sm">Vedic Vedic Bilona</h4>
              <p className="text-xs text-neutral-500 mt-1">Traditional hand-churned products respecting organic cow feeding cycles.</p>
            </div>
          </div>
        </div>

        {/* Major Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                <Milk className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white">PARAG</span>
                <span className="text-[10px] font-bold text-emerald-500 tracking-widest">MILK & DAIRY</span>
              </div>
            </Link>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
              Sustaining rural dairy farming traditions while delivering premium, unadulterated pasteurized cow milk, ghee, and curd fresh to urban doorsteps. Certified organic and fully automated.
            </p>
            
            {/* Social channels */}
            <div className="flex items-center gap-3 mt-2">
              <a href="#" className="p-2.5 bg-neutral-800 hover:bg-blue-600 text-neutral-400 hover:text-white rounded-xl transition-all" title="Facebook">
                <Facebook className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="p-2.5 bg-neutral-800 hover:bg-blue-400 text-neutral-400 hover:text-white rounded-xl transition-all" title="Twitter">
                <Twitter className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="p-2.5 bg-neutral-800 hover:bg-pink-600 text-neutral-400 hover:text-white rounded-xl transition-all" title="Instagram">
                <Instagram className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-widest mb-4">Quick Links</h4>
            <ul className="flex flex-col gap-2.5 text-xs">
              <li><Link to="/products" className="hover:text-white transition-colors">Our Product Catalogue</Link></li>
              <li><Link to="/subscription" className="hover:text-white transition-colors">Subscription Pricing</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Farm History & Story</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Our Helpdesk</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">My Profile & Addresses</Link></li>
            </ul>
          </div>

          {/* Dairy Categories */}
          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-widest mb-4">Core Dairy Products</h4>
            <ul className="flex flex-col gap-2.5 text-xs">
              <li><Link to="/products?category=milk" className="hover:text-white transition-colors">Premium Cow Milk</Link></li>
              <li><Link to="/products?category=curd" className="hover:text-white transition-colors">Thick Organic Curd (Dahi)</Link></li>
              <li><Link to="/products?category=paneer" className="hover:text-white transition-colors">Soft Malai Paneer</Link></li>
              <li><Link to="/products?category=ghee" className="hover:text-white transition-colors">Bilona Vedic Cow Ghee</Link></li>
              <li><Link to="/products?category=ice-cream" className="hover:text-white transition-colors">Fresh Dairy Ice Cream</Link></li>
            </ul>
          </div>

          {/* Newsletter subscription */}
          <div className="flex flex-col gap-4">
            <h4 className="font-black text-white text-xs uppercase tracking-widest">Join Newsletter</h4>
            <p className="text-xs text-neutral-500">Subscribe for early access to discounts, farm updates, and organic parenting insights.</p>
            {subscribed ? (
              <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900 text-emerald-400 text-xs font-semibold">
                🎉 Successfully joined newsletter!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative">
                <input
                  type="email"
                  required
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-800 text-xs text-white placeholder-neutral-500 px-4 py-3 rounded-xl border border-neutral-700 focus:outline-hidden focus:border-blue-500 transition-colors pr-10"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
            
            {/* Play store / App store mock */}
            <div className="flex flex-col gap-1.5 pt-2">
              <span className="text-[10px] text-neutral-600 font-extrabold uppercase tracking-wider">Download App (Blinkit Experience)</span>
              <div className="flex gap-2">
                <a href="#" className="bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-700 flex items-center gap-1.5 shrink-0 transition-colors">
                  <div className="text-[8px] text-left leading-none text-neutral-400">GET IT ON <span className="block text-[10px] font-black text-white mt-0.5">Google Play</span></div>
                </a>
                <a href="#" className="bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-lg border border-neutral-700 flex items-center gap-1.5 shrink-0 transition-colors">
                  <div className="text-[8px] text-left leading-none text-neutral-400">Download on the <span className="block text-[10px] font-black text-white mt-0.5">App Store</span></div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Address and Legal Info */}
        <div className="border-t border-neutral-850 pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-neutral-500 font-medium">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
              <span>Headquarters: Parag Dairy Farms, Plot 42-A, Chakan Industrial Area, Phase II, Pune, MH, India.</span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-neutral-600" />
                <span>+91 20-8472910</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-neutral-600" />
                <span>fresh@paragmilk.com</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:items-end justify-center gap-2">
            <span>© 2026 Parag Milk Dairy Products Private Limited. All rights reserved.</span>
            <div className="flex gap-3 text-[10px] font-semibold text-neutral-600">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:underline">Terms & Conditions</a>
              <span>•</span>
              <a href="#" className="hover:underline">FSSAI Licence No: 11522034000318</a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
