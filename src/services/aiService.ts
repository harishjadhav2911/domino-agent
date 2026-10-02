import type { EventNode, RecoveryPlan } from '../types';

/**
 * DOMINO AI SERVICE LAYER
 * 
 * Strict Architectural Boundary:
 * - Gemini AI Layer: Used for messy input normalization, natural language disruption reasoning,
 *   recovery rationale explanations, and human communication drafts.
 * - Deterministic Engines: Handles all exact arrival math, temporal buffer calculations,
 *   slack margins, hard constraint checks, and cost accounting.
 */

export const GEMINI_MODEL = 'gemini-2.5-flash';

export interface ConnectionTestResult {
  status: 'connected' | 'demo' | 'error';
  mode: 'LIVE GEMINI' | 'DEMO AI MODE';
  message: string;
  model: string;
  latencyMs?: number;
  configured?: boolean;
}

// Global cached connection state
let currentAiState: ConnectionTestResult = {
  status: 'demo',
  mode: 'DEMO AI MODE',
  message: 'Running in Demo AI Mode',
  model: GEMINI_MODEL,
  configured: false
};

const listeners = new Set<(state: ConnectionTestResult) => void>();

export function subscribeAiStatus(listener: (state: ConnectionTestResult) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach(fn => fn(currentAiState));
}

export const getAiStatus = (): ConnectionTestResult => currentAiState;

export const isGeminiConfigured = (): boolean => {
  return currentAiState.status === 'connected';
};

/**
 * Test Gemini API connection safely via the server-side API proxy.
 * Never leaks the API key to client or console.
 */
export async function testGeminiConnection(): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('/api/gemini/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      currentAiState = {
        status: data.status || 'demo',
        mode: data.status === 'connected' ? 'LIVE GEMINI' : 'DEMO AI MODE',
        message: data.message || (data.status === 'connected' ? 'Gemini connection successful ✓' : 'Running in Demo AI Mode'),
        model: data.model || GEMINI_MODEL,
        latencyMs: data.latencyMs || (Date.now() - startTime),
        configured: Boolean(data.configured)
      };
    } else {
      currentAiState = {
        status: 'error',
        mode: 'DEMO AI MODE',
        message: 'Gemini unavailable — Demo Mode active',
        model: GEMINI_MODEL,
        configured: false
      };
    }
  } catch {
    currentAiState = {
      status: 'demo',
      mode: 'DEMO AI MODE',
      message: 'Running in Demo AI Mode',
      model: GEMINI_MODEL,
      configured: false
    };
  }

  notifyListeners();
  return currentAiState;
}

/**
 * Parse raw itinerary text into structured overview
 */
export async function parseTrip(rawText?: string): Promise<{
  summary: string;
  eventsCount: number;
  origin: string;
  destination: string;
  source: 'GEMINI' | 'DETERMINISTIC_PARSER';
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/gemini/parse-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ rawText: rawText || 'Nagpur (NAG) to Mumbai (BOM) via Delhi (DEL)' })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.summary) {
        return {
          summary: data.summary,
          eventsCount: data.eventsCount || 6,
          origin: data.origin || 'Nagpur (NAG)',
          destination: data.destination || 'Mumbai (BOM)',
          source: 'GEMINI'
        };
      }
    }
  } catch {
    // Fallback to deterministic parser
  }

  return {
    summary: 'Nagpur (NAG) → Delhi (DEL) → Mumbai (BOM) multi-modal journey with 6 interdependent events.',
    eventsCount: 6,
    origin: 'Nagpur (NAG)',
    destination: 'Mumbai (BOM)',
    source: 'DETERMINISTIC_PARSER'
  };
}

/**
 * Explain disruption in plain natural language
 */
export async function explainDisruption(
  flightCode: string,
  delayMinutes: number,
  reason: string
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/gemini/explain-disruption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ flightCode, delayMinutes, reason })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return data.text;
      }
    }
  } catch {
    // Fallback
  }

  const landingH = Math.floor((11 * 60 + 45 + delayMinutes) / 60);
  const landingM = (11 * 60 + 45 + delayMinutes) % 60;
  return `Flight ${flightCode} departure has slipped by +${delayMinutes} min (${reason}), shifting touchdown at Delhi IGI to ${landingH.toString().padStart(2, '0')}:${landingM.toString().padStart(2, '0')}.`;
}

/**
 * Natural language explanation for why a specific node is affected by the delay.
 */
export async function explainImpact(
  node: EventNode,
  delayMinutes: number,
  reason: string
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/gemini/explain-impact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        nodeTitle: node.title,
        scheduledStart: node.scheduledStart,
        delayMinutes,
        reason
      })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return data.text;
      }
    }
  } catch {
    // Fallback
  }

  // Deterministic fallback explanation
  if (node.status === 'BROKEN') {
    return `Upstream delay of +${delayMinutes}m completely consumed the minimum operational buffer. Expected arrival now violates the hard dependency deadline.`;
  } else if (node.status === 'AT_RISK') {
    return `Buffer compressed to ${node.slackMinutes} min (below safe threshold). Passenger risks missing scheduled handover if any further minor variance occurs.`;
  } else {
    return `Sufficient temporal buffer remaining (${node.slackMinutes} min). Downstream schedule remains intact.`;
  }
}

export const explainImpactWithAI = explainImpact;

/**
 * Natural language summary for the selected recovery world.
 */
export async function explainRecovery(
  plan: RecoveryPlan,
  delayMinutes: number
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/gemini/explain-recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        planName: plan.name,
        worldTitle: plan.worldTitle,
        delayMinutes
      })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return data.text;
      }
    }
  } catch {
    // Fallback
  }

  return plan.explanation;
}

export const explainRecoveryWithAI = explainRecovery;

/**
 * Generate human-friendly notification drafts.
 */
export async function generateNotification(
  recipientRole: string,
  recipientName: string,
  plan: RecoveryPlan
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('/api/gemini/generate-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        recipientRole,
        recipientName,
        worldTitle: plan.worldTitle
      })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return data.text;
      }
    }
  } catch {
    // Fallback
  }

  if (recipientRole === 'CLIENT') {
    return `Dear ${recipientName}, due to an ATC flight delay, we have re-synchronized our arrival and reserved an executive dinner table at 19:15 at Taj Land's End. Looking forward to our discussion.`;
  } else if (recipientRole === 'DRIVER') {
    return `Hi ${recipientName}, flight AI-428 delay has been absorbed; your revised curbside pickup at Mumbai Terminal 2 is now confirmed for 17:45 IST Gate 4.`;
  } else {
    return `Reservation update: Guaranteed late check-in hold activated for Deluxe Suite. Guest arrival now scheduled for 21:00 IST post-client meeting.`;
  }
}

export const generateNotificationWithAI = generateNotification;
