import type { EventNode, DependencyEdge } from '../types';

export const INITIAL_NODES: EventNode[] = [
  {
    id: 'evt-1-flight-nag-del',
    type: 'FLIGHT',
    title: '✈️ NAG → DEL',
    subtitle: 'Flight AI-428 (Nagpur to Delhi)',
    location: 'Nagpur → Delhi',
    locationCode: 'NAG-DEL',
    scheduledStart: '10:00',
    scheduledEnd: '11:45',
    actualStart: '10:00',
    actualEnd: '11:45',
    durationMinutes: 105,
    priority: 'CRITICAL',
    flexibility: 'RIGID',
    baseCost: 6500,
    currency: 'INR',
    status: 'SAFE',
    slackMinutes: 60,
    minRequiredBuffer: 45,
    notes: 'Initial departure flight.',
    details: {
      operatorOrHost: 'Air India',
      description: 'Scheduled departure from Nagpur.'
    }
  },
  {
    id: 'evt-2-flight-del-bom',
    type: 'CONNECTION',
    title: '✈️ DEL → BOM',
    subtitle: 'Connecting Flight UK-811',
    location: 'Delhi → Mumbai',
    locationCode: 'DEL-BOM',
    scheduledStart: '12:45',
    scheduledEnd: '15:00',
    actualStart: '12:45',
    actualEnd: '15:00',
    durationMinutes: 135,
    priority: 'CRITICAL',
    flexibility: 'RIGID',
    baseCost: 8200,
    currency: 'INR',
    status: 'SAFE',
    slackMinutes: 30,
    minRequiredBuffer: 45,
    notes: 'Requires 45m transit buffer at DEL.',
    details: {
      operatorOrHost: 'Vistara Airlines',
      description: 'Connecting flight to Mumbai.'
    }
  },
  {
    id: 'evt-3-transfer-airport-hotel',
    type: 'TRANSFER',
    title: '🚕 Transfer',
    subtitle: 'Airport Chauffeur to Hotel',
    location: 'Mumbai Airport → Hotel',
    locationCode: 'BOM-LP',
    scheduledStart: '15:30',
    scheduledEnd: '16:30',
    actualStart: '15:30',
    actualEnd: '16:30',
    durationMinutes: 60,
    priority: 'HIGH',
    flexibility: 'MODERATE',
    baseCost: 2400,
    currency: 'INR',
    status: 'SAFE',
    slackMinutes: 15,
    minRequiredBuffer: 30,
    notes: 'Airport curbside pickup.',
    details: {
      operatorOrHost: 'Chauffeur Suresh',
      description: 'Airport transfer to hotel.'
    }
  },
  {
    id: 'evt-4-hotel-checkin',
    type: 'HOTEL',
    title: '🏨 Hotel',
    subtitle: 'The St. Regis Mumbai Check-In',
    location: 'The St. Regis Mumbai',
    locationCode: 'STR-MUM',
    scheduledStart: '16:45',
    scheduledEnd: '17:30',
    actualStart: '16:45',
    actualEnd: '17:30',
    durationMinutes: 45,
    priority: 'MEDIUM',
    flexibility: 'FLEXIBLE',
    baseCost: 18500,
    currency: 'INR',
    status: 'SAFE',
    slackMinutes: 30,
    minRequiredBuffer: 15,
    notes: 'Hotel check-in & freshen up.',
    details: {
      operatorOrHost: 'The St. Regis Mumbai',
      description: 'Hotel suite check-in.'
    }
  },
  {
    id: 'evt-5-client-meeting',
    type: 'MEETING',
    title: '💼 Client Meeting',
    subtitle: 'Apex Corp Executive Sign-off (6:00 PM)',
    location: 'Taj Land\'s End / Apex Boardroom',
    locationCode: 'APEX-HQ',
    scheduledStart: '18:00',
    scheduledEnd: '19:30',
    actualStart: '18:00',
    actualEnd: '19:30',
    durationMinutes: 90,
    priority: 'CRITICAL',
    flexibility: 'RIGID',
    baseCost: 0,
    currency: 'INR',
    status: 'SAFE',
    slackMinutes: 30,
    minRequiredBuffer: 30,
    notes: 'High-stakes client meeting with VP Vikram Singhania.',
    details: {
      operatorOrHost: 'Apex Corp',
      description: 'Critical deal sign-off at 6:00 PM.'
    }
  },
  {
    id: 'evt-6-workshop',
    type: 'WORKSHOP',
    title: '🎓 Workshop',
    subtitle: 'Day 2 Enterprise AI Workshop',
    location: 'Apex Innovation Center (09:00 AM)',
    locationCode: 'BKC-AIC',
    scheduledStart: '09:00',
    scheduledEnd: '17:00',
    actualStart: '09:00',
    actualEnd: '17:00',
    durationMinutes: 480,
    priority: 'CRITICAL',
    flexibility: 'RIGID',
    baseCost: 0,
    currency: 'INR',
    status: 'SAFE',
    slackMinutes: 540,
    minRequiredBuffer: 60,
    notes: 'Day 2 full-day workshop.',
    details: {
      operatorOrHost: 'Apex Tech Academy',
      description: 'Strategic workshop next day.'
    }
  }
];

export const INITIAL_EDGES: DependencyEdge[] = [
  {
    id: 'dep-1-2',
    source: 'evt-1-flight-nag-del',
    target: 'evt-2-flight-del-bom',
    type: 'HARD_TEMPORAL',
    minGapMinutes: 45,
    description: 'Minimum 45m transit buffer at DEL.',
    isViolated: false,
    slackMinutes: 15
  },
  {
    id: 'dep-2-3',
    source: 'evt-2-flight-del-bom',
    target: 'evt-3-transfer-airport-hotel',
    type: 'HARD_TEMPORAL',
    minGapMinutes: 30,
    description: 'Baggage claim & chauffeur pickup.',
    isViolated: false,
    slackMinutes: 0
  },
  {
    id: 'dep-3-4',
    source: 'evt-3-transfer-airport-hotel',
    target: 'evt-4-hotel-checkin',
    type: 'RESOURCE',
    minGapMinutes: 15,
    description: 'Transit to hotel check-in desk.',
    isViolated: false,
    slackMinutes: 0
  },
  {
    id: 'dep-4-5',
    source: 'evt-4-hotel-checkin',
    target: 'evt-5-client-meeting',
    type: 'HARD_COMMITMENT',
    minGapMinutes: 30,
    description: 'Travel time to 18:00 client meeting.',
    isViolated: false,
    slackMinutes: 0
  },
  {
    id: 'dep-5-6',
    source: 'evt-5-client-meeting',
    target: 'evt-6-workshop',
    type: 'HARD_COMMITMENT',
    minGapMinutes: 540,
    description: 'Overnight rest before Day 2 workshop.',
    isViolated: false,
    slackMinutes: 540
  }
];
