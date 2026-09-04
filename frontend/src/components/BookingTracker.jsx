import React from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Clock, MapPin, PhoneCall, ShieldCheck, CheckCircle2, AlertTriangle, 
  X, Navigation, UserCheck, Sparkles, MessageSquare 
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'requested', label: 'Requested', desc: 'Booking received by system' },
  { key: 'accepted', label: 'Accepted', desc: 'Maid confirmed visit' },
  { key: 'en_route', label: 'En Route', desc: 'Heading to your doorstep' },
  { key: 'in_progress', label: 'In Progress', desc: 'Working at your home' },
  { key: 'completed', label: 'Completed', desc: 'Task verified & completed' }
];

export default function BookingTracker() {
  const { isBookingTrackerOpen, setIsBookingTrackerOpen, bookings, loadBookings, showToast, setSelectedMaidForCall, maids } = useApp();

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
    const targetMaid = maids.find(m => m.id === maidId) || {
      id: maidId,
      name: "Assigned Helper",
      phone: "+91 98765 43210",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300"
    };
    setSelectedMaidForCall(targetMaid);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
                Live Doorstep Booking Tracker
              </h2>
              <p className="text-xs text-slate-400">
                Real-time dispatch status, ETA updates & emergency safety hotline
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBookingTrackerOpen(false)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bookings List */}
        <div className="mt-6 space-y-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm">No active bookings currently.</p>
              <p className="text-xs text-slate-500 mt-1">Book an available maid from the catalog to track live arrival.</p>
            </div>
          ) : (
            bookings.map((b) => {
              const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === b.status);

              return (
                <div
                  key={b.id}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl"
                >
                  {/* Top Details & ID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {b.id}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {b.serviceType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{b.address}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Payable</div>
                      <div className="text-lg font-black font-heading text-emerald-400">
                        ₹{b.totalAmount} <span className="text-[11px] text-slate-400 font-normal">({b.paymentMethod})</span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Maid Contact Strip */}
                  <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">Assigned Domestic Helper</div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{b.maidName}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCallMaid(b.maidId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
                      >
                        <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                        <span>Call Maid</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Progress Stepper */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                      <span>Dispatch Status Progress</span>
                      {b.status === 'en_route' && (
                        <span className="text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5" />
                          <span>ETA: ~12 Mins Remaining</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {STATUS_STEPS.map((step, idx) => {
                        const isPast = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                          <div key={step.key} className="flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                                isCurrent
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-4 ring-emerald-500/20'
                                  : isPast
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <span className={`text-[11px] font-bold mt-1.5 ${isCurrent ? 'text-emerald-300' : isPast ? 'text-slate-200' : 'text-slate-500'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Simulation Progress Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">Advance live dispatch state:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'en_route')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                      >
                        Set En Route
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'in_progress')}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                      >
                        Set In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold hover:bg-emerald-900"
                      >
                        Mark Completed
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
  );
}
