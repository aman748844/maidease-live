import React from 'react';
import { useApp } from '../context/AppContext';
import { PhoneCall, ShieldCheck, Zap, Sparkles, Clock, CheckCircle2, ArrowRight, Calculator } from 'lucide-react';

export default function HeroSection() {
  const { availableCount, setIsPriceCalculatorOpen, setSelectedMaidForCall, maids } = useApp();

  const handleTestCall = () => {
    const availableMaid = maids.find(m => m.status === 'available') || maids[0];
    if (availableMaid) {
      setSelectedMaidForCall(availableMaid);
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="glow-orb-emerald -top-20 -left-20"></div>
      <div className="glow-orb-cyan top-40 -right-20"></div>

      <div className="max-w-6xl mx-auto relative z-10 text-center">
        
        {/* Urgent Live Dispatch Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-6 shadow-lg shadow-emerald-950/50 animate-float">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>⚡ Live On-Demand Network: <strong>{availableCount} Verified Maids Active Right Now</strong></span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Ghar Par Kaam Ke Liye Maid Chahiye?{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
            Book in 15 Mins
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          No more searching blindly or relying on brokers. Check <strong>real-time live availability</strong>, 
          transparent per-chore pricing, and <strong>call the maid directly in real time</strong> to confirm details before booking!
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <a
            href="#maid-catalog"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 hover:opacity-95 shadow-xl shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <span>Book Available Maid</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <button
            onClick={handleTestCall}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-slate-800/90 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Test Direct Live Call</span>
          </button>

          <button
            onClick={() => setIsPriceCalculatorOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-md transition-all"
          >
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Calculate Chore Cost</span>
          </button>
        </div>

        {/* Trust Stats Counter Grid */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          <div className="glass-card p-4 rounded-2xl text-left flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white">15-20 Mins</div>
              <div className="text-xs text-slate-400 font-medium">Fast-Track Doorstep Arrival</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-left flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white">Direct Call</div>
              <div className="text-xs text-slate-400 font-medium">Talk to Maid Before Booking</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-left flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white">100% Verified</div>
              <div className="text-xs text-slate-400 font-medium">Police & Aadhaar Background</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl text-left flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-heading text-white">₹140 / hr</div>
              <div className="text-xs text-slate-400 font-medium">Transparent Per-Chore Rates</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
