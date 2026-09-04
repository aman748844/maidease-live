import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, PhoneCall, Calculator, Clock, UserCheck, ShieldCheck, MapPin, RefreshCw, Layers } from 'lucide-react';

export default function Navbar() {
  const { 
    role, 
    setRole, 
    availableCount, 
    bookings, 
    setIsPriceCalculatorOpen, 
    setIsBookingTrackerOpen,
    loadMaids,
    loading
  } = useApp();

  const activeBookingsCount = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length;

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRole('customer')}>
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white shadow-lg shadow-emerald-500/25">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-heading tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                MaidEase<span className="text-emerald-400">Live</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>Indiranagar, Bengaluru</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="text-emerald-400 font-semibold">{availableCount} Maids Available Now</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Price Estimator Button */}
          <button
            onClick={() => setIsPriceCalculatorOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all shadow-sm hover:border-emerald-500/40"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Price Estimator</span>
            <span className="md:hidden">Rates</span>
          </button>

          {/* Active Bookings Button */}
          <button
            onClick={() => setIsBookingTrackerOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all shadow-sm hover:border-emerald-500/40"
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Live Tracker</span>
            <span className="md:hidden">Track</span>
            {activeBookingsCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-emerald-500 text-slate-950 animate-bounce">
                {activeBookingsCount}
              </span>
            )}
          </button>

          {/* Sync Refresh Button */}
          <button
            onClick={loadMaids}
            title="Refresh Live Availability"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-emerald-300 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Role Switcher (Customer vs Maid Partner) */}
          <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner">
            <button
              onClick={() => setRole('customer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                role === 'customer'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>
            <button
              onClick={() => setRole('partner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                role === 'partner'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Maid Partner</span>
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
