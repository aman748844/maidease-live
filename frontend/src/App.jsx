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
import AIAgentAssistant from './components/AIAgentAssistant';
import VLMJobScannerModal from './components/VLMJobScannerModal';
import InstantQuoteModal from './components/InstantQuoteModal';
import { Sparkles, AlertCircle, RefreshCw, Bot } from 'lucide-react';

export default function App() {
  const { role, maids, loading, error, toast, setIsAIAssistantOpen } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : toast.type === 'info'
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'
              : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
          }`}>
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Global Navigation */}
      <Navbar />

      {/* Floating AI Agent Trigger Button (Bottom Right) */}
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white shadow-2xl shadow-purple-500/40 border border-purple-400/30 flex items-center gap-2.5 transition transform hover:scale-105 group"
        title="Open MaidEase Sakhi AI Assistant"
      >
        <Bot className="w-6 h-6 animate-pulse text-purple-200" />
        <span className="font-bold text-sm hidden sm:inline">Ask AI Sakhi</span>
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-500" />
        </span>
      </button>

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
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-800 rounded w-3/4" />
                          <div className="h-3 bg-slate-800 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-8 bg-slate-800 rounded-xl" />
                      <div className="h-4 bg-slate-800 rounded w-full" />
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
      <AIAgentAssistant />
      <VLMJobScannerModal />
      <InstantQuoteModal />
      <InstantBookingModal />
      <MaidProfileModal />
      <PriceCalculatorModal />
      <BookingTracker />
      {/* Direct Call has topmost layer priority */}
      <DirectCallModal />

    </div>
  );
}
