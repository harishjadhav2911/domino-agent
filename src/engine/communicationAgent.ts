import type { CommunicationDraft, RecoveryPlan } from '../types';

export function generateCommunicationDrafts(plan: RecoveryPlan, delayMinutes: number): CommunicationDraft[] {
  const isPlanA = plan.id === 'PLAN_A';
  const isPlanB = plan.id === 'PLAN_B';
  const isPlanC = plan.id === 'PLAN_C';

  const clientDraft: CommunicationDraft = {
    id: 'comm-client',
    recipientCategory: 'CLIENT',
    recipientName: 'Vikram Singhania',
    recipientTitle: 'VP of Engineering, Apex Corp',
    contactMethod: 'WhatsApp',
    subject: `Update regarding today's 6:00 PM Architecture Sign-off`,
    body: isPlanA 
      ? `Hi Vikram,\n\nI hope your day is going well. Due to an unexpected ${delayMinutes}-minute air traffic delay on my inbound flight from Nagpur, I've rebooked directly onto Vistara UK-945 landing Mumbai at ${plan.arrivalTimeMumbai}.\n\nTo ensure we have quality uninterrupted time for our ₹1.4 Cr AI platform architecture sign-off, could we shift our discussion to a working dinner at 7:15 PM at Ming Yang (Taj Land's End)? Table is reserved under my name.\n\nLooking forward to catching up in person tonight!\n\nBest,\nAlex Chen`
      : isPlanB
      ? `Hi Vikram,\n\nQuick heads up: My morning flight encountered a ${delayMinutes}-min ATC delay in Nagpur, but I've secured an express flight (IndiGo 6E-2051) landing at ${plan.arrivalTimeMumbai}. I am heading straight from the tarmac to the Apex Executive Boardroom so we will still kick off our meeting at 6:00 PM sharp as scheduled.\n\nSee you shortly!\n\nAlex Chen`
      : `Hi Vikram,\n\nDue to a ${delayMinutes}-min flight delay on the NAG-DEL sector, I will be connecting to Mumbai later tonight. However, our 6:00 PM meeting remains 100% priority. I have booked an Encalm VIP private teleconference suite at DEL T3 so we can run our full 4K slide presentation & sign-off seamlessly at 6:00 PM via Google Meet.\n\nJoin Link: https://meet.google.com/dmo-apex-arch\n\nLooking forward to speaking at 6:00 PM!\n\nAlex Chen`,
    urgency: 'HIGH',
    automated: false,
    status: 'DRAFTED'
  };

  const hotelDraft: CommunicationDraft = {
    id: 'comm-hotel',
    recipientCategory: 'HOTEL',
    recipientName: 'Front Desk Concierge',
    recipientTitle: 'The St. Regis Mumbai (Lower Parel)',
    contactMethod: 'Email',
    subject: `Late Arrival Notice - Reservation #MB-8991204 (Alex Chen)`,
    body: `Dear St. Regis Reservations & Concierge Team,\n\nPlease note a schedule revision for guest Alex Chen (Marriott Bonvoy Platinum #MB-8991204, Deluxe City View Suite Room 2804).\n\nDue to airline operational delays (${delayMinutes} min), the guest will arrive for check-in at approximately ${isPlanC ? '23:00' : isPlanA ? '21:00' : '20:15'} IST tonight. Please ensure the suite reservation is held guaranteed and all keys are pre-encoded for express arrival.\n\nThank you,\nDOMINO Autonomous Concierge Service`,
    urgency: 'MEDIUM',
    automated: true,
    status: 'DRAFTED'
  };

  const driverDraft: CommunicationDraft = {
    id: 'comm-driver',
    recipientCategory: 'DRIVER',
    recipientName: 'Suresh',
    recipientTitle: 'Executive Chauffeur (Black Cab Mumbai)',
    contactMethod: 'SMS',
    subject: `Pickup Update - BOM Terminal 2 (Booking VIP-MUM-4821)`,
    body: isPlanA
      ? `Namaste Suresh ji. Flight update for guest Alex Chen: Original flight UK-811 missed due to Nagpur delay. New flight is Vistara UK-945 landing BOM T2 at 17:35. Please be ready at T2 Pillar 4 curbside at 17:45. Destination: Taj Land's End Bandra. Thank you.`
      : isPlanB
      ? `Namaste Suresh ji. URGENT update: Guest Alex is now arriving on IndiGo 6E-2051 at 16:35 at BOM T2. Pickup at Gate 2 by 16:50. Immediate priority drop to Taj Land's End Bandra for 18:00 meeting. Thank you.`
      : `Namaste Suresh ji. Flight rescheduled: Guest Alex Chen will now arrive on late evening flight UK-867 at 22:00 at BOM T2. Please arrange pickup at 22:15 for transfer to The St. Regis Lower Parel. Thank you.`,
    urgency: 'HIGH',
    automated: true,
    status: 'DRAFTED'
  };

  const travelerDraft: CommunicationDraft = {
    id: 'comm-traveler',
    recipientCategory: 'TRAVELER',
    recipientName: 'Alex Chen',
    recipientTitle: 'Traveler & Staff Architect',
    contactMethod: 'WhatsApp',
    subject: `DOMINO Action Briefing: Disruption Recovery Initialized`,
    body: `🚨 DOMINO Disruption Briefing:\n\n• Inbound Flight AI-428 delayed +${delayMinutes}m.\n• Recommended Strategy: ${plan.name}\n• Arrival in Mumbai: ${plan.arrivalTimeMumbai} IST\n• Client Meeting Status: ${plan.meetingOutcome}\n• Total Cost: ₹${plan.estimatedCost.toLocaleString()}\n• All automated low-risk actions (Hotel hold, Driver re-dispatch) have been queued.\n\nPlease review and approve high-impact actions on your DOMINO Command Dashboard.`,
    urgency: 'HIGH',
    automated: true,
    status: 'DRAFTED'
  };

  return [clientDraft, hotelDraft, driverDraft, travelerDraft];
}
