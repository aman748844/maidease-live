import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Calculator, Check, Home, Users, Sparkles, X, ArrowRight, ShieldCheck, Tag } from 'lucide-react';

const BHK_OPTIONS = [
  { id: '1', label: '1 BHK / Studio', multiplier: 1.0 },
  { id: '2', label: '2 BHK Flat', multiplier: 1.3 },
  { id: '3', label: '3 BHK Apartment', multiplier: 1.7 },
  { id: '4', label: '4+ BHK / Villa', multiplier: 2.3 },
];

const CHORE_OPTIONS = [
  { id: 'cleaning', label: 'Deep Sweeping & Mopping', baseCost: 900, icon: '🧹' },
  { id: 'cooking', label: 'Cooking (Veg/Non-Veg)', baseCost: 1400, icon: '🍳' },
  { id: 'dishwashing', label: 'Dishwashing (Bartan)', baseCost: 600, icon: '🍽️' },
  { id: 'laundry', label: 'Laundry & Ironing', baseCost: 500, icon: '🧺' },
  { id: 'babysitting', label: 'Babysitting & Child Care', baseCost: 2800, icon: '👶' },
  { id: 'elderlyCare', label: 'Elderly Assistance', baseCost: 3200, icon: '👵' },
];

export default function PriceCalculatorModal() {
  const { isPriceCalculatorOpen, setIsPriceCalculatorOpen, setFilters } = useApp();

  const [bhk, setBhk] = useState('2');
  const [familyMembers, setFamilyMembers] = useState(3);
  const [selectedChores, setSelectedChores] = useState(['cleaning', 'cooking']);
  const [frequency, setFrequency] = useState('monthly'); // 'monthly' | 'onetime'
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPriceCalculatorOpen) return;

    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const res = await api.estimatePrice({
          bhk,
          services: selectedChores,
          familyMembers,
          frequency
        });
        if (res.success) {
          setEstimate(res.breakdown);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [bhk, familyMembers, selectedChores, frequency, isPriceCalculatorOpen]);

  const toggleChore = (choreId) => {
    if (selectedChores.includes(choreId)) {
      if (selectedChores.length > 1) {
        setSelectedChores(selectedChores.filter(c => c !== choreId));
      }
    } else {
      setSelectedChores([...selectedChores, choreId]);
    }
  };

  const handleApplyFilter = () => {
    if (selectedChores.length > 0) {
      setFilters(prev => ({
        ...prev,
        service: selectedChores[0] || 'all',
        maxPrice: estimate ? Math.max(estimate.estimatedHourlyRate + 50, 200) : 300
      }));
    }
    setIsPriceCalculatorOpen(false);
  };

  if (!isPriceCalculatorOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
                Real-Time Chore & Price Calculator
              </h2>
              <p className="text-xs text-slate-400">
                Transparent market rates with zero broker commissions
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPriceCalculatorOpen(false)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-6 space-y-6">
          
          {/* 1. Property Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-400" />
              <span>Select Home Size</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BHK_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBhk(opt.id)}
                  className={`py-3 px-3 rounded-2xl text-xs font-bold transition-all border text-center ${
                    bhk === opt.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Family Members Count */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Family Members Count: <strong className="text-white text-sm">{familyMembers} People</strong></span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5, 6, '7+'].map((num, idx) => {
                const val = typeof num === 'string' ? 7 : num;
                return (
                  <button
                    key={idx}
                    onClick={() => setFamilyMembers(val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      familyMembers === val
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Chores Checklist */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Select Required Household Chores</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CHORE_OPTIONS.map((chore) => {
                const isChecked = selectedChores.includes(chore.id);
                return (
                  <div
                    key={chore.id}
                    onClick={() => toggleChore(chore.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      isChecked
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{chore.icon}</span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white">{chore.label}</div>
                        <div className="text-[11px] text-slate-400">Base rate ~₹{chore.baseCost}/mo</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-700'
                    }`}>
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Frequency Plan Selector */}
          <div className="flex items-center p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => setFrequency('monthly')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                frequency === 'monthly'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Monthly Recurring Helper</span>
              <span className="px-2 py-0.5 text-[10px] bg-slate-950 text-emerald-400 rounded-full font-extrabold">
                15% OFF
              </span>
            </button>
            <button
              onClick={() => setFrequency('onetime')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                frequency === 'onetime'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              One-Time Emergency Visit
            </button>
          </div>

          {/* Dynamic Estimate Result Box */}
          {estimate && (
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Calculated Real-Time Estimate
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-heading mt-0.5">
                    {frequency === 'monthly' ? (
                      <>₹{estimate.estimatedMonthlyTotal} <span className="text-sm text-slate-400 font-normal">/ month</span></>
                    ) : (
                      <>₹{estimate.estimatedOneTimeVisit} <span className="text-sm text-slate-400 font-normal">/ single visit</span></>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Hourly Reference</div>
                  <div className="text-lg font-bold text-cyan-300">
                    ~₹{estimate.estimatedHourlyRate} <span className="text-xs font-normal text-slate-400">/ hr</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <Tag className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{estimate.savingsNote}</span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom CTA */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsPriceCalculatorOpen(false)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Close
          </button>
          <button
            onClick={handleApplyFilter}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-90 shadow-lg shadow-emerald-500/20"
          >
            <span>Find Maids in this Budget</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
