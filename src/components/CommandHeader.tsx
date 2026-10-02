import React from 'react';
import { 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  PlaneTakeoff, 
  Sparkles 
} from 'lucide-react';

interface CommandHeaderProps {
  delayMinutes: number;
  onReset: () => void;
  brokenCount: number;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  delayMinutes,
  onReset,
  brokenCount,
  isDemoMode,
  onToggleDemoMode,
}) => {
  return (
    <header className="w-full bg-[#0a0d17]/95 border-b border-slate-800/80 px-6 py-3 backdrop-blur-xl sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          D
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white font-display">
              DOMINO
            </h1>
            <span className="text-[11px] text-slate-400">
              — Dependency-Aware Disruption Agent
            </span>
          </div>
          <p className="text-xs text-indigo-400 font-medium flex items-center gap-1.5">
            <PlaneTakeoff className="w-3.5 h-3.5" /> Trip: Nagpur → Delhi → Mumbai
          </p>
        </div>
      </div>

      {/* Center Status Indicator */}
      <div className="flex items-center gap-3">
        {brokenCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-semibold animate-pulse">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>DISRUPTION: +{delayMinutes}m Flight Delay</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>TRIP ON SCHEDULE (0m delay)</span>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleDemoMode}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            isDemoMode
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/50'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isDemoMode ? 'DEMO MODE ACTIVE' : '🎬 10-SEC DEMO'}</span>
        </button>

        <button
          onClick={onReset}
          title="Reset to On-Time Initial Itinerary"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all hover:text-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </header>
  );
};
