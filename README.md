# ⚡ DOMINO — Dependency-Aware Disruption Agent

> **"DOMINO detects a disruption, traces its consequences through the trip, and autonomously creates a feasible recovery plan."**

---

## 🎯 7-Step Presentation Story

The application is structured into 7 sequential presentation stages designed to explain the agentic intelligence to judges in seconds:

1. **Step 1: Your Journey** — *What is the journey?*
   - Displays the scheduled multi-event itinerary: `Nagpur → Delhi → Mumbai` (Flights, Transfer, Hotel, Client Meeting, Workshop).
2. **Step 2: Flight Disruption** — *What changed?*
   - Injects a `+120 minute` delay on `Flight AI-428 (NAG → DEL)` due to air traffic delay.
3. **Step 3: What Broke?** — *What broke?*
   - Real-time impact summary: 🔴 **2 Broken** (Connection, Meeting) | 🟠 **2 At Risk** (Hotel, Transfer) | 🟢 **2 Safe**.
4. **Step 4: 3D Blast Radius** — *How did the disruption spread?*
   - Interactive Three.js WebGL 3D dependency graph with animated shockwave ripple traveling from the delayed flight through downstream nodes.
5. **Step 5: 3 Recovery Plans** — *How will DOMINO fix it?*
   - **Plan A (Balanced • Recommended)**: Rebook connection + move meeting to 19:15 working dinner (`Cost: ₹4,200 | Arrival: 17:35 IST`).
   - **Plan B (Preserve Meeting)**: Alternative route + keep exact 18:00 meeting (`Cost: ₹11,400 | Arrival: 16:35 IST`).
   - **Plan C (Lowest Cost)**: Keep route + convert 18:00 meeting to VIP lounge video call (`Cost: ₹1,800 | Arrival: 22:00 IST`).
6. **Step 6: Human Decision** — *Why this plan?*
   - Clear causal reasoning chain + Human-in-the-loop authorization gateway for high-impact actions.
7. **Step 7: Final Journey** — *What is the final result?*
   - Reconciled itinerary with confirmed seat on Vistara UK-945, working dinner meeting at Ming Yang Taj, and preserved Day 2 workshop.

---

## 🎨 Visual Design
- **Theme:** Clean, premium, professional light/white presentation interface.
- **Color Palette:**
  - Background: Clean white `#ffffff` & light slate `#f8fafc`
  - Typography: Dark navy `#0f172a`
  - Accents: Indigo `#4f46e5`
  - Status Indicators: 🔴 Broken `#ef4444`, 🟠 At Risk `#f59e0b`, 🟢 Safe `#10b981`
- **Hero 3D Canvas:** Three.js WebGL canvas with OrbitControls and real-time ripple animation.

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Open in browser
http://127.0.0.1:5173/
```
