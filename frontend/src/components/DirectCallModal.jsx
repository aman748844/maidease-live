import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { realtime } from '../services/realtime';
import { webrtc } from '../services/webrtc';
import { 
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  MessageSquare, Zap, Clock, ShieldCheck, MapPin, CheckCircle2, X, 
  Radio, Sparkles, Send, PhoneForwarded, MessageCircle, Smartphone
} from 'lucide-react';

export default function DirectCallModal() {
  const { 
    selectedMaidForCall, 
    setSelectedMaidForCall, 
    setSelectedMaidForBooking, 
    userPhoneNumber, 
    saveUserPhoneNumber,
    showToast 
  } = useApp();
  
  const [callState, setCallState] = useState('ringing'); // 'ringing' | 'connected' | 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [maidSpeaking, setMaidSpeaking] = useState(false);
  const [currentSpokenReply, setCurrentSpokenReply] = useState('');
  const [inCallTextInput, setInCallTextInput] = useState('');
  const [userSpokenText, setUserSpokenText] = useState('');
  const [isListeningUser, setIsListeningUser] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isHumanConnected, setIsHumanConnected] = useState(false);

  // My Personal Phone for Real Call Testing
  const [testMobileNumber, setTestMobileNumber] = useState(userPhoneNumber || '');

  const audioCtxRef = useRef(null);
  const ringOscillatorRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const activeCallIdRef = useRef(null);

  const maid = selectedMaidForCall;

  // Preset quick inquiries for fast tapping
  const quickInquiries = [
    { label: "Check Availability", text: "Namaste tai, kya aap abhi Kothrud / Pune aane ke liye available ho?" },
    { label: "Ask Pricing", text: "Cooking aur safai ka ek time visit ka kitna charge loge?" },
    { label: "Chapati / Bhakri", text: "Kya aap gol phulka chapati aur Maharashtrian jevan bana leti ho?" },
    { label: "Emergency Visit", text: "Ghar pe emergency hai, kya aap 15-20 minute me pahunch sakti ho?" }
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

      recognition.onerror = () => setIsListeningUser(false);
      recognition.onend = () => setIsListeningUser(false);
      recognitionRef.current = recognition;
    }

    synthRef.current = window.speechSynthesis;
  }, []);

  // Ringtone & WebRTC Initiation
  useEffect(() => {
    if (!maid) return;

    const callId = `CALL-${Date.now()}`;
    activeCallIdRef.current = callId;

    setCallState('ringing');
    setCallDuration(0);
    setMaidSpeaking(false);
    setUserSpokenText('');
    setIsHumanConnected(false);

    const defaultGreeting = `Namaskar ji! Main ${maid.name} bol rahi hu Pune se. Aapko cooking ya safai me kya help chahiye?`;
    setCurrentSpokenReply(defaultGreeting);

    // Start WebRTC initiation to ring Maid partner's tab/phone!
    webrtc.initiateCall(callId, maid.id, 'Customer in Pune').catch(console.error);

    // Listen if a real person (Maid) accepts call
    const unsubAccept = realtime.on('call_accepted', ({ callId: acceptedId }) => {
      if (acceptedId === activeCallIdRef.current) {
        stopRingtone();
        setCallState('connected');
        setIsHumanConnected(true);
        showToast(`Connected to real helper ${maid.name} via WebRTC Audio!`, 'success');
      }
    });

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

    // If maid doesn't pick up within 3.5 seconds, autonomous Gemini AI Persona takes over!
    const aiFallbackTimer = setTimeout(() => {
      stopRingtone();
      setCallState('connected');
      speakReply(defaultGreeting);
    }, 3500);

    return () => {
      clearTimeout(aiFallbackTimer);
      unsubAccept();
      stopRingtone();
      if (synthRef.current) synthRef.current.cancel();
      webrtc.endCall(callId);
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

  useEffect(() => {
    let interval;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  const getLocalPersonaReply = (query) => {
    const text = query.toLowerCase();
    if (text.includes('available') || text.includes('aa sakti') || text.includes('time') || text.includes('kab')) {
      return `Ji haan bhaiya, main abhi ${maid?.location || 'Pune'} ke paas hi hu. 15 se 20 minute me aapke ghar pahunch jaungi!`;
    }
    if (text.includes('price') || text.includes('kitna') || text.includes('charge') || text.includes('rate')) {
      return `Ek bar visit ka ₹${maid?.pricing?.oneTimeVisit || 329} charge lagega, jisme khana aur kitchen safai dono complete ho jayega.`;
    }
    if (text.includes('chapati') || text.includes('roti') || text.includes('khana') || text.includes('cook') || text.includes('bhakri')) {
      return `Ji bilkul! Main gol chapati, jowar bhakri, dal tadka, veg aur paneer sab hygienic tarike se bana leti hu.`;
    }
    if (text.includes('safai') || text.includes('clean') || text.includes('bartan') || text.includes('jhadu')) {
      return `Safai me rooms ka jhadu, pocha, bathroom scrubbing aur bartan pura neat and clean kar dungi!`;
    }
    return `Ji bilkul, main samajh gayi. Main ${maid?.location || 'Pune'} se turant nikalne ke liye taiyar hu!`;
  };

  const handleSendVoiceQuery = async (queryText) => {
    if (!queryText.trim()) return;
    setIsAiResponding(true);

    try {
      let reply = '';
      try {
        const res = await api.getAICallReply({
          userMessage: queryText,
          maidId: maid.id,
          maidName: maid.name
        });
        if (res && res.success && res.spokenReply) {
          reply = res.spokenReply;
        }
      } catch (e) {
        reply = getLocalPersonaReply(queryText);
      }

      if (!reply) reply = getLocalPersonaReply(queryText);

      setCurrentSpokenReply(reply);
      speakReply(reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiResponding(false);
      setInCallTextInput('');
    }
  };

  const toggleMicListening = () => {
    if (!recognitionRef.current) {
      showToast('Speech mic not supported. Please type in the box below!', 'info');
      return;
    }

    if (isListeningUser) {
      recognitionRef.current.stop();
      setIsListeningUser(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningUser(true);
        showToast('Listening... Speak now in Hindi, Marathi, or English', 'info');
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

    webrtc.endCall(activeCallIdRef.current);

    if (maid && callDuration > 0) {
      api.logCall({
        maidId: maid.id,
        maidName: maid.name,
        durationSeconds: callDuration,
        callType: 'outgoing',
        status: 'completed',
        notes: userSpokenText ? `Spoken: "${userSpokenText}"` : 'Real WebRTC & AI Voice Call'
      }).catch(console.error);
    }

    setTimeout(() => {
      setSelectedMaidForCall(null);
    }, 400);
  };

  const handleBookFromCall = () => {
    stopRingtone();
    if (synthRef.current) synthRef.current.cancel();
    webrtc.endCall(activeCallIdRef.current);

    const currentMaid = maid;
    setSelectedMaidForCall(null);
    setSelectedMaidForBooking(currentMaid);
    showToast(`Redirecting to instant booking for ${currentMaid.name}...`, 'success');
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleDispatchToMyPhone = async () => {
    if (!testMobileNumber.trim()) {
      showToast('Please enter your mobile number first (e.g. +91 9876543210)', 'error');
      return;
    }

    saveUserPhoneNumber(testMobileNumber);

    try {
      await api.dispatchTelephonyCall({
        targetPhoneNumber: testMobileNumber,
        maidId: maid?.id,
        maidName: maid?.name
      });
    } catch (e) {}

    window.location.href = `tel:${testMobileNumber.replace(/\s+/g, '')}`;
    showToast(`Calling ${testMobileNumber} directly! Check your phone dialer.`, 'success');
  };

  const handleWhatsAppToMyPhone = () => {
    if (!testMobileNumber.trim()) {
      showToast('Please enter your mobile number first', 'error');
      return;
    }
    const cleanNum = testMobileNumber.replace(/[^0-9]/g, '');
    const msg = `Namaste! MaidEase Live se ${maid.name} (${maid.location}) ko aapke doorstep par visit ke liye book kiya gaya hai.`;
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!maid) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-7 border border-white/15 shadow-2xl overflow-hidden flex flex-col justify-between max-h-[92vh] overflow-y-auto text-slate-100">
        
        {/* Glow */}
        <div className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-all ${
          callState === 'connected' ? 'bg-emerald-500/20' : 'bg-cyan-500/20'
        }`} />

        {/* Header */}
        <div className="flex items-center justify-between z-10 pb-2">
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
              {callState === 'ringing' 
                ? 'Ringing Maid in Pune (WebRTC & Telephony)...' 
                : isHumanConnected 
                ? '🟢 Two-Way Human WebRTC Audio Active' 
                : '🟢 Live Voice Call Active (Gemini AI Agent)'}
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
        <div className="my-auto text-center py-1 z-10 flex flex-col items-center">
          
          <div className="relative mb-2">
            {callState === 'ringing' && (
              <div className="absolute inset-0 -m-3 rounded-3xl border-2 border-cyan-400/40 animate-ping" />
            )}
            {callState === 'connected' && maidSpeaking && (
              <div className="absolute inset-0 -m-3 rounded-3xl border-2 border-emerald-400/60 animate-pulse shadow-lg shadow-emerald-500/30" />
            )}

            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-slate-800 shadow-2xl relative z-10"
            />

            {maid.verified?.police && (
              <div className="absolute -bottom-1.5 -right-1.5 z-20 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md" title="Police Verified">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-black font-heading text-white">{maid.name}</h2>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{maid.location}</span>
          </p>

          {/* Call Status & Timer */}
          <div className="mt-2">
            {callState === 'ringing' ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold animate-pulse">
                <span>Ringing maid device & WebRTC bridge...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTimer(callDuration)}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-normal">• Encrypted VoIP Audio</span>
              </div>
            )}
          </div>

          {/* Dynamic Speaking Waves */}
          {callState === 'connected' && (
            <div className="flex items-center justify-center gap-1.5 my-2.5 h-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                <span
                  key={bar}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    maidSpeaking 
                      ? 'bg-emerald-400 h-5 animate-pulse' 
                      : isListeningUser
                      ? 'bg-purple-400 h-4 animate-bounce'
                      : 'bg-slate-700 h-1.5'
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
                  <span>{maid.name} ({isHumanConnected ? 'Live Real Person' : 'Live Voice Persona'}):</span>
                </span>
                {maidSpeaking && <span className="text-[10px] text-emerald-300 animate-pulse font-semibold">🔊 Speaking...</span>}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                "{currentSpokenReply}"
              </p>

              {userSpokenText && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-purple-300 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-purple-400" />
                  <span>You: "{userSpokenText}"</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Inquiry Pills */}
          {callState === 'connected' && (
            <div className="mt-2 w-full">
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

          {/* In-Call Text Input */}
          {callState === 'connected' && (
            <div className="mt-2.5 w-full flex items-center gap-1.5">
              <input
                type="text"
                value={inCallTextInput}
                onChange={(e) => setInCallTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inCallTextInput.trim()) {
                    setUserSpokenText(inCallTextInput);
                    handleSendVoiceQuery(inCallTextInput);
                  }
                }}
                placeholder="Type in call (e.g. Kya aap Kothrud aa sakti ho?)..."
                className="flex-1 px-3 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400"
              />
              <button
                disabled={!inCallTextInput.trim()}
                onClick={() => {
                  if (inCallTextInput.trim()) {
                    setUserSpokenText(inCallTextInput);
                    handleSendVoiceQuery(inCallTextInput);
                  }
                }}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-40 transition flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Real Phone Calling Feature */}
        <div className="z-10 mt-3 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real Calling to YOUR Mobile Phone</span>
            </span>
            <span className="text-[10px] text-slate-400">Put your SIM number</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="tel"
              value={testMobileNumber}
              onChange={(e) => setTestMobileNumber(e.target.value)}
              placeholder="Enter your phone e.g. +91 98765 43210"
              className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-indigo-500/40 rounded-xl text-white outline-none"
            />
            <button
              onClick={handleDispatchToMyPhone}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow"
              title="Open dialer with your number"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call My Phone</span>
            </button>
            <button
              onClick={handleWhatsAppToMyPhone}
              className="px-2.5 py-1.5 bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl transition flex items-center gap-1"
              title="WhatsApp alert to your number"
            >
              <MessageCircle className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="z-10 pt-3 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={toggleMicListening}
              className={`p-3 rounded-2xl border transition flex items-center justify-center ${
                isListeningUser
                  ? 'bg-purple-600 text-white animate-pulse border-purple-400 shadow-lg shadow-purple-500/40'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isListeningUser ? 'Listening to your voice... click to stop' : 'Tap to speak to helper'}
            >
              {isListeningUser ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={handleEndCall}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-90 shadow-lg shadow-rose-600/30 transition transform hover:scale-105"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            <button
              onClick={() => {
                webrtc.toggleMute(!isMuted);
                setIsMuted(!isMuted);
              }}
              className={`p-3.5 rounded-2xl border transition ${
                isMuted ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              onClick={handleBookFromCall}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-lg shadow-emerald-500/20"
            >
              <Zap className="w-4 h-4" />
              <span>Confirm Book (₹{maid.pricing?.oneTimeVisit || 329})</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Dial Maid directly:</span>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${maid.phone}`}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1 transition text-[11px]"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call {maid.phone}</span>
              </a>
              <a
                href={`https://wa.me/${maid.whatsapp}?text=Namaste%20${encodeURIComponent(maid.name)}%20ji,%20Pune%20me%20home%20service%20chahiye.`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/40 font-semibold flex items-center gap-1 transition text-[11px]"
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
