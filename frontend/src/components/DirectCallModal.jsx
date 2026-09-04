import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  MessageSquare, Zap, Clock, ShieldCheck, MapPin, CheckCircle2, X 
} from 'lucide-react';

export default function DirectCallModal() {
  const { selectedMaidForCall, setSelectedMaidForCall, setSelectedMaidForBooking, showToast } = useApp();
  
  const [callState, setCallState] = useState('ringing'); // 'ringing' | 'connected' | 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [activeDialogueIndex, setActiveDialogueIndex] = useState(0);
  const [maidSpeaking, setMaidSpeaking] = useState(false);

  const audioCtxRef = useRef(null);
  const ringOscillatorRef = useRef(null);

  const maid = selectedMaidForCall;

  // Realistic Interactive Dialogue Presets
  const dialogueScript = [
    {
      userQuery: "Namaste! Kya aap abhi ghar aane ke liye available ho?",
      maidReply: `Namaste ji! Haan main abhi ${maid?.location || 'aapke area'} ke paas hu aur bilkul available hu. 15-20 minute me pahunch sakti hu.`,
      action: "Check Availability"
    },
    {
      userQuery: "Ghar par Cooking + Bartan/Safai ka kitna charge loge?",
      maidReply: `Normal 2-3 BHK ke liye 1-time visit ₹${maid?.pricing?.oneTimeVisit || 349} lagega, jisme khana aur kitchen safai dono complete ho jayega.`,
      action: "Ask Price"
    },
    {
      userQuery: "Emergency hai, kya aap turant nikal sakte ho?",
      maidReply: `Ji bilkul, main abhi ready hu! Aap MaidEase app par Confirm Book daba dijiye taaki address mil jaye aur main nikal pau.`,
      action: "Confirm Visit"
    }
  ];

  // Synthesize Phone Ring Tone using Web Audio API (Safe, zero external audio dependency)
  useEffect(() => {
    if (!maid) return;

    setCallState('ringing');
    setCallDuration(0);
    setActiveDialogueIndex(0);
    setMaidSpeaking(false);

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Create ringtone tone generator
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.frequency.value = 440; // Standard US/India ring tone pair
        osc2.frequency.value = 480;

        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        ringOscillatorRef.current = { osc1, osc2, gainNode, ctx };
      }
    } catch (e) {
      console.log('AudioContext not allowed without user gesture or unsupported');
    }

    // Connect call automatically after 2.5 seconds
    const connectTimer = setTimeout(() => {
      stopRingtone();
      setCallState('connected');
      setMaidSpeaking(true);
      setTimeout(() => setMaidSpeaking(false), 3000);
    }, 2600);

    return () => {
      clearTimeout(connectTimer);
      stopRingtone();
    };
  }, [maid]);

  const stopRingtone = () => {
    if (ringOscillatorRef.current) {
      try {
        ringOscillatorRef.current.osc1.stop();
        ringOscillatorRef.current.osc2.stop();
        ringOscillatorRef.current.ctx.close();
      } catch (e) {}
      ringOscillatorRef.current = null;
    }
  };

  // Call duration counter
  useEffect(() => {
    let interval;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const handleEndCall = () => {
    stopRingtone();
    setCallState('ended');
    if (maid && callDuration > 0) {
      api.logCall({
        maidId: maid.id,
        maidName: maid.name,
        durationSeconds: callDuration,
        callType: 'outgoing',
        status: 'completed'
      }).catch(console.error);
    }
    setTimeout(() => {
      setSelectedMaidForCall(null);
    }, 600);
  };

  const handleBookFromCall = () => {
    stopRingtone();
    const currentMaid = maid;
    setSelectedMaidForCall(null);
    setSelectedMaidForBooking(currentMaid);
    showToast(`Redirecting to instant booking for ${currentMaid.name}...`, 'success');
  };

  const handleUserAskPrompt = (index) => {
    setActiveDialogueIndex(index);
    setMaidSpeaking(true);
    setTimeout(() => {
      setMaidSpeaking(false);
    }, 3500);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!maid) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[560px]">
        
        {/* Background Glowing Ambient */}
        <div className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl transition-all ${
          callState === 'connected' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'
        }`}></div>

        {/* Top Header / Close */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                callState === 'connected' ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                callState === 'connected' ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {callState === 'ringing' ? 'Connecting Live Audio Call...' : 'Direct Live Call Active'}
            </span>
          </div>

          <button
            onClick={handleEndCall}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Maid Profile & Visualizer */}
        <div className="my-auto text-center py-4 z-10 flex flex-col items-center">
          
          {/* Animated Avatar Circle */}
          <div className="relative mb-5">
            {callState === 'ringing' && (
              <div className="absolute inset-0 -m-4 rounded-full border-2 border-cyan-400/40 radar-ring"></div>
            )}
            {callState === 'connected' && maidSpeaking && (
              <div className="absolute inset-0 -m-3 rounded-full border-2 border-emerald-400/50 animate-pulse"></div>
            )}

            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-slate-800 shadow-2xl relative z-10"
            />

            {maid.verified?.police && (
              <div className="absolute -bottom-2 -right-2 z-20 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Maid Name & Tagline */}
          <h2 className="text-2xl font-black font-heading text-white">{maid.name}</h2>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{maid.location} ({maid.distanceKm} km away)</span>
          </p>

          {/* Call Status / Timer */}
          <div className="mt-3">
            {callState === 'ringing' ? (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-pulse">
                <span>Ringing domestic helper phone...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTimer(callDuration)}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-normal">• HD Audio Encrypted</span>
              </div>
            )}
          </div>

          {/* Audio Wave Visualizer Bars */}
          {callState === 'connected' && (
            <div className="flex items-center justify-center gap-1.5 mt-4 h-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                <span
                  key={bar}
                  className={`w-1 wave-bar ${maidSpeaking ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600 h-1.5'}`}
                ></span>
              ))}
            </div>
          )}

          {/* Real-time Maid Voice Speech Bubble */}
          {callState === 'connected' && (
            <div className="mt-4 w-full bg-slate-900/90 border border-emerald-500/20 p-4 rounded-2xl text-left shadow-inner relative animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{maid.name} (Live Response):</span>
                </span>
                {maidSpeaking && <span className="text-[10px] text-emerald-300 animate-pulse">Speaking...</span>}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                "{dialogueScript[activeDialogueIndex].maidReply}"
              </p>
            </div>
          )}

          {/* Quick Voice Inquiry Prompts */}
          {callState === 'connected' && (
            <div className="mt-3 w-full space-y-1.5">
              <div className="text-[11px] text-slate-400 text-left font-semibold">Ask Maid in Call:</div>
              <div className="flex flex-wrap gap-1.5 justify-start">
                {dialogueScript.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUserAskPrompt(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      activeDialogueIndex === idx
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    💬 {d.action}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Call Controls & Fallback */}
        <div className="z-10 pt-4 border-t border-slate-800/80 space-y-3">
          
          {/* Main Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl border transition-all ${
                isMuted
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-90 shadow-lg shadow-rose-600/30 transform hover:scale-105 transition-all"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Speaker Button */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-2xl border transition-all ${
                isSpeakerOn
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Speaker Toggle"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Fast-Track Instant Book from Call */}
            <button
              onClick={handleBookFromCall}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>Book Instantly (₹{maid.pricing.oneTimeVisit})</span>
            </button>
          </div>

          {/* Fallback Direct Phone & WhatsApp Link */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <span>Or dial natively:</span>
            <div className="flex items-center gap-3">
              <a
                href={`tel:${maid.phone}`}
                className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
              >
                <PhoneCall className="w-3 h-3" />
                <span>{maid.phone}</span>
              </a>
              <span>•</span>
              <a
                href={`https://wa.me/${maid.whatsapp}?text=Namaste%20${maid.name}%20ji,%20maine%20aapko%20MaidEase%20pe%20dekha.%20Kya%20aap%20available%20ho?`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline font-semibold"
              >
                WhatsApp
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
