import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Sparkles, Bot, Mic, MicOff, Send, CheckCircle2, 
  MapPin, Star, Clock, ShieldCheck, ArrowRight, X, 
  PhoneCall, Calendar, Zap, RefreshCw, HeartHandshake
} from 'lucide-react';

export default function AIAgentAssistant() {
  const { 
    isAIAssistantOpen, 
    setIsAIAssistantOpen, 
    setSelectedMaidForBooking, 
    setSelectedMaidForCall,
    showToast 
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const recognitionRef = useRef(null);

  // Quick Starter Prompts
  const quickPrompts = [
    "Mujhe aaj raat ke liye 2 BHK me khana banane wali maid chahiye Indiranagar me",
    "Deep house cleaning & dishwashing for 3 BHK under ₹400",
    "Babysitting and elderly care with police verified background"
  ];

  // Setup Web Speech API for voice input
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Supports Hindi/Hinglish/English

      recognition.onresult = (event) => {
        const spoken = event.results[0][0].transcript;
        setInputPrompt(spoken);
        setIsListening(false);
        handleProcessPrompt(spoken);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        showToast('Mic error: Please type your request or enable mic access', 'info');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      showToast('Speech recognition not supported in this browser. Please type below.', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Listening... Speak your requirement in Hindi or English', 'info');
      } catch (e) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  const handleProcessPrompt = async (promptText) => {
    const query = promptText || inputPrompt;
    if (!query.trim()) return;

    setIsProcessing(true);
    try {
      const res = await api.matchAIAgent(query);
      if (res.success) {
        setAiResult(res);
        setConversationHistory(prev => [
          ...prev,
          { sender: 'user', text: query },
          { sender: 'agent', reasoning: res.aiReasoning, topMatch: res.topMatch, checklist: res.suggestedChecklist }
        ]);
        setInputPrompt('');
      }
    } catch (err) {
      showToast('AI Agent failed to process. Retrying with default matches.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAIAssistantOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900/95 border border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden text-slate-100">
        
        {/* Glowing Top Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-blue-900/80 border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">MaidEase Sakhi</h3>
                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-500/20 border border-purple-400/40 text-purple-300 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" /> AI Agent
                </span>
              </div>
              <p className="text-xs text-purple-200/80">Autonomous Natural Language Maid Matcher & Dispatcher</p>
            </div>
          </div>

          <button 
            onClick={() => setIsAIAssistantOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Welcome Card if no results yet */}
          {!aiResult && conversationHistory.length === 0 && (
            <div className="text-center py-6 px-4 rounded-2xl bg-purple-950/30 border border-purple-500/20">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-base font-semibold text-white">Ask anything in Hinglish, Hindi, or English</h4>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                "Mujhe aaj raat ke liye 2 BHK me khana banane wali maid chahiye..." Bolkar ya likhkar batayein, AI turant best verified helper match karega!
              </p>

              {/* Quick Prompts */}
              <div className="mt-5 flex flex-col gap-2">
                <span className="text-xs font-medium text-purple-300/80 uppercase tracking-wider">Try saying:</span>
                {quickPrompts.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputPrompt(qp);
                      handleProcessPrompt(qp);
                    }}
                    className="text-left text-xs bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700/60 hover:border-purple-500/40 p-3 rounded-xl transition text-slate-300 hover:text-white flex items-center justify-between"
                  >
                    <span>"{qp}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Result Card */}
          {aiResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Reasoning Box */}
              <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex gap-3">
                <Bot className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-sm text-slate-200 leading-relaxed">
                  <p className="font-semibold text-indigo-300 mb-1">AI Match Analysis:</p>
                  {aiResult.aiReasoning}
                </div>
              </div>

              {/* Extracted Parameters Tag Cloud */}
              <div className="flex flex-wrap gap-2 text-xs">
                {aiResult.queryAnalysis?.detectedServices?.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg">
                    ✓ {s}
                  </span>
                ))}
                <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg">
                  🏠 {aiResult.queryAnalysis?.bhk} BHK
                </span>
                {aiResult.queryAnalysis?.isVeg && (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
                    🥦 Pure Veg / Diet
                  </span>
                )}
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg">
                  ⚡ Auto-Dispatch Ready
                </span>
              </div>

              {/* Matched Maid Card */}
              {aiResult.topMatch && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-emerald-500/50 shadow-xl relative overflow-hidden">
                  <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs rounded-full flex items-center gap-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    {aiResult.topMatch.matchPercent}% Match
                  </div>

                  <div className="flex items-start gap-4">
                    <img 
                      src={aiResult.topMatch.maid.avatar} 
                      alt={aiResult.topMatch.maid.name} 
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400/60 shadow-md"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{aiResult.topMatch.maid.name}</h4>
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-400" /> Police Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{aiResult.topMatch.maid.tagline}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current" /> {aiResult.topMatch.maid.rating}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" /> {aiResult.topMatch.maid.distanceKm} km
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <Clock className="w-3.5 h-3.5" /> {aiResult.topMatch.maid.etaMins} mins ETA
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Match Reasons */}
                  <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    {aiResult.topMatch.reasons.map((r, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Instant Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsAIAssistantOpen(false);
                        setSelectedMaidForBooking(aiResult.topMatch.maid);
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
                    >
                      <Zap className="w-4 h-4" />
                      Instant Dispatch (₹{aiResult.topMatch.maid.pricing.oneTimeVisit})
                    </button>

                    <button
                      onClick={() => {
                        setIsAIAssistantOpen(false);
                        setSelectedMaidForCall(aiResult.topMatch.maid);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Voice Call
                    </button>
                  </div>
                </div>
              )}

              {/* AI Housework Checklist */}
              {aiResult.suggestedChecklist && (
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-purple-400" />
                    AI Recommended Visit Checklist
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {aiResult.suggestedChecklist.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
          {/* Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`p-3 rounded-2xl transition flex items-center justify-center ${
              isListening 
                ? 'bg-red-500 text-white animate-ping shadow-lg shadow-red-500/50' 
                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30'
            }`}
            title={isListening ? "Listening... click to stop" : "Click to speak in Hindi/English"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleProcessPrompt()}
            placeholder={isListening ? "Listening to your voice..." : "E.g. Mujhe 2 BHK me khana banane aur dusting ke liye maid chahiye..."}
            className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />

          {/* Submit Button */}
          <button
            disabled={isProcessing || !inputPrompt.trim()}
            onClick={() => handleProcessPrompt()}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shadow-lg shadow-purple-500/20"
          >
            {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
