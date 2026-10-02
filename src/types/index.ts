export type NodeType = 'FLIGHT' | 'CONNECTION' | 'TRANSFER' | 'HOTEL' | 'MEETING' | 'WORKSHOP';

export type NodeStatus = 'SAFE' | 'AT_RISK' | 'BROKEN';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type FlexibilityLevel = 'RIGID' | 'MODERATE' | 'FLEXIBLE';

export type DependencyType = 'HARD_TEMPORAL' | 'HARD_COMMITMENT' | 'SOFT_PREFERENCE' | 'RESOURCE';

export interface EventNode {
  id: string;
  type: NodeType;
  title: string;
  subtitle: string;
  location: string;
  locationCode?: string;
  scheduledStart: string; // ISO or HH:mm e.g. "10:00 AM"
  scheduledEnd: string;   // e.g. "11:45 AM"
  actualStart: string;    // computed after delay
  actualEnd: string;      // computed after delay
  durationMinutes: number;
  priority: PriorityLevel;
  flexibility: FlexibilityLevel;
  baseCost: number;
  currency: string;
  status: NodeStatus;
  slackMinutes: number; // slack remaining before next constraint breaks
  minRequiredBuffer: number; // minimum buffer required before next event (in min)
  notes?: string;
  details: {
    operatorOrHost?: string;
    bookingRef?: string;
    seatOrRoom?: string;
    terminal?: string;
    contactPerson?: string;
    description: string;
  };
  impactExplanation?: string;
  upstreamCauseId?: string;
}

export interface DependencyEdge {
  id: string;
  source: string; // source EventNode id
  target: string; // target EventNode id
  type: DependencyType;
  minGapMinutes: number; // minimum buffer needed between source end & target start
  description: string;
  isViolated: boolean;
  slackMinutes: number;
  deficitMinutes?: number;
}

export interface DisruptionState {
  sourceEventId: string;
  delayMinutes: number;
  reason: string;
  timestamp: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  stepNumber: number;
  agent: 'Itinerary Agent' | 'Dependency Engine' | 'Blast Radius Agent' | 'Constraint Validator' | 'Replanning Agent' | 'Communication Agent' | 'Human Approver';
  action: string;
  nodeId?: string;
  nodeTitle?: string;
  details: string;
  status: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  metrics?: {
    slackLost?: number;
    slackRemaining?: number;
    confidenceScore?: number;
  };
}

export interface BlastRadiusReport {
  totalNodes: number;
  safeCount: number;
  atRiskCount: number;
  brokenCount: number;
  safeNodeIds: string[];
  atRiskNodeIds: string[];
  brokenNodeIds: string[];
  totalSlackConsumed: number;
  cascadeDepth: number;
  criticalPathBroken: boolean;
  affectedNodesList: EventNode[];
  auditTrail: AuditEntry[];
}

export type ActionImpact = 'HIGH' | 'LOW';

export interface PlanAction {
  id: string;
  title: string;
  category: 'FLIGHT' | 'HOTEL' | 'TRANSFER' | 'MEETING' | 'COMMUNICATION';
  description: string;
  impact: ActionImpact;
  requiresHumanApproval: boolean;
  isAuto: boolean;
  cost: number;
  currency: string;
  status: 'PENDING_APPROVAL' | 'AUTO_EXECUTED' | 'APPROVED' | 'COMPLETED';
}

export interface PlanValidationCheck {
  title: string;
  passed: boolean;
  note?: string;
}

export interface RecoveryPlan {
  id: 'PLAN_A' | 'PLAN_B' | 'PLAN_C';
  worldCode: 'WORLD A' | 'WORLD B' | 'WORLD C';
  worldTitle: string;
  name: string;
  strategy: string;
  badge: string;
  recommended: boolean;
  isFeasible: boolean;
  rejectionReason?: string;
  feasibility: 'FEASIBLE - HIGH CONFIDENCE' | 'FEASIBLE - MODERATE RISK' | 'FALLBACK OPTION' | 'REJECTED - CONSTRAINT VIOLATION';
  inconvenienceScore: number; // 0 to 100
  inconvenienceLevel: 'Low' | 'Medium' | 'High';
  estimatedCost: number;
  costImpactLabel: string;
  currency: string;
  arrivalTimeMumbai: string;
  arrivalLabel: string;
  meetingOutcome: string;
  changesLabel: string;
  preservedLabel: string;
  movedEvents: string[];
  preservedCommitments: string[];
  hardConstraintsSatisfied: number;
  hardConstraintsTotal: number;
  softPreferencesSatisfied: number;
  softPreferencesTotal: number;
  remainingSlackMin: number;
  validationChecks: PlanValidationCheck[];
  explanation: string;
  tradeoffs: string;
  actions: PlanAction[];
  timelineSummary: {
    event: string;
    oldTime: string;
    newTime: string;
    note: string;
  }[];
}

export interface CommunicationDraft {
  id: string;
  recipientCategory: 'CLIENT' | 'HOTEL' | 'DRIVER' | 'TRAVELER';
  recipientName: string;
  recipientTitle: string;
  contactMethod: 'WhatsApp' | 'Email' | 'SMS';
  subject: string;
  body: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  automated: boolean;
  status: 'DRAFTED' | 'SENT';
}

export type AgentId = 
  | 'itinerary-agent'
  | 'disruption-agent'
  | 'dependency-agent'
  | 'impact-agent'
  | 'replanning-agent'
  | 'validation-agent'
  | 'communication-agent';

export type AgentExecutionStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ToolCall {
  name: string;
  type: 'AI_REASONING' | 'DETERMINISTIC_ENGINE' | 'CONSTRAINT_SOLVER' | 'DISPATCHER';
  description: string;
  executionTimeMs: number;
}

export interface DominoAgentDef {
  id: AgentId;
  name: string;
  shortName: string;
  icon: string;
  purpose: string;
  inputDescription: string;
  outputDescription: string;
  toolUsed: string;
  toolCategory: 'AI Reasoning' | 'Deterministic Engine' | 'Constraint Engine' | 'Dispatcher' | 'Gemini';
  actionDescription: string;
  activeSummary: string;
  status: AgentExecutionStatus;
  executionTimeMs: number;
  sampleOutput: string[];
  hindiSummary?: string;
  observe?: string;
  technical?: string;
}

