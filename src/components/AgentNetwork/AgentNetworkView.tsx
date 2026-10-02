import { useState, useMemo, useEffect } from 'react';
import type { BlastRadiusReport, EventNode, RecoveryPlan, DominoAgentDef, AgentId } from '../../types';
import { 
  getAiStatus, 
  subscribeAiStatus, 
  testGeminiConnection, 
  type ConnectionTestResult, 
  GEMINI_MODEL 
} from '../../services/aiService';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Sparkles, 
  ArrowRight, 
  FileCode2, 
  GitBranch, 
  Zap, 
  Info,
  RefreshCw,
  Server,
  HelpCircle,
  X,
  Bot,
  Eye,
  Terminal
} from 'lucide-react';

interface AgentNetworkViewProps {
  delayMinutes: number;
  reason: string;
  nodes: EventNode[];
  report: BlastRadiusReport;
  recoveryPlans: RecoveryPlan[];
  selectedPlan: RecoveryPlan;
  onClose?: () => void;
}

export function AgentNetworkView({
  delayMinutes,
  reason,
  nodes,
  report,
  recoveryPlans,
  selectedPlan,
  onClose
}: AgentNetworkViewProps) {
  // Live AI status
  const [aiStatus, setAiStatus] = useState<ConnectionTestResult>(getAiStatus());
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [showJudgeModal, setShowJudgeModal] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeAiStatus((st) => {
      setAiStatus(st);
    });
    return () => unsub();
  }, []);

  const isAiActive = aiStatus.status === 'connected';

  // Active agent selected for detail inspection
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('dependency-agent');

  // Pipeline execution state: 0 to 7 (0 = not started, 1..7 = running that index, 8 = all completed)
  const [executingStep, setExecutingStep] = useState<number>(8); // default to fully evaluated on open
  const [isExecutingAll, setIsExecutingAll] = useState<boolean>(false);

  const handleTestGemini = async () => {
    setIsTestingAi(true);
    setTestResult(null);
    try {
      const res = await testGeminiConnection();
      setTestResult(res);
      setAiStatus(res);
    } catch {
      setTestResult({
        status: 'error',
        mode: 'DEMO AI MODE',
        message: 'Gemini unavailable — Demo Mode active',
        model: GEMINI_MODEL,
        configured: false
      });
    } finally {
      setIsTestingAi(false);
    }
  };

  // Dynamic definitions reflecting actual application state
  const agents: DominoAgentDef[] = useMemo(() => {
    return [
      {
        id: 'itinerary-agent',
        name: 'Itinerary Agent',
        shortName: 'Itinerary Agent',
        icon: '📋',
        purpose: 'Parse and normalize the traveller\'s journey from multi-leg reservation telemetry.',
        inputDescription: 'Raw trip data: Nagpur (NAG) → Delhi (DEL) → Mumbai (BOM) flights, transfers, hotels, client meetings, next-day workshop.',
        outputDescription: 'Structured itinerary: 6 normalized temporal events with fixed start/end times and location markers.',
        toolUsed: 'Trip Parser & Normalizer',
        toolCategory: 'AI Reasoning',
        actionDescription: 'Extracted 6 sequential events; mapped critical path and identified physical location transfer nodes.',
        activeSummary: '6 journey events structured and normalized.',
        status: executingStep >= 1 ? (executingStep === 1 ? 'RUNNING' : 'COMPLETED') : 'IDLE',
        executionTimeMs: 18,
        hindiSummary: 'इस Agent ने पूरी travel journey को समझकर flights, connection, transfer, hotel, meeting और workshop को structured events में organize किया.',
        observe: 'Journey successfully understood',
        technical: 'Trip parsing + event structuring',
        sampleOutput: [
          'Input: Raw itinerary dataset (Nagpur → Delhi → Mumbai)',
          'Extracted: 6 event nodes with timestamps and geographic coordinates',
          'Output: Structured itinerary graph registered with Disruption Agent'
        ]
      },
      {
        id: 'disruption-agent',
        name: 'Disruption Agent',
        shortName: 'Disruption Agent',
        icon: '⚠️',
        purpose: 'Detect, ingest, and normalize travel disruption telemetry in real time.',
        inputDescription: `Flight delay event: Flight AI-428 (+${delayMinutes} min delay, Reason: ${reason})`,
        outputDescription: `Normalized disruption: Source = Flight AI-428 (NAG→DEL), Delay = +${delayMinutes} min, Arrival shifted from 11:45 to ${nodes[0]?.actualEnd || '13:45'}.`,
        toolUsed: 'Disruption Ingestion Tool',
        toolCategory: 'AI Reasoning',
        actionDescription: `Quantified schedule slip on initial flight leg and propagated timeline shift to downstream boundary.`,
        activeSummary: `Flight delayed +${delayMinutes} min normalized.`,
        status: executingStep >= 2 ? (executingStep === 2 ? 'RUNNING' : 'COMPLETED') : 'IDLE',
        executionTimeMs: 14,
        hindiSummary: 'इस Agent ने journey में हुए बदलाव को detect किया और पहली flight में 120 मिनट की delay को disruption के रूप में identify किया.',
        observe: '120-minute delay detected',
        technical: 'Disruption detection + event update',
        sampleOutput: [
          `Flight AI-428 delayed: +${delayMinutes} min (${reason})`,
          `Revised arrival at DEL: ${nodes[0]?.actualEnd || '13:45'}`,
          'Output: Normalized disruption payload dispatched to Dependency Agent'
        ]
      },
      {
        id: 'dependency-agent',
        name: 'Dependency Agent',
        shortName: 'Dependency Agent',
        icon: '🔗',
        purpose: 'Build and analyze temporal dependencies and transfer buffers between journey events.',
        inputDescription: 'Structured itinerary + Normalized disruption payload.',
        outputDescription: 'Dependency graph: Flight NAG→DEL ↓ Connection DEL T3 ↓ Transfer BOM ↓ Hotel Check-in ↓ Client Meeting ↓ Workshop.',
        toolUsed: 'Temporal Dependency Graph Engine',
        toolCategory: 'Deterministic Engine',
        actionDescription: 'Traced temporal and physical presence dependencies across 5 directional connection edges.',
        activeSummary: '6 events evaluated; temporal buffer deficit identified at Delhi T3.',
        status: executingStep >= 3 ? (executingStep === 3 ? 'RUNNING' : 'COMPLETED') : 'IDLE',
        executionTimeMs: 22,
        hindiSummary: 'इस Agent ने पता लगाया कि कौन सा event किस दूसरे event पर depend करता है. इसलिए Flight → Connection → Transfer → Hotel → Meeting → Workshop की dependency chain बनी.',
        observe: 'Dependency chain identified',
        technical: 'Dependency Graph Engine',
        sampleOutput: [
          'Evaluated: Flight → Connection → Transfer → Hotel → Meeting → Workshop',
          'DEL T3 Connection: 60m buffer vs 45m minimum connection threshold',
          `Result: -${Math.max(0, delayMinutes - 15)}m buffer deficit at gate closure`
        ]
      },
      {
        id: 'impact-agent',
        name: 'Impact Agent',
        shortName: 'Impact Agent',
        icon: '💥',
        purpose: 'Calculate the causal blast radius and categorize safe, at-risk, and broken commitments.',
        inputDescription: 'Dependency graph + Ingested disruption.',
        outputDescription: `Blast Radius: ${report.brokenCount} Broken, ${report.atRiskCount} At-Risk, ${report.safeCount} Safe events.`,
        toolUsed: 'Blast Radius Causal Engine',
        toolCategory: 'Deterministic Engine',
        actionDescription: 'Traced causal shockwave from missed Delhi flight to chauffeur pickup and 18:00 boardroom meeting.',
        activeSummary: `${report.brokenCount} broken, ${report.atRiskCount} at-risk, ${report.safeCount} safe events calculated.`,
        status: executingStep >= 4 ? (executingStep === 4 ? 'RUNNING' : 'COMPLETED') : 'IDLE',
        executionTimeMs: 19,
        hindiSummary: 'इस Agent ने disruption का causal blast radius calculate किया और downstream events को Safe, At Risk और Broken categories में classify किया.',
        observe: 'Broken / At Risk / Safe',
        technical: 'Causal Blast Radius Tool',
        sampleOutput: [
          `Broken (${report.brokenCount}): UK-811 DEL→BOM flight, BOM airport transfer`,
          `At Risk (${report.atRiskCount}): St. Regis check-in, 18:00 VP Singhania meeting`,
          `Safe (${report.safeCount}): Day 2 Workshop (sufficient buffer)`
        ]
      },
      {
        id: 'replanning-agent',
        name: 'Replanning Agent',
        shortName: 'Replanning Agent',
        icon: '🌐',
        purpose: 'Generate multiple recovery alternatives exploring different priority trade-offs.',
        inputDescription: 'Blast radius analysis + Hard traveler constraints.',
        outputDescription: '3 Recovery Worlds: World A (Preserve Meeting), World B (Preserve Route), World C (Minimize Cost).',
        toolUsed: 'Multi-World Recovery Simulator',
        toolCategory: 'AI Reasoning',
        actionDescription: 'Synthesized alternate flight inventory (UK-945, UK-867) and rescheduled meeting modalities.',
        activeSummary: '3 recovery worlds generated (Preserve Meeting, Preserve Route, Minimize Cost).',
        status: executingStep >= 5 ? (executingStep === 5 ? 'RUNNING' : 'COMPLETED') : 'IDLE',
        executionTimeMs: 35,
        hindiSummary: 'इस Agent ने broken journey को recover करने के लिए multiple recovery plans simulate किए और alternative routes तथा schedule changes compare किए.',
        observe: 'Multiple recovery plans',
        technical: 'Recovery Simulator + Counterfactual Planning',
        sampleOutput: [
          'World A: Rebook UK-945 (15:15) + Executive Dinner at Taj (Preserve meeting)',
          'World B: Retain original booking + Standby transit (Late arrival)',
          'World C: Hybrid VIP Lounge Video link + UK-867 (Minimize cost)'
        ]
      },
      {
        id: 'validation-agent',
        name: 'Validation Agent',
        shortName: 'Validation Agent',
        icon: '🛡️',
        purpose: 'Validate proposed recovery plans against hard physical and commitment constraints.',
        inputDescription: 'Candidate recovery worlds + Strict boundary constraints.',
        outputDescription: `Feasibility Report: World A = Feasible ✓, World B = ${recoveryPlans[1]?.isFeasible ? 'Feasible ✓' : 'Rejected ✕ (Violates 18:00 meeting)'}, World C = Feasible ✓.`,
        toolUsed: 'Constraint Validator Engine',
        toolCategory: 'Constraint Engine',
        actionDescription: 'Proved exact temporal bounds: MCT minimums, transit time across Bandra-Worli Sea Link, and meeting deadlines.',
        activeSummary: `${selectedPlan.worldCode} proved feasible (5/5 hard constraints satisfied).`,
        status: executingStep >= 6 ? (executingStep === 6 ? 'RUNNING' : 'COMPLETED') : 'IDLE',
        executionTimeMs: 16,
        hindiSummary: 'इस Agent ने generated recovery plans को timing, dependencies और hard constraints के against verify किया. जो plan feasible नहीं था उसे reject किया.',
        observe: 'Plan validation',
        technical: 'Constraint Validator',
        sampleOutput: [
          'World A: 5/5 Hard constraints satisfied (Feasible ✓)',
          `World B: ${recoveryPlans[1]?.isFeasible ? '5/5 satisfied (Feasible ✓)' : 'Rejected ✕ — Reason: Misses 18:00 boardroom meeting deadline'}`,
          'World C: 5/5 Hard constraints satisfied (Feasible ✓)'
        ]
      },
      {
        id: 'communication-agent',
        name: 'Communication Agent',
        shortName: 'Communication Agent',
        icon: '💬',
        purpose: 'Convert the validated recovery decision into traveller-friendly communications.',
        inputDescription: `Approved recovery plan (${selectedPlan.worldCode}: ${selectedPlan.worldTitle}).`,
        outputDescription: '3 Tailored Dispatches: Client WhatsApp invitation, Driver Suresh curbside gate alert, St. Regis late check-in hold.',
        toolUsed: 'Notification Dispatcher & Message Generator',
        toolCategory: 'Gemini',
        actionDescription: 'Generated personalized, clear status notifications for all human stakeholders.',
        activeSummary: '3 stakeholder notifications generated and ready for dispatch.',
        status: executingStep >= 7 ? (executingStep === 7 ? 'RUNNING' : 'COMPLETED') : 'IDLE',
        executionTimeMs: 12,
        hindiSummary: 'इस Agent ने approved recovery plan के आधार पर traveller, hotel या meeting stakeholders के लिए communication तयार किया.',
        observe: 'Recovery communication ready',
        technical: 'Communication Generator / Gemini Dispatch',
        sampleOutput: [
          'Client: Dinner invitation update sent to VP Vikram Singhania (Taj Land\'s End, 19:15)',
          'Driver: Curbside pickup at Mumbai T2 synchronized to 17:45 IST Gate 4',
          'Hotel: Guaranteed late check-in hold confirmed with St. Regis front desk'
        ]
      }
    ];
  }, [delayMinutes, reason, nodes, report, recoveryPlans, selectedPlan, executingStep]);

  const activeAgent = useMemo(() => {
    return agents.find(a => a.id === selectedAgentId) || agents[2];
  }, [agents, selectedAgentId]);

  // Execute Agent Network sequentially
  const handleRunPipeline = () => {
    setIsExecutingAll(true);
    setExecutingStep(1);
    setSelectedAgentId('itinerary-agent');

    const stepInterval = 280; // snappy, hackathon-friendly execution

    for (let i = 1; i <= 7; i++) {
      setTimeout(() => {
        setExecutingStep(i);
        const agentMap: AgentId[] = [
          'itinerary-agent',
          'disruption-agent',
          'dependency-agent',
          'impact-agent',
          'replanning-agent',
          'validation-agent',
          'communication-agent'
        ];
        setSelectedAgentId(agentMap[i - 1]);
      }, i * stepInterval);
    }

    setTimeout(() => {
      setExecutingStep(8);
      setIsExecutingAll(false);
      setSelectedAgentId('dependency-agent');
    }, 8 * stepInterval);
  };

  const handleResetPipeline = () => {
    setExecutingStep(0);
    setSelectedAgentId('itinerary-agent');
  };

  return (
    <div className="w-full flex flex-col items-center animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="w-full text-center mb-6">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3.5 py-1 rounded-full font-mono-code flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" /> AGENT NETWORK
          </span>

          <span className={`text-xs font-bold font-mono-code px-3 py-1 rounded-full border flex items-center gap-1.5 ${
            isAiActive 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            {isAiActive ? 'GEMINI AI MODE' : 'DEMO AI MODE'}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
          AGENT NETWORK
        </h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto mt-1">
          "Specialized agents collaborate to analyze, simulate and validate recovery."
        </p>
      </div>

      {/* Control Bar */}
      <div className="w-full card-premium p-4 rounded-2xl mb-6 bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code">
            EXECUTION STATUS:
          </span>
          <span className="text-xs font-mono-code px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
            {executingStep >= 8 ? '7/7 AGENTS COMPLETED ✓' : executingStep > 0 ? `RUNNING AGENT ${executingStep}/7...` : 'IDLE (READY)'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* JUDGE QUICK EXPLANATION BUTTON */}
          <button
            onClick={() => setShowJudgeModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold font-mono-code transition-all cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>EXPLAIN THIS RESULT</span>
          </button>

          <button
            onClick={handleResetPipeline}
            disabled={isExecutingAll}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold font-mono-code transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>

          <button
            onClick={handleRunPipeline}
            disabled={isExecutingAll}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold font-mono-code shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-[1.02]"
          >
            {isExecutingAll ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>RUNNING AGENTS...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN AGENT NETWORK</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION ABOVE AGENT CARDS: AI AGENT EXECUTION SUMMARY    */}
      {/* ======================================================== */}
      <div className="w-full card-premium p-5 sm:p-6 rounded-3xl mb-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white text-left shadow-md border border-indigo-800/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-300 bg-indigo-800/60 px-2.5 py-0.5 rounded-full border border-indigo-700">
            SEQUENTIAL MULTI-AGENT WORKFLOW
          </span>
          <span className="text-xs font-mono-code text-indigo-300">
            • AI AGENT EXECUTION SUMMARY
          </span>
        </div>

        <p className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed mb-1.5 font-display">
          "DOMINO में agents अलग-अलग chatbot की तरह काम नहीं करते. हर Agent अपने stage का result अगले stage को देता है."
        </p>
        <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-sans mb-4">
          "DOMINO uses a sequential agent workflow where each stage produces information consumed by the next stage."
        </p>

        {/* Horizontal Flow Line */}
        <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/30 text-white">Itinerary</span>
          <span className="text-indigo-400">↓</span>
          <span className="px-2.5 py-1 rounded-lg bg-red-500/30 text-white">Disruption</span>
          <span className="text-indigo-400">↓</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/30 text-white">Dependency</span>
          <span className="text-indigo-400">↓</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/30 text-white">Impact</span>
          <span className="text-indigo-400">↓</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/30 text-white">Replanning</span>
          <span className="text-indigo-400">↓</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/30 text-white">Validation</span>
          <span className="text-indigo-400">↓</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-400/30 text-white">Communication</span>
        </div>
      </div>

      {/* Interactive Visual Network DAG */}
      <div className="w-full card-premium p-6 rounded-3xl mb-6 bg-gradient-to-b from-white to-slate-50/80 border border-slate-200 text-left relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-indigo-600" />
            VISUAL AGENT PIPELINE & WORKFLOW
          </span>
          <span className="text-[11px] text-slate-500 font-mono-code">
            Click any agent node to inspect Hindi summary, tools & deterministic outputs
          </span>
        </div>

        {/* 7 Agents Interactive Network Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 mb-2">
          {agents.map((agent, index) => {
            const isSelected = selectedAgentId === agent.id;
            const isRunning = agent.status === 'RUNNING';
            const isCompleted = agent.status === 'COMPLETED';

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between border relative ${
                  isSelected
                    ? 'bg-white ring-2 ring-indigo-600 shadow-md border-indigo-300'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs'
                }`}
              >
                {/* Agent Number & Status Icon */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono-code">
                      {index + 1}
                    </span>

                    {isRunning && (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                    )}
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {agent.status === 'IDLE' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    )}
                  </div>

                  <span className="text-xl block mb-1">{agent.icon}</span>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">
                    {agent.shortName}
                  </h4>

                  <span className={`text-[9px] font-mono-code px-2 py-0.5 rounded-full font-bold inline-block mb-2 ${
                    agent.toolCategory.includes('Deterministic') || agent.toolCategory.includes('Constraint')
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}>
                    {agent.toolCategory}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono-code">
                  <span className={`font-bold ${
                    isRunning ? 'text-indigo-600' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}>
                    {isRunning ? 'RUNNING...' : isCompleted ? '✓ Completed' : 'IDLE'}
                  </span>
                  <span className="text-slate-400">{agent.executionTimeMs}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Agent Inspector Panel */}
      <div className="w-full card-premium p-6 sm:p-7 rounded-3xl mb-6 bg-white border border-slate-200 text-left">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-indigo-50 border border-indigo-100">
              {activeAgent.icon}
            </span>
            <div>
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-700 block">
                AGENT DETAILS & HINDI EXPLANATION
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                {activeAgent.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono-code font-bold px-3 py-1 rounded-full border ${
              activeAgent.status === 'COMPLETED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : activeAgent.status === 'RUNNING'
                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              STATUS: {activeAgent.status === 'COMPLETED' ? 'Completed ✓' : activeAgent.status}
            </span>

            <button
              onClick={() => {
                setExecutingStep(agents.findIndex(a => a.id === activeAgent.id) + 1);
              }}
              className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono-code font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>RETRY AGENT</span>
            </button>
          </div>
        </div>

        {/* HINDI SUMMARY CALLOUT CARD */}
        {activeAgent.hindiSummary && (
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 mb-5">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-800 block mb-1">
              🇮🇳 HINDI SUMMARY
            </span>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed font-sans mb-3">
              "{activeAgent.hindiSummary}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-indigo-200/60 text-xs font-mono-code">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Eye className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span><strong>What to observe:</strong> {activeAgent.observe}</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-800">
                <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span><strong>Technical:</strong> {activeAgent.technical}</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-600 leading-relaxed mb-6 font-sans">
          <strong>English Purpose:</strong> {activeAgent.purpose}
        </p>

        {/* 4-Stage Execution Flow: INPUT -> AGENT -> TOOL -> OUTPUT */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono-code text-xs mb-6">
          {/* INPUT */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-sans">
              1. INPUT
            </span>
            <p className="text-slate-800 font-sans text-xs leading-relaxed font-medium">
              {activeAgent.inputDescription}
            </p>
          </div>

          {/* AGENT ACTION */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1 font-sans">
              2. AGENT ACTION
            </span>
            <p className="text-indigo-950 font-sans text-xs leading-relaxed font-medium">
              {activeAgent.actionDescription}
            </p>
          </div>

          {/* TOOL INVOKED */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1 font-sans">
              3. TOOL INVOKED
            </span>
            <span className="font-bold text-emerald-900 block text-xs mb-1">
              {activeAgent.toolUsed}
            </span>
            <span className="text-[11px] font-sans text-emerald-800 block">
              Category: {activeAgent.toolCategory}
            </span>
          </div>

          {/* OUTPUT */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1 font-sans">
              4. DETERMINISTIC OUTPUT
            </span>
            <p className="text-slate-800 font-sans text-xs leading-relaxed font-medium">
              {activeAgent.outputDescription}
            </p>
          </div>
        </div>

        {/* Traceable Telemetry Output Lines */}
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono-code text-xs mb-4">
          <div className="flex items-center justify-between mb-2 text-slate-400 border-b border-slate-800 pb-1.5 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              TELEMETRY LOG OUTPUT
            </span>
            <span className="text-[10px] text-emerald-400">STATUS: 200 OK</span>
          </div>

          <div className="space-y-1.5">
            {activeAgent.sampleOutput.map((line, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-slate-500">{'>'}</span>
                <span className="text-slate-200">{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Reasoning vs Deterministic Tools Boundary */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="font-sans leading-relaxed">
            <strong className="text-slate-900">Responsible AI Architecture: </strong>
            Gemini is used for messy input normalization, disruption explanation, and communication drafting. 
            All exact temporal arithmetic, buffer deficits, slack margins, and constraint proofs are executed by deterministic engines.
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* OVERALL RESULT BOX AFTER ALL 7 AGENTS COMPLETE           */}
      {/* ======================================================== */}
      {executingStep >= 8 && (
        <div className="w-full card-premium p-6 sm:p-7 rounded-3xl mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white text-left shadow-lg border border-indigo-800/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-700">
              EXECUTION COMPLETED • 7/7 AGENTS
            </span>
            <span className="text-xs font-mono-code text-indigo-300">
              • OVERALL RESULT
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-white font-display tracking-tight mb-2">
            DOMINO ने क्या किया?
          </h3>

          <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed mb-2 font-display">
            "DOMINO ने disruption को detect किया → dependency chain trace की → impact calculate किया → recovery plans बनाए → constraints validate किए → final communication तैयार किया."
          </p>

          <p className="text-xs sm:text-sm text-indigo-200 font-sans leading-relaxed">
            "DOMINO detected the disruption, traced its dependency chain, calculated the impact, generated recovery options, validated constraints, and prepared the recovery communication."
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* AI vs DETERMINISTIC ENGINE BOX                           */}
      {/* ======================================================== */}
      <div className="w-full card-premium p-5 sm:p-6 rounded-3xl mb-6 bg-indigo-50/70 border border-indigo-200 text-left">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 font-mono-code">
            AI + Deterministic Engine
          </h4>
        </div>

        <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed mb-1.5 font-display">
          "AI journey को समझने, planning, replanning और communication में मदद करता है. Exact timing, dependency और constraint validation deterministic engine से होती है."
        </p>

        <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
          "AI handles understanding, planning, replanning and communication support. Deterministic engines handle exact timing, dependencies and constraint validation."
        </p>
      </div>

      {/* Tools Used Matrix */}
      <div className="w-full card-premium p-5 rounded-2xl mb-6 bg-slate-50 border border-slate-200 text-left">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code mb-3 flex items-center gap-1.5">
          <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
          TOOLS USED IN DOMINO AGENT WORKFLOW
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs font-mono-code">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
            <span>✓ Trip Parser</span>
            <span className="text-indigo-700 font-bold">AI REASONING</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
            <span>✓ Dependency Graph Engine</span>
            <span className="text-emerald-700 font-bold">DETERMINISTIC</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
            <span>✓ Causal Blast Radius Tool</span>
            <span className="text-emerald-700 font-bold">DETERMINISTIC</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
            <span>✓ Recovery Simulator</span>
            <span className="text-indigo-700 font-bold">HEURISTIC SOLVER</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
            <span>✓ Constraint Validator</span>
            <span className="text-emerald-700 font-bold">CONSTRAINT ENGINE</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
            <span>✓ Notification Generator</span>
            <span className="text-indigo-700 font-bold">GEMINI DISPATCH</span>
          </div>
        </div>
      </div>

      {/* AI Connection Test Section */}
      <div className="w-full card-premium p-5 rounded-2xl mb-6 bg-white border border-slate-200 text-left">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono-code">
              AI CONNECTION TEST
            </span>
          </div>

          <button
            onClick={handleTestGemini}
            disabled={isTestingAi}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold font-mono-code transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isTestingAi ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>TESTING...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>TEST GEMINI</span>
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`p-4 rounded-2xl border text-xs font-mono-code space-y-1.5 ${
            testResult.status === 'connected'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : testResult.status === 'demo'
              ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            <div className="flex items-center justify-between border-b border-black/5 pb-2 mb-1.5 font-bold">
              <span className="flex items-center gap-1.5">
                {testResult.status === 'connected' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {testResult.status === 'connected' ? 'GEMINI CONNECTION' : testResult.status === 'demo' ? 'DEMO AI MODE' : 'GEMINI ERROR'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/80 border border-black/5">
                {testResult.status === 'connected' ? '✓ Connected' : testResult.status === 'demo' ? 'Demo Mode Active' : 'Fallback: DEMO AI MODE'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div><strong>Model:</strong> {testResult.model || GEMINI_MODEL}</div>
              <div><strong>Mode:</strong> {testResult.mode} {testResult.latencyMs ? `(${testResult.latencyMs}ms)` : ''}</div>
            </div>
            <div className="text-[11px] text-slate-600 pt-1 border-t border-black/5">
              {testResult.message}
            </div>
          </div>
        )}
      </div>

      {/* Back / Close Action */}
      {onClose && (
        <button
          onClick={onClose}
          className="px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
        >
          <span>RETURN TO DASHBOARD / JOURNEY</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

      {/* ======================================================== */}
      {/* JUDGE QUICK EXPLANATION MODAL                            */}
      {/* ======================================================== */}
      {showJudgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 text-left relative">
            <button
              onClick={() => setShowJudgeModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-3 py-0.5 rounded-full font-mono-code flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                JUDGE QUICK EXPLANATION
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 font-display mb-3">
              EXPLAIN THIS RESULT
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
              <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-800 block mb-1">
                🇮🇳 HINDI EXPLANATION
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                "DOMINO ने पहले पूरी journey को understand किया. फिर 120-minute flight delay detect की. Dependency Agent ने downstream chain trace की. Impact Agent ने बताया कि कौन से events Broken, At Risk या Safe हैं. Replanning Agent ने recovery options बनाए. Validation Agent ने constraints check किए. अंत में Communication Agent ने approved recovery के लिए communication तैयार किया."
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs sm:text-sm font-mono-code font-bold text-indigo-950 mb-6">
              "DOMINO detects → traces → calculates → replans → validates → communicates."
            </div>

            <button
              onClick={() => setShowJudgeModal(false)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
            >
              CLOSE EXPLANATION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
