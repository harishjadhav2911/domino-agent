import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Play, 
  Zap,
  AlertTriangle
} from 'lucide-react';

export function WhyDominoSection() {
  const [activeCascadeIndex, setActiveCascadeIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

  // Subtle domino cascade animation ticker
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveCascadeIndex((prev) => (prev + 1) % 6);
    }, 1200);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const dominoExpansion = [
    { letter: 'D', word: 'Dependency', desc: 'Directed temporal edges connecting events' },
    { letter: 'O', word: 'Oriented', desc: 'Targeted recovery towards high-priority goals' },
    { letter: 'M', word: 'Multi-event', desc: 'Simultaneous reasoning over 6+ journey legs' },
    { letter: 'I', word: 'Impact &', desc: 'Causal blast radius shockwave calculation' },
    { letter: 'N', word: 'Network', desc: '7 specialized autonomous cooperative agents' },
    { letter: 'O', word: 'Optimization', desc: 'Feasibility-proven counterfactual replanning' },
  ];

  const travelDominoChain = [
    { name: 'FLIGHT DELAY', icon: '✈️', tag: 'Root Trigger', color: 'border-red-300 bg-red-50 text-red-800' },
    { name: 'CONNECTION', icon: '🔄', tag: 'MCT Buffer', color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { name: 'TRANSFER', icon: '🚕', tag: 'Chauffeur', color: 'border-blue-300 bg-blue-50 text-blue-800' },
    { name: 'HOTEL', icon: '🏨', tag: 'Check-in Hold', color: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
    { name: 'MEETING', icon: '💼', tag: 'High Priority', color: 'border-purple-300 bg-purple-50 text-purple-800' },
    { name: 'WORKSHOP', icon: '🎓', tag: 'Day 2 Keynote', color: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
  ];

  const scenarioSteps = [
    { step: 'Flight Delay', desc: '+120m on Nagpur AI-428', icon: '✈️', status: 'BROKEN' },
    { step: 'Connection Missed', desc: 'Delhi T3 gate closes', icon: '❌', status: 'BROKEN' },
    { step: 'Transfer Affected', desc: 'Mumbai pickup delayed', icon: '⚠️', status: 'BROKEN' },
    { step: 'Hotel Timing Changed', desc: 'St. Regis late hold', icon: '🏨', status: 'AT_RISK' },
    { step: 'Meeting At Risk', desc: '18:00 VP Singhania meeting', icon: '💼', status: 'AT_RISK' },
    { step: 'Downstream Impact', desc: 'Whole schedule cascades', icon: '💥', status: 'CASCADE' },
  ];

  return (
    <div className="w-full text-left mb-8 animate-fadeIn">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full font-mono-code flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              PROJECT IDENTITY & ARCHITECTURE
            </span>
            <span className="text-xs text-slate-500 font-mono-code font-semibold">
              • Hindi + English Guide
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
            WHY DOMINO?
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5 font-medium">
            "One disruption. A chain of consequences."
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsAutoPlaying(!isAutoPlaying);
            }}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            {isAutoPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>CASCADE ACTIVE</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-indigo-600" />
                <span>PLAY CASCADE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="card-premium p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-7">
        
        {/* ======================================================== */}
        {/* 1. PROJECT-SPECIFIC EXPANSION CARDS (D O M I N O)        */}
        {/* ======================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              PROJECT NAME EXPANSION
            </span>
            <span className="text-[11px] font-mono-code font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              Project-specific expansion
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {dominoExpansion.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center font-display shadow-sm shadow-indigo-600/20 mb-2">
                    {item.letter}
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight">
                    {item.word}
                  </h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mt-2 pt-2 border-t border-slate-100 font-sans">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. MEANING — HINDI                                       */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100/80 px-2.5 py-0.5 rounded-full border border-indigo-200">
              🇮🇳 MEANING — HINDI
            </span>
          </div>

          <div className="space-y-2 text-slate-900 font-sans text-xs sm:text-sm leading-relaxed">
            <p className="font-bold font-display text-sm sm:text-base text-slate-950">
              "DOMINO नाम Domino Effect से inspired है."
            </p>
            <p className="font-medium text-slate-800">
              Domino Effect में एक domino गिरने पर उसके कारण अगला domino गिरता है, और फिर एक chain reaction शुरू होती है.
            </p>
            <p className="font-medium text-slate-800">
              ठीक उसी तरह travel journey में एक छोटी disruption, जैसे flight delay, केवल एक flight को affect नहीं करती.
            </p>
            <p className="font-semibold text-indigo-950">
              उसका impact आगे की पूरी dependency chain पर जा सकता है.
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. VISUAL CASCADE: THE DOMINO EFFECT IN TRAVEL           */}
        {/* ======================================================== */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              THE DOMINO EFFECT IN TRAVEL
            </span>
            <span className="text-[11px] text-slate-500 font-mono-code">
              Subtle cascading chain reaction simulation
            </span>
          </div>

          {/* 6 Domino Tiles with cascading highlight */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {travelDominoChain.map((tile, idx) => {
              const isCascading = activeCascadeIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveCascadeIndex(idx)}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                    isCascading
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border-indigo-600 scale-[1.03] ring-2 ring-indigo-300'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{tile.icon}</span>
                      <span className={`text-[9px] font-mono-code font-bold px-1.5 py-0.5 rounded-md ${
                        isCascading ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        LEG 0{idx + 1}
                      </span>
                    </div>

                    <h4 className={`text-xs font-black font-display tracking-tight uppercase ${
                      isCascading ? 'text-white' : 'text-slate-900'
                    }`}>
                      {tile.name}
                    </h4>
                  </div>

                  <div className={`mt-3 pt-2 border-t text-[10px] font-mono-code flex items-center justify-between ${
                    isCascading ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-500'
                  }`}>
                    <span>{tile.tag}</span>
                    <span className="text-xs">↓</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. REAL DEMO SCENARIO EXAMPLE                            */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono-code">
              EXAMPLE: "अगर Nagpur → Delhi flight 120 minutes late होती है..."
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 my-3.5">
            {scenarioSteps.map((item, idx) => (
              <div 
                key={idx} 
                className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base">{item.icon}</span>
                    <span className={`text-[9px] font-mono-code font-bold px-1.5 py-0.2 rounded ${
                      item.status === 'BROKEN'
                        ? 'bg-red-50 text-red-700'
                        : item.status === 'AT_RISK'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 leading-tight">
                    {item.step}
                  </h5>
                </div>
                <p className="text-[10px] text-slate-500 font-mono-code mt-1.5 pt-1.5 border-t border-slate-100">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-xs text-indigo-950 font-semibold font-sans">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>"यही chain reaction DOMINO detect, trace और recover करता है."</span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. WHY THIS NAME FITS OUR SYSTEM                         */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Hindi */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-700 block mb-1.5">
              WHY THIS NAME FITS OUR SYSTEM (HINDI)
            </span>
            <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed font-sans">
              "हमारा system सिर्फ disrupted event को reschedule नहीं करता. यह देखता है कि उस disruption के कारण आगे कौन-कौन से events प्रभावित होंगे, उनकी dependency trace करता है, Causal Blast Radius calculate करता है, और फिर feasible recovery plan बनाता है."
            </p>
          </div>

          {/* English */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
              WHY THIS NAME FITS OUR SYSTEM (ENGLISH)
            </span>
            <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed font-sans">
              "DOMINO models the chain reaction caused by a travel disruption. It traces downstream dependencies, calculates the causal blast radius, and builds a feasible recovery plan."
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. HIGHLIGHTED SIGNATURE QUOTE                           */}
        {/* ======================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white text-center shadow-md">
          <div className="inline-block px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-code text-[10px] font-bold uppercase tracking-wider mb-2 border border-indigo-400/20">
            CORE PHILOSOPHY
          </div>
          <h4 className="text-base sm:text-xl font-black font-display tracking-tight text-white mb-1.5">
            "DOMINO doesn't just reschedule the flight. It reschedules the consequences."
          </h4>
          <p className="text-indigo-200 text-xs sm:text-sm font-medium font-sans">
            "DOMINO सिर्फ flight को reschedule नहीं करता, बल्कि उसके consequences को trace करके पूरी journey को recover करता है."
          </p>
        </div>

      </div>
    </div>
  );
}
