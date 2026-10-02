import React, { useState } from 'react';
import type { RecoveryPlan } from '../types';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  UserCheck, 
  X, 
  CheckCircle2, 
  Zap, 
  Check 
} from 'lucide-react';

interface ApprovalModalProps {
  plan: RecoveryPlan;
  isOpen: boolean;
  onClose: () => void;
  onApproveSuccess: (planId: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  plan,
  isOpen,
  onClose,
  onApproveSuccess,
}) => {
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>(
    plan.actions.map(a => a.id)
  );
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionStep, setExecutionStep] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleAction = (id: string) => {
    if (selectedActionIds.includes(id)) {
      setSelectedActionIds(selectedActionIds.filter(aId => aId !== id));
    } else {
      setSelectedActionIds([...selectedActionIds, id]);
    }
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setExecutionStep(1);

    setTimeout(() => {
      setExecutionStep(2);
    }, 900);

    setTimeout(() => {
      setExecutionStep(3);
    }, 1800);

    setTimeout(() => {
      setExecutionStep(4);
      setIsExecuting(false);
      setIsDone(true);
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      onApproveSuccess(plan.id);
    }, 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0d111a] border border-indigo-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col gap-4 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Human-in-the-Loop Gateway
              </span>
              <h3 className="text-lg font-bold text-white leading-tight mt-1">
                Authorize Recovery Plan: {plan.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Execution progress view if in flight */}
        {isExecuting || isDone ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/50">
              {isDone ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
              ) : (
                <Zap className="w-8 h-8 text-indigo-400 animate-pulse" />
              )}
            </div>

            <div>
              <h4 className="text-base font-bold text-white font-display">
                {isDone ? 'Recovery Plan Fully Executed!' : 'Autonomous Agents Executing Plan...'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 font-mono-code">
                {executionStep === 1 && 'Step 1/3: Submitting airline re-ticketing to GDS API...'}
                {executionStep === 2 && 'Step 2/3: Dispatching real-time WhatsApp telemetry to Driver Suresh...'}
                {executionStep === 3 && 'Step 3/3: Transmitting St. Regis concierge late hold & calendar update...'}
                {executionStep === 4 && 'All actions confirmed and synchronized across the temporal graph.'}
              </p>
            </div>

            {/* Step Progress Bar */}
            <div className="w-full max-w-md bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                style={{ width: `${(executionStep / 4) * 100}%` }}
              />
            </div>

            {isDone && (
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold font-mono-code shadow-lg shadow-emerald-500/30 transition-all"
              >
                Return to Command Center
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Strategy Summary */}
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs leading-relaxed text-slate-300">
              <strong className="text-white block mb-1">Executive Summary:</strong>
              {plan.explanation}
            </div>

            {/* Metrics Overview */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono-code">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">EST. EXPENSE</span>
                <span className="text-sm font-bold text-amber-300">₹{plan.estimatedCost.toLocaleString()}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">BOM ARRIVAL</span>
                <span className="text-sm font-bold text-white">{plan.arrivalTimeMumbai} IST</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 block">INCONVENIENCE</span>
                <span className="text-sm font-bold text-emerald-400">{plan.inconvenienceScore}/100</span>
              </div>
            </div>

            {/* Action Item Breakdown Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono-code">
                  Action Item Authorization Checklist ({plan.actions.length})
                </h4>
                <span className="text-[10px] text-slate-500">Select items to execute</span>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {plan.actions.map((act) => {
                  const isChecked = selectedActionIds.includes(act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => toggleAction(act.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                        isChecked
                          ? 'bg-slate-900/90 border-indigo-500/60 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                      }`}
                    >
                      <div className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-600 bg-slate-900'
                      }`}>
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-white">{act.title}</span>
                          {act.requiresHumanApproval ? (
                            <span className="text-[9px] font-mono-code px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                              HUMAN APPROVAL REQ
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono-code px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              AUTO DISPATCH
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 mt-0.5 text-[11px] leading-snug">
                          {act.description}
                        </p>
                        {act.cost > 0 && (
                          <span className="text-[10px] font-mono-code text-amber-300 mt-1 block">
                            Cost: ₹{act.cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-code transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={selectedActionIds.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold font-mono-code shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>AUTHORIZE & EXECUTE PLAN</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
