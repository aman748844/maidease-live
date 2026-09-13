import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { realtime } from '../services/realtime';
import { webrtc } from '../services/webrtc';
import { 
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  MessageSquare, Zap, Clock, ShieldCheck, MapPin, CheckCircle2, X, 
  Radio, Sparkles, Send, PhoneForwarded, MessageCircle, Smartphone,
  Minimize2, Maximize2, Settings, Cpu, ChevronDown, Check, AlertCircle, RefreshCw
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
  
  // Call Lifecycle States: 'ringing' | 'connected' | 'ended'
  const [callState, setCallState] = useState('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // AI Voice & Interaction States
  const [maidSpeaking, setMaidSpeaking] = useState(false);
  const [currentSpokenReply, setCurrentSpokenReply] = useState('');
  const [inCallTextInput, setInCallTextInput] = useState('');
  const [userSpokenText, setUserSpokenText] = useState('');
  const [isListeningUser, setIsListeningUser] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isHumanConnected, setIsHumanConnected] = useState(false);
  const [callTranscript, setCallTranscript] = useState([]);

  // AI Model Selection & Keys
  const [selectedAiModel, setSelectedAiModel] = useState(
    () => localStorage.getItem('maidease_ai_model') || 'gemini-2.0-flash'
  );
  const [customOpenAiKey, setCustomOpenAiKey] = useState(
    () => localStorage.getItem('maidease_openai_key') || ''
  );
  const [customGeminiKey, setCustomGeminiKey] = useState(
    () => localStorage.getItem('maidease_gemini_key') || ''
  );
  const [customGroqKey, setCustomGroqKey] = useState(
    () => localStorage.getItem('maidease_groq_key') || ''
  );
  const [customSarvamKey, setCustomSarvamKey] = useState(
    () => localStorage.getItem('maidease_sarvam_key') || ''
  );
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [activeEngineBadge, setActiveEngineBadge] = useState('Gemini 2.0 Flash');

  // Real Mobile Number for Phone Testing
  const [testMobileNumber, setTestMobileNumber] = useState(userPhoneNumber || '');

  // Audio Context & Cadence Refs
  const audioCtxRef = useRef(null);
  const ringCadenceTimerRef = useRef(null);
  const ringOscillatorsRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const activeCallIdRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const handleSendVoiceQueryRef = useRef(null);

  const maid = selectedMaidForCall;

  // Preset quick inquiries tailored for Indian domestic helper conversations
  const quickInquiries = [
    { label: "Kitne minute me aaogi?", text: "Namaste tai, kya aap abhi Kothrud / Pune aane ke liye available ho aur kitne time me pahunchogi?" },
    { label: "Chapati / Bhakri banaogi?", text: "Kya aap gol phulka chapati, jowar bhakri aur swadisht khana bana leti ho?" },
    { label: "Visit charges kitna hai?", text: "Ek time visit ka kitna charge loge aur usme kya-kya shamil hai?" },
    { label: "Ghar ki deep cleaning", text: "Safai me jhadu, pocha, bathroom aur kitchen bartan pura complete karogi?" },
    { label: "Police verified ho?", text: "Kya aapka background check aur police verification done hai?" },
    { label: "Abhi turant nikal jao!", text: "Theek hai ji, mujhe kaam pasand aaya. Aap turant nikal lijiye, main confirm book kar raha hu." }
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN';

      recognition.onresult = async (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const spoken = finalTranscript.trim() || interimTranscript.trim();
        if (spoken) setUserSpokenText(spoken);

        if (finalTranscript.trim()) {
          setIsListeningUser(false);
          if (handleSendVoiceQueryRef.current) {
            handleSendVoiceQueryRef.current(finalTranscript.trim());
          }
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListeningUser(false);
        if (e.error === 'not-allowed') {
          showToast('Mic permission blocked. Click 🔒 icon in browser URL bar to allow Microphone.', 'error');
        } else if (e.error === 'no-speech') {
          showToast('No voice detected. Please speak closer to microphone.', 'info');
        } else {
          showToast(`Mic status: ${e.error}`, 'info');
        }
      };

      recognition.onend = () => {
        setIsListeningUser(false);
      };

      recognitionRef.current = recognition;
    }

    synthRef.current = window.speechSynthesis;
  }, []);

  // Play realistic sounds (Indian Telecom Ringback cadence, Pickup chime, Hangup beep)
  const playPickupChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  const playHangupBeeps = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      [0, 0.2, 0.4].forEach((timeOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, ctx.currentTime + timeOffset);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + timeOffset + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.14);
      });
    } catch (e) {}
  };

  // Indian Telecom Ringtone (Dual frequency 400Hz + 450Hz, Cadence: 1.2s ON, 2.0s OFF)
  const startIndianRingbackTone = () => {
    stopIndianRingbackTone();
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const playBurst = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
        
        // Resume if suspended by browser autoplay policy
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(400, ctx.currentTime);
        osc2.frequency.setValueAtTime(450, ctx.currentTime);

        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.15);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 1.22);
        osc2.stop(ctx.currentTime + 1.22);
        ringOscillatorsRef.current = { osc1, osc2 };
      };

      // Play immediate first ring
      playBurst();
      // Cadence every 3.2 seconds (1.2s tone + 2.0s silence)
      ringCadenceTimerRef.current = setInterval(playBurst, 3200);
    } catch (e) {
      console.log('Web Audio tone init error:', e);
    }
  };

  const stopIndianRingbackTone = () => {
    if (ringCadenceTimerRef.current) {
      clearInterval(ringCadenceTimerRef.current);
      ringCadenceTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {}
      audioCtxRef.current = null;
    }
    ringOscillatorsRef.current = null;
  };

  // Speaks text with authentic natural Indian domestic helper voice
  const speakReply = (textToSpeak) => {
    if (!isSpeakerOn || !synthRef.current) return;
    
    try {
      synthRef.current.cancel();
      const cleanText = textToSpeak.replace(/[*#]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Select best voice: look for Indian Hindi / Marathi / Indian English female voices
      const voices = synthRef.current.getVoices ? synthRef.current.getVoices() : [];
      const indianVoice = voices.find(v => 
        (v.lang === 'hi-IN' || v.lang === 'hi_IN' || v.lang === 'mr-IN' || v.lang === 'en-IN') &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('swara') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('geeta') || v.name.toLowerCase().includes('kalpana'))
      ) || voices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('mr')) || voices.find(v => v.lang.includes('IN'));

      if (indianVoice) utterance.voice = indianVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.08;

      utterance.onstart = () => setMaidSpeaking(true);
      utterance.onend = () => setMaidSpeaking(false);
      utterance.onerror = () => setMaidSpeaking(false);

      synthRef.current.speak(utterance);
    } catch (e) {
      setMaidSpeaking(false);
    }
  };

  // Main Call Initiation Loop
  useEffect(() => {
    if (!maid) return;

    const callId = `CALL-${Date.now()}`;
    activeCallIdRef.current = callId;

    setCallState('ringing');
    setCallDuration(0);
    setMaidSpeaking(false);
    setUserSpokenText('');
    setIsHumanConnected(false);
    setIsMinimized(false);

    const initialGreeting = `Namaskar ji! Main ${maid.name} bol rahi hu Pune se. Sangaa, cooking ya ghar ki safai me kya help chahiye?`;
    setCurrentSpokenReply(initialGreeting);
    setCallTranscript([
      { sender: 'maid', text: initialGreeting, time: 'Connected' }
    ]);

    // Start realistic telecom ringtone
    startIndianRingbackTone();

    // Start WebRTC bridge signaling to Partner Dashboard
    webrtc.initiateCall(callId, maid.id, 'Customer in Pune').catch(console.error);

    // Listen if a real helper accepts the call in partner tab
    const unsubAccept = realtime.on('call_accepted', ({ callId: acceptedId }) => {
      if (acceptedId === activeCallIdRef.current) {
        stopIndianRingbackTone();
        playPickupChime();
        setCallState('connected');
        setIsHumanConnected(true);
        setActiveEngineBadge('Two-Way WebRTC Human Audio');
        showToast(`Connected to ${maid.name} via Live WebRTC HD Audio!`, 'success');
      }
    });

    // Realistic telecom connect: after ~2.4 seconds, AI domestic helper persona answers the call!
    const connectTimer = setTimeout(() => {
      stopIndianRingbackTone();
      playPickupChime();
      setCallState('connected');
      
      const badge = selectedAiModel.includes('astra') ? 'GPT-6 Astra' :
                    selectedAiModel.includes('groq') || selectedAiModel.includes('llama') ? 'Groq Llama 3.3 (100% Free)' :
                    selectedAiModel.includes('2.0') ? 'Gemini 2.0 Flash (100% Free)' : 
                    selectedAiModel.includes('1.5') ? 'Gemini 1.5 Flash (100% Free)' : 
                    selectedAiModel.includes('4o') ? 'GPT-4o' :
                    selectedAiModel.includes('sarvam') ? 'Sarvam AI Voice' : 'MaidEase Neural (Zero-Key)';
      setActiveEngineBadge(badge);

      // Warm spoken opening greeting
      speakReply(initialGreeting);
    }, 2400);

    return () => {
      clearTimeout(connectTimer);
      unsubAccept();
      stopIndianRingbackTone();
      if (synthRef.current) synthRef.current.cancel();
      webrtc.endCall(callId);
    };
  }, [maid]);

  // Call duration ticker
  useEffect(() => {
    let interval;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [callTranscript, currentSpokenReply]);

  // High-Quality Local Persona Fallback
  const getLocalPersonaReply = (query) => {
    const text = query.toLowerCase();
    if (text.includes('sun rahe') || text.includes('awaaz') || text.includes('voice') || text.includes('sunai') || text.includes('hear')) {
      return `Ji haan bhaiya, aapki awaaz bilkul saaf aa rahi hai, main sun rahi hu! Boliye aapko kya kaam karwana hai?`;
    }
    if (text.includes('hello') || text.includes('namaste') || text.includes('kaise ho') || text.includes('namaskar')) {
      return `Namaskar ji! Main ${maid?.name || 'Sunita'} bol rahi hu Pune se. Boliye khana banane ya safai me kya help chahiye?`;
    }
    if (text.includes('available') || text.includes('aa sakti') || text.includes('time') || text.includes('kab') || text.includes('kitni der') || text.includes('pahunch')) {
      return `Ji haan bhaiya, main abhi ${maid?.location || 'Pune'} ke paas hi hu. Bas ${maid?.etaMins || 18} minute me aapke doorstep par pahunch jaungi!`;
    }
    if (text.includes('price') || text.includes('kitna') || text.includes('charge') || text.includes('rate') || text.includes('rupaye') || text.includes('cost')) {
      return `Ek bar visit ka ₹${maid?.pricing?.oneTimeVisit || 329} charge lagega, jisme khana aur kitchen safai dono complete ho jayega.`;
    }
    if (text.includes('chapati') || text.includes('roti') || text.includes('khana') || text.includes('cook') || text.includes('bhakri') || text.includes('sabji')) {
      return `Ji bilkul! Main gol phulka chapati, jowar bhakri, dal tadka, veg aur paneer sab hygienic tarike se bana leti hu.`;
    }
    if (text.includes('safai') || text.includes('clean') || text.includes('bartan') || text.includes('jhadu') || text.includes('bathroom')) {
      return `Safai me pure ghar ka jhadu, pocha, bathroom scrubbing aur bartan chamkakar rakh dungi, aap befikra rahiye!`;
    }
    if (text.includes('police') || text.includes('verified') || text.includes('safe') || text.includes('aadhaar')) {
      return `Ji haan, mera police verification aur government Aadhaar dono verified hai. Aap bilkul nishchint reh sakte hain!`;
    }
    if (text.includes('nikal') || text.includes('book') || text.includes('confirm') || text.includes('turant') || text.includes('aajao')) {
      return `Theek hai ji, main apna kit lekar nikal rahi hu! Aap app par 'Confirm Book' daba dijiye taaki mujhe address mil jaye.`;
    }
    return `Ji bilkul bhaiya, main samajh gayi. Main ${maid?.location || 'Pune'} se nikalne ke liye taiyar hu, tasalli se pura kaam ho jayega!`;
  };

  // Send voice query to AI model
  const handleSendVoiceQuery = async (queryText) => {
    if (!queryText.trim()) return;
    setIsAiResponding(true);

    const userEntry = { sender: 'user', text: queryText, time: formatTimer(callDuration) };
    setCallTranscript(prev => [...prev, userEntry]);

    try {
      let reply = '';
      const effectiveModel = selectedAiModel || localStorage.getItem('maidease_ai_model') || 'gemini-2.0-flash';
      const effectiveGeminiKey = (customGeminiKey || localStorage.getItem('maidease_gemini_key') || '').trim();
      const effectiveGroqKey = (customGroqKey || localStorage.getItem('maidease_groq_key') || '').trim();
      const effectiveOpenAiKey = (customOpenAiKey || localStorage.getItem('maidease_openai_key') || '').trim();
      const effectiveSarvamKey = (customSarvamKey || localStorage.getItem('maidease_sarvam_key') || '').trim();

      let modelUsed = effectiveModel;

      try {
        const res = await api.getAICallReply({
          userMessage: queryText,
          maidId: maid.id,
          maidName: maid.name,
          openaiKey: effectiveOpenAiKey,
          apiKey: effectiveGeminiKey,
          geminiKey: effectiveGeminiKey,
          groqKey: effectiveGroqKey,
          sarvamKey: effectiveSarvamKey,
          preferredModel: effectiveModel
        });

        if (res && res.success && res.spokenReply) {
          reply = res.spokenReply;
          modelUsed = res.modelUsed || effectiveModel;

          // Dynamically reflect active engine
          const badgeText = modelUsed.includes('gemini') ? 'Gemini 2.0 Flash (Live AI)' :
                            modelUsed.includes('groq') || modelUsed.includes('llama') ? 'Groq Llama 3.3 (Live AI)' :
                            modelUsed.includes('gpt') || modelUsed.includes('astra') ? 'GPT-6 Astra (Live AI)' :
                            modelUsed.includes('sarvam') ? 'Sarvam AI (Live AI)' : 'MaidEase Neural';
          setActiveEngineBadge(badgeText);
        }
      } catch (e) {
        console.warn('Backend voice reply failed, using local persona:', e);
        reply = getLocalPersonaReply(queryText);
        modelUsed = 'local-multilingual-agent';
      }

      if (!reply) reply = getLocalPersonaReply(queryText);

      setCurrentSpokenReply(reply);
      setCallTranscript(prev => [
        ...prev, 
        { sender: 'maid', text: reply, time: formatTimer(callDuration), model: modelUsed }
      ]);

      // Speak response immediately
      speakReply(reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiResponding(false);
      setInCallTextInput('');
    }
  };

  // Keep ref synchronized
  useEffect(() => {
    handleSendVoiceQueryRef.current = handleSendVoiceQuery;
  });

  // Mic toggle for speaking
  const toggleMicListening = () => {
    if (!recognitionRef.current) {
      showToast('Microphone not supported in this browser. You can type in the box below!', 'info');
      return;
    }

    if (isListeningUser) {
      recognitionRef.current.stop();
      setIsListeningUser(false);
    } else {
      try {
        // Stop speech synthesizer if maid was speaking so user can speak
        if (synthRef.current) synthRef.current.cancel();
        setMaidSpeaking(false);

        recognitionRef.current.start();
        setIsListeningUser(true);
        showToast('Listening... Speak now in Hindi, Marathi, or English', 'info');
      } catch (e) {
        recognitionRef.current.stop();
        setIsListeningUser(false);
      }
    }
  };

  // End Call
  const handleEndCall = () => {
    stopIndianRingbackTone();
    playHangupBeeps();
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
        notes: `AI Voice Call (${activeEngineBadge})`
      }).catch(console.error);
    }

    showToast('Call ended', 'info');
    setTimeout(() => {
      setSelectedMaidForCall(null);
    }, 350);
  };

  // Instant Book from call
  const handleBookFromCall = () => {
    stopIndianRingbackTone();
    if (synthRef.current) synthRef.current.cancel();
    webrtc.endCall(activeCallIdRef.current);

    const currentMaid = maid;
    setSelectedMaidForCall(null);
    setSelectedMaidForBooking(currentMaid);
    showToast(`Redirecting to instant booking for ${currentMaid.name}...`, 'success');
  };

  // Format Call Timer MM:SS
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Real phone dialer test
  const handleDispatchToMyPhone = async () => {
    if (!testMobileNumber.trim()) {
      showToast('Please enter your mobile number (e.g. +91 9876543210)', 'error');
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
    showToast(`Calling ${testMobileNumber} directly via device dialer!`, 'success');
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

  // Save AI Configuration
  const handleSaveAiConfig = (e) => {
    e.preventDefault();
    const cleanGemini = customGeminiKey.trim();
    const cleanGroq = customGroqKey.trim();
    const cleanOpenAi = customOpenAiKey.trim();
    const cleanSarvam = customSarvamKey.trim();

    setCustomGeminiKey(cleanGemini);
    setCustomGroqKey(cleanGroq);
    setCustomOpenAiKey(cleanOpenAi);
    setCustomSarvamKey(cleanSarvam);

    localStorage.setItem('maidease_ai_model', selectedAiModel);
    localStorage.setItem('maidease_openai_key', cleanOpenAi);
    localStorage.setItem('maidease_gemini_key', cleanGemini);
    localStorage.setItem('maidease_groq_key', cleanGroq);
    localStorage.setItem('maidease_sarvam_key', cleanSarvam);

    const badge = selectedAiModel.includes('astra') ? 'GPT-6 Astra' :
                  selectedAiModel.includes('groq') || selectedAiModel.includes('llama') ? 'Groq Llama 3.3 (Free)' :
                  selectedAiModel.includes('2.0') ? 'Gemini 2.0 Flash (Free)' : 
                  selectedAiModel.includes('1.5') ? 'Gemini 1.5 Flash (Free)' : 
                  selectedAiModel.includes('4o') ? 'GPT-4o' :
                  selectedAiModel.includes('sarvam') ? 'Sarvam AI Voice' : 'MaidEase Neural';
    setActiveEngineBadge(badge);

    setShowModelConfig(false);
    showToast(`AI Model set to ${badge}!`, 'success');
  };

  if (!maid) return null;

  // -------------------------------------------------------------
  // MINIMIZED PICTURE-IN-PICTURE (PiP) CALL WIDGET
  // -------------------------------------------------------------
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[120] animate-fadeIn">
        <div className="flex items-center gap-3 bg-slate-900/95 border-2 border-emerald-500/50 p-3 rounded-2xl shadow-2xl backdrop-blur-xl text-white">
          <div className="relative">
            <img 
              src={maid.avatar} 
              alt={maid.name} 
              className="w-12 h-12 rounded-xl object-cover border border-emerald-400"
            />
            {maidSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">{maid.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                {formatTimer(callDuration)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
              {maidSpeaking ? '🔊 Speaking...' : '🟢 HD Call Active'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition"
              title="Expand Call View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleEndCall}
              className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-500 transition shadow"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL IMMERSIVE TELECOM CALLING MODAL (z-[100])
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-7 border border-white/20 shadow-2xl overflow-hidden flex flex-col justify-between max-h-[94vh] overflow-y-auto text-slate-100">
        
        {/* Ambient Pulsing Glow */}
        <div className={`absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl transition-all ${
          callState === 'connected' ? 'bg-emerald-500/25' : 'bg-cyan-500/25'
        }`} />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl bg-indigo-500/20" />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between z-10 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                callState === 'connected' ? 'bg-emerald-400' : 'bg-cyan-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                callState === 'connected' ? 'bg-emerald-500' : 'bg-cyan-500'
              }`} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {callState === 'ringing' 
                ? 'Ringing Pune Helper (VoIP Bridge)...' 
                : isHumanConnected 
                ? '🟢 Two-Way Human WebRTC Audio' 
                : `🟢 HD Voice Call • ${activeEngineBadge}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Model Config Trigger */}
            <button
              onClick={() => setShowModelConfig(!showModelConfig)}
              className="p-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition flex items-center gap-1 text-[11px] font-medium"
              title="Configure AI Models & Keys"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">AI Model</span>
            </button>

            {/* Minimize to PiP */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white transition"
              title="Minimize call (keep talking while tracking GPS)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close / Hangup */}
            <button
              onClick={handleEndCall}
              className="p-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-rose-400 transition"
              title="End Call"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Model Configuration Drawer (Expandable) */}
        {showModelConfig && (
          <form onSubmit={handleSaveAiConfig} className="z-20 my-2 p-4 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-3 animate-fadeIn text-xs">
            <div className="flex items-center justify-between font-bold text-purple-300">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Select Real-Time AI Model</span>
              </span>
              <button 
                type="button" 
                onClick={() => setShowModelConfig(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 text-[11px] font-semibold">Active AI Conversational Engine:</label>
              <select
                value={selectedAiModel}
                onChange={(e) => setSelectedAiModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-400 text-xs"
              >
                <option value="gemini-2.0-flash">🌟 Google Gemini 2.0 Flash (100% FREE • Voice + Vision • No Card)</option>
                <option value="groq-llama-3.3">⚡ Groq Cloud Llama 3.3 (100% FREE • 350 tok/sec Ultra-Fast)</option>
                <option value="local-multilingual-agent">🛡️ MaidEase Pune Neural Agent (100% FREE • No Key Needed)</option>
                <option value="gpt-6-astra">🚀 OpenAI GPT-6 Astra (Flagship • Requires Paid OpenAI Key)</option>
                <option value="gpt-4o">OpenAI GPT-4o (Omni Multimodal • Paid Key)</option>
                <option value="sarvam-2b">Sarvam AI (Indian Regional Languages & Indic Voice)</option>
              </select>
            </div>

            {/* Quick Free Key Helpers */}
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200 space-y-1">
              <p className="font-semibold text-white flex items-center gap-1">
                <span>🎁 Need a 100% Free Real-Time Key? (Zero Cost, No Credit Card):</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a 
                  href="https://aistudio.google.com/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-medium text-[10px] transition inline-flex items-center gap-1"
                >
                  <span>🔑 Get Free Gemini Key (aistudio.google.com)</span>
                </a>
                <a 
                  href="https://console.groq.com/keys" 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-2 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 font-medium text-[10px] transition inline-flex items-center gap-1"
                >
                  <span>⚡ Get Free Groq Key (console.groq.com)</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-slate-400 text-[10px] flex items-center justify-between">
                  <span>Gemini Key (100% FREE Tier):</span>
                  <span className="text-emerald-400 text-[9px] font-semibold">Recommended</span>
                </label>
                <input
                  type="password"
                  value={customGeminiKey}
                  onChange={(e) => setCustomGeminiKey(e.target.value)}
                  placeholder="AIzaSy... (Free from aistudio.google.com)"
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px] flex items-center justify-between">
                  <span>Groq Key (100% FREE Real-Time):</span>
                  <span className="text-cyan-400 text-[9px] font-semibold">Ultra Fast</span>
                </label>
                <input
                  type="password"
                  value={customGroqKey}
                  onChange={(e) => setCustomGroqKey(e.target.value)}
                  placeholder="gsk_... (Free from console.groq.com)"
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">OpenAI Key (Paid for GPT-6 Astra):</label>
                <input
                  type="password"
                  value={customOpenAiKey}
                  onChange={(e) => setCustomOpenAiKey(e.target.value)}
                  placeholder="sk-proj-... (Paid on platform.openai.com)"
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] outline-none"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[10px]">Sarvam AI Key (Optional):</label>
                <input
                  type="password"
                  value={customSarvamKey}
                  onChange={(e) => setCustomSarvamKey(e.target.value)}
                  placeholder="api-key-here..."
                  className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                💡 No key? <b>MaidEase Pune Neural Agent</b> runs free forever!
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition"
              >
                Apply Model
              </button>
            </div>
          </form>
        )}

        {/* Center: Maid Profile & Live Waveform */}
        <div className="my-auto text-center py-2 z-10 flex flex-col items-center">
          
          <div className="relative mb-2">
            {callState === 'ringing' && (
              <>
                <div className="absolute inset-0 -m-3 rounded-full border-2 border-cyan-400/50 animate-ping" />
                <div className="absolute inset-0 -m-6 rounded-full border border-cyan-400/30 animate-pulse" />
              </>
            )}
            {callState === 'connected' && maidSpeaking && (
              <>
                <div className="absolute inset-0 -m-3 rounded-full border-2 border-emerald-400/70 animate-pulse shadow-lg shadow-emerald-500/40" />
                <div className="absolute inset-0 -m-5 rounded-full border border-emerald-500/30 animate-ping" />
              </>
            )}

            <img
              src={maid.avatar}
              alt={maid.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-slate-800 shadow-2xl relative z-10"
            />

            {maid.verified?.police && (
              <div className="absolute bottom-0 right-0 z-20 p-1.5 rounded-full bg-emerald-500 text-slate-950 shadow-md" title="Police Verified Pune Helper">
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-heading text-white">{maid.name}</h2>
          <p className="text-xs text-slate-300 flex items-center justify-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{maid.location}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold">ETA ~{maid.etaMins || 18} mins</span>
          </p>

          {/* Call Status & Live Timer */}
          <div className="mt-2.5">
            {callState === 'ringing' ? (
              <div className="flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold animate-pulse">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>Ringing helper device...</span>
                </div>
                <button
                  onClick={() => {
                    stopIndianRingbackTone();
                    playPickupChime();
                    setCallState('connected');
                    speakReply(currentSpokenReply);
                  }}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow transition"
                >
                  Pick Up Call Now
                </button>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.2 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTimer(callDuration)}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-normal">• HD Voice Active</span>
              </div>
            )}
          </div>

          {/* Dynamic Audio Waveform Equalizer */}
          {callState === 'connected' && (
            <div className="flex items-center justify-center gap-1.5 my-3 h-6">
              {[60, 90, 40, 100, 75, 45, 85, 30, 95, 50, 80, 65].map((height, idx) => (
                <span
                  key={idx}
                  style={{
                    height: maidSpeaking 
                      ? `${Math.max(6, (height * 0.22))}px` 
                      : isListeningUser 
                      ? `${Math.max(6, (height * 0.18))}px` 
                      : '4px'
                  }}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    maidSpeaking 
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400' 
                      : isListeningUser
                      ? 'bg-purple-400 shadow-sm shadow-purple-400'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Spoken Reply Bubble & Dialogue Transcript */}
          {callState === 'connected' && (
            <div className="w-full bg-slate-900/90 border border-emerald-500/30 p-3.5 rounded-2xl text-left shadow-inner relative animate-fadeIn max-h-36 overflow-y-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{maid.name} ({isHumanConnected ? 'Live Partner' : 'AI Voice Assistant'}):</span>
                </span>
                {maidSpeaking && <span className="text-[10px] text-emerald-300 animate-pulse font-semibold">🔊 Speaking...</span>}
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed italic">
                "{currentSpokenReply}"
              </p>

              {userSpokenText && (
                <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-purple-300 flex items-center gap-1">
                  <Mic className="w-3 h-3 text-purple-400" />
                  <span>You: "{userSpokenText}"</span>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>
          )}

          {/* Quick Inquiry Chips (Interactive Hindi/Marathi Voice Queries) */}
          {callState === 'connected' && (
            <div className="mt-2.5 w-full">
              <div className="flex flex-wrap gap-1.5 justify-start">
                {quickInquiries.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setUserSpokenText(q.text);
                      handleSendVoiceQuery(q.text);
                    }}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-800/80 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-500/40 border border-slate-700 transition active:scale-95"
                  >
                    💬 {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In-Call Text Input for noisy places */}
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
                placeholder="Type question in call (e.g. Kya aap Kothrud aa sakti ho?)..."
                className="flex-1 px-3 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 outline-none focus:border-emerald-400"
              />
              <button
                disabled={!inCallTextInput.trim() || isAiResponding}
                onClick={() => {
                  if (inCallTextInput.trim()) {
                    setUserSpokenText(inCallTextInput);
                    handleSendVoiceQuery(inCallTextInput);
                  }
                }}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl disabled:opacity-40 transition flex items-center gap-1"
              >
                {isAiResponding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Real Mobile Calling (Tested for Real Market) */}
        <div className="z-10 mt-2 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Real Market Mobile Call Dispatch</span>
            </span>
            <span className="text-[10px] text-slate-400">Dial on your SIM phone</span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="tel"
              value={testMobileNumber}
              onChange={(e) => setTestMobileNumber(e.target.value)}
              placeholder="Enter your phone (e.g. +91 9876543210)"
              className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-indigo-500/40 rounded-xl text-white outline-none"
            />
            <button
              onClick={handleDispatchToMyPhone}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 shadow"
              title="Open phone dialer with number"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call Phone</span>
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

        {/* Bottom Call Action Controls */}
        <div className="z-10 pt-3 border-t border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-center gap-3">
            {/* Mic Toggle Button */}
            <button
              onClick={toggleMicListening}
              className={`p-3 rounded-2xl border transition flex items-center justify-center ${
                isListeningUser
                  ? 'bg-purple-600 text-white animate-pulse border-purple-400 shadow-lg shadow-purple-500/40'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isListeningUser ? 'Listening... click to stop' : 'Tap to speak to helper'}
            >
              {isListeningUser ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white hover:opacity-90 shadow-lg shadow-rose-600/30 transition transform hover:scale-105 active:scale-95"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Speaker Toggle Button */}
            <button
              onClick={() => {
                const nextSpeaker = !isSpeakerOn;
                setIsSpeakerOn(nextSpeaker);
                if (!nextSpeaker && synthRef.current) synthRef.current.cancel();
              }}
              className={`p-3.5 rounded-2xl border transition ${
                !isSpeakerOn ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title={isSpeakerOn ? 'Speaker On (click to mute audio)' : 'Speaker Muted'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Instant Booking From Call */}
            <button
              onClick={handleBookFromCall}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:opacity-95 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Confirm Book (₹{maid.pricing?.oneTimeVisit || 329})</span>
            </button>
          </div>

          {/* Quick Direct Helper Contacts */}
          <div className="flex items-center justify-between text-xs bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Direct telecom dials:</span>
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
