import React from 'react';
import type { EventNode, BlastRadiusReport } from '../../types';
import { Activity } from 'lucide-react';

interface BlastRadiusViewProps {
  report: BlastRadiusReport;
  nodes: EventNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({
  report,
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const affectedNodes = nodes.filter(n => n.status !== 'SAFE');

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-full">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-display">
              Blast Radius
            </h2>
          </div>
          <span className="text-[11px] font-mono-code text-slate-400">
            {report.brokenCount + report.atRiskCount} Events Impacted
          </span>
        </div>

        {/* 3 Status Counters */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-red-950/40 border border-red-500/40 p-2.5 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-300 font-mono-code font-bold">BROKEN</span>
            </div>
            <span className="text-2xl font-black text-red-400 font-mono-code">
              {report.brokenCount}
            </span>
          </div>

          <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-amber-300 font-mono-code font-bold">AT RISK</span>
            </div>
            <span className="text-2xl font-black text-amber-400 font-mono-code">
              {report.atRiskCount}
            </span>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/40 p-2.5 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-300 font-mono-code font-bold">SAFE</span>
            </div>
            <span className="text-2xl font-black text-emerald-400 font-mono-code">
              {report.safeCount}
            </span>
          </div>
        </div>

        {/* List of Affected Events */}
        <div className="space-y-2 mb-3">
          <span className="text-[10px] uppercase font-mono-code text-slate-400 font-bold block mb-1">
            Affected Trip Events & Causes:
          </span>

          {affectedNodes.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-center text-xs text-emerald-300">
              ✅ All trip events are within safe operating buffers.
            </div>
          ) : (
            affectedNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isBroken = node.status === 'BROKEN';

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-md'
                      : isBroken
                      ? 'bg-red-950/25 border-red-900/60 hover:border-red-600/70'
                      : 'bg-amber-950/25 border-amber-900/60 hover:border-amber-600/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isBroken ? 'text-red-400' : 'text-amber-400'}`}>
                        {isBroken ? '🔴' : '🟠'}
                      </span>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {node.title}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.2 rounded-md text-[9px] font-mono-code font-bold ${
                      isBroken ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {node.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-snug pl-5">
                    {node.impactExplanation}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Helper Footer */}
      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center font-mono-code">
        Deterministic Slack Propagation Engine
      </div>
    </div>
  );
};
