import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, CheckCircle, AlertTriangle, X, Search, HelpCircle, Sparkles } from 'lucide-react';
import { checkDeliveryEligibility, COVERED_LOCATIONS } from '../utils/delivery';

interface DeliveryCoverageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeliveryCoverageModal: React.FC<DeliveryCoverageModalProps> = ({ isOpen, onClose }) => {
  const [cityInput, setCityInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Suggestions helper
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  const cities = ['Lucknow', 'Pune'];
  const suggestedAreas: { [city: string]: string[] } = {
    Lucknow: ['Hazratganj', 'Gomti Nagar', 'Aliganj', 'Indira Nagar', 'Mahanagar'],
    Pune: ['Koregaon Park', 'Viman Nagar', 'Shivajinagar', 'Kothrud', 'Baner']
  };

  const handleCheck = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cityInput.trim() || !areaInput.trim()) return;

    setIsChecking(true);
    setResult(null);

    // Simulate standard satellite check/server ping
    setTimeout(() => {
      const eligibility = checkDeliveryEligibility(cityInput, areaInput);
      setResult(eligibility);
      setIsChecking(false);

      if (eligibility.isDeliverable) {
        // Persist verified location
        const verifiedLoc = {
          city: eligibility.city,
          area: eligibility.area,
          isEligible: true,
          checkedAt: new Date().toISOString()
        };
        localStorage.setItem('parag_verified_location', JSON.stringify(verifiedLoc));
        // Dispatch a custom event to notify components (e.g. Navbar)
        window.dispatchEvent(new Event('parag_location_updated'));
      } else {
        // Save unsuccessful attempt or clear
        localStorage.removeItem('parag_verified_location');
        window.dispatchEvent(new Event('parag_location_updated'));
      }
    }, 1000);
  };

  const selectCity = (city: string) => {
    setCityInput(city);
    setAreaInput('');
    setShowCitySuggestions(false);
    setResult(null);
  };

  const selectArea = (area: string) => {
    setAreaInput(area);
    setShowAreaSuggestions(false);
    setResult(null);
  };

  useEffect(() => {
    // Load pre-existing verified or custom input if any
    const saved = localStorage.getItem('parag_verified_location');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCityInput(parsed.city);
      setAreaInput(parsed.area);
      setResult(checkDeliveryEligibility(parsed.city, parsed.area));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glass overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-900/65 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-neutral-900 rounded-[32px] w-full max-w-lg p-6 md:p-8 border border-neutral-200/50 dark:border-neutral-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Dynamic Background visual pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-blue-100/40 dark:from-blue-900/10 to-transparent blur-2xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-44 h-44 bg-radial from-emerald-100/40 dark:from-emerald-900/10 to-transparent blur-2xl rounded-full pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center text-white shadow-lg">
              <MapPin className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-neutral-900 dark:text-neutral-50 leading-none">
                Delivery Coverage Checker
              </h3>
              <p className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                Lucknow & Pune Regions Only
              </p>
            </div>
          </div>

          <form onSubmit={handleCheck} className="space-y-5">
            {/* City input */}
            <div className="relative space-y-1.5">
              <label className="text-xs font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
                Select Operating City
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => {
                    setCityInput(e.target.value);
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  placeholder="e.g. Lucknow, Pune"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-3 px-4 text-xs font-bold text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowCitySuggestions(!showCitySuggestions)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* City suggestions list */}
              {showCitySuggestions && (
                <div className="absolute z-20 left-0 right-0 bg-white dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-lg mt-1 p-1 max-h-36 overflow-y-auto">
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => selectCity(city)}
                      className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between"
                    >
                      <span>{city}</span>
                      <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Active</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Area input */}
            <div className="relative space-y-1.5">
              <label className="text-xs font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
                Enter Locality / Area
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={areaInput}
                  onChange={(e) => {
                    setAreaInput(e.target.value);
                    setShowAreaSuggestions(true);
                  }}
                  onFocus={() => setShowAreaSuggestions(true)}
                  placeholder="e.g. Hazratganj or Gomti Nagar"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl py-3 px-4 text-xs font-bold text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              {/* Area suggestions list */}
              {showAreaSuggestions && cityInput && (
                <div className="absolute z-20 left-0 right-0 bg-white dark:bg-neutral-850 border border-neutral-100 dark:border-neutral-800 rounded-xl shadow-lg mt-1 p-1 max-h-40 overflow-y-auto">
                  {/* Find matched city */}
                  {Object.keys(suggestedAreas)
                    .filter((c) => c.toLowerCase() === cityInput.toLowerCase() || cityInput.toLowerCase().includes(c.toLowerCase()))
                    .flatMap((c) => suggestedAreas[c])
                    .map((area) => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => selectArea(area)}
                        className="w-full text-left px-3.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between"
                      >
                        <span>{area}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          area === 'Gomti Nagar' 
                            ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' 
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                        }`}>
                          {area === 'Gomti Nagar' ? 'Outside Coverage' : 'Coverage Active'}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Check Button */}
            <button
              type="submit"
              disabled={isChecking || !cityInput.trim() || !areaInput.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 disabled:from-neutral-200 disabled:to-neutral-300 dark:disabled:from-neutral-800 dark:disabled:to-neutral-800 disabled:text-neutral-400 text-white font-extrabold text-xs uppercase tracking-widest shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verifying GIS Coordinates...
                </>
              ) : (
                'CHECK DISPATCH ELIGIBILITY'
              )}
            </button>
          </form>

          {/* Results Display */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={result.isDeliverable ? 'success' : 'fail'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-6 p-4 rounded-2xl border transition-all ${
                  result.isDeliverable
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                    : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400'
                }`}
              >
                <div className="flex gap-3">
                  {result.isDeliverable ? (
                    <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-500 mt-0.5" />
                  )}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider">
                      {result.isDeliverable ? 'DISPATCH ELIGIBLE' : 'OUTSIDE SERVICE AREA'}
                    </h4>
                    <p className="text-xs font-semibold leading-relaxed">
                      {result.reason}
                    </p>

                    {/* Suggestions list for Lucknow Hazratganj / Gomti Nagar case */}
                    {result.suggestions && result.suggestions.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-black text-neutral-400 block mb-1">
                          Our active dispatch zones in {result.city}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {result.suggestions.map((s: string) => (
                            <span
                              key={s}
                              onClick={() => {
                                setAreaInput(s);
                                setCityInput(result.city);
                                setResult(null);
                              }}
                              className="text-[9px] font-black tracking-wide bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 px-2 py-1 rounded-md cursor-pointer transition-colors"
                            >
                              📍 {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.isDeliverable && (
                      <div className="pt-2 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        We deliver here daily between 5:30 AM - 7:30 AM!
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick FAQ / Note */}
          <div className="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 text-center flex items-center justify-center gap-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>All cities & locations are 100% deliverable across India!</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
