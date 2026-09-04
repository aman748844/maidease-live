import React from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SearchAndFilters from './components/SearchAndFilters';
import MaidCard from './components/MaidCard';
import DirectCallModal from './components/DirectCallModal';
import InstantBookingModal from './components/InstantBookingModal';
import MaidProfileModal from './components/MaidProfileModal';
import PriceCalculatorModal from './components/PriceCalculatorModal';
import BookingTracker from './components/BookingTracker';
import PartnerDashboard from './components/PartnerDashboard';
import SafetyBadges from './components/SafetyBadges';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const { role, maids, loading, error, toast } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
          }`}>
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Navigation */}
      <Navbar />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {role === 'customer' ? (
          <div>
            {/* Hero Section with Live Stats */}
            <HeroSection />

            {/* Live Filter & Search Controls */}
            <SearchAndFilters />

            {/* Maid Catalog Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              
              {/* Error Notice if any */}
              {error && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 mb-6">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Grid or Empty/Loading State */}
              {loading && maids.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((sk) => (
                    <div key={sk} className="glass-card rounded-3xl p-6 h-72 animate-pulse space-y-4">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                        </div>
                      </div>
                      <div className="h-8 bg-slate-800 rounded-xl"></div>
                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : maids.length === 0 ? (
                <div className="glass-card rounded-3xl p-12 text-center max-w-lg mx-auto">
                  <Sparkles className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-pulse" />
                  <h3 className="text-lg font-bold text-white">No maids match this filter criteria</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting the service category or increasing the distance radius.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {maids.map((maid) => (
                    <MaidCard key={maid.id} maid={maid} />
                  ))}
                </div>
              )}

            </section>

            {/* Safety & Trust Pillars + FAQ */}
            <SafetyBadges />
          </div>
        ) : (
          /* Maid Partner Dashboard Mode */
          <PartnerDashboard />
        )}
      </main>

      {/* Global Modals */}
      <DirectCallModal />
      <InstantBookingModal />
      <MaidProfileModal />
      <PriceCalculatorModal />
      <BookingTracker />

    </div>
  );
}
