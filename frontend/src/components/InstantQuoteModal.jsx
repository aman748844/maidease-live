import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Zap, X, CheckCircle2, ShieldCheck, MapPin, 
  DollarSign, Sparkles, ArrowRight, Tag, Clock, PhoneCall 
} from 'lucide-react';

export default function InstantQuoteModal() {
  const { 
    isQuoteModalOpen, 
    setIsQuoteModalOpen, 
    quoteTargetMaid, 
    setSelectedMaidForBooking,
    setSelectedMaidForCall,
    showToast 
  } = useApp();

  const [bhk, setBhk] = useState('2');
  const [serviceType, setServiceType] = useState('Cooking & Deep Cleaning');
  const [quoteData, setQuoteData] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    if (!isQuoteModalOpen) return;

    const fetchQuote = async () => {
      setLoadingQuote(true);
      try {
        const res = await api.getInstantQuote({
          serviceType,
          locality: quoteTargetMaid?.location || 'Kothrud, Pune',
          bhk,
          frequency: 'one_time'
        });
        if (res.success) {
          setQuoteData(res.quote);
        }
      } catch (e) {
        // Local fallback
        setQuoteData({
          finalPrice: 329,
          marketAverage: 450,
          savingsAmount: 121,
          savingsPercent: '27%',
          badge: 'JD Guaranteed Lowest Rate',
          includes: [
            'Doorstep arrival in 20 minutes',
            'Full chore execution with OTP safety guarantee',
            'Police verified & vaccinated helper',
            'No advance payment required'
          ]
        });
      } finally {
        setLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [isQuoteModalOpen, bhk, serviceType, quoteTargetMaid]);

  if (!isQuoteModalOpen) return null;

  const handleBookQuote = () => {
    setIsQuoteModalOpen(false);
    if (quoteTargetMaid) {
      setSelectedMaidForBooking(quoteTargetMaid);
    }
    showToast(`Quote locked! Complete your instant booking.`, 'success');
  };

  const handleCallQuote = () => {
    setIsQuoteModalOpen(false);
    if (quoteTargetMaid) {
      setSelectedMaidForCall(quoteTargetMaid);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-5 sm:p-7 border border-emerald-500/30 shadow-2xl overflow-y-auto max-h-[92vh] text-slate-100">
        
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-black font-heading text-white">Justdial Best Deal Quote</h3>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Guaranteed lowest market rate for {quoteTargetMaid ? quoteTargetMaid.name : 'Pune Helpers'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsQuoteModalOpen(false)}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selections */}
        <div className="mt-4 space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Select Home Size (BHK):</label>
            <div className="grid grid-cols-4 gap-2">
              {['1', '2', '3', '4'].map((b) => (
                <button
                  key={b}
                  onClick={() => setBhk(b)}
                  className={`py-2 rounded-xl font-bold border transition ${
                    bhk === b
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {b} BHK
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Service Required:</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-emerald-400"
            >
              <option value="Cooking & Deep Cleaning">Cooking (Chapati/Sabji) + Deep Cleaning</option>
              <option value="Cooking & Bartan">Cooking Only + Utensil Washing</option>
              <option value="Deep Floor Cleaning & Mopping">Deep Floor Sweeping & Antiseptic Mopping</option>
              <option value="Babysitting & Nanny">Babysitting & Infant Care</option>
              <option value="Elderly & Patient Care">Elderly Companion & Meal Support</option>
            </select>
          </div>
        </div>

        {/* Quote Card */}
        {quoteData && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-tr from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {quoteData.badge || 'JD Guaranteed Price'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-heading text-emerald-400">
                    ₹{quoteData.finalPrice}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ₹{quoteData.marketAverage}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400">You Save</span>
                <div className="text-sm font-black text-amber-300">
                  ₹{quoteData.savingsAmount} ({quoteData.savingsPercent || '25%'} OFF)
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
              {quoteData.includes?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {quoteTargetMaid && (
            <button
              onClick={handleCallQuote}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition shadow"
              title="Call Maid on Quote"
            >
              <PhoneCall className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleBookQuote}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/30 transition transform hover:scale-[1.02] flex items-center justify-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>Lock Deal & Book Visit</span>
          </button>
        </div>

      </div>
    </div>
  );
}
