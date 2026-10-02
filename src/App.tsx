import { useState, useMemo, useEffect } from 'react';
import { ThreeGraphCanvas } from './components/ThreeGraph/ThreeGraphCanvas';
import { AgentNetworkView } from './components/AgentNetwork/AgentNetworkView';
import { StepExplainerCard } from './components/StepExplainerCard';
import { WhyDominoSection } from './components/WhyDominoSection';
import { propagateDisruption } from './engine/propagationEngine';
import { generateRecoveryPlans } from './engine/replanner';
import { 
  getAiStatus, 
  subscribeAiStatus, 
  testGeminiConnection, 
  type ConnectionTestResult,
  GEMINI_MODEL 
} from './services/aiService';
import confetti from 'canvas-confetti';
import { 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  CheckCircle,
  RefreshCw,
  Sliders,
  Maximize2,
  Minimize2,
  Sparkles,
  XCircle,
  Scale,
  FileCheck2,
  AlertTriangle,
  Cpu,
  LayoutDashboard,
  Calendar,
  Clock,
  Shield,
  X,
  Compass,
  AlertCircle,
  GitBranch,
  Activity,
  MessageSquare,
  Bot,
  Layers
} from 'lucide-react';

export type DominoScreen = 'LOGIN' | 'DASHBOARD' | 'TRIP' | 'AGENT_NETWORK';

const STAGES = [
  { id: 1, stepNum: '01', name: 'Trip', label: 'Your Journey', question: 'What is the journey?' },
  { id: 2, stepNum: '02', name: 'Disruption', label: 'Flight Disruption', question: 'What changed?' },
  { id: 3, stepNum: '03', name: 'Impact', label: 'What Broke?', question: 'What broke?' },
  { id: 4, stepNum: '04', name: '3D Impact', label: '3D Blast Radius', question: 'How did the disruption spread?' },
  { id: 5, stepNum: '05', name: 'Replan', label: 'Replanning', question: 'How should DOMINO recover?' },
  { id: 6, stepNum: '06', name: 'Decision', label: 'Human Decision', question: 'Why this plan?' },
  { id: 7, stepNum: '07', name: 'Result', label: 'Final Journey', question: 'What is the final result?' },
];

export function App() {
  // Navigation screen: LOGIN -> DASHBOARD -> TRIP (1..7) / AGENT_NETWORK
  const [currentScreen, setCurrentScreen] = useState<DominoScreen>('LOGIN');
  const [demoUserName, setDemoUserName] = useState<string>('Harish Jadhav');
  const [demoUserRole, setDemoUserRole] = useState<string>('Demo Traveller');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);

  // Dynamic AI Status Tracking
  const [aiStatus, setAiStatus] = useState<ConnectionTestResult>(getAiStatus());
  const [isTestingModalAi, setIsTestingModalAi] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeAiStatus((status) => {
      setAiStatus(status);
    });
    // Check initial connection on startup
    testGeminiConnection().then(res => setAiStatus(res));
    return () => unsub();
  }, []);

  const handleModalTestGemini = async () => {
    setIsTestingModalAi(true);
    try {
      const res = await testGeminiConnection();
      setAiStatus(res);
    } finally {
      setIsTestingModalAi(false);
    }
  };

  // Current stage: 1 to 7
  const [currentStage, setCurrentStage] = useState<number>(1);
  
  // Disruption parameters
  const [delayMinutes, setDelayMinutes] = useState<number>(120);
  const [reason, setReason] = useState<string>('Air Traffic Delay at DEL');
  
  // Selected Node in 3D / detail view
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('evt-2-flight-del-bom');
  
  // Selected recovery plan: Plan A by default
  const [selectedPlanId, setSelectedPlanId] = useState<'PLAN_A' | 'PLAN_B' | 'PLAN_C'>('PLAN_A');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Trigger shockwave ripple timestamp
  const [disruptionTriggerTime, setDisruptionTriggerTime] = useState<number>(Date.now());

  // Cascade replay animation trigger
  const [cascadeKey, setCascadeKey] = useState<number>(0);

  // Presentation Mode toggle for 3D hero
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  // Helper for dynamic arrival time
  const getDelayedArrival = (baseH: number, baseM: number, addedMin: number) => {
    const total = baseH * 60 + baseM + addedMin;
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const newFlightArrival = useMemo(() => {
    return getDelayedArrival(11, 45, delayMinutes);
  }, [delayMinutes]);

  // Dynamic connection feasibility status
  const connectionStatus = useMemo(() => {
    const availableBuffer = 60 - delayMinutes;
    if (availableBuffer >= 45) {
      return {
        type: 'SAFE',
        label: 'CONNECTION SAFE',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-500',
        boxBg: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
        text: `Available connection buffer (${availableBuffer} min) is within safe operational limits at Delhi T3.`
      };
    } else if (availableBuffer >= 0) {
      return {
        type: 'AT_RISK',
        label: 'CONNECTION AT RISK',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500',
        boxBg: 'bg-amber-50/90 border-amber-200 text-amber-900',
        text: `Transit buffer compressed to ${availableBuffer} min (below 45m MCT). High risk of missed gate closure.`
      };
    } else {
      return {
        type: 'BROKEN',
        label: 'CONNECTION BROKEN',
        badgeBg: 'bg-red-100 text-red-800 border-red-300',
        dotColor: 'bg-red-500',
        boxBg: 'bg-red-50/90 border-red-200 text-red-900',
        text: `Available connection buffer is no longer sufficient (-${Math.abs(availableBuffer)} min deficit). Connecting flight UK-811 will be missed.`
      };
    }
  }, [delayMinutes]);

  // Deterministic Graph Propagation
  const { nodes, edges, report } = useMemo(() => {
    return propagateDisruption(delayMinutes, reason);
  }, [delayMinutes, reason]);

  // Deterministic Counterfactual Recovery Plans
  const recoveryPlans = useMemo(() => {
    return generateRecoveryPlans(delayMinutes);
  }, [delayMinutes]);

  const selectedPlan = useMemo(() => {
    return recoveryPlans.find(p => p.id === selectedPlanId) || recoveryPlans[0];
  }, [recoveryPlans, selectedPlanId]);

  const [simulatingWorld, setSimulatingWorld] = useState<boolean>(false);

  const handleSelectWorld = (planId: 'PLAN_A' | 'PLAN_B' | 'PLAN_C') => {
    setSimulatingWorld(true);
    setSelectedPlanId(planId);
    setTimeout(() => {
      setSimulatingWorld(false);
    }, 240);
  };

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[1] || nodes[0];
  }, [nodes, selectedNodeId]);

  // Detailed Causal explanation for the selected node
  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;
    
    let trigger = 'Upstream operational flight delay at Nagpur (AI-428)';
    let requiredBuffer = '45 min';
    let availableBuffer = `${selectedNode.slackMinutes ?? 0} min`;
    let result = selectedNode.impactExplanation;
    let causeType = 'Temporal buffer constraint';

    if (selectedNode.id === 'evt-1-flight-nag-del') {
      trigger = 'ATC Congestion & Runway Maintenance at Delhi IGI';
      requiredBuffer = '0 min';
      availableBuffer = `+${delayMinutes} min shift`;
      result = delayMinutes > 15 ? `Flight lands at ${selectedNode.actualEnd} instead of scheduled 11:45.` : 'Flight on schedule.';
      causeType = 'Primary root disruption';
    } else if (selectedNode.id === 'evt-2-flight-del-bom') {
      trigger = `Flight AI-428 landing delayed to ${newFlightArrival}`;
      requiredBuffer = '45 min MCT (Minimum Connection Time at DEL T3)';
      const gap = 60 - delayMinutes;
      availableBuffer = `${gap} min available transit window`;
      result = gap < 45 ? `Connecting flight UK-811 departs at 12:45 before passenger arrives. Deficit = ${45 - gap} min.` : 'Connection can be made.';
      causeType = 'Hard temporal transfer dependency (DEL T3)';
    } else if (selectedNode.id === 'evt-3-transfer-airport-hotel') {
      trigger = nodes[1].status === 'BROKEN' ? 'Missed flight UK-811 connection at Delhi' : 'Delay shift on earlier flights';
      requiredBuffer = '30 min airport egress buffer';
      availableBuffer = `${selectedNode.slackMinutes ?? 0} min`;
      result = nodes[1].status === 'BROKEN' ? 'Chauffeur Suresh curbside pickup at Mumbai BOM (15:30) rendered invalid.' : 'Pickup on schedule.';
      causeType = 'Physical passenger presence co-location dependency';
    } else if (selectedNode.id === 'evt-4-hotel-checkin') {
      trigger = nodes[1].status === 'BROKEN' ? 'Flight cancellation/rebooking delay' : 'Transit timeline compression';
      requiredBuffer = '45 min check-in & suit prep window';
      availableBuffer = `${selectedNode.slackMinutes ?? 0} min`;
      result = nodes[1].status === 'BROKEN' ? 'Check-in window at St. Regis (16:45) missed. Room must be held.' : 'Check-in on schedule.';
      causeType = 'Flexible service dependency with late-arrival hold';
    } else if (selectedNode.id === 'evt-5-client-meeting') {
      trigger = nodes[1].status === 'BROKEN' ? 'Inability to arrive in Mumbai before 18:00' : 'Tight arrival buffer';
      requiredBuffer = 'Fixed 18:00 boardroom start (VP Singhania)';
      availableBuffer = `${selectedNode.slackMinutes ?? 0} min`;
      result = nodes[1].status === 'BROKEN' ? 'Traveler physically cannot reach Bandra Kurla Complex by 18:00 IST.' : 'Executive meeting timing preserved.';
      causeType = 'Hard executive commitment (High Priority)';
    } else if (selectedNode.id === 'evt-6-workshop') {
      trigger = 'Overnight buffer to Day 2';
      requiredBuffer = '8h mandatory overnight rest buffer';
      availableBuffer = `${selectedNode.slackMinutes ?? 540} min overnight buffer`;
      result = 'Workshop starts at 09:00 AM next day. Buffer is fully protected.';
      causeType = 'Decoupled next-day constraint';
    }

    return {
      trigger,
      requiredBuffer,
      availableBuffer,
      result: result || 'Constraint processed',
      causeType
    };
  }, [selectedNode, delayMinutes, newFlightArrival, nodes]);

  // Dependency Slack Data
  const slackData = useMemo(() => {
    const connectionGap = 60 - delayMinutes;
    const connectionDeficit = connectionGap - 45;

    const transferSlack = nodes[1].status === 'BROKEN' ? -delayMinutes : Math.max(0, 15 - Math.floor(delayMinutes / 4));
    const meetingSlack = nodes[1].status === 'BROKEN' ? -Math.max(60, delayMinutes - 30) : Math.max(0, 30 - delayMinutes);

    return [
      {
        name: 'Delhi T3 Connection Window',
        available: `${connectionGap} min`,
        required: '45 min MCT',
        remaining: `${connectionDeficit} min`,
        status: connectionDeficit < 0 ? 'BROKEN' : connectionDeficit < 15 ? 'AT_RISK' : 'SAFE'
      },
      {
        name: 'BOM Airport Transfer Buffer',
        available: nodes[1].status === 'BROKEN' ? '0 min (Invalidated)' : `${Math.max(0, 30 - Math.floor(delayMinutes / 3))} min`,
        required: '30 min',
        remaining: `${transferSlack} min`,
        status: nodes[2].status
      },
      {
        name: 'Pre-Meeting Preparation Window',
        available: nodes[1].status === 'BROKEN' ? '0 min (Delayed)' : `${Math.max(0, 30 - delayMinutes)} min`,
        required: '30 min',
        remaining: `${meetingSlack} min`,
        status: nodes[4].status
      }
    ];
  }, [delayMinutes, nodes]);

  // Reset to initial clean state
  const [approvalPhase, setApprovalPhase] = useState<string | null>(null);

  const handleReset = () => {
    setCurrentScreen('DASHBOARD');
    setCurrentStage(1);
    setDelayMinutes(120);
    setReason('Air Traffic Delay at DEL');
    setSelectedPlanId('PLAN_A');
    setIsExecuting(false);
    setApprovalPhase(null);
    setSelectedNodeId('evt-1-flight-nag-del');
    setDisruptionTriggerTime(Date.now());
  };

  const handleApprovePlan = () => {
    setIsExecuting(true);
    setApprovalPhase('VALIDATING RECOVERY...');
    
    setTimeout(() => {
      setApprovalPhase('CONSTRAINTS VERIFIED ✓');
    }, 450);

    setTimeout(() => {
      setApprovalPhase('APPLYING APPROVED CHANGES...');
    }, 900);

    setTimeout(() => {
      setApprovalPhase('JOURNEY REPLANNED ✓');
    }, 1350);

    setTimeout(() => {
      setIsExecuting(false);
      setApprovalPhase(null);
      setCurrentStage(7);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }, 1750);
  };

  const handleDelayChange = (newDelay: number) => {
    setDelayMinutes(newDelay);
    setDisruptionTriggerTime(Date.now());
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans bg-subtle-grid selection:bg-indigo-500/20 selection:text-indigo-900 relative">
      {/* AI SYSTEM STATUS MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="card-premium p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl max-w-md w-full text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900 font-display">
                  AI MODE & SYSTEM ARCHITECTURE
                </h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono-code mb-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Gemini API Layer</span>
                  <span className="text-[10px] font-bold text-slate-500">Model: {aiStatus.model || GEMINI_MODEL}</span>
                </div>
                <span className={`font-bold flex items-center gap-1.5 ${aiStatus.status === 'connected' ? 'text-emerald-700' : 'text-indigo-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${aiStatus.status === 'connected' ? 'bg-emerald-500' : 'bg-indigo-500'} animate-pulse`} />
                  {aiStatus.status === 'connected' ? `Connected ✓ (${aiStatus.mode})` : `${aiStatus.mode} (Deterministic Fallback)`}
                </span>
                {aiStatus.latencyMs && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">Response latency: {aiStatus.latencyMs}ms</span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Deterministic Engine</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active ✓ (Mathematical buffer & constraint calculations)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Agent Network</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  7 Specialized Agents Ready
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 font-sans leading-relaxed mb-4">
              <strong>Responsible Boundary:</strong> Gemini handles natural language normalization, disruption insights, and stakeholder notifications. All exact flight math, arrival feasibility, slack margins, and hard constraints are solved by deterministic engines.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleModalTestGemini}
                disabled={isTestingModalAi}
                className="flex-1 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isTestingModalAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>TESTING GEMINI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>TEST GEMINI</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowAiModal(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. POLISHED PRODUCT HEADER */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => {
              if (currentScreen !== 'LOGIN') {
                setCurrentScreen('DASHBOARD');
              }
            }}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-600/25 cursor-pointer hover:scale-105 transition-all"
          >
            D
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 
                onClick={() => {
                  if (currentScreen !== 'LOGIN') {
                    setCurrentScreen('DASHBOARD');
                  }
                }}
                className="text-lg font-extrabold tracking-tight text-slate-900 font-display cursor-pointer"
              >
                DOMINO
              </h1>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono-code px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                Disruption Agent
              </span>
            </div>
            <p className="text-xs text-indigo-600 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Route: Nagpur (NAG) → Delhi (DEL) → Mumbai (BOM)</span>
            </p>
          </div>
        </div>

        {/* Header CTA Controls */}
        <div className="flex items-center gap-2.5">
          {/* Global AI Status Badge (Clickable for System Architecture Modal) */}
          <button
            onClick={() => setShowAiModal(true)}
            className={`text-xs font-bold font-mono-code px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02] ${
              aiStatus.status === 'connected' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200/70 hover:bg-indigo-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{aiStatus.status === 'connected' ? '● GEMINI AI MODE' : '● DEMO AI MODE'}</span>
          </button>

          {/* Dashboard Button */}
          {currentScreen !== 'LOGIN' && currentScreen !== 'DASHBOARD' && (
            <button
              onClick={() => setCurrentScreen('DASHBOARD')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-xs cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span>DASHBOARD</span>
            </button>
          )}

          {/* Dedicated Agent Network Toggle */}
          <button
            onClick={() => {
              if (currentScreen === 'AGENT_NETWORK') {
                setCurrentScreen('TRIP');
              } else {
                setCurrentScreen('AGENT_NETWORK');
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
              currentScreen === 'AGENT_NETWORK'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/25'
                : 'bg-white hover:bg-slate-100 text-indigo-700 border-indigo-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AGENT NETWORK</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>RESET</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* SCREEN 1: LOGIN / DEMO ENTRY                             */}
      {/* ======================================================== */}
      {currentScreen === 'LOGIN' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 animate-fadeIn max-w-xl mx-auto w-full text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center font-black text-white text-3xl shadow-xl shadow-indigo-600/30 mb-4">
            D
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight mb-1">
            DOMINO
          </h1>

          <div className="inline-block px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-mono-code text-xs font-bold uppercase tracking-wider mb-3">
            Dependency-Aware Disruption Agent
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-800 leading-snug mb-2 font-display">
            "Travel disruption isn't one problem.<br />It's a chain reaction."
          </h2>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 max-w-md font-medium">
            "Trace the disruption. Simulate the consequences. Validate the recovery."
          </p>

          {/* Clean Login Card */}
          <div className="w-full card-premium p-6 rounded-3xl bg-white border border-slate-200 shadow-md text-left mb-4">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 font-display">
                Welcome back
              </h3>
              <span className="text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                DEMO READY
              </span>
            </div>

            <div className="space-y-3.5 mb-5 text-xs font-mono-code">
              <div>
                <label className="text-[11px] font-sans font-bold text-slate-600 block mb-1">
                  Name:
                </label>
                <input
                  type="text"
                  value={demoUserName}
                  onChange={(e) => setDemoUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="text-[11px] font-sans font-bold text-slate-600 block mb-1">
                  Mode:
                </label>
                <input
                  type="text"
                  value={demoUserRole}
                  onChange={(e) => setDemoUserRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
                  placeholder="Enter mode"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentScreen('DASHBOARD');
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] cursor-pointer"
            >
              <span>CONTINUE TO DOMINO</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 text-center">
              <span className="text-[11px] font-mono-code text-slate-500">
                DEMO MODE • No real account required
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2: DASHBOARD                                      */}
      {/* ======================================================== */}
      {currentScreen === 'DASHBOARD' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-8 animate-fadeIn flex flex-col">
          {/* Welcome Banner */}
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              Good morning, {demoUserName.split(' ')[0] || 'Harish'}
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              "Let's protect your journey from disruption."
            </p>
          </div>

          {/* Main Active Journey Card */}
          <div className="card-premium p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md mb-6 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-[11px] font-mono-code font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">
                  ACTIVE JOURNEY
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                  Nagpur → Delhi → Mumbai
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono-code font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ● Monitoring
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 font-mono-code text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Journey Date:</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Demo Trip (Today)
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Next Commitment:</span>
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Client Meeting — 18:00
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Active Status:</span>
                <span className="font-bold text-indigo-700 text-sm flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  {delayMinutes > 0 ? `+${delayMinutes}m Flight Slip` : 'On Schedule'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setCurrentScreen('TRIP');
                  setCurrentStage(1);
                }}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>OPEN JOURNEY</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setCurrentScreen('AGENT_NETWORK');
                }}
                className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>OPEN AGENT NETWORK</span>
              </button>
            </div>
          </div>

          {/* 4 Compact Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-left">
            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-500 block mb-1">
                TRIP STATUS
              </span>
              <p className="text-sm font-bold text-slate-900 mb-1">
                {delayMinutes > 0 ? 'Disruption Detected' : 'Normal'}
              </p>
              <span className="text-xs text-slate-500 font-mono-code">
                {delayMinutes > 0 ? `+${delayMinutes}m on AI-428` : 'All 6 events on time'}
              </span>
            </div>

            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-500 block mb-1">
                DEPENDENCIES
              </span>
              <p className="text-sm font-bold text-slate-900 mb-1">
                6 Events
              </p>
              <span className="text-xs text-slate-500 font-mono-code">
                Directed temporal DAG
              </span>
            </div>

            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-500 block mb-1">
                HIGH PRIORITY
              </span>
              <p className="text-sm font-bold text-slate-900 mb-1">
                2 Commitments
              </p>
              <span className="text-xs text-slate-500 font-mono-code">
                18:00 Meeting + Day 2
              </span>
            </div>

            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-slate-500 block mb-1">
                AGENT STATUS
              </span>
              <p className="text-sm font-bold text-indigo-700 mb-1">
                7 Agents Ready
              </p>
              <span className="text-xs text-emerald-700 font-mono-code font-bold">
                Deterministic verified ✓
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SIGNATURE PRESENTATION STATEMENT                         */}
          {/* ======================================================== */}
          <div className="card-premium p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white mb-8 text-center shadow-lg border border-indigo-800/40 relative overflow-hidden">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-code text-[11px] font-bold uppercase tracking-wider mb-2 border border-indigo-400/20">
              DOMINO SIGNATURE PRINCIPLE
            </div>
            <h3 className="text-lg sm:text-2xl font-black font-display tracking-tight text-white mb-1.5">
              "DOMINO doesn't just reschedule the flight. It reschedules the consequences."
            </h3>
            <p className="text-indigo-200 text-xs sm:text-sm font-medium">
              "DOMINO सिर्फ flight को reschedule नहीं करता, उसके consequences को भी reschedule करता है।"
            </p>
          </div>

          {/* ======================================================== */}
          {/* WHY DOMINO? SECTION                                      */}
          {/* ======================================================== */}
          <WhyDominoSection />

          {/* ======================================================== */}
          {/* HOW DOMINO HELPS SECTION                                 */}
          {/* ======================================================== */}
          <div className="w-full text-left mb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full font-mono-code">
                HOW DOMINO HELPS
              </span>
              <span className="text-xs text-slate-500 font-mono-code font-semibold">
                • 5 Core Functions
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              From one disruption to a validated recovery.
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              "DOMINO सिर्फ flight का नया time नहीं बताता। यह delay की वजह से पूरी journey में होने वाले consequences को समझकर recovery plan बनाता है।"
            </p>
          </div>

          {/* 5 Core Feature Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8 text-left">
            {/* 1. DETECT */}
            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center justify-center text-xs font-black font-mono-code">1</span>
                  <span className="text-[10px] font-mono-code font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full">DETECT</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Detects the disruption</h4>
                <p className="text-xs text-slate-600 leading-snug mb-3">
                  Flight delay या दूसरी travel disruption को detect करता है।
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 text-[11px] font-mono-code text-red-700 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                +120 min Flight Delay
              </div>
            </div>

            {/* 2. TRACE */}
            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center text-xs font-black font-mono-code">2</span>
                  <span className="text-[10px] font-mono-code font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">TRACE</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Traces dependency chain</h4>
                <p className="text-xs text-slate-600 leading-snug mb-3">
                  Connection, transfer, hotel और meeting पर क्या असर होगा, trace करता है।
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 text-[10px] font-mono-code text-slate-700 font-semibold leading-tight">
                Flight ↓ Connection ↓ Transfer ↓ Meeting
              </div>
            </div>

            {/* 3. SIMULATE */}
            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center text-xs font-black font-mono-code">3</span>
                  <span className="text-[10px] font-mono-code font-bold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">SIMULATE</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Simulates alternatives</h4>
                <p className="text-xs text-slate-600 leading-snug mb-3">
                  अलग-अलग recovery options को पहले simulate करता है।
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 text-[10px] font-mono-code text-purple-700 font-bold leading-tight">
                Preserve Meeting • Route • Cost
              </div>
            </div>

            {/* 4. VALIDATE */}
            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-xs font-black font-mono-code">4</span>
                  <span className="text-[10px] font-mono-code font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">VALIDATE</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Validates every plan</h4>
                <p className="text-xs text-slate-600 leading-snug mb-3">
                  Hard constraints, timing और dependencies के against check करता है।
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 text-[10px] font-mono-code font-bold flex items-center justify-between">
                <span className="text-emerald-700">✓ Feasible</span>
                <span className="text-red-600">✕ Violation</span>
              </div>
            </div>

            {/* 5. RECOVER */}
            <div className="card-premium p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-black font-mono-code">5</span>
                  <span className="text-[10px] font-mono-code font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">RECOVER</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Helps recover journey</h4>
                <p className="text-xs text-slate-600 leading-snug mb-3">
                  Human approval के बाद approved recovery plan लागू करके final plan तैयार करता है।
                </p>
              </div>
              <div className="pt-2.5 border-t border-slate-100 text-[10px] font-mono-code text-blue-700 font-bold leading-tight">
                Disruption → Recovery → Approved
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* WHAT DOES EACH AI AGENT DO? SECTION                      */}
          {/* ======================================================== */}
          <div className="card-premium p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-md mb-8 text-left">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full font-mono-code flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                    AGENTIC INTELLIGENCE
                  </span>
                  <span className="text-xs text-slate-500 font-mono-code font-semibold">
                    • 7 Coordinated AI Agents
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
                  WHAT DOES EACH AI AGENT DO?
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                  Multi-agent cooperative system: AI handles understanding & replanning, deterministic engines handle timing & validation.
                </p>
              </div>

              <button
                onClick={() => setCurrentScreen('AGENT_NETWORK')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>OPEN AGENT NETWORK</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
              </button>
            </div>

            {/* 7 Agent Cards with Hindi + English */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 mb-6">
              {/* 1. ITINERARY AGENT */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-mono-code font-black text-xs flex items-center justify-center">
                      1
                    </span>
                    <Compass className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight mb-1.5">
                    ITINERARY AGENT
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">
                    "पूरी travel journey को समझता है और flights, hotel, transfers और meetings को structured करता है."
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Understands the journey & normalizes schedule.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-mono-code font-bold text-indigo-700">
                  UNDERSTAND & PARSE
                </div>
              </div>

              {/* 2. DISRUPTION AGENT */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-red-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-red-100 text-red-800 font-mono-code font-black text-xs flex items-center justify-center">
                      2
                    </span>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight mb-1.5">
                    DISRUPTION AGENT
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">
                    "Flight delay या किसी भी changed event को detect करता है और disruption को understand करता है."
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Detects delay & extracts parameters.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-mono-code font-bold text-red-700">
                  DETECT DELAY
                </div>
              </div>

              {/* 3. DEPENDENCY AGENT */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-blue-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-mono-code font-black text-xs flex items-center justify-center">
                      3
                    </span>
                    <GitBranch className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight mb-1.5">
                    DEPENDENCY AGENT
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">
                    "यह पता करता है कि disrupted event पर कौन-कौन से downstream events depend करते हैं."
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Traces downstream graph chain.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-mono-code font-bold text-blue-700">
                  GRAPH PROPAGATION
                </div>
              </div>

              {/* 4. IMPACT AGENT */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-amber-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-mono-code font-black text-xs flex items-center justify-center">
                      4
                    </span>
                    <Activity className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight mb-1.5">
                    IMPACT AGENT
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">
                    "Disruption का Blast Radius calculate करता है और बताता है कि कौन सा event Safe, At Risk या Broken है."
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Calculates Safe / Risk / Broken status.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-mono-code font-bold text-amber-700">
                  BLAST RADIUS
                </div>
              </div>

              {/* 5. REPLANNING AGENT */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-purple-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-mono-code font-black text-xs flex items-center justify-center">
                      5
                    </span>
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight mb-1.5">
                    REPLANNING AGENT
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">
                    "Multiple recovery plans generate करता है — जैसे alternative route, connection change या meeting adjustment."
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Simulates counterfactual recovery worlds.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-mono-code font-bold text-purple-700">
                  RECOVERY WORLDS
                </div>
              </div>

              {/* 6. VALIDATION AGENT */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-mono-code font-black text-xs flex items-center justify-center">
                      6
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight mb-1.5">
                    VALIDATION AGENT
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">
                    "हर recovery plan को time, dependency और hard constraints के against verify करता है."
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Deterministic constraint checking.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-mono-code font-bold text-emerald-700">
                  HARD CONSTRAINTS
                </div>
              </div>

              {/* 7. COMMUNICATION AGENT */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 font-mono-code font-black text-xs flex items-center justify-center">
                      7
                    </span>
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-tight mb-1.5">
                    COMMUNICATION AGENT
                  </h4>
                  <p className="text-[11px] text-slate-700 font-medium leading-snug mb-2">
                    "Approved recovery plan के आधार पर traveller, hotel या meeting के लिए communication तैयार करता है."
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Prepares stakeholder alerts.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[9px] font-mono-code font-bold text-indigo-700">
                  PROACTIVE ALERTS
                </div>
              </div>
            </div>

            {/* Highlighted Core Agent Principle Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white mb-4 text-left shadow-sm">
              <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-300 bg-indigo-800/60 px-2.5 py-0.5 rounded-md border border-indigo-700/50 block w-fit mb-2">
                DOMINO का AI Agent क्या करता है?
              </span>
              <p className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed mb-2 font-display">
                "अगर flight delay होती है, तो DOMINO सिर्फ delay का alert नहीं भेजता। यह delay की वजह से पूरी journey में होने वाले consequences को समझकर 3 validated recovery plans बनाता है, hard constraints verify करता है और human decision के बाद proactive alerts generate करता है।"
              </p>
              <p className="text-xs text-indigo-300 font-mono-code font-medium">
                "DOMINO doesn't just reschedule the flight. It reschedules the consequences."
              </p>
            </div>

            {/* Technical Architecture Explanation */}
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3 text-left">
              <Bot className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-800 block mb-0.5">
                  HYBRID ARCHITECTURE: LLM REASONING + DETERMINISTIC VERIFICATION
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed">
                  "AI agents handle understanding, planning, replanning and communication. Deterministic engines handle exact timing, dependencies and constraint validation."
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* WHAT MAKES DOMINO DIFFERENT                              */}
          {/* ======================================================== */}
          <div className="card-premium p-6 sm:p-7 rounded-3xl bg-indigo-50/70 border border-indigo-200/80 mb-8 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 font-mono-code">
                WHAT MAKES DOMINO DIFFERENT?
              </span>
            </div>
            <p className="text-slate-900 text-sm sm:text-base font-semibold leading-relaxed mb-2 font-display">
              "DOMINO does not simply generate a new itinerary. It understands the dependency chain, simulates consequences, validates recovery options, and keeps a human in control of high-impact decisions."
            </p>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
              "DOMINO सिर्फ नई itinerary generate नहीं करता। यह dependency chain को समझता है, disruption का impact trace करता है, अलग recovery options simulate करता है और high-impact decisions के लिए human approval रखता है।"
            </p>
          </div>

          {/* ======================================================== */}
          {/* DOMINO CORE FLOW                                         */}
          {/* ======================================================== */}
          <div className="card-premium p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 mb-8 text-left shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full block w-fit mb-1">
                  CORE PIPELINE
                </span>
                <h4 className="text-lg sm:text-xl font-black text-slate-900 font-display">
                  DOMINO CORE FLOW
                </h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 font-display block">
                  "Disruption से Final Recovery तक"
                </span>
                <span className="text-[11px] text-slate-500 font-mono-code">
                  From disruption to validated recovery.
                </span>
              </div>
            </div>

            {/* 8-Step Connected Flow Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs font-mono-code font-bold">
              <div className="p-3 rounded-2xl bg-red-50 text-red-800 border border-red-200 flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-red-600 opacity-75">STEP 1</span>
                <span>DETECT</span>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-200 flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-indigo-600 opacity-75">STEP 2</span>
                <span>UNDERSTAND</span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-blue-600 opacity-75">STEP 3</span>
                <span>TRACE</span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-amber-600 opacity-75">STEP 4</span>
                <span>CALCULATE IMPACT</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 text-purple-800 border border-purple-200 flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-purple-600 opacity-75">STEP 5</span>
                <span>REPLAN</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-emerald-600 opacity-75">STEP 6</span>
                <span>VALIDATE</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-indigo-300 opacity-75">STEP 7</span>
                <span>APPROVE</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-600 text-white border border-emerald-700 shadow-sm flex flex-col justify-center items-center gap-1">
                <span className="text-[10px] text-emerald-200 opacity-75">STEP 8</span>
                <span>RECOVER</span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* DEMO SCENARIO                                            */}
          {/* ======================================================== */}
          <div className="card-premium p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 mb-6 text-left shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono-code">
                REAL DEMO SCENARIO
              </span>
            </div>

            <h4 className="text-lg sm:text-xl font-black text-slate-900 font-display mb-2">
              WHAT HAPPENS IF THE FLIGHT IS 120 MINUTES LATE?
            </h4>

            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold mb-1.5">
              "DOMINO checks whether the delay breaks the connecting flight, airport transfer, hotel timing or client meeting."
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-5">
              "अगर पहली flight 120 मिनट late होती है, तो DOMINO सिर्फ flight का नया time नहीं दिखाता। यह check करता है कि connection miss होगा या नहीं, transfer पर क्या असर होगा और 18:00 की meeting बच सकती है या नहीं।"
            </p>

            {/* Visual Demo Chain */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-mono-code font-bold">
              <span className="text-red-700 bg-red-100/80 px-2.5 py-1 rounded-lg border border-red-200">+120 MIN DELAY</span>
              <span className="text-slate-400">↓</span>
              <span className="text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200">CONNECTION AT RISK</span>
              <span className="text-slate-400">↓</span>
              <span className="text-slate-800 bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-300">BLAST RADIUS</span>
              <span className="text-slate-400">↓</span>
              <span className="text-purple-800 bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200">3 RECOVERY WORLDS</span>
              <span className="text-slate-400">↓</span>
              <span className="text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">CONSTRAINT VALIDATION</span>
              <span className="text-slate-400">↓</span>
              <span className="text-indigo-800 bg-indigo-100/80 px-2.5 py-1 rounded-lg border border-indigo-200">HUMAN APPROVAL</span>
              <span className="text-slate-400">↓</span>
              <span className="text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300">RECOVERED JOURNEY</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 3: AGENT NETWORK                                  */}
      {/* ======================================================== */}
      {currentScreen === 'AGENT_NETWORK' && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 flex flex-col justify-center">
          <AgentNetworkView
            delayMinutes={delayMinutes}
            reason={reason}
            nodes={nodes}
            report={report}
            recoveryPlans={recoveryPlans}
            selectedPlan={selectedPlan}
            onClose={() => setCurrentScreen('TRIP')}
          />
        </main>
      )}

      {/* ======================================================== */}
      {/* SCREEN 4: 7-STEP TRIP PRESENTATION FLOW                  */}
      {/* ======================================================== */}
      {currentScreen === 'TRIP' && (
        <>
          {/* 2. CONNECTED PROGRESS TIMELINE */}
          <div className="w-full bg-white/90 backdrop-blur-sm border-b border-slate-200 px-6 py-3 shadow-xs">
            <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
              {/* Numbered Connected Steps */}
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
                {STAGES.map((s, idx) => {
                  const isActive = currentStage === s.id;
                  const isPast = currentStage > s.id;

                  return (
                    <div key={s.id} className="flex items-center">
                      <button
                        onClick={() => {
                          setCurrentStage(s.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-2 ring-indigo-200'
                            : isPast
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                        }`}
                      >
                        <span className={`text-[10px] font-mono-code font-bold ${isActive ? 'text-indigo-200' : isPast ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {s.stepNum}
                        </span>
                        <span>{s.name}</span>
                        {isPast && <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />}
                      </button>

                      {idx < STAGES.length - 1 && (
                        <div className={`w-3 sm:w-5 h-[2px] mx-1 transition-all ${
                          currentStage > s.id ? 'bg-emerald-400' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Stepper Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentStage(Math.max(1, currentStage - 1));
                  }}
                  disabled={currentStage === 1}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-40 text-xs text-slate-700 font-semibold border border-slate-200 flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  onClick={() => {
                    setCurrentStage(Math.min(7, currentStage + 1));
                  }}
                  disabled={currentStage === 7}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. MAIN STORY STAGES */}
          <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 flex flex-col justify-center">
        {/* ======================================================== */}
        {/* STAGE 1: YOUR JOURNEY ("What is the journey?")           */}
        {/* ======================================================== */}
        {currentStage === 1 && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-3.5 py-1 rounded-full mb-2 inline-block font-mono-code">
                STEP 01 • YOUR JOURNEY
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                Scheduled Multi-Step Delegation
              </h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto mt-2">
                "One disruption. A chain reaction. One intelligent recovery."
              </p>
            </div>

            {/* WHAT HAPPENS IN THIS STEP EXPLAINER */}
            <StepExplainerCard
              stepNum="STEP 01"
              title="01 • TRIP — Journey Understanding"
              hindiText="यहाँ DOMINO पूरी यात्रा को समझता है और flights, connections, transfers, hotel, meetings और workshops को structured events में बदलता है."
              englishText="DOMINO converts the complete journey into structured events and identifies their relationships."
              observe="Original Journey"
              technical="Trip Parser + Event Model"
              presentationTip="यह हमारी normal journey है."
            />

            {/* Visual Route Banner */}
            <div className="w-full card-premium p-4 rounded-2xl mb-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  🛫
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono-code text-indigo-300 font-semibold tracking-wider">Mission Origin</span>
                  <h4 className="text-sm font-bold text-white">Nagpur (NAG)</h4>
                </div>
              </div>

              <div className="flex items-center gap-2 text-indigo-300 font-mono-code text-xs">
                <span>Via Delhi Transit (DEL T3)</span>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg">
                  🛬
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono-code text-indigo-300 font-semibold tracking-wider">Destination</span>
                  <h4 className="text-sm font-bold text-white">Mumbai (BOM)</h4>
                </div>
              </div>
            </div>

            {/* Horizontal Timeline Event Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mb-6">
              {/* Event 1 */}
              <div className="card-premium card-premium-hover p-4 rounded-2xl border-l-4 border-l-indigo-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">✈️</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">NAG → DEL</h3>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Flight AI-428</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-code text-slate-500">
                  10:00 - 11:45
                </div>
              </div>

              {/* Event 2 */}
              <div className="card-premium card-premium-hover p-4 rounded-2xl border-l-4 border-l-indigo-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">✈️</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">DEL → BOM</h3>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Flight UK-811</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-code text-slate-500">
                  12:45 - 15:00
                </div>
              </div>

              {/* Event 3 */}
              <div className="card-premium card-premium-hover p-4 rounded-2xl border-l-4 border-l-indigo-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🚕</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Transfer</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Chauffeur Suresh</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-code text-slate-500">
                  15:30 - 16:30
                </div>
              </div>

              {/* Event 4 */}
              <div className="card-premium card-premium-hover p-4 rounded-2xl border-l-4 border-l-indigo-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🏨</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Hotel</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">The St. Regis</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-code text-slate-500">
                  16:45 - 17:30
                </div>
              </div>

              {/* Event 5 */}
              <div className="card-premium card-premium-hover p-4 rounded-2xl border-l-4 border-l-indigo-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">💼</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Meeting</h3>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">VP Singhania</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-code text-slate-500">
                  18:00 - 19:30
                </div>
              </div>

              {/* Event 6 */}
              <div className="card-premium card-premium-hover p-4 rounded-2xl border-l-4 border-l-indigo-600 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">🎓</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 leading-tight">Workshop</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Innovation Center</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-mono-code text-slate-500">
                  Day 2 09:00
                </div>
              </div>
            </div>

            {/* Status Indicator Banner */}
            <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm font-semibold mb-6 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>✓ Everything is on schedule. Available connection buffer = 60 min at Delhi T3.</span>
              </div>
              <span className="text-xs font-mono-code text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-full">
                Nominal
              </span>
            </div>

            {/* Primary Action CTA */}
            <button
              onClick={() => setCurrentStage(2)}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
            >
              <span>SIMULATE DISRUPTION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 2: FLIGHT DISRUPTION ("What changed?")             */}
        {/* ======================================================== */}
        {currentStage === 2 && (
          <div className="w-full flex flex-col items-center animate-fadeIn max-w-3xl mx-auto">
            {/* Stage Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 border border-red-200/80 text-red-700 font-mono-code text-xs font-bold uppercase tracking-wider mb-2">
                <span>STEP 02</span>
                <span>•</span>
                <span>FLIGHT DISRUPTION</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                One Delay Can Change The Entire Journey
              </h2>
              <p className="text-slate-600 text-sm max-w-lg mx-auto mt-1.5">
                Let's see what happens when the first flight is delayed.
              </p>
            </div>

            {/* WHAT HAPPENS IN THIS STEP EXPLAINER */}
            <StepExplainerCard
              stepNum="STEP 02"
              title="02 • DISRUPTION — Detect What Changed"
              hindiText="यहाँ हम journey में disruption introduce करते हैं, जैसे पहली flight में 120 मिनट की delay."
              englishText="DOMINO detects the changed event and updates its timing."
              observe="120-minute flight delay"
              technical="Disruption Detection + Event Update"
              presentationTip="अब मैं first flight में 120-minute delay introduce करता हूँ."
            />

            {/* Central Primary Flight Disruption Card */}
            <div className="w-full card-premium p-6 sm:p-7 rounded-3xl border-2 border-red-200/90 bg-white shadow-md mb-6 text-left">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center text-2xl shadow-xs">
                    ✈️
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 font-display">NAG → DEL</h3>
                      <span className="text-xs font-mono-code font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
                        Flight AI-428
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Nagpur Dr. Ambedkar → Delhi IGI Terminal 3</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 font-mono-code border border-red-200 shadow-xs">
                    +{delayMinutes} MIN DELAY
                  </span>
                </div>
              </div>

              {/* Visual Before / After Timeline Comparison */}
              <div className="mt-5 mb-6 space-y-3">
                <span className="text-[11px] uppercase font-mono-code font-bold text-slate-400 tracking-wider block">
                  TIMELINE SHIFT PREVIEW
                </span>

                {/* Original Schedule Bar */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono-code text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-200/70">
                      ORIGINAL
                    </span>
                    <span className="text-sm font-extrabold text-slate-700 font-mono-code">
                      10:00 ────────── 11:45
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">1h 45m scheduled duration</span>
                </div>

                {/* Delay Connector Indicator */}
                <div className="flex items-center justify-center -my-1">
                  <div className="px-3 py-0.5 rounded-full bg-red-100 border border-red-200 text-red-700 text-[11px] font-mono-code font-bold flex items-center gap-1.5 shadow-xs">
                    <span>+{delayMinutes} MIN OPERATIONAL DELAY</span>
                  </div>
                </div>

                {/* Updated Schedule Bar */}
                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono-code text-red-700 uppercase px-2 py-0.5 rounded bg-red-100">
                      UPDATED
                    </span>
                    <span className="text-sm font-black text-red-600 font-mono-code">
                      10:00 ────────────────── {newFlightArrival}
                    </span>
                  </div>
                  <span className="text-xs text-red-700 font-semibold">Lands Delhi at {newFlightArrival}</span>
                </div>
              </div>

              {/* Disruption Simulator Slider & Quick Buttons */}
              <div className="bg-slate-50/90 p-5 rounded-2xl border border-slate-200/90 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold font-mono-code text-slate-700 uppercase tracking-wide">
                    SIMULATE FLIGHT DELAY:
                  </span>
                  <span className="text-base font-black font-mono-code text-red-600">
                    +{delayMinutes} MIN
                  </span>
                </div>

                <input
                  type="range"
                  min={15}
                  max={180}
                  step={15}
                  value={delayMinutes}
                  onChange={(e) => handleDelayChange(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600 mb-4"
                />

                <div className="grid grid-cols-6 gap-1.5">
                  {[30, 60, 90, 120, 150, 180].map((m) => (
                    <button
                      key={m}
                      onClick={() => handleDelayChange(m)}
                      className={`py-2 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer ${
                        delayMinutes === m
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/25 ring-2 ring-red-200'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Delay Feasibility Status */}
              <div className={`p-4 rounded-2xl border mb-5 flex items-start justify-between gap-3 ${connectionStatus.boxBg}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-3 h-3 rounded-full mt-1 shrink-0 ${connectionStatus.dotColor} animate-pulse`} />
                  <div>
                    <span className="text-xs font-black font-mono-code tracking-wider uppercase block">
                      {connectionStatus.label}
                    </span>
                    <p className="text-xs sm:text-sm mt-0.5 leading-relaxed font-medium">
                      {connectionStatus.text}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-mono-code font-bold uppercase px-2.5 py-1 rounded-md border shrink-0 ${connectionStatus.badgeBg}`}>
                  {connectionStatus.type}
                </span>
              </div>

              {/* Root Cause Banner */}
              <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                <span><strong>Reported Root Cause:</strong> Air Traffic Delay at Delhi Airport (ATC Hold & Runway Maintenance)</span>
                <span className="text-slate-500 font-mono-code text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                  DEL T3 Airspace
                </span>
              </div>
            </div>

            {/* Why This Matters Preview Section */}
            <div className="w-full card-premium p-5 rounded-3xl border border-slate-200/90 bg-white mb-6 text-left shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 font-mono-code">
                  WHY THIS MATTERS
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Temporal Graph Propagation
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
                DOMINO is not changing the itinerary yet. First, it measures how much of the journey this disruption can affect across temporal buffers.
              </p>

              {/* Subtle Dependency Chain Preview */}
              <div className="flex items-center justify-between overflow-x-auto py-2 px-1 text-xs font-mono-code font-bold text-slate-700">
                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                  <span>✈️ FLIGHT</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                  <span>🔄 CONNECTION</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                  <span>🚕 TRANSFER</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                  <span>🏨 HOTEL</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                  <span>💼 MEETING</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Navigation */}
            <div className="flex items-center gap-3 w-full justify-center">
              <button
                onClick={() => setCurrentStage(1)}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                onClick={() => setCurrentStage(3)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <span>ANALYZE IMPACT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 3: IMPACT VIEW ("What did the delay break?")        */}
        {/* ======================================================== */}
        {currentStage === 3 && (
          <div className="w-full flex flex-col items-center animate-fadeIn max-w-4xl mx-auto space-y-6">
            {/* Stage Title */}
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-red-50 border border-red-200/80 text-red-700 font-mono-code text-xs font-bold uppercase tracking-wider mb-2">
                <span>STEP 03</span>
                <span>•</span>
                <span>IMPACT ANALYSIS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                One Delay. A Chain Reaction.
              </h2>
              <p className="text-slate-600 text-sm max-w-lg mx-auto mt-1.5 font-medium">
                DOMINO traces the disruption through the journey's temporal dependencies.
              </p>
            </div>

            {/* WHAT HAPPENS IN THIS STEP EXPLAINER */}
            <StepExplainerCard
              stepNum="STEP 03"
              title="03 • IMPACT — Find the Consequences"
              hindiText="DOMINO check करता है कि disruption की वजह से कौन-कौन से downstream events प्रभावित हुए हैं."
              englishText="DOMINO traces dependencies and calculates which events are Safe, At Risk, or Broken."
              observe="Broken • At Risk • Safe"
              technical="Dependency Engine + Causal Blast Radius"
              presentationTip="अब DOMINO calculate करता है कि delay की वजह से क्या-क्या break हुआ."
            />

            {/* 1. Dynamic Impact Summary Metric Cards */}
            <div className="w-full grid grid-cols-3 gap-3.5 sm:gap-5">
              <div className="card-premium p-4 sm:p-5 rounded-3xl text-center border-t-4 border-t-red-600 bg-red-50/40 shadow-xs">
                <span className="text-xs font-black text-red-700 font-mono-code block mb-1 tracking-wider uppercase">
                  BROKEN
                </span>
                <span className="text-3xl sm:text-4xl font-black text-red-600 font-mono-code">
                  {report.brokenCount}
                </span>
                <span className="text-[11px] text-red-700/80 font-medium block mt-1">
                  Hard Overlap / Buffer Breached
                </span>
              </div>

              <div className="card-premium p-4 sm:p-5 rounded-3xl text-center border-t-4 border-t-amber-500 bg-amber-50/40 shadow-xs">
                <span className="text-xs font-black text-amber-700 font-mono-code block mb-1 tracking-wider uppercase">
                  AT RISK
                </span>
                <span className="text-3xl sm:text-4xl font-black text-amber-600 font-mono-code">
                  {report.atRiskCount}
                </span>
                <span className="text-[11px] text-amber-700/80 font-medium block mt-1">
                  Buffer Compressed
                </span>
              </div>

              <div className="card-premium p-4 sm:p-5 rounded-3xl text-center border-t-4 border-t-emerald-600 bg-emerald-50/40 shadow-xs">
                <span className="text-xs font-black text-emerald-700 font-mono-code block mb-1 tracking-wider uppercase">
                  SAFE
                </span>
                <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono-code">
                  {report.safeCount}
                </span>
                <span className="text-[11px] text-emerald-700/80 font-medium block mt-1">
                  Intact & Protected
                </span>
              </div>
            </div>

            {/* 2. Causal Chain (Main Visual with Cascade Animation) */}
            <div className="w-full card-premium p-6 sm:p-7 rounded-3xl text-left bg-white border border-slate-200 shadow-md">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 font-mono-code uppercase tracking-wider">
                    Cascading Dependency Chain
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any event below to inspect why it broke or succeeded.
                  </p>
                </div>

                <button
                  onClick={() => setCascadeKey(prev => prev + 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono-code transition-all shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>REPLAY CASCADE</span>
                </button>
              </div>

              {/* 6 Connected Chain Items */}
              <div className="space-y-3" key={cascadeKey}>
                {nodes.map((node, idx) => {
                  const isSelected = selectedNodeId === node.id;
                  const isBroken = node.status === 'BROKEN';
                  const isAtRisk = node.status === 'AT_RISK';

                  const itemBg = isBroken 
                    ? 'bg-red-50/90 border-red-200/90 hover:bg-red-100/70' 
                    : isAtRisk 
                    ? 'bg-amber-50/90 border-amber-200/90 hover:bg-amber-100/70' 
                    : 'bg-emerald-50/70 border-emerald-200/70 hover:bg-emerald-100/50';

                  const badgeBg = isBroken 
                    ? 'bg-red-100 text-red-800 border-red-300' 
                    : isAtRisk 
                    ? 'bg-amber-100 text-amber-800 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                  const iconMap: Record<string, string> = {
                    'evt-1-flight-nag-del': '✈️',
                    'evt-2-flight-del-bom': '✈️',
                    'evt-3-transfer-airport-hotel': '🚕',
                    'evt-4-hotel-checkin': '🏨',
                    'evt-5-client-meeting': '💼',
                    'evt-6-workshop': '🎓'
                  };

                  return (
                    <div key={node.id} className="animate-fadeIn" style={{ animationDelay: `${idx * 120}ms` }}>
                      <div
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-wrap items-center justify-between gap-3 ${itemBg} ${
                          isSelected ? 'ring-2 ring-indigo-600 shadow-sm' : 'shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="text-2xl shrink-0">{iconMap[node.id] || '📍'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{node.title}</h4>
                              <span className="text-[11px] font-mono-code text-slate-500 font-semibold">
                                {node.scheduledStart} - {node.scheduledEnd}
                              </span>
                            </div>
                            <p className={`text-xs mt-0.5 font-medium ${isBroken ? 'text-red-700' : isAtRisk ? 'text-amber-800' : 'text-emerald-800'}`}>
                              {node.impactExplanation}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono-code font-bold uppercase px-3 py-1 rounded-full border ${badgeBg}`}>
                            {node.status}
                          </span>
                        </div>
                      </div>

                      {idx < nodes.length - 1 && (
                        <div className="flex justify-center -my-1">
                          <div className={`w-[2px] h-3.5 ${
                            nodes[idx + 1].status === 'BROKEN' ? 'bg-red-300' : nodes[idx + 1].status === 'AT_RISK' ? 'bg-amber-300' : 'bg-emerald-300'
                          }`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Causal Explanation Deep-Dive Detail Panel */}
            {selectedNode && selectedNodeDetails && (
              <div className="w-full card-premium p-6 rounded-3xl text-left bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-black uppercase tracking-wider font-mono-code text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-md">
                      CAUSAL DIAGNOSTIC
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Why is {selectedNode.title} {selectedNode.status}?
                    </h4>
                  </div>
                  <span className="text-xs font-mono-code text-slate-500">
                    Node ID: {selectedNode.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[10px] uppercase font-mono-code font-bold text-slate-400 block mb-1">
                      Upstream Trigger
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">
                      {selectedNodeDetails.trigger}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[10px] uppercase font-mono-code font-bold text-slate-400 block mb-1">
                      Available Buffer / Slack
                    </span>
                    <span className={`text-xs font-bold block ${selectedNode.status === 'BROKEN' ? 'text-red-600' : 'text-slate-800'}`}>
                      {selectedNodeDetails.availableBuffer}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[10px] uppercase font-mono-code font-bold text-slate-400 block mb-1">
                      Required Buffer
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">
                      {selectedNodeDetails.requiredBuffer}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white border border-slate-200/80">
                    <span className="text-[10px] uppercase font-mono-code font-bold text-slate-400 block mb-1">
                      Dependency Constraint
                    </span>
                    <span className="text-xs font-bold text-indigo-700 block">
                      {selectedNodeDetails.causeType}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                  <span><strong>Deterministic Diagnostic:</strong> {selectedNodeDetails.result}</span>
                  <span className="text-[11px] font-mono-code text-slate-500 font-semibold">Priority: {selectedNode.priority}</span>
                </div>
              </div>
            )}

            {/* 4. Dependency Slack Visualization */}
            <div className="w-full card-premium p-6 rounded-3xl text-left bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono-code">
                    DEPENDENCY SLACK & BUFFER HEALTH
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time delta between required physical buffer vs available connection time.
                  </p>
                </div>
                <span className="text-xs font-mono-code font-bold text-slate-400">
                  Buffer Thresholds
                </span>
              </div>

              <div className="space-y-4">
                {slackData.map((item, idx) => {
                  const isBroken = item.status === 'BROKEN';
                  const isAtRisk = item.status === 'AT_RISK';

                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-900">{item.name}</span>
                        <div className="flex items-center gap-3 text-xs font-mono-code">
                          <span className="text-slate-500">Available: <strong className="text-slate-800">{item.available}</strong></span>
                          <span className="text-slate-500">Required: <strong className="text-slate-800">{item.required}</strong></span>
                          <span className={isBroken ? 'text-red-600 font-black' : isAtRisk ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                            Slack: {item.remaining}
                          </span>
                        </div>
                      </div>

                      {/* Status Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isBroken ? 'bg-red-500 w-full' : isAtRisk ? 'bg-amber-500 w-2/3' : 'bg-emerald-500 w-full'
                          }`} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Blast Radius Breakdown & Callout */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono-code font-bold uppercase text-slate-400 block mb-1">
                  DIRECT IMPACT
                </span>
                <span className="text-xl font-black text-red-600 font-mono-code">1 Event</span>
                <span className="text-xs text-slate-500 block mt-0.5">Flight AI-428 delay</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono-code font-bold uppercase text-slate-400 block mb-1">
                  DOWNSTREAM CASCADE
                </span>
                <span className="text-xl font-black text-amber-600 font-mono-code">
                  {Math.max(0, report.brokenCount + report.atRiskCount - 1)} Events
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">Connection, transfer & hotel</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-mono-code font-bold uppercase text-slate-400 block mb-1">
                  SAFE COMMITMENTS
                </span>
                <span className="text-xl font-black text-emerald-600 font-mono-code">{report.safeCount} Event</span>
                <span className="text-xs text-slate-500 block mt-0.5">Day 2 Workshop preserved</span>
              </div>
            </div>

            {/* 6. What DOMINO Did Differently Callout */}
            <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 text-left flex items-start gap-3.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                ✨
              </div>
              <div>
                <h5 className="text-xs font-bold text-indigo-950 uppercase font-mono-code">
                  WHAT DOMINO DID DIFFERENTLY
                </h5>
                <p className="text-xs sm:text-sm text-indigo-900/90 mt-0.5 leading-relaxed font-medium">
                  DOMINO does not simply regenerate the itinerary. First, it identifies the causal chain and determines exactly which commitments can still be preserved.
                </p>
              </div>
            </div>

            {/* 7. Bottom Navigation CTAs */}
            <div className="flex items-center gap-3 w-full justify-center pt-2">
              <button
                onClick={() => setCurrentStage(2)}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                onClick={() => setCurrentStage(4)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <span>EXPLORE 3D BLAST RADIUS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 4: 3D BLAST RADIUS VIEW ("How did it spread?")     */}
        {/* ======================================================== */}
        {currentStage === 4 && (
          <div className={`w-full flex flex-col items-center animate-fadeIn ${isPresentationMode ? 'max-w-7xl' : 'max-w-5xl'} mx-auto space-y-4`}>
            {/* Stage Title & Presentation Mode Toggle */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 text-left">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-mono-code text-xs font-bold uppercase tracking-wider mb-1.5">
                  <span>STEP 04</span>
                  <span>•</span>
                  <span>3D BLAST RADIUS</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                  Watch the Disruption Propagate
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
                  DOMINO visualizes the temporal dependency chain in 3D real time.
                </p>
              </div>

              {/* Presentation Mode Button */}
              <button
                onClick={() => setIsPresentationMode(!isPresentationMode)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono-code font-bold transition-all border shadow-xs cursor-pointer ${
                  isPresentationMode
                    ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isPresentationMode ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>EXIT PRESENTATION</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>PRESENTATION MODE</span>
                  </>
                )}
              </button>
            </div>

            {/* WHAT HAPPENS IN THIS STEP EXPLAINER */}
            <StepExplainerCard
              stepNum="STEP 04"
              title="04 • 3D BLAST RADIUS — Visualize the Chain Reaction"
              hindiText="यहाँ वही calculated dependency impact 3D graph में दिखाई देता है, जिससे पता चलता है कि disruption कहाँ से शुरू हुआ और कहाँ तक पहुँचा."
              englishText="The 3D graph visualizes the actual dependency chain and how the disruption propagates."
              observe="Flight → Connection → Transfer → Hotel → Meeting → Workshop"
              technical="3D Dependency Graph"
              badge="REAL DEPENDENCY GRAPH"
              presentationTip="अब वही impact 3D dependency graph में visualize होता है."
            />

            {/* Dedicated Hero 3D Canvas (Large: 75-80% of view) */}
            <div className="w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090d16]">
              <ThreeGraphCanvas
                nodes={nodes}
                edges={edges}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                disruptionTriggerTime={disruptionTriggerTime}
                report={report}
                selectedNodeDetails={selectedNodeDetails}
                isPresentationMode={isPresentationMode}
              />
            </div>

            {/* What-If Delay Interactive Simulator Bar */}
            <div className="w-full card-premium p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-left shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase font-mono-code text-slate-800 block">
                    WHAT-IF DISRUPTION CONTROL:
                  </span>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Adjust the delay to see the 3D graph dynamically adapt its status and blast radius.
                  </p>
                </div>
              </div>

              {/* Slider & Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                {[30, 60, 90, 120, 150, 180].map((m) => (
                  <button
                    key={m}
                    onClick={() => handleDelayChange(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono-code font-bold transition-all cursor-pointer ${
                      delayMinutes === m
                        ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    +{m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Causal Trace Flow Indicator */}
            <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-mono-code text-slate-600 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">CAUSAL TRACE:</span>
                <span className="text-red-600 font-bold">NAG-DEL (+{delayMinutes}m)</span>
                <span>➔</span>
                <span className="text-red-600 font-bold">DEL-BOM (Buffer Deficit)</span>
                <span>➔</span>
                <span className="text-amber-600 font-bold">Transfer & Hotel (At Risk)</span>
                <span>➔</span>
                <span className="text-red-600 font-bold">Client Meeting (Overlap)</span>
                <span>➔</span>
                <span className="text-emerald-600 font-bold">Workshop (Safe)</span>
              </div>
              <span className="text-[11px] text-slate-400">Deterministic DAG</span>
            </div>

            {/* Bottom Action Navigation */}
            <div className="flex items-center gap-3 w-full justify-center pt-2">
              <button
                onClick={() => setCurrentStage(3)}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                onClick={() => setCurrentStage(5)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <span>CONTINUE TO REPLANNING</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 5: REPLANNING & COUNTERFACTUAL SIMULATION          */}
        {/* ======================================================== */}
        {currentStage === 5 && (
          <div className="w-full flex flex-col items-center animate-fadeIn max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 rounded-full font-mono-code">
                  STEP 05 • REPLANNING
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full font-mono-code flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> 3 recovery worlds simulated
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                How should DOMINO recover?
              </h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl mx-auto">
                DOMINO simulates alternative futures before making a decision.
              </p>
            </div>

            {/* WHAT HAPPENS IN THIS STEP EXPLAINER */}
            <StepExplainerCard
              stepNum="STEP 05"
              title="05 • REPLAN — Simulate Recovery Options"
              hindiText="अब DOMINO original journey को blindly replace नहीं करता. यह multiple recovery plans simulate करता है."
              englishText="DOMINO generates alternative recovery plans and compares their impact."
              observe="Plan A • Plan B • Plan C"
              technical="Recovery Simulator + Counterfactual Planning"
              highlights={['Alternative route', 'Connection change', 'Meeting adjustment', 'Cost / impact comparison']}
              presentationTip="अब DOMINO multiple recovery options simulate करता है."
            />

            {/* SECTION 1 — CURRENT DISRUPTION */}
            <div className="w-full card-premium p-4 rounded-2xl mb-6 bg-slate-50/80 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-base shrink-0">
                  ✈️
                </span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-code block">
                    FLIGHT DISRUPTION
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    Nagpur → Delhi (AI-428)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono-code text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 block">ORIGINAL:</span>
                  <span className="font-bold text-slate-800">10:00 - 11:45</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">DELAYED:</span>
                  <span className="font-bold text-red-600">12:00 - {newFlightArrival}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">DELAY:</span>
                  <span className="font-bold text-red-600">+{delayMinutes} min</span>
                </div>
                <div className="hidden sm:block border-l border-slate-200 pl-4">
                  <span className="text-[10px] text-slate-500 block">AFFECTED COMMITMENT:</span>
                  <span className="font-bold text-slate-900">Delhi → Mumbai connection (UK-811)</span>
                </div>
              </div>
            </div>

            {/* Simulation Active Flash Indicator */}
            {simulatingWorld && (
              <div className="w-full py-1.5 px-4 mb-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono-code flex items-center justify-center gap-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>SIMULATING WORLD CONSEQUENCES & VALIDATING CONSTRAINTS...</span>
              </div>
            )}

            {/* SECTION 2 — 3 COUNTERFACTUAL WORLDS */}
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              {recoveryPlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handleSelectWorld(plan.id)}
                    className={`p-5 rounded-3xl cursor-pointer flex flex-col justify-between transition-all duration-200 relative ${
                      isSelected
                        ? plan.isFeasible 
                          ? 'bg-white ring-2 ring-indigo-600 shadow-lg shadow-indigo-600/10 border-indigo-200' 
                          : 'bg-white ring-2 ring-red-500 shadow-lg shadow-red-500/10 border-red-200'
                        : 'card-premium card-premium-hover'
                    }`}
                  >
                    {/* Top World Header & Badges */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full font-mono-code border ${
                          plan.recommended 
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {plan.worldCode}
                        </span>

                        {plan.isFeasible ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono-code">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> FEASIBLE
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono-code">
                            <XCircle className="w-3.5 h-3.5 text-red-600" /> REJECTED
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-1.5">
                        {plan.worldTitle}
                      </h3>
                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        {plan.strategy}
                      </p>

                      {/* Rejection Warning Banner if Rejected */}
                      {!plan.isFeasible && plan.rejectionReason && (
                        <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">REJECTED BY ENGINE:</span>
                            <span>{plan.rejectionReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Key Consequence Metrics Grid */}
                      <div className="space-y-2 text-xs font-mono-code mb-4">
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 font-sans">PRESERVED:</span>
                          <span className="font-bold text-slate-900 text-right">{plan.preservedLabel}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 font-sans">CHANGES:</span>
                          <span className="font-bold text-slate-900 text-right">{plan.changesLabel}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 font-sans">COST IMPACT:</span>
                          <span className={`font-extrabold text-sm ${plan.estimatedCost > 0 ? 'text-indigo-700' : 'text-emerald-700'}`}>
                            {plan.costImpactLabel}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 font-sans">INCONVENIENCE:</span>
                          <span className={`font-bold ${
                            plan.inconvenienceLevel === 'High' ? 'text-amber-700' : 'text-slate-800'
                          }`}>
                            {plan.inconvenienceLevel}
                          </span>
                        </div>
                        <div className="flex justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-slate-500 font-sans">ARRIVAL:</span>
                          <span className="font-bold text-slate-900 text-right">{plan.arrivalLabel}</span>
                        </div>
                      </div>
                    </div>

                    {/* Select / Active State Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectWorld(plan.id);
                      }}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? plan.isFeasible 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                            : 'bg-red-600 text-white shadow-md shadow-red-600/25'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>SIMULATING THIS WORLD</span>
                        </>
                      ) : (
                        <span>SIMULATE THIS WORLD</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* SECTION 3 — PLAN PROOF */}
            <div className="w-full card-premium p-6 rounded-3xl mb-6 bg-white border border-slate-200 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    <FileCheck2 className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-code block">
                      EXPLAINABLE VALIDATION
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 font-display">
                      PLAN PROOF • {selectedPlan.worldCode} — {selectedPlan.worldTitle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono-code font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Confidence: 98.4%
                  </span>
                  {selectedPlan.isFeasible ? (
                    <span className="text-xs font-mono-code font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> VALID
                    </span>
                  ) : (
                    <span className="text-xs font-mono-code font-bold px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> CONSTRAINT BREACH
                    </span>
                  )}
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                {selectedPlan.validationChecks.map((check, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                      check.passed 
                        ? 'bg-slate-50/80 border-slate-200/80 text-slate-800' 
                        : 'bg-red-50/80 border-red-200 text-red-900'
                    }`}
                  >
                    {check.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold block">{check.title}</span>
                      {check.note && <span className="text-[11px] text-slate-500 block mt-0.5">{check.note}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Numerical Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4 font-mono-code text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Hard Constraints:</span>
                  <span className={`font-extrabold text-sm ${selectedPlan.isFeasible ? 'text-emerald-700' : 'text-red-700'}`}>
                    {selectedPlan.hardConstraintsSatisfied} / {selectedPlan.hardConstraintsTotal} satisfied
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Soft Preferences:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedPlan.softPreferencesSatisfied} / {selectedPlan.softPreferencesTotal} satisfied
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Slack Remaining:</span>
                  <span className={`font-extrabold text-sm ${selectedPlan.remainingSlackMin >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                    {selectedPlan.remainingSlackMin >= 0 ? `${selectedPlan.remainingSlackMin} min` : `${selectedPlan.remainingSlackMin} min (deficit)`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Total Cost:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedPlan.costImpactLabel}
                  </span>
                </div>
              </div>

              {/* Plain Language Explainable Proof */}
              <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium ${
                selectedPlan.isFeasible 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                  : 'bg-red-50/80 border-red-200 text-red-950'
              }`}>
                {selectedPlan.isFeasible ? (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-emerald-900 font-bold mb-0.5">Constraint validation passed.</strong>
                      <span>{selectedPlan.explanation}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-red-900 font-bold mb-0.5">Constraint validation failed.</strong>
                      <span>{selectedPlan.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 4 — BEFORE vs AFTER COMPARISON */}
            <div className="w-full card-premium p-6 rounded-3xl mb-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 text-left">
              <div className="flex items-center gap-2 mb-4">
                <Scale className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code">
                  CONSEQUENCE COMPARISON (BEFORE vs AFTER)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LEFT: CURRENT DISRUPTED WORLD */}
                <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 font-mono-code block mb-3">
                    CURRENT WORLD (UNRESOLVED DISRUPTION)
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 border border-red-200 text-slate-800 flex items-center justify-between">
                      <span>✈️ Flight AI-428</span>
                      <span className="font-mono-code text-red-600 font-bold">Delayed +{delayMinutes}m</span>
                    </div>
                    <div className="text-center text-red-500 font-bold text-xs">↓</div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-red-200 text-slate-800 flex items-center justify-between">
                      <span>✈️ Connection UK-811</span>
                      <span className="font-mono-code text-red-600 font-bold">Broken / Missed</span>
                    </div>
                    <div className="text-center text-red-500 font-bold text-xs">↓</div>
                    <div className="p-2.5 rounded-xl bg-white/80 border border-red-200 text-slate-800 flex items-center justify-between">
                      <span>💼 Client Meeting (18:00)</span>
                      <span className="font-mono-code text-red-600 font-bold">At Risk / Missed</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: SIMULATED WORLD */}
                <div className={`p-4 rounded-2xl border ${
                  selectedPlan.isFeasible 
                    ? 'bg-emerald-50/60 border-emerald-200/80' 
                    : 'bg-slate-100 border-slate-300'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider font-mono-code block mb-3 ${
                    selectedPlan.isFeasible ? 'text-emerald-800' : 'text-slate-700'
                  }`}>
                    SIMULATED WORLD ({selectedPlan.worldCode}: {selectedPlan.worldTitle})
                  </span>
                  
                  <div className="space-y-2 text-xs">
                    {selectedPlan.id === 'PLAN_A' && (
                      <>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-slate-800 flex items-center justify-between">
                          <span>✈️ Rebook Flight UK-945</span>
                          <span className="font-mono-code text-emerald-700 font-bold">Departs 15:15 DEL</span>
                        </div>
                        <div className="text-center text-emerald-600 font-bold text-xs">↓</div>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-slate-800 flex items-center justify-between">
                          <span>🚕 Express Sea Link Transfer</span>
                          <span className="font-mono-code text-emerald-700 font-bold">Validated (17:45 BOM)</span>
                        </div>
                        <div className="text-center text-emerald-600 font-bold text-xs">↓</div>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-slate-800 flex items-center justify-between">
                          <span>💼 Client Meeting (Dinner)</span>
                          <span className="font-mono-code text-emerald-700 font-bold">Preserved (19:15 Taj)</span>
                        </div>
                      </>
                    )}

                    {selectedPlan.id === 'PLAN_B' && (
                      <>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 text-slate-800 flex items-center justify-between">
                          <span>✈️ Retain Original Ticket</span>
                          <span className="font-mono-code text-slate-700 font-bold">No Rebooking</span>
                        </div>
                        <div className="text-center text-slate-500 font-bold text-xs">↓</div>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-red-200 text-slate-800 flex items-center justify-between">
                          <span>✈️ Standby Flight Transit</span>
                          <span className="font-mono-code text-red-600 font-bold">Arrival: 19:40 BOM</span>
                        </div>
                        <div className="text-center text-red-500 font-bold text-xs">↓</div>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-red-200 text-slate-800 flex items-center justify-between">
                          <span>💼 Client Meeting</span>
                          <span className="font-mono-code text-red-600 font-bold">✕ MISSED (18:00 Breached)</span>
                        </div>
                      </>
                    )}

                    {selectedPlan.id === 'PLAN_C' && (
                      <>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-slate-800 flex items-center justify-between">
                          <span>💻 Lounge Hybrid Studio</span>
                          <span className="font-mono-code text-emerald-700 font-bold">18:00 - 19:00 (DEL T3)</span>
                        </div>
                        <div className="text-center text-emerald-600 font-bold text-xs">↓</div>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-slate-800 flex items-center justify-between">
                          <span>✈️ Relaxed Flight UK-867</span>
                          <span className="font-mono-code text-emerald-700 font-bold">19:45 → 22:00 BOM</span>
                        </div>
                        <div className="text-center text-emerald-600 font-bold text-xs">↓</div>
                        <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 text-slate-800 flex items-center justify-between">
                          <span>🎓 Day 2 AI Workshop</span>
                          <span className="font-mono-code text-emerald-700 font-bold">100% Protected (09:00)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5 — WHAT CHANGES IF... */}
            <div className="w-full card-premium p-5 rounded-2xl mb-6 bg-slate-50 text-left border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  WHAT CHANGES IF...
                </span>
                <span className="text-[11px] text-slate-500 font-sans">
                  Quick-simulate decision actions across the itinerary:
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 mb-4">
                <button
                  onClick={() => handleSelectWorld('PLAN_A')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPlanId === 'PLAN_A'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  [ Rebook Connection ]
                </button>

                <button
                  onClick={() => handleSelectWorld('PLAN_C')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPlanId === 'PLAN_C'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  [ Move Meeting ]
                </button>

                <button
                  onClick={() => handleSelectWorld('PLAN_B')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedPlanId === 'PLAN_B'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  [ Keep Current Route ]
                </button>
              </div>

              {/* Dynamic Outcome Preview */}
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono-code grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">ACTION:</span>
                  <span className="font-bold text-slate-900">{selectedPlan.changesLabel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">COST:</span>
                  <span className="font-bold text-slate-900">{selectedPlan.costImpactLabel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">MEETING:</span>
                  <span className={`font-bold ${selectedPlan.isFeasible ? 'text-emerald-700' : 'text-red-600'}`}>
                    {selectedPlan.isFeasible ? 'Preserved' : 'Missed (18:00)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">CONSTRAINT:</span>
                  <span className={`font-bold ${selectedPlan.isFeasible ? 'text-emerald-700' : 'text-red-600'}`}>
                    {selectedPlan.isFeasible ? '✓ Valid' : '✕ Violation'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 6 — SIMULATION SUMMARY & NAVIGATION */}
            <div className="w-full card-premium p-4 rounded-2xl mb-6 bg-slate-50 text-xs flex flex-wrap items-center justify-between gap-4 border border-slate-200">
              <span className="font-bold text-slate-800 font-mono-code uppercase">SIMULATION SUMMARY:</span>
              <div className="flex flex-wrap items-center gap-4 text-slate-600 font-mono-code">
                <span>World A: <strong className="text-slate-900">Meeting preserved • Higher cost • Feasible</strong></span>
                <span>•</span>
                <span>World B: <strong className={recoveryPlans[1].isFeasible ? 'text-slate-900' : 'text-red-700'}>
                  Route preserved • {recoveryPlans[1].isFeasible ? 'Feasible' : 'Rejected'}
                </strong></span>
                <span>•</span>
                <span>World C: <strong className="text-slate-900">Lowest cost • Meeting moved • Feasible</strong></span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              <button
                onClick={() => setCurrentStage(4)}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm border border-slate-200 transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>BACK TO BLAST RADIUS</span>
              </button>

              <button
                onClick={() => setCurrentStage(6)}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                <span>CONTINUE TO DECISION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 6: HUMAN DECISION GATEWAY                         */}
        {/* ======================================================== */}
        {currentStage === 6 && (
          <div className="w-full flex flex-col items-center animate-fadeIn max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1 rounded-full mb-2 inline-block font-mono-code">
                STEP 06 • FINAL DECISION
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                Ready to recover the journey?
              </h2>
              <p className="text-slate-600 text-sm mt-1 max-w-xl mx-auto">
                DOMINO has simulated the consequences. Review the validated recovery plan before applying it.
              </p>
            </div>

            {/* WHAT HAPPENS IN THIS STEP EXPLAINER */}
            <StepExplainerCard
              stepNum="STEP 06"
              title="06 • DECISION — Human Approval"
              hindiText="High-impact decisions जैसे flight rebooking या paid booking cancellation के लिए DOMINO human approval लेता है."
              englishText="DOMINO keeps humans in control of high-impact financial or business decisions."
              observe="Auto • Suggest • Approval Required"
              technical="Human-in-the-Loop Decision Layer"
              workflowTiers={[
                { label: 'LOW RISK', mode: 'AUTO', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                { label: 'MEDIUM RISK', mode: 'SUGGEST', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                { label: 'HIGH IMPACT', mode: 'HUMAN APPROVAL', color: 'bg-red-50 text-red-800 border-red-200' }
              ]}
              presentationTip="High-impact decision के लिए system human approval लेता है."
            />

            {/* Selected Recovery Plan Top Banner */}
            <div className="w-full card-premium p-5 rounded-3xl mb-6 bg-white border border-slate-200 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold font-mono-code border border-indigo-200">
                    {selectedPlan.worldCode}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {selectedPlan.worldTitle}
                  </h3>
                </div>

                {selectedPlan.isFeasible ? (
                  <span className="text-xs font-bold font-mono-code px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> FEASIBLE
                  </span>
                ) : (
                  <span className="text-xs font-bold font-mono-code px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-300 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-600" /> REJECTED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {selectedPlan.strategy}
              </p>

              {/* Compact Selected Plan Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono-code text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">MEETING</span>
                  <span className="font-extrabold text-emerald-700">Preserved ✓</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">CONNECTION</span>
                  <span className="font-bold text-slate-900">{selectedPlan.id === 'PLAN_A' ? 'Rebooked' : selectedPlan.id === 'PLAN_C' ? 'Shifted' : 'Retained'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">ARRIVAL</span>
                  <span className="font-bold text-slate-900">{selectedPlan.id === 'PLAN_A' ? 'Before commitment' : selectedPlan.arrivalLabel.split(' ')[0]}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">COST IMPACT</span>
                  <span className="font-extrabold text-slate-900">{selectedPlan.costImpactLabel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">INCONVENIENCE</span>
                  <span className="font-bold text-slate-800">{selectedPlan.inconvenienceLevel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">SLACK</span>
                  <span className="font-bold text-slate-900">{selectedPlan.remainingSlackMin >= 0 ? `${selectedPlan.remainingSlackMin} min` : `${selectedPlan.remainingSlackMin} min`}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-sans">HARD CONSTRAINTS</span>
                  <span className="font-extrabold text-emerald-700">{selectedPlan.hardConstraintsSatisfied} / {selectedPlan.hardConstraintsTotal} satisfied</span>
                </div>
              </div>
            </div>

            {/* Plan Proof ("Why this plan is valid") */}
            <div className="w-full card-premium p-5 rounded-3xl mb-6 bg-white border border-slate-200 text-left">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code">
                  WHY THIS PLAN IS VALID
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3.5">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Flight timing validated</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Connection dependency validated</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Airport transfer validated</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hotel timing validated</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Client meeting preserved</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2 text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Workshop preserved</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                <strong>Factual Validation:</strong> DOMINO selected this recovery because all hard temporal and commitment constraints are satisfied.
              </p>
            </div>

            {/* Autonomy & Trust Boundaries */}
            <div className="w-full card-premium p-5 rounded-3xl mb-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 text-left">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code">
                  DOMINO AUTONOMY BOUNDARIES
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* AUTO */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 font-mono-code flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> AUTO EXECUTED
                  </span>
                  <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                    <li className="flex items-center gap-1.5"><span>✓</span> Update itinerary</li>
                    <li className="flex items-center gap-1.5"><span>✓</span> Notify traveller</li>
                    <li className="flex items-center gap-1.5"><span>✓</span> Update hotel arrival time</li>
                  </ul>
                </div>

                {/* SUGGEST */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs font-bold text-amber-800 font-mono-code flex items-center gap-1.5 mb-2">
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600" /> SUGGEST
                  </span>
                  <ul className="space-y-1.5 text-xs text-amber-950 font-medium">
                    <li className="flex items-center gap-1.5"><span>→</span> Modify local transfer</li>
                    <li className="flex items-center gap-1.5"><span>→</span> Adjust flexible activity</li>
                  </ul>
                </div>

                {/* APPROVAL REQUIRED */}
                <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200">
                  <span className="text-xs font-bold text-red-800 font-mono-code flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> APPROVAL REQUIRED
                  </span>
                  <ul className="space-y-1.5 text-xs text-red-950 font-medium">
                    <li className="flex items-center gap-1.5"><span>⚠</span> Rebook flight</li>
                    <li className="flex items-center gap-1.5"><span>⚠</span> Cancel paid booking</li>
                    <li className="flex items-center gap-1.5"><span>⚠</span> Move high-priority meeting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Approval Notice Card & Action Buttons */}
            <div className="w-full card-premium p-6 rounded-3xl border-2 border-indigo-300 bg-white mb-6 text-left shadow-sm">
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase font-mono-code text-indigo-700 block">
                    🔐 HUMAN APPROVAL REQUIRED
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">
                    The selected plan requires a flight rebooking. DOMINO will not execute this action without approval.
                  </p>
                </div>
              </div>

              {/* Approval Animation Status if Executing */}
              {isExecuting && approvalPhase && (
                <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold font-mono-code flex items-center justify-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{approvalPhase}</span>
                </div>
              )}

              {/* Decision Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setCurrentStage(5)}
                  disabled={isExecuting}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  REVIEW OTHER PLANS
                </button>

                <button
                  onClick={handleApprovePlan}
                  disabled={isExecuting}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
                >
                  {isExecuting ? (
                    <span>EXECUTING APPROVAL...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>APPROVE RECOVERY PLAN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STAGE 7: FINAL REPLANNED JOURNEY                         */}
        {/* ======================================================== */}
        {currentStage === 7 && (
          <div className="w-full flex flex-col items-center text-center animate-fadeIn max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-300 px-3.5 py-1 rounded-full font-mono-code">
                  STEP 07 • FINAL JOURNEY
                </span>
                <span className="text-xs font-bold font-mono-code px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> RECOVERY PLAN APPLIED
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                Your journey has been replanned.
              </h2>
              <p className="text-slate-600 text-sm max-w-xl mx-auto mt-1">
                DOMINO applied the approved recovery plan while preserving high-priority commitments.
              </p>
            </div>

            {/* WHAT HAPPENS IN THIS STEP EXPLAINER */}
            <StepExplainerCard
              stepNum="STEP 07"
              title="07 • RESULT — Final Recovered Journey"
              hindiText="Approved recovery plan के बाद DOMINO final feasible journey तैयार करता है और बताता है कि क्या बदला और क्या preserve हुआ."
              englishText="DOMINO produces the final validated journey after approval."
              observe="Recovered Journey"
              technical="Validated Final Plan + Communication"
              highlights={['Final route', 'Changed events', 'Preserved commitments', 'Final timeline', 'Recovery summary']}
              presentationTip="अब हमें validated और recovered final journey मिलती है."
            />

            {/* BEFORE -> AFTER Visual Comparison */}
            <div className="w-full card-premium p-5 rounded-3xl mb-6 bg-white border border-slate-200 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code">
                  BEFORE → AFTER RECOVERY COMPARISON
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* BEFORE (Disrupted) */}
                <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 font-mono-code block mb-3">
                    BEFORE (UNRESOLVED DISRUPTION)
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/90 border border-red-200 flex justify-between items-center text-slate-800">
                      <span>✈️ 08:00 (10:00) Nagpur → Delhi Flight</span>
                      <span className="font-mono-code font-bold text-red-600">Delayed +{delayMinutes}m</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-red-200 flex justify-between items-center text-slate-800">
                      <span>✈️ Delhi → Mumbai Connection</span>
                      <span className="font-mono-code font-bold text-red-600">Connection at risk / Missed</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-red-200 flex justify-between items-center text-slate-800">
                      <span>💼 18:00 Client Meeting</span>
                      <span className="font-mono-code font-bold text-red-600">At risk / Missed</span>
                    </div>
                  </div>
                </div>

                {/* AFTER (Replanned) */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono-code block mb-3">
                    AFTER (DOMINO REPLANNED RECOVERY)
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 flex justify-between items-center text-slate-800">
                      <span>✈️ Flight AI-428 Schedule Sync</span>
                      <span className="font-mono-code font-bold text-emerald-700">12:00 - {newFlightArrival}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 flex justify-between items-center text-slate-800">
                      <span>✈️ Alternative Connection</span>
                      <span className="font-mono-code font-bold text-emerald-700">{selectedPlan.id === 'PLAN_A' ? 'UK-945 (15:15 - 17:35)' : selectedPlan.id === 'PLAN_C' ? 'UK-867 (19:45 - 22:00)' : 'Standby Transit'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 flex justify-between items-center text-slate-800">
                      <span>💼 Client Meeting Preserved</span>
                      <span className="font-mono-code font-bold text-emerald-700">{selectedPlan.id === 'PLAN_A' ? '19:15 Dinner Preserved ✓' : selectedPlan.id === 'PLAN_C' ? '18:00 Hybrid VIP Preserved ✓' : 'Rescheduled'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Replanned Journey Timeline Cards */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 mb-6 text-left">
              {/* Event 1 */}
              <div className="card-premium p-4 rounded-2xl border-l-4 border-l-slate-400 bg-slate-50/70">
                <span className="text-2xl block mb-1">✈️</span>
                <span className="text-xs font-bold text-slate-900 block">NAG → DEL</span>
                <span className="text-[11px] text-red-600 font-bold block">12:00 - {newFlightArrival}</span>
                <span className="text-[10px] text-slate-500 block mt-1">Delayed +{delayMinutes}m</span>
              </div>

              {/* Event 2 */}
              <div className="card-premium p-4 rounded-2xl border-l-4 border-l-emerald-600 bg-emerald-50/50 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] font-mono-code font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  UPDATED
                </span>
                <span className="text-2xl block mb-1">✈️</span>
                <span className="text-xs font-bold text-slate-900 block">{selectedPlan.id === 'PLAN_A' ? 'Rebooked UK-945' : selectedPlan.id === 'PLAN_C' ? 'Shifted UK-867' : 'DEL → BOM Standby'}</span>
                <span className="text-[11px] text-emerald-800 font-bold block">{selectedPlan.id === 'PLAN_A' ? '15:15 - 17:35' : selectedPlan.id === 'PLAN_C' ? '19:45 - 22:00' : '17:30 - 19:40'}</span>
                <span className="text-[10px] text-emerald-700 block mt-1">Confirmed Seat 2D</span>
              </div>

              {/* Event 3 */}
              <div className="card-premium p-4 rounded-2xl border-l-4 border-l-emerald-600 bg-emerald-50/50 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] font-mono-code font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  UPDATED
                </span>
                <span className="text-2xl block mb-1">🚕</span>
                <span className="text-xs font-bold text-slate-900 block">Express Cab</span>
                <span className="text-[11px] text-emerald-800 font-bold block">{selectedPlan.id === 'PLAN_A' ? '17:45 - 18:45' : selectedPlan.id === 'PLAN_C' ? '22:15 - 22:50' : '19:50 - 20:45'}</span>
                <span className="text-[10px] text-emerald-700 block mt-1">Driver Suresh Gate 4</span>
              </div>

              {/* Event 4 */}
              <div className="card-premium p-4 rounded-2xl border-l-4 border-l-emerald-600 bg-emerald-50/50 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] font-mono-code font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  {selectedPlan.id === 'PLAN_A' || selectedPlan.id === 'PLAN_C' ? 'PRESERVED' : 'UPDATED'}
                </span>
                <span className="text-2xl block mb-1">💼</span>
                <span className="text-xs font-bold text-slate-900 block">Client Meeting</span>
                <span className="text-[11px] text-emerald-800 font-bold block">{selectedPlan.id === 'PLAN_A' ? '19:15 - 20:45' : selectedPlan.id === 'PLAN_C' ? '18:00 - 19:00 (VIP)' : '20:45 (Shifted)'}</span>
                <span className="text-[10px] text-emerald-700 block mt-1">VP Vikram Singhania</span>
              </div>

              {/* Event 5 */}
              <div className="card-premium p-4 rounded-2xl border-l-4 border-l-emerald-600 bg-emerald-50/50 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] font-mono-code font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  UPDATED
                </span>
                <span className="text-2xl block mb-1">🏨</span>
                <span className="text-xs font-bold text-slate-900 block">Hotel Check-in</span>
                <span className="text-[11px] text-emerald-800 font-bold block">{selectedPlan.id === 'PLAN_A' ? '21:00 - 21:30' : selectedPlan.id === 'PLAN_C' ? '23:00 - 23:20' : '21:30 - 22:00'}</span>
                <span className="text-[10px] text-emerald-700 block mt-1">Late Hold Active</span>
              </div>

              {/* Event 6 */}
              <div className="card-premium p-4 rounded-2xl border-l-4 border-l-emerald-600 bg-emerald-50/50">
                <span className="text-2xl block mb-1">🎓</span>
                <span className="text-xs font-bold text-slate-900 block">AI Workshop</span>
                <span className="text-[11px] text-emerald-800 font-bold block">Day 2 09:00</span>
                <span className="text-[10px] text-emerald-700 block mt-1">100% On Schedule</span>
              </div>
            </div>

            {/* Impact Summary (6 Compact Metrics) */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 font-mono-code text-xs text-left">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Commitments Preserved</span>
                <span className="font-extrabold text-slate-900 text-base">5 / 5</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Hard Constraints</span>
                <span className="font-extrabold text-emerald-700 text-base">5 / 5</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Changed Events</span>
                <span className="font-extrabold text-slate-900 text-base">2</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Additional Cost</span>
                <span className="font-extrabold text-indigo-700 text-base">{selectedPlan.costImpactLabel}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Slack Remaining</span>
                <span className="font-extrabold text-slate-900 text-base">{selectedPlan.remainingSlackMin >= 0 ? `${selectedPlan.remainingSlackMin} min` : '45 min'}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs">
                <span className="text-[10px] text-emerald-700 uppercase block font-sans">Recovery Status</span>
                <span className="font-extrabold text-emerald-800 text-base flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" /> VALIDATED
                </span>
              </div>
            </div>

            {/* WHAT DOMINO CHANGED vs WHAT DID NOT CHANGE */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 card-premium">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code mb-3 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600" /> WHAT CHANGED?
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 font-mono-code">1.</span>
                    <span><strong>Connection flight:</strong> Rebooked to alternative connection ({selectedPlan.id === 'PLAN_A' ? 'UK-945 at 15:15' : selectedPlan.id === 'PLAN_C' ? 'UK-867 at 19:45' : 'Standby routing'})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 font-mono-code">2.</span>
                    <span><strong>Airport transfer:</strong> Chauffeur pickup synchronized to revised {selectedPlan.id === 'PLAN_A' ? '17:45' : selectedPlan.id === 'PLAN_C' ? '22:15' : '19:50'} arrival</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600 font-mono-code">3.</span>
                    <span><strong>Hotel arrival:</strong> Guaranteed late check-in transmission sent for {selectedPlan.id === 'PLAN_A' ? '21:00' : selectedPlan.id === 'PLAN_C' ? '23:00' : '21:30'}</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 card-premium">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> WHAT DID NOT CHANGE?
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Client meeting:</strong> Executive deal handshake preserved ({selectedPlan.id === 'PLAN_A' ? 'Taj Dinner' : selectedPlan.id === 'PLAN_C' ? 'VIP Lounge Link' : 'Reconciled'})</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Next-day workshop:</strong> Day 2 AI Architecture Workshop 100% on schedule</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>High-priority commitments:</strong> Zero cancellation of deal milestones</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* AUDIT TRAIL — DOMINO DECISION LOG */}
            <div className="w-full card-premium p-5 rounded-3xl mb-6 bg-slate-50 border border-slate-200 text-left">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono-code flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" /> DOMINO DECISION LOG (AUDIT TRAIL)
                </h4>
                <span className="text-[10px] font-mono-code text-slate-500">Traceability: 100% Deterministic</span>
              </div>

              <div className="space-y-2 font-mono-code text-xs text-slate-700">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500">09:42</span>
                  <span className="font-bold text-slate-900">Disruption detected — Flight AI-428 delayed +{delayMinutes} min</span>
                  <span className="text-[10px] text-red-600 font-bold">TRIGGER</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500">09:43</span>
                  <span className="font-medium text-slate-800">Dependency graph analyzed & temporal buffers evaluated</span>
                  <span className="text-[10px] text-slate-500">GRAPH</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500">09:43</span>
                  <span className="font-medium text-slate-800">Blast radius calculated — 2 Broken, 2 At-Risk, 2 Safe</span>
                  <span className="text-[10px] text-amber-600 font-bold">PROPAGATION</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500">09:44</span>
                  <span className="font-medium text-slate-800">Counterfactual recovery alternatives simulated (World A, B, C)</span>
                  <span className="text-[10px] text-indigo-600 font-bold">SIMULATION</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500">09:45</span>
                  <span className="font-medium text-slate-800">{selectedPlan.worldCode} validated against 5 hard constraints</span>
                  <span className="text-[10px] text-emerald-600 font-bold">VALIDATION</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-slate-500">09:46</span>
                  <span className="font-medium text-slate-800">Human approval received for flight rebooking & calendar shift</span>
                  <span className="text-[10px] text-indigo-600 font-bold">APPROVED</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold">
                  <span className="text-emerald-700">09:46</span>
                  <span>Recovery plan applied — Journey successfully replanned</span>
                  <span className="text-[10px] text-emerald-700">COMPLETED ✓</span>
                </div>
              </div>
            </div>

            {/* FINAL PRESENTATION CARD & BUTTONS */}
            <div className="w-full card-premium p-6 rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white mb-6 text-center shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg mx-auto mb-3 shadow-md shadow-indigo-600/50">
                D
              </div>
              <h3 className="text-xl font-extrabold font-display tracking-tight mb-1">
                DOMINO
              </h3>
              <p className="text-indigo-200 text-xs sm:text-sm font-semibold mb-2">
                "From disruption to validated recovery."
              </p>
              <p className="text-slate-300 text-xs max-w-xl mx-auto mb-5 leading-relaxed">
                DOMINO detected the disruption, traced its dependency chain, simulated alternative recovery worlds, validated constraints, obtained human approval, and produced a feasible replanned journey.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentStage(4)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>VIEW FINAL 3D JOURNEY</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RESTART DEMO</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
        </>
      )}
    </div>
  );
}

export default App;
