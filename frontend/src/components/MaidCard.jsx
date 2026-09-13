import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  PhoneCall, ShieldCheck, MapPin, Star, Clock, Zap, 
  CheckCircle2, Award, ChevronRight, MessageCircle, BadgeCheck, 
  Sparkles, ThumbsUp, HeartHandshake, Eye
} from 'lucide-react';

export default function MaidCard({ maid }) {
  const { 
    setSelectedMaidForCall, 
    setSelectedMaidForBooking, 
    setSelectedMaidForProfile,
    setIsQuoteModalOpen,
    setQuoteTargetMaid,
    showToast 
  } = useApp();

  const isAvailable = maid.status === 'available';
  const isBusy = maid.status === 'busy';
  const isOffline = maid.status === 'offline';

  const handleCall = (e) => {
    e.stopPropagation();
    showToast(`Connecting live real-time call with ${maid.name}...`, 'info');
    setSelectedMaidForCall(maid);
  };

  const handleBook = (e) => {
    e.stopPropagation();
    setSelectedMaidForBooking(maid);
  };

  const handleGetBestDeal = (e) => {
    e.stopPropagation();
    setQuoteTargetMaid(maid);
    setIsQuoteModalOpen(true);
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const phoneClean = maid.whatsapp || maid.phone?.replace(/[^0-9]/g, '') || '919823411201';
    const msg = `Namaste ${maid.name} ji! Maine aapki MaidEase profile dekhi. Mujhe Pune me domestic help ke liye inquiry karni hai.`;
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div 
      onClick={() => setSelectedMaidForProfile(maid)}
      className="glass-card rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group cursor-pointer border border-white/10 hover:border-emerald-500/40 shadow-xl transition-all duration-300"
    >
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-emerald-500/10 via-cyan-500/5 to-transparent rounded-full blur-2xl group-hover:from-emerald-500/20 transition-all pointer-events-none" />

      <div>
        {/* Top Header: Avatar, Name & Justdial Trust Badges */}
        <div className="flex items-start gap-3.5">
          
          {/* Avatar with Live Status Ring */}
          <div className="relative shrink-0">
            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-lg group-hover:border-emerald-400 transition-all"
            />
            {isAvailable && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
              </span>
            )}
            {isBusy && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full bg-amber-500 border-2 border-slate-900" />
            )}
          </div>

          {/* Listing Details */}
          <div className="flex-1 min-w-0 space-y-1">
            
            {/* Name + JD Verified Tag */}
            <div className="flex items-center justify-between gap-1">
              <h3 className="text-base sm:text-lg font-black font-heading text-white truncate hover:text-emerald-400 transition-colors">
                {maid.name}
              </h3>

              {/* Justdial Verified Stamp */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-extrabold uppercase shrink-0">
                <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>JD Verified</span>
              </span>
            </div>

            {/* Tagline */}
            <p className="text-xs text-slate-300 line-clamp-1">
              {maid.tagline}
            </p>

            {/* Rating Bar & Experience */}
            <div className="flex items-center gap-2 pt-0.5 text-xs flex-wrap">
              <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{maid.rating}</span>
                <span className="text-slate-400 font-normal">({maid.reviewCount})</span>
              </span>

              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Award className="w-3 h-3 text-cyan-400" />
                <span>{maid.experienceYears} yrs exp</span>
              </span>

              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold">
                ⚡ Responds in 3m
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Status Alert Bar */}
        <div className="mt-3.5">
          {isAvailable && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Available Now for Instant Arrival</span>
              </div>
              <span className="text-[11px] font-bold bg-emerald-500/20 px-2 py-0.2 rounded text-emerald-200">
                ~{maid.etaMins || 18}m ETA
              </span>
            </div>
          )}

          {isBusy && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Busy on a Pune Flat Visit</span>
              </div>
              <span className="text-[11px] font-bold bg-amber-500/20 px-2 py-0.2 rounded text-amber-200">
                Free at {maid.busyUntil || '3:30 PM'}
              </span>
            </div>
          )}
        </div>

        {/* Location & Specialties Pills */}
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{maid.location}</span>
            </div>
            <span className="font-semibold text-slate-300 shrink-0 ml-2">
              {maid.distanceKm} km away
            </span>
          </div>

          {/* Specialties Tags */}
          <div className="flex flex-wrap gap-1">
            {maid.specialties?.slice(0, 3).map((sp, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] font-medium border border-slate-700/60"
              >
                {sp}
              </span>
            ))}
            {maid.languages && (
              <span className="px-1.5 py-0.5 rounded-md bg-purple-950/40 text-purple-300 text-[10px] font-semibold border border-purple-500/30">
                🗣️ {maid.languages.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Transparent Pricing Display */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">One-Time Visit</div>
            <div className="text-xl font-black font-heading text-emerald-400">
              ₹{maid.pricing?.oneTimeVisit}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Hourly Rate</div>
            <div className="text-sm font-bold text-slate-200">
              ₹{maid.pricing?.hourlyRate}/hr
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          HIGH-CONVERSION JUSTDIAL ACTION BUTTONS
      -------------------------------------------------------------- */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Call Button (Live Real-Time AI / VoIP Call) */}
          <button
            onClick={handleCall}
            className="py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition active:scale-95"
            title="Call Helper Directly"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call Now</span>
          </button>

          {/* WhatsApp Direct */}
          <button
            onClick={handleWhatsApp}
            className="py-2.5 px-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
            title="Direct WhatsApp Chat"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Get Best Quote (Justdial Instant Quote Modal) */}
          <button
            onClick={handleGetBestDeal}
            className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Best Quote</span>
          </button>

          {/* Book Visit */}
          <button
            onClick={handleBook}
            className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-[11px] shadow transition flex items-center justify-center gap-1 hover:opacity-95"
          >
            <span>Book Visit</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

    </div>
  );
}
