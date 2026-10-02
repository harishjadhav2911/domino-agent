import React, { useState } from 'react';
import type { RecoveryPlan } from '../../types';
import { 
  Sparkles, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';

interface RecoveryMatrixProps {
  plans: RecoveryPlan[];
  selectedPlan: RecoveryPlan;
  onSelectPlan: (plan: RecoveryPlan) => void;
  onInitiateApproval: (plan: RecoveryPlan) => void;
  approvedPlanId: string | null;
}

export const RecoveryMatrix: React.FC<RecoveryMatrixProps> = ({
  plans,
  selectedPlan,
  onSelectPlan,
  onInitiateApproval,
  approvedPlanId,
}) => {
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Recovery Plans Section Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold uppercase tracking-wider text-white font-display">
            DOMINO HAS GENERATED 3 RECOVERY PLANS
          </h3>
        </div>
        <span className="text-xs font-mono-code text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
          Autonomous Replanner Active
        </span>
      </div>

      {/* 3 Recovery Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isSelected = selectedPlan.id === plan.id;
          const isApproved = approvedPlanId === plan.id;

          let planLabel = 'PLAN A — BALANCED';
          let planTradeoff = 'Rebook connection + move client meeting to 19:15 working dinner';
          if (plan.id === 'PLAN_B') {
            planLabel = 'PLAN B — PRESERVE MEETING';
            planTradeoff = 'Alternative route + keep exact 18:00 meeting (skip hotel)';
          } else if (plan.id === 'PLAN_C') {
            planLabel = 'PLAN C — LOWEST COST';
            planTradeoff = 'Keep route + convert 18:00 meeting to VIP lounge video call';
          }

          return (
            <div
              key={plan.id}
              onClick={() => onSelectPlan(plan)}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                isApproved
                  ? 'glass-panel-success border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                  : isSelected
                  ? 'glass-panel-glow border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-400'
                  : 'glass-panel border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[11px] font-mono-code font-bold uppercase px-2.5 py-0.5 rounded-full ${
                    plan.recommended
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {plan.id === 'PLAN_A' ? '⭐ RECOMMENDED' : plan.id === 'PLAN_B' ? 'FASTEST' : 'ECONOMICAL'}
                  </span>

                  <span className={`text-xs font-semibold font-mono-code ${
                    plan.feasibility.includes('HIGH') ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    ✓ Feasible
                  </span>
                </div>

                {/* Plan Title */}
                <h4 className="text-sm font-bold text-white mb-2">
                  {planLabel}
                </h4>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-3 font-mono-code text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">EST. COST</span>
                    <span className="text-amber-300 font-bold text-sm">
                      ₹{plan.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">ARRIVAL</span>
                    <span className="text-white font-bold text-sm">
                      {plan.arrivalTimeMumbai} IST
                    </span>
                  </div>
                </div>

                {/* Main Trade-off */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-4 text-xs">
                  <span className="text-slate-400 block font-semibold text-[11px] mb-0.5">
                    Main Trade-off:
                  </span>
                  <span className="text-slate-200 leading-snug">
                    {planTradeoff}
                  </span>
                </div>
              </div>

              {/* Select Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPlan(plan);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono-code transition-all flex items-center justify-center gap-1.5 ${
                  isApproved
                    ? 'bg-emerald-500 text-white font-bold'
                    : isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isApproved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>PLAN APPROVED</span>
                  </>
                ) : isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>SELECTED PLAN</span>
                  </>
                ) : (
                  <span>SELECT THIS PLAN</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Human Approval Callout */}
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-indigo-500/30 bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90">
        <div className="flex-1 min-w-[280px]">
          <div className="flex items-center gap-2 text-xs font-bold font-mono-code text-indigo-400 mb-1">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>HUMAN APPROVAL GATEWAY</span>
          </div>

          <h4 className="text-sm font-bold text-white mb-1">
            DOMINO recommends {selectedPlan.id === 'PLAN_A' ? 'Plan A (Balanced)' : selectedPlan.id === 'PLAN_B' ? 'Plan B (Preserve Meeting)' : 'Plan C (Lowest Cost)'}
          </h4>

          <p className="text-xs text-slate-300">
            <strong className="text-indigo-300 font-medium">WHY: </strong>
            {selectedPlan.id === 'PLAN_A' 
              ? 'Preserves the high-priority client meeting while satisfying all hard time constraints.'
              : selectedPlan.id === 'PLAN_B'
              ? 'Keeps the original 18:00 boardroom meeting time via alternate carrier routing.'
              : 'Minimizes rebooking costs while providing high-fidelity VIP hybrid conference.'}
          </p>

          <span className="text-[11px] text-amber-400/90 mt-1 block font-mono-code">
            ⚠️ Human approval required for flight rebooking & meeting reschedule.
          </span>
        </div>

        <button
          onClick={() => onInitiateApproval(selectedPlan)}
          className={`px-6 py-3 rounded-xl text-xs font-bold font-mono-code transition-all flex items-center gap-2 shadow-lg ${
            approvedPlanId === selectedPlan.id
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/40 hover:scale-[1.02]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{approvedPlanId === selectedPlan.id ? 'APPROVED (Click to re-open)' : 'APPROVE & EXECUTE PLAN'}</span>
        </button>
      </div>

      {/* Expandable Audit Trail */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <button
          onClick={() => setIsAuditOpen(!isAuditOpen)}
          className="w-full px-5 py-3 flex items-center justify-between text-xs font-medium text-slate-300 hover:text-white transition-all bg-slate-900/60"
        >
          <span className="font-semibold text-indigo-300 flex items-center gap-2">
            💡 Why did DOMINO make this decision?
          </span>
          <span className="flex items-center gap-1 text-slate-400 font-mono-code text-[11px]">
            {isAuditOpen ? 'Hide Chain of Reasoning' : 'Show Chain of Reasoning'}
            {isAuditOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {isAuditOpen && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/90">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code text-slate-300">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-red-400 font-bold">1</span>
                <span>Flight delayed 120 min</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-red-400 font-bold">2</span>
                <span>Connection buffer exceeded (-105m)</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold">3</span>
                <span>Connection became impossible</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-amber-400 font-bold">4</span>
                <span>Hotel and meeting affected</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />

              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-emerald-400 font-bold">5</span>
                <span>3 Recovery plans generated</span>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />

              <div className="flex items-center gap-2 p-2 rounded-lg bg-indigo-950 border border-indigo-500/50 text-indigo-300 font-bold">
                <span>⭐ Plan A selected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
