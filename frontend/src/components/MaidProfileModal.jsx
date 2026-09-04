import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, Star, MapPin, PhoneCall, Zap, Clock, 
  Award, CheckCircle2, MessageSquare, X, DollarSign, HeartHandshake, Languages 
} from 'lucide-react';

export default function MaidProfileModal() {
  const { selectedMaidForProfile, setSelectedMaidForProfile, setSelectedMaidForCall, setSelectedMaidForBooking } = useApp();

  const maid = selectedMaidForProfile;
  if (!maid) return null;

  const isAvailable = maid.status === 'available';

  const handleCall = () => {
    const current = maid;
    setSelectedMaidForProfile(null);
    setSelectedMaidForCall(current);
  };

  const handleBook = () => {
    const current = maid;
    setSelectedMaidForProfile(null);
    setSelectedMaidForBooking(current);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={() => setSelectedMaidForProfile(null)}
          className="absolute right-5 top-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-800">
          <div className="relative">
            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-slate-800 shadow-xl"
            />
            {isAvailable ? (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            ) : (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full bg-amber-500 border-2 border-slate-900"></span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black font-heading text-white">{maid.name}</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Police Verified</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-1">{maid.tagline}</p>

            {/* Ratings, Exp & Location */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs">
              <span className="flex items-center gap-1 font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{maid.rating}</span>
                <span className="text-slate-400 font-normal">({maid.reviewCount} reviews)</span>
              </span>

              <span className="text-slate-300 flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                <span>{maid.experienceYears} Years Experience</span>
              </span>

              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{maid.location} ({maid.distanceKm} km away)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="mt-6 space-y-6">
          
          {/* Bio Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">About Helper</h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              {maid.bio}
            </p>
          </div>

          {/* Trust & Background Verification Badges */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Verified Trust Credentials
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Police Clearance</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Aadhaar Verified</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Medical Check</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Reference Check</span>
              </div>
            </div>
          </div>

          {/* Languages & Specialties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-cyan-400" />
                <span>Languages Spoken</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {maid.languages.map((lang, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200">
                    🗣️ {lang}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Specialized Skills & Cuisines</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {maid.specialties.map((sp, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-amber-950/30 text-amber-300 border border-amber-500/30">
                    ⭐ {sp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Transparent Per-Chore Rate Card */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Transparent Rate Card</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Hourly Rate</div>
                <div className="text-lg font-black font-heading text-white mt-0.5">
                  ₹{maid.pricing.hourlyRate} <span className="text-xs font-normal text-slate-400">/ hr</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="text-xs text-emerald-300">1-Time Emergency Visit</div>
                <div className="text-lg font-black font-heading text-emerald-400 mt-0.5">
                  ₹{maid.pricing.oneTimeVisit} <span className="text-xs font-normal text-emerald-300">all inc.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Monthly Package</div>
                <div className="text-lg font-black font-heading text-cyan-300 mt-0.5">
                  ₹{maid.pricing.monthlyEstimate} <span className="text-xs font-normal text-slate-400">/ mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Verified Reviews */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span>Verified Customer Reviews</span>
            </h4>
            <div className="space-y-2.5">
              {maid.recentReviews?.map((rev, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{rev.author}</span>
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{rev.rating}.0</span>
                      <span className="text-slate-500 font-normal ml-1">• {rev.date}</span>
                    </span>
                  </div>
                  <p className="text-slate-300 italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions: Call & Book */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-3">
          <button
            onClick={handleCall}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            <span>Direct Call {maid.name}</span>
          </button>

          <button
            onClick={handleBook}
            className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Book Instant Visit (₹{maid.pricing.oneTimeVisit})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
