import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Camera, Upload, Sparkles, CheckCircle2, AlertTriangle, 
  Clock, DollarSign, ShieldCheck, MapPin, X, PhoneCall, Zap, 
  RefreshCw, Scan, Layers, FileImage, ArrowRight, Eye
} from 'lucide-react';

const PRESET_SAMPLES = [
  {
    id: 'kitchen-sink',
    title: 'Messy Kitchen & Sink',
    subtitle: 'Oil grease on stove + 15+ unwashed dishes',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
    tag: 'Cooking & Bartan'
  },
  {
    id: 'living-room',
    title: '2 BHK Living Room Dust',
    subtitle: 'High floor dust, cluttered coffee table & sofa',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    tag: 'Deep Sweeping & Mopping'
  },
  {
    id: 'bathroom',
    title: 'Bathroom Hard Water Tiles',
    subtitle: 'Soap scum, floor grout & mirror scale stains',
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=600&auto=format&fit=crop&q=80',
    tag: 'Bathroom Scrubbing'
  }
];

export default function VLMJobScannerModal() {
  const { 
    isVLMScannerOpen, 
    setIsVLMScannerOpen, 
    setSelectedMaidForCall, 
    setSelectedMaidForBooking, 
    showToast,
    maids 
  } = useApp();

  const [selectedImage, setSelectedImage] = useState(PRESET_SAMPLES[0].image);
  const [selectedSampleId, setSelectedSampleId] = useState('kitchen-sink');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isVLMScannerOpen) return null;

  // Handle local image upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setSelectedSampleId('custom-upload');
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Vision-Language Model Analysis
  const handleAnalyzePhoto = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await api.analyzeRoomPhoto({
        image: selectedImage,
        prompt: customPrompt,
        sampleId: selectedSampleId,
        preferredModel: localStorage.getItem('maidease_ai_model') || 'gemini-2.0-flash',
        apiKey: localStorage.getItem('maidease_gemini_key') || '',
        openaiKey: localStorage.getItem('maidease_openai_key') || ''
      });

      if (res && res.success) {
        setScanResult(res);
        showToast('🎉 VLM Inspection Complete! Chores & Price calculated.', 'success');
      } else {
        showToast('VLM scan could not parse image. Please try again.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Scan error. Local neural heuristic applied!', 'info');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBookScannedJob = () => {
    if (!scanResult) return;
    const target = maids.find(m => m.id === scanResult.matchedHelper?.id) || maids[0];
    setIsVLMScannerOpen(false);
    setSelectedMaidForBooking(target);
    showToast(`Proceeding to instant booking with ${target.name} for ₹${scanResult.analysis?.suggestedPrice || 329}!`, 'success');
  };

  const handleCallScannedJob = () => {
    if (!scanResult) return;
    const target = maids.find(m => m.id === scanResult.matchedHelper?.id) || maids[0];
    setIsVLMScannerOpen(false);
    setSelectedMaidForCall(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl glass-panel rounded-3xl p-5 sm:p-7 border border-white/20 shadow-2xl overflow-y-auto max-h-[94vh] text-slate-100">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
              <Eye className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-heading text-white">
                  AI Room & Kitchen Photo Scanner
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  Multimodal VLM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Snap or upload a photo of your kitchen, room, or dishes. AI visual model detects chores, cleaning difficulty & fair price instantly!
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsVLMScannerOpen(false)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Sample Cards Grid */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Choose a Room Photo to Inspect:</span>
            <span className="text-[11px] text-slate-500">Click any preset sample or upload your own</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRESET_SAMPLES.map((sample) => (
              <div
                key={sample.id}
                onClick={() => {
                  setSelectedImage(sample.image);
                  setSelectedSampleId(sample.id);
                  setScanResult(null);
                }}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                  selectedSampleId === sample.id
                    ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={sample.image}
                  alt={sample.title}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">
                    {sample.tag}
                  </span>
                  <h4 className="text-xs font-bold text-white truncate mt-1">{sample.title}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{sample.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image Preview & Scanner Visualizer */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Image Canvas with HUD Scanline */}
          <div className="lg:col-span-6 space-y-3">
            <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 aspect-video flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Selected Area to Scan"
                className="w-full h-full object-cover"
              />

              {/* Laser Scan HUD overlay when scanning */}
              {isScanning && (
                <div className="absolute inset-0 bg-purple-900/20 backdrop-blur-[1px] flex flex-col justify-between p-3 pointer-events-none">
                  <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 font-bold">
                    <span>VLM SCANNER RUNNING</span>
                    <span>DETECTING CLUTTER & GREASE</span>
                  </div>
                  
                  {/* Moving Scan Beam */}
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce shadow-lg shadow-cyan-400/80" />
                  
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300 font-bold">
                    <span>GEMINI MULTIMODAL ACTIVE</span>
                    <span>FPS: 60 • RESOLUTION: HD</span>
                  </div>
                </div>
              )}

              {/* HUD Target corners */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-purple-400 pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-purple-400 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-purple-400 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-purple-400 pointer-events-none" />
            </div>

            {/* Custom Notes & Actions */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Optional notes (e.g. Needs deep scrubbing before 7 PM)..."
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-purple-400 placeholder:text-slate-500"
              />

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                title="Upload Photo from Phone/PC"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload</span>
              </button>

              <button
                onClick={handleAnalyzePhoto}
                disabled={isScanning}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-60"
              >
                {isScanning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-3.5 h-3.5" />
                    <span>Run VLM Scan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: VLM Output Results & Matching Card */}
          <div className="lg:col-span-6 space-y-3">
            {!scanResult && !isScanning ? (
              <div className="h-full min-h-[220px] rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center text-slate-400">
                <Sparkles className="w-10 h-10 text-purple-400 mb-2 animate-pulse" />
                <h4 className="text-sm font-bold text-white">Ready for Vision Inspection</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Click <strong>"Run VLM Scan"</strong> to extract chore list, required cleaning effort & instant price estimation using Vision AI.
                </p>
              </div>
            ) : isScanning ? (
              <div className="h-full min-h-[220px] rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 animate-spin">
                  <Scan className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Scanning Visual Surface Telemetry...</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Gemini Multimodal VLM is classifying room & estimating tasks</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-fadeIn">
                {/* Cleanliness Score & Target Area */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-300">
                      {scanResult.analysis?.roomType}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                      Cleanliness Index: {scanResult.analysis?.cleanlinessRating} / 10
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 italic">
                    "{scanResult.analysis?.aiAnalysis}"
                  </p>

                  <div className="flex items-center gap-4 text-xs pt-1 border-t border-slate-800 text-slate-400">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{scanResult.analysis?.estimatedMinutes} Mins Needed</span>
                    </span>
                    <span className="flex items-center gap-1 font-black text-white text-sm">
                      <span>Suggested Price:</span>
                      <span className="text-emerald-400 font-heading">₹{scanResult.analysis?.suggestedPrice}</span>
                    </span>
                  </div>
                </div>

                {/* Detected Chores Checklist */}
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AI Detected Chores & Sanitation Items</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {scanResult.analysis?.detectedTasks?.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/80 text-[11px] text-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span className="truncate">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matched Pune Helper Card */}
                {scanResult.matchedHelper && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={scanResult.matchedHelper.avatar}
                        alt={scanResult.matchedHelper.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-emerald-400"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">
                            {scanResult.matchedHelper.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            {scanResult.matchedHelper.rating}★
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {scanResult.matchedHelper.location} • ~{scanResult.matchedHelper.etaMins} min ETA
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={handleCallScannedJob}
                        className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition shadow"
                        title="Call Helper Directly"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleBookScannedJob}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs shadow transition flex items-center gap-1 hover:opacity-95"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Book ₹{scanResult.analysis?.suggestedPrice}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
