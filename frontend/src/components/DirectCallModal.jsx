import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  MessageSquare, Zap, Clock, ShieldCheck, MapPin, CheckCircle2, X, 
  Radio, Sparkles, Send, PhoneForwarded, MessageCircle
} from 'lucide-react';

export default function DirectCallModal() {
  const { selectedMaidForCall, setSelectedMaidForCall, setSelectedMaidForBooking, showToast } = useApp();
  
  const [callState, setCallState] = useState('ringing'); // 'ringing' | 'connected' | 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [maidSpeaking, setMaidSpeaking] = useState(false);
  const [currentSpokenReply, setCurrentSpokenReply] = useState('');
  const [userSpokenText, setUserSpokenText] = useState('');
  const [isListeningUser, setIsListeningUser] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);

  const audioCtxRef = useRef(null);
  const ringOscillatorRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  const maid = selectedMaidForCall;

  // Preset quick inquiries for fast tapping
  const quickInquiries = [
    { label: "Check Availability", text: "Namaste ji, kya aap abhi Indiranagar aane ke liye available ho?" },
    { label: "Ask Pricing", text: "Cooking aur bartan safai ka kitna charge loge?" },
    { label: "Emergency ASAP", text: "Ghar pe emergency hai, kya aap 15-20 minute me pahunch sakti ho?" },
    { label: "Diet / Veg Food", text: "Kya aap pure veg khana aur gol phulka roti bana sakti ho?" }
  ];

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN';

      recognition.onresult = async (event) => {
        const spoken = event.results[0][0].transcript;
        setUserSpokenText(spoken);
        setIsListeningUser(false);
        handleSendVoiceQuery(spoken);
      };

      recognition.onerror = () => {
        setIsListeningUser(false);
      };

      recognition.onend = () => {
        setIsListeningUser(false);
      };

      recognitionRef.current = recognition;
    }

    synthRef.current = window.speechSynthesis;
  }, []);

  // Ringtone synthesizer
  useEffect(() => {
    if (!maid) return;

    setCallState('ringing');
    setCallDuration(0);
    setMaidSpeaking(false);
    setUserSpokenText('');
    const defaultGreeting = `Namaste ji! Main ${maid.name} bol rahi hu. Aapko khana banane ya safai me kya help chahiye?`;
    setCurrentSpokenReply(defaultGreeting);

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.frequency.value = 440;
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
      console.log('Web Audio tone init handled');
    }

    // Connect after 2.4 seconds
    const connectTimer = setTimeout(() => {
      stopRingtone();
      setCallState('connected');
      speakReply(defaultGreeting);
    }, 2400);

    return () => {
      clearTimeout(connectTimer);
      stopRingtone();
      if (synthRef.current) synthRef.current.cancel();
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

  // Speak AI response using Web Speech Synthesis
  const speakReply = (textToSpeak) => {
    if (!isSpeakerOn || !synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;

    utterance.onstart = () => setMaidSpeaking(true);
    utterance.onend = () => setMaidSpeaking(false);
    utterance.onerror = () => setMaidSpeaking(false);

    synthRef.current.speak(utterance);
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

  // Handle user speech query
  const handleSendVoiceQuery = async (queryText) => {
    if (!queryText.trim()) return;
    setIsAiResponding(true);

    try {
      const res = await api.getAICallReply({
        userMessage: queryText,
        maidId: maid.id,
        maidName: maid.name
      });

      if (res.success && res.spokenReply) {
        setCurrentSpokenReply(res.spokenReply);
        speakReply(res.spokenReply);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiResponding(false);
    }
  };

  const toggleMicListening = () => {
    if (!recognitionRef.current) {
      showToast('Mic speech recognition not supported in this browser.', 'info');
      return;
    }

    if (isListeningUser) {
      recognitionRef.current.stop();
      setIsListeningUser(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningUser(true);
        showToast('Mic on: Speak in Hindi or English to maid...', 'info');
      } catch (e) {
        recognitionRef.current.stop();
        setIsListeningUser(false);
      }
    }
  };

  const handleEndCall = () => {
    stopRingtone();
    if (synthRef.current) synthRef.current.cancel();
    setCallState('ended');

    if (maid && callDuration > 0) {
      api.logCall({
        maidId: maid.id,
        maidName: maid.name,
        durationSeconds: callDuration,
        callType: 'outgoing',
        status: 'completed',
        notes: userSpokenText ? `Spoken: "${userSpokenText}"` : 'Direct live call'
      }).catch(console.error);
    }

    setTimeout(() => {
      setSelectedMaidForCall(null);
    }, 500);
  };

  const handleBookFromCall = () => {
    stopRingtone();
    if (synthRef.current) synthRef.current.cancel();
    const currentMaid = maid;
    setSelectedMaidForCall(null);
    setSelectedMaidForBooking(currentMaid);
    showToast(`Opening instant dispatch booking for ${currentMaid.name}...`, 'success');
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!maid) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-7 border border-white/15 shadow-2xl overflow-hidden flex flex-col justify-between min-h-[580px] text-slate-100">
        
        {/* Background Ambient Glow */}
        <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-all ${
          callState === 'connected' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'
        }`} />

        {/* Header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                callState === 'connected' ? 'bg-emerald-400' : 'bg-cyan-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                callState === 'connected' ? 'bg-emerald-500' : 'bg-cyan-500'
              }`} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {callState === 'ringing' ? 'Dialing Domestic Helper...' : 'Live Real-Time Voice Call Active'}
            </span>
          </div>

          <button
            onClick={handleEndCall}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Maid Profile & Live Waveform */}
        <div className="my-auto text-center py-2 z-10 flex flex-col items-center">
          
          <div className="relative mb-3">
            {callState === 'ringing' && (
              <div className="absolute inset-0 -m-3 rounded-3xl border-2 border-cyan-400/40 animate-ping" />
            )}
            {callState === 'connected' && maidSpeaking && (
              <div className="absolute inset-0 -m-3 rounded-3xl border-2 border-emerald-400/60 animate-pulse shadow-lg shadow-emerald-500/30" />
            )}

            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-slate-800 shadow-2xl relative z-10"
            />

            {maid.verified?.police && (
              <div className="absolute -bottom-2 -right-2 z-20 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md" title="Police Verified">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-black font-heading text-white">{maid.name}</h2>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{maid.location} • {maid.distanceKm} km away</span>
          </p>

          {/* Call Status & Timer */}
          <div className="mt-2.5">
            {callState === 'ringing' ? (
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-pulse">
                <span>Ringing maid direct line...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTimer(callDuration)}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-normal">• AI Voice Bridge Active</span>
              </div>
            )}
          </div>

          {/* Dynamic Speaking Audio Waves */}
          {callState === 'connected' && (
            <div className="flex items-center justify-center gap-1.5 my-3 h-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                <span
                  key={bar}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    maidSpeaking 
                      ? 'bg-emerald-400 h-6 animate-pulse' 
                      : isListeningUser
                      ? 'bg-purple-400 h-4 animate-bounce'
                      : 'bg-slate-700 h-2'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Spoken Reply Bubble */}
          {callState === 'connected' && (
            <div className="w-full bg-slate-900/95 border border-emerald-500/30 p-3.5 rounded-2xl text-left shadow-inner relative animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{maid.name} (Live Voice):</span>
                </span>
                {maidSpeaking && <span className="text-[10px] text-emerald-300 animate-pulse font-semibold">🔊 Speaking...</span>}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                "{currentSpokenReply}"
              </p>

              {userSpokenText && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-purple-300 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-purple-400" />
                  <span>You asked: "{userSpokenText}"</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Inquiry Pills */}
          {callState === 'connected' && (
            <div className="mt-2.5 w-full">
              <div className="text-[11px] text-slate-400 text-left font-semibold mb-1">Quick Voice Prompts:</div>
              <div className="flex flex-wrap gap-1.5 justify-start">
                {quickInquiries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserSpokenText(q.text);
                      handleSendVoiceQuery(q.text);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-800/80 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700 transition"
                  >
                    💬 {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="z-10 pt-3 border-t border-slate-800/80 space-y-3">
          
          {/* Main Controls Row */}
          <div className="flex items-center justify-center gap-3">
            
            {/* Live Mic Toggle (Speak to Maid) */}
            <button
              onClick={toggleMicListening}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-center ${
                isListeningUser
                  ? 'bg-purple-600 text-white animate-pulse border-purple-400 shadow-lg shadow-purple-500/40'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isListeningUser ? 'Listening to your voice... click to stop' : 'Tap to speak to helper'}
            >
              {isListeningUser ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-90 shadow-lg shadow-rose-600/30 transition transform hover:scale-105"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Speaker Toggle */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-2xl border transition ${
                isSpeakerOn
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Speaker Toggle"
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Fast-Track Instant Book */}
            <button
              onClick={handleBookFromCall}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>Confirm Book (₹{maid.pricing.oneTimeVisit})</span>
            </button>
          </div>

          {/* Real Phone Dial & WhatsApp Direct Links */}
          <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Real Telephony Links:</span>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${maid.phone}`}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 transition"
                title="Dial on your phone"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call {maid.phone}</span>
              </a>
              <a
                href={`https://wa.me/${maid.whatsapp}?text=Namaste%20${encodeURIComponent(maid.name)}%20ji,%20maine%20aapko%20MaidEase%20pe%20dekha.%20Mujhe%20urgent%20home%20maid%20chahiye.`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 font-semibold flex items-center gap-1 transition"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
