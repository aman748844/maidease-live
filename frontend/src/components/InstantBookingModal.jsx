import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { Zap, Clock, MapPin, ShieldCheck, CreditCard, Banknote, User, Phone, FileText, X, CheckCircle2 } from 'lucide-react';

export default function InstantBookingModal() {
  const { selectedMaidForBooking, setSelectedMaidForBooking, handleCreateBooking, showToast } = useApp();

  const maid = selectedMaidForBooking;

  const [customerName, setCustomerName] = useState('Rahul Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [address, setAddress] = useState('Flat 304, Green Glen Heights, Indiranagar, Bengaluru');
  const [serviceType, setServiceType] = useState('Deep House Cleaning & Cooking');
  const [frequency, setFrequency] = useState('instant');
  const [scheduledTime, setScheduledTime] = useState('Immediately (Within 20 mins)');
  const [paymentMethod, setPaymentMethod] = useState('Cash after service');
  const [notes, setNotes] = useState('Please bring basic surface cleaner if possible.');
  const [submitting, setSubmitting] = useState(false);

  if (!maid) return null;

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!address || !customerPhone || !customerName) {
      showToast('Please fill all required details', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await handleCreateBooking({
        maidId: maid.id,
        customerName,
        customerPhone,
        address,
        serviceType,
        frequency,
        scheduledTime,
        totalAmount: maid.pricing.oneTimeVisit || 349,
        paymentMethod,
        notes
      });

      // Confetti burst
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
                Instant Home Visit Checkout
              </h2>
              <p className="text-xs text-slate-400">
                Book <strong className="text-emerald-300">{maid.name}</strong> for direct home visit
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedMaidForBooking(null)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Maid Summary Preview Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-12 h-12 rounded-xl object-cover border border-white/10"
            />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{maid.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>⭐ {maid.rating} ({maid.reviewCount} reviews)</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{maid.distanceKm} km away</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">1-Time Visit Charge</div>
            <div className="text-lg font-black font-heading text-emerald-400">
              ₹{maid.pricing.oneTimeVisit}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmitBooking} className="mt-5 space-y-4">
          
          {/* Dispatch Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setFrequency('instant');
                setScheduledTime('Immediately (Within 20 mins)');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                frequency === 'instant'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Instant Dispatch (20 Min)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFrequency('scheduled');
                setScheduledTime('Tomorrow Morning (8:00 AM - 10:00 AM)');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                frequency === 'scheduled'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule for Later</span>
            </button>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Your Name</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile Number</span>
              </label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Doorstep Visit Address</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Flat No, Apartment Name, Street, Landmark..."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm"
            />
          </div>

          {/* Service Details & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chore Instructions for Helper</span>
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cook dinner for 3 persons (Rotis + Dal), and clean kitchen sink."
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm"
            ></textarea>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setPaymentMethod('Cash after service')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'Cash after service'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold">Cash After Work Done</span>
              </div>

              <div
                onClick={() => setPaymentMethod('UPI / QR Code')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition-all ${
                  paymentMethod === 'UPI / QR Code'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <CreditCard className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold">UPI / Online Pay</span>
              </div>
            </div>
          </div>

          {/* Guarantee / Safe Shield Notice */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>100% Satisfaction Guarantee: Pay only after work is completed satisfactorily.</span>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-xl shadow-emerald-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>{submitting ? 'Confirming Dispatch...' : `Confirm Booking & Dispatch Maid (₹${maid.pricing.oneTimeVisit})`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
