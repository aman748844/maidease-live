import React from 'react';
import { useApp } from '../context/AppContext';
import { PhoneCall, ShieldCheck, MapPin, Star, Clock, Zap, CheckCircle2, Award, ChevronRight } from 'lucide-react';

export default function MaidCard({ maid }) {
  const { setSelectedMaidForCall, setSelectedMaidForBooking, setSelectedMaidForProfile } = useApp();

  const isAvailable = maid.status === 'available';
  const isBusy = maid.status === 'busy';
  const isOffline = maid.status === 'offline';

  return (
    <div className="glass-card rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden group">
      
      {/* Background Glow on Hover */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all"></div>

      <div>
        {/* Top Header: Avatar, Status & Verified Badge */}
        <div className="flex items-start gap-4">
          {/* Avatar with Live Indicator */}
          <div className="relative">
            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-white/10 shadow-md group-hover:border-emerald-500/50 transition-all"
            />
            {isAvailable && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            )}
            {isBusy && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full bg-amber-500 border-2 border-slate-900"></span>
            )}
            {isOffline && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full bg-slate-500 border-2 border-slate-900"></span>
            )}
          </div>

          {/* Name & Bio Highlights */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h3 
                onClick={() => setSelectedMaidForProfile(maid)}
                className="text-lg sm:text-xl font-bold font-heading text-white truncate hover:text-emerald-400 cursor-pointer transition-colors"
              >
                {maid.name}
              </h3>
              {maid.verified?.police && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
              {maid.tagline}
            </p>

            {/* Ratings & Experience */}
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{maid.rating}</span>
                <span className="text-slate-400 font-normal">({maid.reviewCount})</span>
              </span>

              <span className="text-slate-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>{maid.experienceYears} yrs exp</span>
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time Live Status Banner */}
        <div className="mt-4">
          {isAvailable && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Available Now for Instant Visit</span>
              </div>
              <span className="text-[11px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md text-emerald-200">
                ~{maid.etaMins || 20} min arrival
              </span>
            </div>
          )}

          {isBusy && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Busy on a job</span>
              </div>
              <span className="text-[11px] font-bold bg-amber-500/20 px-2 py-0.5 rounded-md text-amber-200">
                Free at {maid.busyUntil || '3:30 PM'}
              </span>
            </div>
          )}

          {isOffline && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
              <span>Offline currently</span>
              <span className="text-[11px]">Available tomorrow</span>
            </div>
          )}
        </div>

        {/* Location & Distance */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{maid.location}</span>
          </div>
          <span className="font-semibold text-slate-300 shrink-0 ml-2">
            {maid.distanceKm} km away
          </span>
        </div>

        {/* Services & Specialty Chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {maid.services.map((srv, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/80"
            >
              {srv}
            </span>
          ))}
          {maid.specialties.slice(0, 1).map((sp, idx) => (
            <span
              key={`sp-${idx}`}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-950/40 text-cyan-300 border border-cyan-500/30"
            >
              ⭐ {sp}
            </span>
          ))}
        </div>
      </div>

      {/* Pricing & Call / Book Actions Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Starting Rate</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold font-heading text-white">₹{maid.pricing.hourlyRate}</span>
              <span className="text-xs text-slate-400">/ hour</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">1-Time Visit</div>
            <div className="text-sm font-bold text-emerald-400">
              ₹{maid.pricing.oneTimeVisit} <span className="text-[10px] text-slate-400">all inclusive</span>
            </div>
          </div>
        </div>

        {/* Buttons: Direct Call & Instant Book */}
        <div className="grid grid-cols-2 gap-2">
          {/* Direct Call Button */}
          <button
            onClick={() => setSelectedMaidForCall(maid)}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 shadow-md transition-all group-hover:border-emerald-500/50"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>Direct Call</span>
          </button>

          {/* Instant Book Button */}
          <button
            onClick={() => setSelectedMaidForBooking(maid)}
            disabled={isOffline}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-bold text-xs transition-all shadow-md ${
              isAvailable
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-90 shadow-emerald-500/20'
                : isBusy
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isAvailable ? 'Instant Book' : isBusy ? 'Pre-Book' : 'Offline'}</span>
          </button>
        </div>

        {/* View Profile Link */}
        <button
          onClick={() => setSelectedMaidForProfile(maid)}
          className="w-full mt-2.5 py-1 text-center text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 transition-colors"
        >
          <span>View Verified Bio, Rate Card & Reviews</span>
          <ChevronRight className="w-3 h-3" />
        </button>

      </div>
    </div>
  );
}
