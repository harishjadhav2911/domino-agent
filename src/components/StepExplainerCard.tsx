import React from 'react';
import { Eye, Terminal, Sparkles, Lightbulb } from 'lucide-react';

export interface StepExplainerProps {
  stepNum: string;
  title: string;
  hindiText: string;
  englishText: string;
  observe: string;
  technical: string;
  presentationTip: string;
  badge?: string;
  highlights?: string[];
  workflowTiers?: { label: string; mode: string; color: string }[];
}

export const StepExplainerCard: React.FC<StepExplainerProps> = ({
  stepNum,
  title,
  hindiText,
  englishText,
  observe,
  technical,
  presentationTip,
  badge,
  highlights,
  workflowTiers,
}) => {
  return (
    <div className="w-full card-premium p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm mb-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3.5 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            WHAT HAPPENS IN THIS STEP?
          </span>
          <span className="text-xs font-mono-code font-bold text-slate-500">
            {stepNum}
          </span>
        </div>

        {badge && (
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-0.5 rounded-full shadow-2xs">
            {badge}
          </span>
        )}
      </div>

      {/* Main Step Title */}
      <h3 className="text-base sm:text-lg font-black text-slate-900 font-display tracking-tight mb-3">
        {title}
      </h3>

      {/* 2-Column or Stacked Explanation Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Left: Explanations (Hindi + English) */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
            <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-800 block mb-1">
              HINDI SUMMARY
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              "{hindiText}"
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            <strong className="text-indigo-950 font-semibold">Technical Purpose: </strong>
            {englishText}
          </div>
        </div>

        {/* Right: Observe & Technical Metadata */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider">
                WHAT TO OBSERVE
              </span>
            </div>
            <span className="text-xs font-bold text-slate-900 font-mono-code block">
              {observe}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
              <Terminal className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider">
                UNDERLYING ENGINE
              </span>
            </div>
            <span className="text-xs font-bold text-indigo-700 font-mono-code block">
              {technical}
            </span>
          </div>
        </div>
      </div>

      {/* Optional Highlight Bullets (e.g. for Step 5 / Step 7) */}
      {highlights && highlights.length > 0 && (
        <div className="mb-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono-code flex flex-wrap items-center gap-3 text-slate-700">
          <span className="font-bold text-slate-900 font-sans uppercase text-[10px]">KEY ELEMENTS:</span>
          {highlights.map((h, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold">
              • {h}
            </span>
          ))}
        </div>
      )}

      {/* Optional Decision Tiers (e.g. for Step 6) */}
      {workflowTiers && workflowTiers.length > 0 && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono-code font-bold">
          {workflowTiers.map((tier, i) => (
            <div key={i} className={`p-2.5 rounded-xl border flex items-center justify-between ${tier.color}`}>
              <span>{tier.label}</span>
              <span className="text-[10px] uppercase font-mono-code opacity-80">→ {tier.mode}</span>
            </div>
          ))}
        </div>
      )}

      {/* Presentation Tip Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-left flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <Lightbulb className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
            PRESENTATION TIP (JUDGES WALKTHROUGH)
          </span>
          <p className="text-xs sm:text-sm font-bold text-amber-950 font-display">
            "{presentationTip}"
          </p>
        </div>
      </div>
    </div>
  );
};
