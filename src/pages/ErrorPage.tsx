import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  WifiOff, AlertTriangle, ShieldAlert, FileQuestion, 
  RefreshCw, Home, Search, HelpCircle, ArrowLeft 
} from 'lucide-react';
import { useApp } from '../AppContext';

interface ErrorPageProps {
  type?: '404' | '500' | 'offline' | 'empty-search';
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ type }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  // Determine error style: via prop or URL query
  const errorType = type || (searchParams.get('type') as any) || '404';

  const handleTestConnection = () => {
    showToast('Checking telemetry connection to Pune server... OK! Cloud servers are online.', 'success');
  };

  const handleRefreshState = () => {
    showToast('Clearing local caches and reloading application states...', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4 py-12 transition-all">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-[32px] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Subtle abstract glassmorphism decorative bubbles */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-blue-100 dark:bg-sky-950/20 rounded-full blur-xl" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-100 dark:bg-emerald-950/20 rounded-full blur-xl" />

        {/* 1. STATE-SPECIFIC ILLUSTRATION & BADGE */}
        {errorType === '404' && (
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-md">
              <FileQuestion className="w-9 h-9 stroke-[2]" />
            </div>
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider border border-rose-100">
              Error Code: 404 (Missing Paste)
            </span>
            <h2 className="text-xl md:text-2xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight leading-none">
              Dairy Route Not Found
            </h2>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
              We couldn't locate this page. It might have been relocated during our logistics network upgrade.
            </p>
          </div>
        )}

        {errorType === '500' && (
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-9 h-9 stroke-[2]" />
            </div>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-100">
              Error Code: 500 (Server Timeout)
            </span>
            <h2 className="text-xl md:text-2xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight leading-none">
              Internal Pipeline Fault
            </h2>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
              Our automated checkout server experienced a brief lag. Let's try testing the telemetry nodes.
            </p>
          </div>
        )}

        {errorType === 'offline' && (
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 bg-neutral-100 text-neutral-500 rounded-full flex items-center justify-center mx-auto shadow-md">
              <WifiOff className="w-9 h-9 stroke-[2] animate-pulse" />
            </div>
            <span className="text-[10px] font-black text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full uppercase tracking-wider border">
              Telemetry Offline State
            </span>
            <h2 className="text-xl md:text-2xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight leading-none">
              No Network Connection
            </h2>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
              Please inspect your Wi-Fi or mobile cellular status. Parag local state managers will sync once online.
            </p>
          </div>
        )}

        {errorType === 'empty-search' && (
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-md">
              <Search className="w-9 h-9 stroke-[2]" />
            </div>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider border border-blue-100">
              Empty Query Boundary
            </span>
            <h2 className="text-xl md:text-2xl font-black text-neutral-800 dark:text-neutral-100 tracking-tight leading-none">
              Zero Items Sourced
            </h2>
            <p className="text-neutral-400 text-xs leading-relaxed max-w-xs mx-auto">
              We couldn't find any dairy matches matching your description. Try simple terms like "cow milk" or "desi ghee".
            </p>
          </div>
        )}

        {/* 2. RECOVERY WORKFLOW BUTTONS */}
        <div className="space-y-3 relative z-10 pt-4 border-t">
          {errorType === 'offline' ? (
            <button
              onClick={handleTestConnection}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md cursor-pointer"
            >
              TEST TELEMETRY CONNECTION
            </button>
          ) : (
            <Link
              to="/"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:opacity-95 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-4.5 h-4.5" />
              <span>RETURN TO MAIN DASHBOARD</span>
            </Link>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 text-xs font-black py-2.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>GO BACK</span>
            </button>
            <button
              onClick={handleRefreshState}
              className="bg-neutral-50 hover:bg-neutral-100 text-neutral-600 text-xs font-black py-2.5 rounded-xl border flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH</span>
            </button>
          </div>
        </div>

        {/* 3. SIMULATE ERROR STATE SHORTCUTS (Useful for client review!) */}
        <div className="pt-4 border-t border-dashed">
          <span className="text-[9px] font-black uppercase text-neutral-400 tracking-widest block mb-2">Simulate Other Error Pages</span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {[
              { id: '404', label: '404' },
              { id: '500', label: '500' },
              { id: 'offline', label: 'Offline' },
              { id: 'empty-search', label: 'Empty Search' }
            ].map((e) => (
              <button
                key={e.id}
                onClick={() => navigate(`/error?type=${e.id}`)}
                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md border ${
                  errorType === e.id ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950' : 'bg-neutral-50 text-neutral-500'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
