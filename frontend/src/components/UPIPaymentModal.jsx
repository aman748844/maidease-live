import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, CheckCircle2, ShieldCheck, Download, Copy, 
  Smartphone, QrCode, ArrowRight, Sparkles 
} from 'lucide-react';

export default function UPIPaymentModal({ booking, onClose, onPaymentSuccess }) {
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const amount = booking.totalAmount || 329;
  const upiId = 'maidease.pune@okhdfcbank';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=MaidEase%20Pune&am=${amount}&cu=INR&tn=Booking%20${booking.id}`
  )}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirmPayment = () => {
    setIsPaid(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn text-slate-100">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 border border-emerald-500/30 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Instant UPI QR Payment</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isPaid ? (
          <div className="space-y-4 text-center">
            {/* Amount Badge */}
            <div className="py-2 px-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 inline-block">
              <span className="text-xs text-slate-400">Total Payable Amount: </span>
              <span className="text-xl font-black font-heading text-emerald-400">₹{amount}</span>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block border-4 border-slate-800">
              <img 
                src={qrUrl} 
                alt="UPI QR Code" 
                className="w-48 h-48 mx-auto"
              />
              <div className="text-[10px] text-slate-800 font-bold mt-1">
                Scan with GPay, PhonePe, Paytm
              </div>
            </div>

            {/* UPI ID Row */}
            <div className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[11px] truncate">{upiId}</span>
              <button
                onClick={handleCopyUPI}
                className="flex items-center gap-1 text-emerald-400 font-bold hover:underline shrink-0 ml-2"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy UPI'}</span>
              </button>
            </div>

            {/* Action */}
            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition transform hover:scale-102 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simulate Payment Received</span>
            </button>
          </div>
        ) : (
          /* Payment Success & Digital Receipt */
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white">Payment Verified!</h4>
              <p className="text-xs text-slate-400 mt-0.5">Transaction ID: UPI-{Date.now().toString().slice(-8)}</p>
            </div>

            {/* Receipt Summary */}
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="font-bold text-white">{booking.serviceType}</span>
              </div>
              <div className="flex justify-between">
                <span>Maid:</span>
                <span className="font-bold text-emerald-400">{booking.maidName}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-400">₹{amount} (Paid Online)</span>
              </div>
              <div className="flex justify-between">
                <span>Doorstep OTP:</span>
                <span className="font-mono font-bold text-white tracking-widest">{booking.otp || '4829'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
            >
              Close & Track Arrival
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
