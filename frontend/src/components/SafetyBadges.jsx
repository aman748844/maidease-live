import React, { useState } from 'react';
import { ShieldCheck, Lock, HeartHandshake, PhoneCall, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

const FAQS = [
  {
    q: "How fast can a maid arrive at my home after instant booking?",
    a: "When a helper has the '🟢 Available Now' badge, they are currently in your neighborhood and typically reach your doorstep within 15 to 25 minutes."
  },
  {
    q: "Can I call and talk to the maid before booking?",
    a: "Yes! MaidEase features a real-time Direct Call button on every profile. You can start an in-app live audio call or dial natively to verify availability, discuss dishes/chores, and confirm details before booking."
  },
  {
    q: "How are the chore and hourly prices calculated?",
    a: "All rates are transparent with zero hidden broker charges. You can use our built-in Price Estimator to calculate costs based on your BHK size, number of family members, and specific chores (cooking, deep cleaning, bartan, babysitting)."
  },
  {
    q: "Are the domestic helpers background verified and safe?",
    a: "Every helper on our platform undergoes a 4-step verification process: Government ID (Aadhaar), Local Police Clearance, Health/Medical Check, and Residential Reference Verification."
  }
];

export default function SafetyBadges() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* 4 Trust & Safety Pillars */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 mb-12 shadow-2xl relative overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            Safety & Trust Guarantee
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-white mt-2">
            Why 50,000+ Families Trust MaidEase Live
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Built from the ground up to eliminate unreliability and safety concerns in hiring domestic help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">100% Police Verified</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every maid is vetted with government ID and local jurisdiction police clearance records.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Direct Real-Time Calling</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Speak directly with helpers over live audio to discuss specific chores before confirming.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Pay After Satisfaction</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero advance payment. Pay securely via Cash or UPI only after the work is completed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">Damage & Loss Covered</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Up to ₹10,000 complimentary insurance protection for every verified booking.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="max-w-3xl mx-auto space-y-3">
        <h3 className="text-xl font-bold font-heading text-white text-center mb-6">
          Frequently Asked Questions
        </h3>

        {FAQS.map((faq, idx) => {
          const isOpen = openFaq === idx;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-slate-800 overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-emerald-300 transition-colors"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2 text-slate-300 font-bold">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>MaidEase Live — India's #1 Real-Time Domestic Helper Network</span>
        </div>
        <p>© 2026 MaidEase Technologies. All verified helper profiles are strictly vetted for safety and quality.</p>
      </footer>

    </section>
  );
}
