import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, SlidersHorizontal, Sparkles, MapPin, X, 
  ShieldCheck, Zap, Flame, CheckCircle2, ChevronRight, Eye 
} from 'lucide-react';

const JUSTDIAL_CATEGORIES = [
  { id: 'all', label: 'All Services', subtitle: '6+ verified chores', icon: '✨', badge: 'Popular' },
  { id: 'cooking', label: 'Cooks & Chefs', subtitle: 'Gol Chapati & Maharashtrian', icon: '🍳', badge: 'High Demand' },
  { id: 'cleaning', label: 'House Cleaning', subtitle: 'Mopping & Deep Dusting', icon: '🧹', badge: 'Instant' },
  { id: 'dishwashing', label: 'Bartan & Sink', subtitle: 'Sparkling Utensils', icon: '🍽️', badge: 'Fast' },
  { id: 'babysitting', label: 'Babysitter & Aya', subtitle: 'Childcare & Infant feeding', icon: '👶', badge: 'Verified' },
  { id: 'elderlyCare', label: 'Elderly Care', subtitle: 'Patient & Companion Care', icon: '👵', badge: 'Trusted' },
  { id: 'laundry', label: '24hr Full-Time', subtitle: 'Live-in / Full Day Domestic', icon: '🏡', badge: 'Monthly' },
];

const PUNE_LOCALITIES = [
  'All Pune', 'Kothrud', 'Baner', 'Hinjawadi', 'Viman Nagar', 'Wakad', 'Hadapsar', 'Kalyani Nagar'
];

const TRENDING_TAGS = [
  { label: 'Gol Chapati Cook', query: 'chapati cook' },
  { label: 'Bathroom Acid Scrub', query: 'bathroom' },
  { label: 'Arrives in 15 mins', query: 'available' },
  { label: 'Police Verified Helpers', query: 'verified' },
  { label: 'Indiranagar / Kothrud Flat', query: 'kothrud' }
];

export default function SearchAndFilters() {
  const { 
    filters, 
    setFilters, 
    availableCount, 
    maids, 
    selectedLocality, 
    setSelectedLocality,
    setIsVLMScannerOpen,
    setIsQuoteModalOpen,
    setQuoteTargetMaid
  } = useApp();

  const handleServiceChange = (serviceId) => {
    setFilters(prev => ({ ...prev, service: serviceId }));
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleLocalitySelect = (loc) => {
    setSelectedLocality(loc);
    if (loc === 'All Pune') {
      setFilters(prev => ({ ...prev, search: '' }));
    } else {
      setFilters(prev => ({ ...prev, search: loc }));
    }
  };

  const handleApplyTrendingTag = (tag) => {
    if (tag.query === 'available') {
      setFilters(prev => ({ ...prev, status: 'available', search: '' }));
    } else {
      setFilters(prev => ({ ...prev, search: tag.query }));
    }
  };

  return (
    <div id="maid-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      
      {/* -------------------------------------------------------------
          1. JUSTDIAL-STYLE HERO SEARCH & LOCALITY SELECTOR
      -------------------------------------------------------------- */}
      <div className="glass-panel p-5 sm:p-7 rounded-3xl space-y-5 border border-white/15 shadow-2xl relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          
          {/* Pune Locality Dropdown Pill */}
          <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-700 md:w-56 shrink-0">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Location</span>
              <select
                value={selectedLocality}
                onChange={(e) => handleLocalitySelect(e.target.value)}
                className="bg-transparent text-white font-bold text-xs outline-none w-full cursor-pointer"
              >
                {PUNE_LOCALITIES.map((loc) => (
                  <option key={loc} value={loc} className="bg-slate-900 text-white">
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Justdial Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search maids, cooks, housekeepers (e.g. Chapati Cook, Dishwashing, Kothrud, Baner)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 outline-none transition"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* AI VLM Quick Trigger */}
          <button
            onClick={() => setIsVLMScannerOpen(true)}
            className="px-4 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 hover:opacity-95 transition transform hover:scale-[1.02] shrink-0 active:scale-95"
          >
            <Eye className="w-4 h-4 animate-pulse" />
            <span>AI Photo Scanner (VLM)</span>
          </button>
        </div>

        {/* Locality Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Popular Localities:</span>
          {PUNE_LOCALITIES.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocalitySelect(loc)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedLocality === loc
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md'
                  : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* -------------------------------------------------------------
            2. JUSTDIAL ICONIC SERVICE CATEGORY TILES
        -------------------------------------------------------------- */}
        <div>
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>Explore Verified Home Chores</span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                JD Verified
              </span>
            </span>
            <span className="text-slate-400 text-[11px]">Click to filter catalog</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {JUSTDIAL_CATEGORIES.map((cat) => {
              const isActive = filters.service === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleServiceChange(cat.id)}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-tr from-emerald-950/80 to-teal-900/60 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="text-2xl sm:text-3xl mb-1.5 group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {cat.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                      {cat.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {cat.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* -------------------------------------------------------------
            3. TRENDING SEARCHES & REAL-TIME AVAILABILITY SWITCHES
        -------------------------------------------------------------- */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          
          {/* Trending Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
              <Flame className="w-3.5 h-3.5" />
              <span>Trending:</span>
            </span>
            {TRENDING_TAGS.map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyTrendingTag(t)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Real-time Status Buttons */}
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              onClick={() => handleStatusChange('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                filters.status === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
            >
              All ({maids.length})
            </button>

            <button
              onClick={() => handleStatusChange('available')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                filters.status === 'available'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Available Now ({availableCount})</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
