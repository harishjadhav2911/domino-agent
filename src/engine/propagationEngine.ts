import type { EventNode, DependencyEdge, BlastRadiusReport, AuditEntry } from '../types';
import { INITIAL_NODES, INITIAL_EDGES } from './data';

export function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export interface PropagationResult {
  nodes: EventNode[];
  edges: DependencyEdge[];
  report: BlastRadiusReport;
}

export function propagateDisruption(delayMinutes: number, reason: string = 'Air Traffic Delay'): PropagationResult {
  const nodes: EventNode[] = JSON.parse(JSON.stringify(INITIAL_NODES));
  const edges: DependencyEdge[] = JSON.parse(JSON.stringify(INITIAL_EDGES));

  const auditTrail: AuditEntry[] = [];
  let step = 1;

  // Step 1: Initial disruption
  auditTrail.push({
    id: `audit-${step++}`,
    timestamp: '10:05 IST',
    stepNumber: 1,
    agent: 'Itinerary Agent',
    action: 'Flight Delay Ingested',
    nodeId: nodes[0].id,
    nodeTitle: 'NAG → DEL Flight',
    details: `Flight delayed by ${delayMinutes} min due to ${reason}.`,
    status: delayMinutes > 60 ? 'CRITICAL' : delayMinutes > 0 ? 'WARNING' : 'INFO',
    metrics: {
      slackLost: delayMinutes,
    }
  });

  // Calculate Node 1 (NAG-DEL Flight)
  const node1ScheduledStartMin = parseTimeToMinutes(nodes[0].scheduledStart);
  const node1ScheduledEndMin = parseTimeToMinutes(nodes[0].scheduledEnd);
  
  const node1ActualStartMin = node1ScheduledStartMin + delayMinutes;
  const node1ActualEndMin = node1ScheduledEndMin + delayMinutes;

  nodes[0].actualStart = formatMinutesToTime(node1ActualStartMin);
  nodes[0].actualEnd = formatMinutesToTime(node1ActualEndMin);

  if (delayMinutes === 0) {
    nodes[0].status = 'SAFE';
    nodes[0].slackMinutes = 15;
    nodes[0].impactExplanation = 'On time schedule maintained.';
  } else if (delayMinutes <= 15) {
    nodes[0].status = 'AT_RISK';
    nodes[0].slackMinutes = 15 - delayMinutes;
    nodes[0].impactExplanation = `Delayed by ${delayMinutes}m. Landing revised to ${nodes[0].actualEnd}.`;
  } else {
    nodes[0].status = 'BROKEN';
    nodes[0].slackMinutes = 15 - delayMinutes;
    nodes[0].impactExplanation = `Delayed by ${delayMinutes}m. Arrival moved from ${nodes[0].scheduledEnd} to ${nodes[0].actualEnd}.`;
  }

  // Step 2: Connection DEL-BOM
  const edge1 = edges.find(e => e.id === 'dep-1-2')!;
  const node2ScheduledStartMin = parseTimeToMinutes(nodes[1].scheduledStart);
  const availableGapDelta = node2ScheduledStartMin - node1ActualEndMin;
  const edge1Slack = availableGapDelta - edge1.minGapMinutes;

  edge1.slackMinutes = edge1Slack;
  edge1.isViolated = edge1Slack < 0;

  if (edge1.isViolated) {
    edge1.deficitMinutes = Math.abs(edge1Slack);
    nodes[1].status = 'BROKEN';
    nodes[1].slackMinutes = edge1Slack;
    nodes[1].upstreamCauseId = nodes[0].id;
    nodes[1].impactExplanation = `Missed connection because available buffer = ${edge1Slack} min (requires 45 min)`;

    auditTrail.push({
      id: `audit-${step++}`,
      timestamp: '10:05 IST',
      stepNumber: 2,
      agent: 'Constraint Validator',
      action: 'Connection Buffer Exceeded',
      nodeId: nodes[1].id,
      nodeTitle: 'DEL → BOM Connection',
      details: `Minimum Connection Time breached by ${Math.abs(edge1Slack)} min. Connection impossible.`,
      status: 'CRITICAL',
    });
  } else if (edge1Slack < 10) {
    nodes[1].status = 'AT_RISK';
    nodes[1].slackMinutes = edge1Slack;
    nodes[1].upstreamCauseId = nodes[0].id;
    nodes[1].impactExplanation = `Tight connection: Only ${availableGapDelta} min transfer window remaining.`;
  } else {
    nodes[1].status = 'SAFE';
    nodes[1].slackMinutes = edge1Slack;
    nodes[1].impactExplanation = 'Connection buffer intact.';
  }

  // Step 3: Airport Transfer
  const edge2 = edges.find(e => e.id === 'dep-2-3')!;
  if (nodes[1].status === 'BROKEN') {
    nodes[2].status = 'BROKEN';
    nodes[2].slackMinutes = -delayMinutes;
    nodes[2].upstreamCauseId = nodes[1].id;
    nodes[2].impactExplanation = 'Chauffeur pickup invalid due to missed flight arrival';
    edge2.isViolated = true;
    edge2.slackMinutes = -delayMinutes;
  } else if (nodes[1].status === 'AT_RISK') {
    nodes[2].status = 'AT_RISK';
    nodes[2].slackMinutes = 5;
    nodes[2].impactExplanation = 'Late deplaning may delay curbside pickup';
  } else {
    nodes[2].status = 'SAFE';
    nodes[2].slackMinutes = 15;
    nodes[2].impactExplanation = 'Transfer on schedule.';
  }

  // Step 4: Hotel Check-In
  const edge3 = edges.find(e => e.id === 'dep-3-4')!;
  if (nodes[2].status === 'BROKEN') {
    nodes[3].status = 'AT_RISK';
    nodes[3].slackMinutes = -delayMinutes;
    nodes[3].upstreamCauseId = nodes[2].id;
    nodes[3].impactExplanation = 'Arrival shifted beyond planned check-in window';
    edge3.isViolated = true;
    edge3.slackMinutes = -delayMinutes;
  } else if (nodes[2].status === 'AT_RISK') {
    nodes[3].status = 'AT_RISK';
    nodes[3].slackMinutes = 10;
    nodes[3].impactExplanation = 'Tight window for room prep';
  } else {
    nodes[3].status = 'SAFE';
    nodes[3].slackMinutes = 30;
    nodes[3].impactExplanation = 'Check-in on schedule.';
  }

  // Step 5: Client Meeting (6:00 PM)
  const edge4 = edges.find(e => e.id === 'dep-4-5')!;
  if (nodes[1].status === 'BROKEN') {
    nodes[4].status = 'BROKEN';
    nodes[4].slackMinutes = -Math.max(60, delayMinutes - 30);
    nodes[4].upstreamCauseId = nodes[1].id;
    nodes[4].impactExplanation = 'Arrival conflicts with 18:00 client meeting';
    edge4.isViolated = true;
    edge4.slackMinutes = nodes[4].slackMinutes;

    auditTrail.push({
      id: `audit-${step++}`,
      timestamp: '10:05 IST',
      stepNumber: 3,
      agent: 'Constraint Validator',
      action: 'Client Meeting Breached',
      nodeId: nodes[4].id,
      nodeTitle: 'Client Meeting',
      details: 'Traveler cannot reach 18:00 meeting under original timetable.',
      status: 'CRITICAL',
    });
  } else if (nodes[3].status === 'AT_RISK' || delayMinutes >= 20) {
    nodes[4].status = 'AT_RISK';
    nodes[4].slackMinutes = Math.max(0, 30 - delayMinutes);
    nodes[4].upstreamCauseId = nodes[3].id;
    nodes[4].impactExplanation = 'Zero buffer remaining before 18:00 meeting';
  } else {
    nodes[4].status = 'SAFE';
    nodes[4].slackMinutes = 30;
    nodes[4].impactExplanation = 'Meeting timing preserved.';
  }

  // Step 6: Workshop next day
  if (delayMinutes >= 360) {
    nodes[5].status = 'BROKEN';
    nodes[5].slackMinutes = 540 - delayMinutes;
    nodes[5].impactExplanation = 'Overnight rest window breached';
  } else if (delayMinutes >= 180) {
    nodes[5].status = 'AT_RISK';
    nodes[5].slackMinutes = 540 - delayMinutes;
    nodes[5].impactExplanation = 'Reduced rest before 09:00 AM workshop';
  } else {
    nodes[5].status = 'SAFE';
    nodes[5].slackMinutes = 540 - Math.min(delayMinutes, 240);
    nodes[5].impactExplanation = 'Preserved on schedule for tomorrow 09:00 AM';
  }

  const brokenCount = nodes.filter(n => n.status === 'BROKEN').length;
  const atRiskCount = nodes.filter(n => n.status === 'AT_RISK').length;
  const safeCount = nodes.filter(n => n.status === 'SAFE').length;

  auditTrail.push({
    id: `audit-${step++}`,
    timestamp: '10:05 IST',
    stepNumber: 4,
    agent: 'Replanning Agent',
    action: 'Recovery Plans Generated',
    details: 'Synthesized 3 feasible recovery strategies based on temporal slack.',
    status: 'SUCCESS'
  });

  const report: BlastRadiusReport = {
    totalNodes: nodes.length,
    safeCount,
    atRiskCount,
    brokenCount,
    safeNodeIds: nodes.filter(n => n.status === 'SAFE').map(n => n.id),
    atRiskNodeIds: nodes.filter(n => n.status === 'AT_RISK').map(n => n.id),
    brokenNodeIds: nodes.filter(n => n.status === 'BROKEN').map(n => n.id),
    totalSlackConsumed: delayMinutes,
    cascadeDepth: brokenCount > 0 ? 4 : atRiskCount > 0 ? 2 : 0,
    criticalPathBroken: brokenCount > 0,
    affectedNodesList: nodes.filter(n => n.status !== 'SAFE'),
    auditTrail
  };

  return {
    nodes,
    edges,
    report
  };
}
