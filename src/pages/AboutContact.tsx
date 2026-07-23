import React, { useState } from 'react';
import { 
  Heart, ShieldCheck, Mail, Phone, MapPin, 
  Send, Sparkles, Star, Users, HelpCircle, ChevronDown 
} from 'lucide-react';
import { useApp } from '../AppContext';
import { FAQS } from '../data';

export const AboutContact: React.FC = () => {
  const { showToast } = useApp();

  // FAQ interactive state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && msg.trim()) {
      setSuccess(true);
      showToast(`Thank you, ${name}! Your inquiry has been routed to our Pune logistics office.`, 'success');
      setName('');
      setEmail('');
      setPhone('');
      setMsg('');
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24 space-y-16">
      
      {/* 1. HERO BRAND INTRO */}
      <section className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
          🐄 OUR SOURCE OF PURENESS
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
          Parag Heritage & Integrity
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm mt-3 leading-relaxed">
          Pioneering local dairy unadulteration standards since 2012. Learn how our green-pasture cow farms provide direct milk-packs to Pune families within 12 hours of milking.
        </p>
      </section>

      {/* 2. THE STORY / JOURNEY GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-10 border border-neutral-100 dark:border-neutral-800">
        <div className="space-y-4">
          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block">THE 12-HOUR FARM-TO-HOME PROMISE</span>
          <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
            Nurtured by Nature, Proven by Science.
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed">
            Parag Milk was born in the lush, organic pastures near Pune with a simple mission: to make pure, unadulterated milk accessible to everyone without corporate preservatives or artificial hormones. Today, our co-op partners with over 350 sustainable dairy farmers.
          </p>
          
          {/* Key pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-bold text-neutral-700">
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-neutral-850">A2 Pasteurization</span>
                <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">Tested for zero beta-casomorphin side effects.</span>
              </div>
            </div>
            <div className="flex gap-2.5 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-neutral-850">Grass-Fed Cows</span>
                <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">Pasture fed high-clover diet rich in CLA.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual illustration of the farm environment */}
        <div className="relative rounded-2xl overflow-hidden aspect-video border shadow-xs bg-neutral-150">
          <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000" 
            alt="Cow pasture pasture land" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Absolute banner overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent flex items-end p-5">
            <div className="text-white">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Certified Farm</span>
              <span className="text-xs font-black block mt-1">Parag Pastures, Hadapsar Valley, Pune District</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MICRO-LOGISTICS GEOLOCATION & CONTACT CONTACT FORM */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Form (Lg: 7/12) */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6">
          <div>
            <h3 className="text-base md:text-lg font-black text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Contact Our Pune Office
            </h3>
            <span className="text-[11px] text-neutral-400 font-semibold block mt-1">
              Have questions about your milk deliveries or partnership opportunities? Send a message!
            </span>
          </div>

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 text-xs font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Message submitted successfully! We will contact you within 2 business hours.</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Kulkarni"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. anand@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. +91 9988776655"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Message Description</label>
              <textarea
                required
                rows={4}
                placeholder="Type your question or delivery address details..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                className="bg-neutral-50 dark:bg-neutral-950 text-xs px-3.5 py-2.5 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>SEND MESSAGE</span>
            </button>
          </form>
        </div>

        {/* Office Details & Map (Lg: 5/12) */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-[32px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest">
            Distribution Channels
          </h3>

          <div className="space-y-4 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <div className="flex gap-3 items-start">
              <MapPin className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="block font-black text-neutral-800 dark:text-neutral-200">Main Distribution Hub</span>
                <span className="block text-neutral-400 mt-0.5 text-[11px]">Viman Nagar Industrial Estate, Lane 4, Pune - 411014</span>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Phone className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="block font-black text-neutral-800 dark:text-neutral-200">Customer Helpline</span>
                <span className="block text-neutral-400 mt-0.5 text-[11px] font-mono">+91 (020) 2612-4040 (05:00 AM - 09:00 PM)</span>
              </div>
            </div>
          </div>

          {/* Interactive Pune distribution map mockup */}
          <div className="border border-neutral-150 rounded-2xl overflow-hidden aspect-square relative bg-slate-50">
            {/* Visual nodes for Pune locations */}
            <div className="absolute inset-0 bg-sky-50/20 dark:bg-neutral-950/20" />
            
            {/* Map graphic lines mockup */}
            <div className="absolute top-[20%] left-0 right-0 h-[1px] bg-neutral-200" />
            <div className="absolute top-0 bottom-0 left-[40%] w-[1px] bg-neutral-200" />
            
            {/* Distribution Hub Node */}
            <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center animate-ping absolute" />
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white relative z-10" />
              <span className="text-[9px] font-black text-blue-700 bg-white/95 px-2 py-0.5 rounded-full border shadow-sm block mt-1 uppercase">HQ Viman Nagar</span>
            </div>

            {/* Sub-node A: Baner */}
            <div className="absolute top-[30%] left-[20%] flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
              <span className="text-[8px] text-neutral-500 bg-white/90 px-1 rounded-sm mt-0.5">Baner Hub</span>
            </div>

            {/* Sub-node B: Kothrud */}
            <div className="absolute bottom-[30%] left-[25%] flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
              <span className="text-[8px] text-neutral-500 bg-white/90 px-1 rounded-sm mt-0.5">Kothrud Hub</span>
            </div>

            {/* Sub-node C: Hadapsar */}
            <div className="absolute bottom-[25%] right-[20%] flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
              <span className="text-[8px] text-neutral-500 bg-white/90 px-1 rounded-sm mt-0.5">Hadapsar</span>
            </div>

            {/* Map footer credits */}
            <div className="absolute bottom-2 left-2 right-2 text-[10px] text-center font-bold text-neutral-400 bg-white/90 py-1 rounded-md">
              📍 Delivering to Kalyani Nagar, Viman Nagar, Baner, Kothrud, Hadapsar, and Pimple Saudagar.
            </div>
          </div>
        </div>

      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 border border-neutral-100 dark:border-neutral-800 shadow-xs space-y-6">
        <div className="text-center">
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">DOUBTS RESOLVED</span>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-4xl mx-auto divide-y divide-neutral-100 dark:divide-neutral-800">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center text-left py-2 font-black text-xs sm:text-sm text-neutral-800 dark:text-neutral-200 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4.5 h-4.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                </button>
                
                {isOpen && (
                  <div className="pt-2 text-xs sm:text-sm text-neutral-500 leading-relaxed font-semibold">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
