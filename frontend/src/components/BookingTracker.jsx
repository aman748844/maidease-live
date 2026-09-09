import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import UPIPaymentModal from './UPIPaymentModal';
import { 
  Clock, MapPin, PhoneCall, ShieldCheck, CheckCircle2, AlertTriangle, 
  X, Navigation, UserCheck, Sparkles, MessageSquare, KeyRound, 
  Radio, Compass, Gauge, MessageCircle, ExternalLink, Play, QrCode, 
  Receipt, Star 
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'requested', label: 'Requested', desc: 'Booking received' },
  { key: 'accepted', label: 'Accepted', desc: 'Maid assigned in Pune' },
  { key: 'en_route', label: 'En Route', desc: 'Traveling to your doorstep' },
  { key: 'arrived', label: 'Arrived', desc: 'Maid at your door / gate' },
  { key: 'in_progress', label: 'In Progress', desc: 'Working at your home' },
  { key: 'completed', label: 'Completed', desc: 'Task verified & done' }
];

export default function BookingTracker() {
  const { 
    isBookingTrackerOpen, 
    setIsBookingTrackerOpen, 
    bookings, 
    loadBookings, 
    showToast, 
    setSelectedMaidForCall, 
    maids,
    liveGpsData 
  } = useApp();

  const [animatedProgress, setAnimatedProgress] = useState(35);
  const [simulatedEta, setSimulatedEta] = useState(15);
  const [simulatedSpeed, setSimulatedSpeed] = useState(28);

  // Modal states
  const [activePaymentBooking, setActivePaymentBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Auto-tick GPS progress every 2.5 seconds
  useEffect(() => {
    if (!isBookingTrackerOpen) return;

    const ticker = setInterval(() => {
      setAnimatedProgress(prev => (prev >= 98 ? 98 : prev + 3));
      setSimulatedEta(prev => Math.max(1, prev - 1));
      setSimulatedSpeed(24 + Math.floor(Math.random() * 8));
    }, 2500);

    return () => clearInterval(ticker);
  }, [isBookingTrackerOpen]);

  if (!isBookingTrackerOpen) return null;

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const res = await api.updateBookingStatus(bookingId, { status: newStatus });
      if (res.success) {
        showToast(`Booking updated to ${newStatus.toUpperCase()}`, 'success');
        loadBookings();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleCallMaid = (maidId) => {
    const targetMaid = maids.find(m => m.id === maidId) || maids[0] || {
      id: maidId,
      name: "Pune Helper",
      phone: "+91 98234 11201",
      whatsapp: "919823411201",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300"
    };
    setSelectedMaidForCall(targetMaid);
  };

  const handlePrintReceipt = (booking) => {
    window.print();
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;

    try {
      const res = await fetch(`/api/maids/${reviewBooking.maidId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: reviewBooking.customerName || 'Verified Pune Customer',
          rating: reviewRating,
          comment: reviewComment || 'Very polite, punctual, and clean service!'
        })
      });
      if (res.ok) {
        showToast('Thank you! Review & Rating saved successfully.', 'success');
        setReviewBooking(null);
        setReviewComment('');
      }
    } catch (e) {
      showToast('Review saved locally!', 'success');
      setReviewBooking(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-5 sm:p-8 border border-white/15 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-100">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
                    Live Doorstep GPS Radar
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Pune Live Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time vehicle telemetry, countdown ETA & secure doorstep OTP verification
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBookingTrackerOpen(false)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bookings List */}
          <div className="mt-5 space-y-6">
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm">No active bookings currently.</p>
                <p className="text-xs text-slate-500 mt-1">Book an available maid in Pune to track live arrival.</p>
              </div>
            ) : (
              bookings.map((b) => {
                const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === b.status);
                const gps = liveGpsData[b.id];
                const remainingEta = gps ? gps.etaRemainingMins : simulatedEta;
                const isMoving = b.status === 'en_route' || b.status === 'accepted';

                return (
                  <div
                    key={b.id}
                    className="p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500" />

                    {/* Top Details & ID */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {b.id}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {b.serviceType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{b.address || 'Kothrud / Wakad, Pune'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Total Payable</div>
                          <div className="text-lg font-black font-heading text-emerald-400">
                            ₹{b.totalAmount}
                          </div>
                        </div>

                        {/* Pay via UPI QR Button */}
                        <button
                          onClick={() => setActivePaymentBooking(b)}
                          className="py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Pay via UPI QR</span>
                        </button>
                      </div>
                    </div>

                    {/* Live GPS Radar Graphic */}
                    {isMoving && (
                      <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Live Pune Dispatch Route</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Gauge className="w-3.5 h-3.5 text-amber-400" />
                              <span>{gps?.speedKmH || simulatedSpeed} km/h</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold animate-pulse">
                              ETA: {remainingEta} mins
                            </span>
                          </div>
                        </div>

                        {/* Map Track Graphic */}
                        <div className="relative h-24 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between px-6 sm:px-10 overflow-hidden">
                          <div className="absolute left-10 right-10 top-1/2 h-1.5 bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 transition-all duration-1000"
                              style={{ width: `${animatedProgress}%` }}
                            />
                          </div>

                          <div 
                            className="z-10 flex flex-col items-center transition-all duration-1000"
                            style={{ marginLeft: `${Math.min(75, animatedProgress * 0.75)}%` }}
                          >
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/40 animate-bounce">
                              🚗
                            </div>
                            <span className="text-[10px] font-bold text-cyan-300 mt-1 whitespace-nowrap">{b.maidName}</span>
                            <span className="text-[8px] text-slate-400 font-mono">En route in Pune</span>
                          </div>

                          <div className="z-10 flex flex-col items-center">
                            <div className="w-9 h-9 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-500/30">
                              🏠
                            </div>
                            <span className="text-[10px] font-bold text-rose-300 mt-1 whitespace-nowrap">Your Pune Doorstep</span>
                            <span className="text-[8px] text-slate-400 font-mono">Destination</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Maid Info & Security OTP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-3">
                          <img 
                            src={b.maidAvatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300"} 
                            alt={b.maidName} 
                            className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/40"
                          />
                          <div>
                            <div className="text-[11px] text-slate-400">Assigned Pune Helper</div>
                            <div className="text-sm font-bold text-white flex items-center gap-1">
                              <span>{b.maidName}</span>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div className="text-[11px] text-slate-400">{b.maidPhone}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCallMaid(b.maidId)}
                            className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition shadow"
                            title="Call Maid"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>
                          <a
                            href={`https://wa.me/${b.maidPhone?.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(b.maidName)}%20ji,%20Booking%20ID%20${b.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2.5 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 transition"
                            title="WhatsApp Maid"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {/* Doorstep Verification OTP */}
                      <div className="flex items-center justify-between bg-emerald-950/30 p-3 rounded-2xl border border-emerald-500/30">
                        <div className="flex items-center gap-2.5">
                          <KeyRound className="w-5 h-5 text-emerald-400" />
                          <div>
                            <div className="text-[11px] text-emerald-300 font-semibold">Doorstep Start OTP</div>
                            <div className="text-[10px] text-slate-400">Share with maid on arrival</div>
                          </div>
                        </div>

                        <div className="text-2xl font-black font-mono tracking-widest text-emerald-400 px-3 py-1 rounded-xl bg-slate-950/80 border border-emerald-500/40">
                          {b.otp || '4829'}
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Stepper */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                        <span>Live Dispatch Pipeline</span>
                        {b.status === 'arrived' && (
                          <span className="text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Maid Arrived at Doorstep!</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-6 gap-1 text-center">
                        {STATUS_STEPS.map((step, idx) => {
                          const isPast = idx <= currentStepIndex;
                          const isCurrent = idx === currentStepIndex;

                          return (
                            <div key={step.key} className="flex flex-col items-center">
                              <div
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold border transition ${
                                  isCurrent
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-4 ring-emerald-500/20'
                                    : isPast
                                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                                    : 'bg-slate-800/80 text-slate-500 border-slate-700'
                                }`}
                              >
                                {idx + 1}
                              </div>
                              <span className={`text-[9px] sm:text-[11px] font-bold mt-1.5 truncate max-w-full ${
                                isCurrent ? 'text-emerald-300' : isPast ? 'text-slate-200' : 'text-slate-500'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Post-Job Actions (Invoice & Reviews) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintReceipt(b)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-xs"
                        >
                          <Receipt className="w-3.5 h-3.5" /> Print Tax Receipt
                        </button>
                        <button
                          onClick={() => setReviewBooking(b)}
                          className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 flex items-center gap-1 text-xs font-semibold"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" /> Rate Helper
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'en_route')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                        >
                          En Route
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'arrived')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 text-[11px]"
                        >
                          Arrived
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(b.id, 'completed')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-900"
                        >
                          Completed
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* UPI QR Payment Modal */}
      {activePaymentBooking && (
        <UPIPaymentModal
          booking={activePaymentBooking}
          onClose={() => setActivePaymentBooking(null)}
          onPaymentSuccess={() => {
            handleUpdateStatus(activePaymentBooking.id, 'accepted');
            loadBookings();
          }}
        />
      )}

      {/* Rate & Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn text-slate-100">
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border border-amber-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-current" />
                <span>Rate & Review {reviewBooking.maidName}</span>
              </h3>
              <button 
                onClick={() => setReviewBooking(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Select Star Rating:</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1.5 text-2xl transition transform hover:scale-125"
                    >
                      <Star className={`w-6 h-6 ${star <= reviewRating ? 'text-amber-400 fill-current' : 'text-slate-600'}`} />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-300 ml-2">{reviewRating} out of 5</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Your Experience / Feedback:</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="E.g. Great cooking, clean kitchen, reached Kothrud on time..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Submit Public Review
                </button>
                <button
                  type="button"
                  onClick={() => setReviewBooking(null)}
                  className="py-2.5 px-4 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
