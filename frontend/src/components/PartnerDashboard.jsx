import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { realtime } from '../services/realtime';
import { webrtc } from '../services/webrtc';
import { 
  UserCheck, ShieldCheck, Zap, PhoneCall, Clock, DollarSign, 
  CheckCircle2, XCircle, Settings, Award, TrendingUp, Bell, MapPin, 
  PhoneIncoming, KeyRound, Mic, MicOff, PhoneOff, Check 
} from 'lucide-react';

export default function PartnerDashboard() {
  const { 
    maids, 
    activePartnerMaidId, 
    setActivePartnerMaidId, 
    toggleMaidStatus, 
    bookings, 
    loadBookings, 
    loadMaids,
    showToast 
  } = useApp();

  const currentMaid = maids.find(m => m.id === activePartnerMaidId) || maids[0];

  const [hourlyRate, setHourlyRate] = useState(currentMaid?.pricing?.hourlyRate || 160);
  const [oneTimeVisit, setOneTimeVisit] = useState(currentMaid?.pricing?.oneTimeVisit || 329);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  
  // Incoming Call State
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // OTP Verification state
  const [otpInputs, setOtpInputs] = useState({});

  // Incoming bookings for this maid
  const maidBookings = bookings.filter(b => b.maidId === currentMaid?.id);

  // Listen for real-time incoming WebRTC calls over SSE
  useEffect(() => {
    const unsubCall = realtime.on('incoming_call_ring', (session) => {
      if (!currentMaid || session.maidId === currentMaid.id) {
        setIncomingCall(session);
        realtime.playChime('ring');
      }
    });

    const unsubCallEnd = realtime.on('call_ended', () => {
      setIncomingCall(null);
      setIsCallActive(false);
    });

    return () => {
      unsubCall();
      unsubCallEnd();
    };
  }, [currentMaid]);

  const handleStatusChange = (status) => {
    if (!currentMaid) return;
    const busyUntil = status === 'busy' ? '4:00 PM' : null;
    toggleMaidStatus(currentMaid.id, status, busyUntil, 18);
  };

  const handleSaveRates = async (e) => {
    e.preventDefault();
    if (!currentMaid) return;
    setIsUpdatingRates(true);
    try {
      const res = await api.updateMaidPricing(currentMaid.id, {
        hourlyRate,
        oneTimeVisit
      });
      if (res.success) {
        showToast('Pricing rates updated! Customers now see your new rates in Pune.', 'success');
        loadMaids();
      }
    } catch (err) {
      showToast('Failed to update pricing', 'error');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleBookingAction = async (bookingId, newStatus) => {
    try {
      const res = await api.updateBookingStatus(bookingId, { status: newStatus });
      if (res.success) {
        showToast(`Booking marked as ${newStatus.toUpperCase()}`, 'success');
        loadBookings();
      }
    } catch (err) {
      showToast('Failed to update booking status', 'error');
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (bookingId) => {
    const code = otpInputs[bookingId] || '';
    if (!code.trim()) {
      showToast('Please enter the 4-digit OTP provided by customer', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code })
      });
      const data = await res.json();
      if (data.success) {
        showToast('🎉 OTP Verified! Service timer started.', 'success');
        loadBookings();
      } else {
        showToast(data.message || 'Invalid OTP', 'error');
      }
    } catch (e) {
      showToast('Error verifying OTP', 'error');
    }
  };

  // Answer WebRTC Call
  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    try {
      await webrtc.answerIncomingCall(incomingCall.callId);
      setIsCallActive(true);
      showToast('Call connected! Live two-way audio active.', 'success');
    } catch (e) {
      showToast('Could not access microphone for call', 'error');
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      webrtc.endCall(incomingCall.callId);
    }
    setIncomingCall(null);
    setIsCallActive(false);
  };

  if (!currentMaid) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn text-slate-100">
      
      {/* Incoming Call Popup Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-bounce">
          <div className="relative w-full max-w-sm glass-panel rounded-3xl p-6 border-2 border-cyan-400/60 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 animate-pulse">
              <PhoneIncoming className="w-8 h-8" />
            </div>

            <div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                Incoming VoIP Audio Call
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{incomingCall.customerName}</h3>
              <p className="text-xs text-slate-400">Customer is calling for domestic service inquiry</p>
            </div>

            {!isCallActive ? (
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAnswerCall}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Accept Call</span>
                </button>
                <button
                  onClick={handleRejectCall}
                  className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl transition"
                  title="Decline"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Two-Way WebRTC Audio Active</span>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      webrtc.toggleMute(!isMuted);
                      setIsMuted(!isMuted);
                    }}
                    className={`p-3 rounded-xl border ${isMuted ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800 border-slate-700'}`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={handleRejectCall}
                    className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
                  >
                    End Call
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Banner with Helper Selector */}
      <div className="glass-panel p-6 rounded-3xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-cyan-500/20 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentMaid.avatar}
              alt={currentMaid.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400 shadow-lg"
            />
            <span className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900 ${
              currentMaid.status === 'available' ? 'bg-emerald-500 animate-ping' : currentMaid.status === 'busy' ? 'bg-amber-500' : 'bg-slate-500'
            }`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                Pune Maid Partner Portal
              </span>
              <span className="text-xs text-slate-400">• Verified Helper #MED-{currentMaid.id}</span>
            </div>
            <h1 className="text-2xl font-black font-heading text-white mt-1">
              Namaste, {currentMaid.name}!
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Base Pune Area: {currentMaid.location}</span>
            </p>
          </div>
        </div>

        {/* Switch Partner Profile */}
        <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold pl-2">Switch Pune Maid:</span>
          <select
            value={currentMaid.id}
            onChange={(e) => setActivePartnerMaidId(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:border-cyan-400 outline-none cursor-pointer"
          >
            {maids.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.location.split('(')[0].trim()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Live Availability Controls & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Availability Switcher */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Live Availability Status</span>
            </h3>
            <span className="text-xs text-slate-400">Pune Real-Time</span>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => handleStatusChange('available')}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                currentMaid.status === 'available'
                  ? 'bg-emerald-950/60 border-emerald-400 text-white ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-white">🟢 Online & Available Now</div>
                  <div className="text-[11px] text-slate-400">Ready to visit homes in 15-20 mins</div>
                </div>
              </div>
              {currentMaid.status === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => handleStatusChange('busy')}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                currentMaid.status === 'busy'
                  ? 'bg-amber-950/60 border-amber-400 text-white ring-2 ring-amber-500/20 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">🟡 Busy on a Job</div>
                  <div className="text-[11px] text-slate-400">Customers can only pre-book for later</div>
                </div>
              </div>
              {currentMaid.status === 'busy' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Rate Card Customizer */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span>Customize Visit Pricing</span>
          </h3>

          <form onSubmit={handleSaveRates} className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold">1-Time Visit Price (₹):</label>
              <input
                type="number"
                value={oneTimeVisit}
                onChange={(e) => setOneTimeVisit(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold">Hourly Rate (₹):</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full mt-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingRates}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition"
            >
              Save New Pricing
            </button>
          </form>
        </div>

        {/* Real-time Earnings & Ratings */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span>Today's Performance</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Total Rating</span>
              <div className="text-xl font-bold text-amber-400 mt-0.5">★ {currentMaid.rating}</div>
              <span className="text-[10px] text-slate-500">{currentMaid.reviewCount} Reviews</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Today's Jobs</span>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{maidBookings.length}</div>
              <span className="text-[10px] text-slate-500">Completed & Active</span>
            </div>
          </div>
        </div>

      </div>

      {/* Real-time Customer Bookings & OTP Verification Section */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span>Live Customer Bookings for {currentMaid.name}</span>
            </h3>
            <p className="text-xs text-slate-400">Incoming bookings appear here in real-time without page refresh</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
            {maidBookings.length} Active Orders
          </span>
        </div>

        <div className="space-y-3">
          {maidBookings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No active customer booking for {currentMaid.name} right now.  
              Switch to Customer View and book her to test real-time dispatch!
            </div>
          ) : (
            maidBookings.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                        {b.id}
                      </span>
                      <span className="text-sm font-bold text-white">{b.serviceType}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Customer: {b.customerName} ({b.customerPhone})</span>
                      <span>•</span>
                      <span>📍 {b.address}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Payable: </span>
                    <span className="text-base font-bold text-emerald-400">₹{b.totalAmount}</span>
                  </div>
                </div>

                {/* Doorstep OTP Verification Input */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 font-semibold">Enter Doorstep OTP:</span>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="4-digit OTP"
                      value={otpInputs[b.id] || ''}
                      onChange={(e) => setOtpInputs({ ...otpInputs, [b.id]: e.target.value })}
                      className="w-28 px-3 py-1.5 bg-slate-950 border border-emerald-500/40 rounded-xl text-center text-white font-mono font-bold tracking-widest outline-none"
                    />
                    <button
                      onClick={() => handleVerifyOtp(b.id)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition"
                    >
                      Verify & Start Job
                    </button>
                  </div>

                  {/* Advance dispatch actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBookingAction(b.id, 'en_route')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    >
                      Start Ride (En Route)
                    </button>
                    <button
                      onClick={() => handleBookingAction(b.id, 'completed')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold"
                    >
                      Mark Job Complete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
