import React from 'react';
import { 
  Sliders, 
  Plane 
} from 'lucide-react';

interface TripStatusProps {
  delayMinutes: number;
  onDelayChange: (delay: number) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
}

const PRESET_DELAYS = [30, 60, 90, 120, 180];

const DISRUPTION_REASONS = [
  'Air Traffic Delay at DEL',
  'Dense Fog & Low Visibility',
  'Aircraft Technical Check',
  'VIP Airspace Hold'
];

export const TripStatus: React.FC<TripStatusProps> = ({
  delayMinutes,
  onDelayChange,
  reason,
  onReasonChange,
}) => {
  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-full">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-white font-display">
            Disruption Simulator
          </h2>
        </div>

        {/* Flight Delay Display */}
        <div className="mb-4">
          <label className="text-xs uppercase font-mono-code text-slate-400 font-semibold block mb-1.5 flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-red-400" /> FLIGHT DELAY (NAG → DEL)
          </label>
          
          <div className="bg-slate-950/90 p-4 rounded-xl border border-red-500/40 flex items-center justify-between shadow-inner">
            <span className="text-xs text-slate-400 font-mono-code">DELAY MAGNITUDE:</span>
            <span className="text-2xl font-black text-red-400 font-mono-code">
              +{delayMinutes} MIN
            </span>
          </div>
        </div>

        {/* Delay Range Slider */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono-code">
            <span>0m</span>
            <span>60m</span>
            <span className="text-red-400 font-bold">120m (Default)</span>
            <span>180m</span>
          </div>
          <input
            type="range"
            min={0}
            max={180}
            step={15}
            value={delayMinutes}
            onChange={(e) => onDelayChange(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>

        {/* Quick Buttons */}
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {PRESET_DELAYS.map((m) => (
            <button
              key={m}
              onClick={() => onDelayChange(m)}
              className={`py-2 rounded-xl text-xs font-mono-code font-bold transition-all ${
                delayMinutes === m
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 ring-1 ring-red-300'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Cause */}
        <div className="mb-2">
          <label className="text-xs uppercase font-mono-code text-slate-400 font-semibold block mb-1.5">
            CAUSE
          </label>
          <select
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono-code"
          >
            {DISRUPTION_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Summary Note */}
      <div className="bg-indigo-950/30 p-3 rounded-xl border border-indigo-500/20 text-xs text-indigo-300">
        💡 <strong>How DOMINO works:</strong> When the delay changes, the engine propagates the time shift through all dependent nodes in real-time.
      </div>
    </div>
  );
};
