import type { RecoveryPlan } from '../types';

export function generateRecoveryPlans(delayMinutes: number): RecoveryPlan[] {
  const isMinorDelay = delayMinutes <= 45;

  const planA: RecoveryPlan = {
    id: 'PLAN_A',
    worldCode: 'WORLD A',
    worldTitle: 'PRESERVE MEETING',
    name: 'World A: Rebook Connection (Preserve Meeting)',
    strategy: 'Rebook the Delhi → Mumbai connection using an alternative available flight (UK-945). Keep the client meeting.',
    badge: 'RECOMMENDED • BALANCED',
    recommended: true,
    isFeasible: true,
    feasibility: 'FEASIBLE - HIGH CONFIDENCE',
    inconvenienceScore: Math.min(85, Math.max(15, Math.round(25 + delayMinutes * 0.15))),
    inconvenienceLevel: 'Medium',
    estimatedCost: 4500,
    costImpactLabel: '+₹4,500',
    currency: 'INR',
    arrivalTimeMumbai: isMinorDelay ? '15:20' : '17:35',
    arrivalLabel: '17:35 IST (Before meeting)',
    meetingOutcome: 'Client Meeting Preserved (19:15 Dinner)',
    changesLabel: 'Connection flight',
    preservedLabel: 'Client meeting',
    hardConstraintsSatisfied: 5,
    hardConstraintsTotal: 5,
    softPreferencesSatisfied: 3,
    softPreferencesTotal: 4,
    remainingSlackMin: 45,
    validationChecks: [
      { title: 'Flight timing updated', passed: true, note: 'UK-945 departing DEL 15:15' },
      { title: 'Connection dependency checked', passed: true, note: '90m buffer at DEL T3' },
      { title: 'Airport transfer checked', passed: true, note: 'Chauffeur synced to 17:45 BOM' },
      { title: 'Hotel timing checked', passed: true, note: 'Late check-in deferred to 21:00' },
      { title: 'Client meeting constraint preserved', passed: true, note: 'Preserved at 19:15 Taj Land\'s End' },
      { title: 'Workshop constraint preserved', passed: true, note: 'Day 2 09:00 AM 100% on schedule' }
    ],
    movedEvents: [
      'Connecting Flight DEL→BOM (Rebooked to UK-945 at 15:15)',
      'Airport Transfer (Rescheduled to 17:45)',
      'Client Meeting (Moved from 18:00 to 19:15)',
      'Hotel Check-In (Deferred to 21:00 post-meeting)'
    ],
    preservedCommitments: [
      'Face-to-face executive handshake with VP Vikram Singhania',
      'Full Day 2 AI Architecture Workshop (09:00 AM)',
      'Luxury Suite at The St. Regis Mumbai'
    ],
    explanation: `Replaces missed connection UK-811 with flight UK-945 (departing DEL 15:15, landing BOM 17:35). High-speed transit brings traveler directly to Taj Land's End for a working dinner meeting at 19:15. Hotel check-in is seamlessly deferred to 21:00.`,
    tradeoffs: 'Client meeting shifted slightly to high-touch executive dinner; in-person deal closing relationship maintained.',
    timelineSummary: [
      {
        event: 'Flight UK-945 (DEL → BOM)',
        oldTime: '12:45 → 15:00',
        newTime: isMinorDelay ? '12:45 → 15:00' : '15:15 → 17:35',
        note: 'Rebooked on Vistara UK-945 (Confirmed Seat 2D)'
      },
      {
        event: 'Executive Chauffeur (CSMIA → Taj Land\'s End)',
        oldTime: '15:30 → 16:30',
        newTime: '17:45 → 18:45',
        note: 'Driver Suresh redirected to curbside Gate 4'
      },
      {
        event: 'Apex Client Meeting (Working Dinner)',
        oldTime: '18:00 → 19:30',
        newTime: '19:15 → 20:45',
        note: 'Executive dinner table reserved at Ming Yang, Taj Land\'s End'
      },
      {
        event: 'Hotel Check-In (St. Regis Mumbai)',
        oldTime: '16:45 → 17:30',
        newTime: '21:00 → 21:30',
        note: 'Guaranteed late check-in notification transmitted'
      },
      {
        event: 'Day 2 AI Workshop (Innovation Hall)',
        oldTime: '09:00 → 17:00',
        newTime: '09:00 → 17:00',
        note: '100% on schedule with full night\'s rest'
      }
    ],
    actions: [
      {
        id: 'act-a1',
        title: 'Rebook DEL→BOM flight to Vistara UK-945 (15:15)',
        category: 'FLIGHT',
        description: 'Authorize airline re-ticketing via corporate GDS API. 2 seats remaining in Business cabin.',
        impact: 'HIGH',
        requiresHumanApproval: true,
        isAuto: false,
        cost: 3500,
        currency: 'INR',
        status: 'PENDING_APPROVAL'
      },
      {
        id: 'act-a2',
        title: 'Reschedule Client Meeting to 19:15 (Dinner)',
        category: 'MEETING',
        description: 'Send calendar update and VIP dinner invitation to Vikram Singhania (VP Engineering).',
        impact: 'HIGH',
        requiresHumanApproval: true,
        isAuto: false,
        cost: 1000,
        currency: 'INR',
        status: 'PENDING_APPROVAL'
      },
      {
        id: 'act-a3',
        title: 'Auto-Notify Chauffeur Suresh of revised 17:45 pickup',
        category: 'TRANSFER',
        description: 'Automated WhatsApp dispatch with real-time flight telemetry sync.',
        impact: 'LOW',
        requiresHumanApproval: false,
        isAuto: true,
        cost: 0,
        currency: 'INR',
        status: 'AUTO_EXECUTED'
      },
      {
        id: 'act-a4',
        title: 'Auto-Notify The St. Regis Mumbai (Late Check-in at 21:00)',
        category: 'HOTEL',
        description: 'Automated Marriott Bonvoy concierge API transmission to hold Deluxe Suite #2804.',
        impact: 'LOW',
        requiresHumanApproval: false,
        isAuto: true,
        cost: 0,
        currency: 'INR',
        status: 'AUTO_EXECUTED'
      }
    ]
  };

  const isWorldBFeasible = isMinorDelay;

  const planB: RecoveryPlan = {
    id: 'PLAN_B',
    worldCode: 'WORLD B',
    worldTitle: 'PRESERVE ROUTE',
    name: 'World B: Preserve Existing Route & Slack',
    strategy: 'Keep the existing travel route and absorb delay using available buffer slack without rebooking tickets.',
    badge: isWorldBFeasible ? 'ROUTE PRESERVED' : 'REJECTED BY CONSTRAINT ENGINE',
    recommended: false,
    isFeasible: isWorldBFeasible,
    rejectionReason: isWorldBFeasible ? undefined : 'Arrival occurs after the hard meeting constraint.',
    feasibility: isWorldBFeasible ? 'FEASIBLE - MODERATE RISK' : 'REJECTED - CONSTRAINT VIOLATION',
    inconvenienceScore: isWorldBFeasible ? 40 : 95,
    inconvenienceLevel: isWorldBFeasible ? 'Medium' : 'High',
    estimatedCost: 0,
    costImpactLabel: '₹0 / Low',
    currency: 'INR',
    arrivalTimeMumbai: isWorldBFeasible ? '15:20' : '19:40',
    arrivalLabel: isWorldBFeasible ? '15:20 IST' : '19:40 IST (After meeting)',
    meetingOutcome: isWorldBFeasible ? 'Preserved On Time' : 'Constraint Violated: Meeting Missed',
    changesLabel: 'Transfer / timing',
    preservedLabel: 'Existing route',
    hardConstraintsSatisfied: isWorldBFeasible ? 5 : 4,
    hardConstraintsTotal: 5,
    softPreferencesSatisfied: isWorldBFeasible ? 4 : 2,
    softPreferencesTotal: 4,
    remainingSlackMin: isWorldBFeasible ? 15 : -90,
    validationChecks: [
      { title: 'Flight timing updated', passed: true, note: 'Keeps original ticket' },
      { title: 'Connection dependency checked', passed: isWorldBFeasible, note: isWorldBFeasible ? 'Tight buffer' : 'Buffer exceeded at DEL' },
      { title: 'Airport transfer checked', passed: true, note: 'Adjusted to actual arrival' },
      { title: 'Hotel timing checked', passed: true, note: 'Normal check-in' },
      { 
        title: 'Client meeting constraint preserved', 
        passed: isWorldBFeasible, 
        note: isWorldBFeasible ? 'Meeting intact' : 'REJECTED: Arrival at 19:40 violates 18:00 deadline' 
      },
      { title: 'Workshop constraint preserved', passed: true, note: 'Day 2 intact' }
    ],
    movedEvents: isWorldBFeasible ? ['Buffer compressed'] : [
      'Original Connection Missed (Next available standby reaches BOM at 19:40)',
      'Client Meeting Missed (18:00 slot breached)'
    ],
    preservedCommitments: [
      'Original itinerary airline carrier',
      'Day 2 AI Workshop (09:00 AM)'
    ],
    explanation: isWorldBFeasible 
      ? `Minor delay absorbed by existing connection buffer.` 
      : `Attempting to preserve original route without rebooking results in missing connecting flight UK-811. Standby transit delays arrival to 19:40, breaching the hard 18:00 executive meeting constraint.`,
    tradeoffs: isWorldBFeasible 
      ? 'Zero additional cost, but tight buffer at airport.' 
      : 'Zero rebooking fee, but causes hard failure of key business milestone (Meeting Missed).',
    timelineSummary: [
      {
        event: 'Original Connection (DEL → BOM)',
        oldTime: '12:45 → 15:00',
        newTime: isWorldBFeasible ? '12:45 → 15:00' : '17:30 → 19:40',
        note: isWorldBFeasible ? 'Connection preserved' : 'Missed connection -> Standby'
      },
      {
        event: 'Client Meeting (18:00)',
        oldTime: '18:00 → 19:30',
        newTime: '18:00 (MISSED)',
        note: isWorldBFeasible ? 'Preserved' : 'VIOLATED: Passenger in transit'
      }
    ],
    actions: [
      {
        id: 'act-b1',
        title: 'Retain Original Ticket Routing',
        category: 'FLIGHT',
        description: 'Do not issue any airline re-ticketing; rely on airline gate standby.',
        impact: 'HIGH',
        requiresHumanApproval: true,
        isAuto: false,
        cost: 0,
        currency: 'INR',
        status: 'PENDING_APPROVAL'
      }
    ]
  };

  const planC: RecoveryPlan = {
    id: 'PLAN_C',
    worldCode: 'WORLD C',
    worldTitle: 'MINIMIZE COST',
    name: 'World C: Move Meeting / Hybrid VIP Lounge + Evening Flight',
    strategy: 'Keep the current travel route and move the flexible meeting/activity to an executive VIP video link or 20:00.',
    badge: 'ZERO REBOOKING COST • LOW INCONVENIENCE',
    recommended: false,
    isFeasible: true,
    feasibility: 'FEASIBLE - HIGH CONFIDENCE',
    inconvenienceScore: Math.min(70, Math.max(20, Math.round(20 + delayMinutes * 0.1))),
    inconvenienceLevel: 'High',
    estimatedCost: 0,
    costImpactLabel: '₹0 / Low',
    currency: 'INR',
    arrivalTimeMumbai: '22:00',
    arrivalLabel: '22:00 IST (Meeting converted to Hybrid / 20:00)',
    meetingOutcome: 'Hybrid Video Link / Rescheduled (18:00 IST)',
    changesLabel: 'Meeting time / format',
    preservedLabel: 'Travel route & Workshop',
    hardConstraintsSatisfied: 5,
    hardConstraintsTotal: 5,
    softPreferencesSatisfied: 3,
    softPreferencesTotal: 4,
    remainingSlackMin: 60,
    validationChecks: [
      { title: 'Flight timing updated', passed: true, note: 'Evening standard waiver flight' },
      { title: 'Connection dependency checked', passed: true, note: 'Relaxed transit window' },
      { title: 'Airport transfer checked', passed: true, note: 'Rescheduled to 22:15' },
      { title: 'Hotel timing checked', passed: true, note: 'Late check-in at 23:00' },
      { title: 'Client meeting constraint preserved', passed: true, note: 'Converted to HD Video conference from VIP Studio' },
      { title: 'Workshop constraint preserved', passed: true, note: 'Day 2 09:00 AM intact' }
    ],
    movedEvents: [
      'Client Meeting (Converted to 4K Video Conference from DEL VIP Lounge at 18:00 / 20:00)',
      'Connecting Flight DEL→BOM (Moved to UK-867 at 19:45 under disruption waiver)',
      'Airport Transfer (Moved to 22:15)',
      'Hotel Check-In (Moved to 23:00)'
    ],
    preservedCommitments: [
      'Client meeting timing preserved at 18:00 IST (Virtual)',
      'Day 2 AI Architecture Workshop in Mumbai (09:00 AM)',
      'Traveler stress minimized with zero ticket rebooking fees'
    ],
    explanation: `Eliminates travel pressure by hosting the meeting via ultra-high-definition video link from the Delhi IGI T3 VIP Lounge boardroom. Traveler departs on evening flight UK-867 at 19:45 under airline schedule waiver with ₹0 rebooking fee, landing Mumbai at 22:00 for Day 2 workshop.`,
    tradeoffs: 'Client meeting is conducted virtually instead of in-person, but zero transit rush and zero additional ticket cost.',
    timelineSummary: [
      {
        event: 'Apex Client Meeting (Encalm VIP Studio T3)',
        oldTime: '18:00 → 19:30',
        newTime: '18:00 → 19:00 (Virtual)',
        note: 'High-speed fiber optic 4K hybrid link'
      },
      {
        event: 'Evening Flight UK-867 (DEL → BOM)',
        oldTime: '12:45 → 15:00',
        newTime: '19:45 → 22:00',
        note: 'Airline waiver schedule shift (₹0 fee)'
      },
      {
        event: 'Midnight Transfer (BOM T2 → St. Regis)',
        oldTime: '15:30 → 16:30',
        newTime: '22:15 → 22:50',
        note: 'Zero traffic on late night transfer'
      },
      {
        event: 'Hotel Check-In & Rest (St. Regis)',
        oldTime: '16:45 → 17:30',
        newTime: '23:00 → 23:20',
        note: 'Restful sleep ready for Day 2 Workshop'
      }
    ],
    actions: [
      {
        id: 'act-c1',
        title: 'Host Meeting via VIP Private Studio (DEL T3)',
        category: 'MEETING',
        description: 'Reserve soundproof executive conference pod with 4K camera & fiber internet.',
        impact: 'LOW',
        requiresHumanApproval: true,
        isAuto: false,
        cost: 0,
        currency: 'INR',
        status: 'PENDING_APPROVAL'
      },
      {
        id: 'act-c2',
        title: 'Rebook Flight to Vistara UK-867 (19:45)',
        category: 'FLIGHT',
        description: 'Standard schedule change under airline disruption waiver.',
        impact: 'HIGH',
        requiresHumanApproval: true,
        isAuto: false,
        cost: 0,
        currency: 'INR',
        status: 'PENDING_APPROVAL'
      }
    ]
  };

  return [planA, planB, planC];
}
