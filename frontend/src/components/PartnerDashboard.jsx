import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  UserCheck, ShieldCheck, Zap, PhoneCall, Clock, DollarSign, 
  CheckCircle2, XCircle, Settings, Award, TrendingUp, Bell, MapPin 
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

  const [hourlyRate, setHourlyRate] = useState(currentMaid?.pricing?.hourlyRate || 180);
  const [oneTimeVisit, setOneTimeVisit] = useState(currentMaid?.pricing?.oneTimeVisit || 349);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  // Incoming bookings for this maid
  const maidBookings = bookings.filter(b => b.maidId === currentMaid?.id);

  const handleStatusChange = (status) => {
    if (!currentMaid) return;
    const busyUntil = status === 'busy' ? '4:00 PM' : null;
    toggleMaidStatus(currentMaid.id, status, busyUntil, 20);
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
        showToast('Pricing rates updated successfully! Customers now see your new rates.', 'success');
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

  if (!currentMaid) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      
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
            }`}></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
                Maid Partner Portal
              </span>
              <span className="text-xs text-slate-400">• Verified ID #MED-{currentMaid.id}</span>
            </div>
            <h1 className="text-2xl font-black font-heading text-white mt-1">
              Namaste, {currentMaid.name}!
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Base Area: {currentMaid.location}</span>
            </p>
          </div>
        </div>

        {/* Switch Partner Profile */}
        <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold pl-2">Switch Helper:</span>
          <select
            value={currentMaid.id}
            onChange={(e) => setActivePartnerMaidId(e.target.value)}
            className="bg-slate-800 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 border border-slate-700 focus:border-cyan-400 outline-none cursor-pointer"
          >
            {maids.map(m => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.services[0]} - {m.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Live Availability Controls & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Live Real-Time Availability Switcher */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Live Availability Status</span>
            </h3>
            <span className="text-xs text-slate-400">Controls Customer Visibility</span>
          </div>

          <p className="text-xs text-slate-300">
            Set your current status so nearby customers know when to call and book you instantly:
          </p>

          <div className="space-y-2.5">
            {/* Online / Available */}
            <button
              onClick={() => handleStatusChange('available')}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                currentMaid.status === 'available'
                  ? 'bg-emerald-950/60 border-emerald-400 text-white ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <div className="text-xs font-bold text-white">🟢 Online & Available Now</div>
                  <div className="text-[11px] text-slate-400">Ready to visit homes in 15-20 mins</div>
                </div>
              </div>
              {currentMaid.status === 'available' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Busy */}
            <button
              onClick={() => handleStatusChange('busy')}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                currentMaid.status === 'busy'
                  ? 'bg-amber-950/60 border-amber-400 text-white ring-2 ring-amber-500/20 shadow-lg shadow-amber-950/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <div>
                  <div className="text-xs font-bold text-white">🟡 Busy on a Job</div>
                  <div className="text-[11px] text-slate-400">Customers can only pre-book for later</div>
                </div>
              </div>
              {currentMaid.status === 'busy' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Offline */}
            <button
              onClick={() => handleStatusChange('offline')}
              className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between ${
                currentMaid.status === 'offline'
                  ? 'bg-slate-800 border-slate-500 text-white ring-2 ring-slate-600/20 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                <div>
                  <div className="text-xs font-bold text-white">🔴 Offline / Resting</div>
                  <div className="text-[11px] text-slate-400">Hidden from instant dispatch</div>
                </div>
              </div>
              {currentMaid.status === 'offline' && <CheckCircle2 className="w-4 h-4 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* 2. Rate Card Customizer */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              <span>Set Your Real-Time Rates</span>
            </h3>
            <span className="text-xs text-slate-400">Instant Updates</span>
          </div>

          <form onSubmit={handleSaveRates} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hourly Base Rate (₹)
              </label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                1-Time Emergency Visit Price (₹)
              </label>
              <input
                type="number"
                value={oneTimeVisit}
                onChange={(e) => setOneTimeVisit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingRates}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{isUpdatingRates ? 'Saving...' : 'Update & Publish Rates'}</span>
            </button>
          </form>
        </div>

        {/* 3. Performance & Earnings Stats */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <span>Today's Earnings & Trips</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Today's Payout</div>
              <div className="text-xl font-black font-heading text-emerald-400 mt-0.5">₹1,450</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Completed Visits</div>
              <div className="text-xl font-black font-heading text-white mt-0.5">4 Homes</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Customer Rating</div>
              <div className="text-xl font-black font-heading text-amber-400 mt-0.5">
                ⭐ {currentMaid.rating}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Direct Calls</div>
              <div className="text-xl font-black font-heading text-cyan-400 mt-0.5">12 Calls</div>
            </div>
          </div>
        </div>

      </div>

      {/* Incoming Booking Requests Panel */}
      <div className="mt-8 glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-white">
                Incoming Customer Bookings & Dispatch Requests
              </h2>
              <p className="text-xs text-slate-400">Accept or advance doorstep visit status</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-bold text-slate-300">
            {maidBookings.length} Total Bookings
          </span>
        </div>

        {maidBookings.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No active booking requests assigned to {currentMaid.name} right now.
          </div>
        ) : (
          <div className="space-y-3">
            {maidBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {b.id}
                    </span>
                    <span className="text-sm font-bold text-white">{b.customerName}</span>
                    <span className="text-xs text-slate-400">({b.customerPhone})</span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    📍 {b.address} • <strong>{b.serviceType}</strong>
                  </div>
                  {b.notes && (
                    <div className="text-[11px] text-slate-400 mt-0.5 italic">
                      Note: "{b.notes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">₹{b.totalAmount}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">{b.status}</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {b.status === 'requested' && (
                      <button
                        onClick={() => handleBookingAction(b.id, 'accepted')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                      >
                        Accept
                      </button>
                    )}
                    {b.status === 'accepted' && (
                      <button
                        onClick={() => handleBookingAction(b.id, 'en_route')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                      >
                        I'm on the Way
                      </button>
                    )}
                    {b.status === 'en_route' && (
                      <button
                        onClick={() => handleBookingAction(b.id, 'in_progress')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500 text-white hover:bg-purple-400"
                      >
                        Start Work
                      </button>
                    )}
                    {b.status === 'in_progress' && (
                      <button
                        onClick={() => handleBookingAction(b.id, 'completed')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
