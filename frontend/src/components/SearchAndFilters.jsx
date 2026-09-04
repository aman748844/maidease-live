import React from 'react';
import { useApp } from '../context/AppContext';
import { Search, SlidersHorizontal, Sparkles, MapPin, X } from 'lucide-react';

const SERVICE_CATEGORIES = [
  { id: 'all', label: 'All Services', icon: '✨' },
  { id: 'cooking', label: 'Cooking & Meals', icon: '🍳' },
  { id: 'cleaning', label: 'Deep House Cleaning', icon: '🧹' },
  { id: 'dishwashing', label: 'Dishwashing (Bartan)', icon: '🍽️' },
  { id: 'babysitting', label: 'Babysitting & Nanny', icon: '👶' },
  { id: 'elderlyCare', label: 'Elderly Care', icon: '👵' },
  { id: 'laundry', label: 'Laundry & Ironing', icon: '🧺' },
];

export default function SearchAndFilters() {
  const { filters, setFilters, availableCount, maids } = useApp();

  const handleServiceChange = (serviceId) => {
    setFilters(prev => ({ ...prev, service: serviceId }));
  };

  const handleStatusChange = (status) => {
    setFilters(prev => ({ ...prev, status }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleDistanceChange = (e) => {
    setFilters(prev => ({ ...prev, maxDistance: Number(e.target.value) }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      service: 'all',
      status: 'all',
      maxDistance: 5,
      maxPrice: 300
    });
  };

  return (
    <div id="maid-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-5">
        
        {/* Top Search & Live Status Bar */}
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by maid name, cuisine, chore (e.g. Cook, Cleaning, Nanny, Indiranagar)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl glass-input text-sm placeholder:text-slate-500 focus:border-emerald-400 transition-all"
            />
            {filters.search && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Real-time Status Filter Pills */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => handleStatusChange('all')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filters.status === 'all'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Maids ({maids.length})
            </button>

            <button
              onClick={() => handleStatusChange('available')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filters.status === 'available'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20'
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-500/30'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>Available Now ({availableCount})</span>
            </button>

            <button
              onClick={() => handleStatusChange('busy')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filters.status === 'busy'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/40 border border-amber-500/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Busy</span>
            </button>

            <button
              onClick={() => handleStatusChange('offline')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                filters.status === 'offline'
                  ? 'bg-slate-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-500 hover:text-slate-300 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              <span>Offline</span>
            </button>
          </div>
        </div>

        {/* Service Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {SERVICE_CATEGORIES.map(cat => {
            const isSelected = filters.service.toLowerCase() === cat.id.toLowerCase();
            return (
              <button
                key={cat.id}
                onClick={() => handleServiceChange(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transform scale-[1.02]'
                    : 'bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 border border-slate-700/80 hover:border-emerald-500/40'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters Bar: Distance & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Max Distance: <strong className="text-white font-semibold">{filters.maxDistance} km</strong></span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={filters.maxDistance}
                onChange={handleDistanceChange}
                className="w-24 sm:w-32 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Max Rate: <strong className="text-white font-semibold">₹{filters.maxPrice}/hr</strong></span>
              <input
                type="range"
                min="100"
                max="400"
                step="20"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                className="w-24 sm:w-32 accent-cyan-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-slate-400 hover:text-emerald-400 font-semibold underline underline-offset-4 transition-colors"
          >
            Reset All Filters
          </button>
        </div>

      </div>
    </div>
  );
}
