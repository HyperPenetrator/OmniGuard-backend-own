# OmniGuard — Central Command API (Backend) 📡

The high-performance core of the OmniGuard ecosystem. This backend handles real-time data persistence, AI-driven triage, and secure incident orchestration.

## 🔑 System Access & Development Credentials

The following credentials are pre-seeded via `scripts/seed-users.js` for tactical verification.

| Team Role | User ID (Email) | Access Code (Password) | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin Strategist** | `coordinator@omniguard.io` | `omni2024!` | Global Triage & Team Stats |
| **Fire Team Lead** | `fire_commander@omniguard.io` | `resp2024!` | Fire Suppression Dashboard |
| **Crime Team Lead** | `crime_chief@omniguard.io` | `resp2024!` | Security Response View |
| **Disaster Lead** | `disaster_lead@omniguard.io` | `resp2024!` | Disaster Management |
| **Medic Unit M-1** | `medic1@omniguard.io` | `resp2024!` | Medical Response Dashboard |
| **Civilian Portal** | `civilian@omniguard.io` | `civ2024!` | Basic Safety Access |

*Note: Run `npm run node server/scripts/seed-users.js` to reset the database state.*

## 🗺️ Geospatial Intelligence Engine

The backend utilizes a high-frequency **Geospatial Triage Engine** to automate dispatcher logic.

- **Proximity Logic**: Uses the **Haversine Formula** for precise spherical distance calculations.
- **Broadcast Radius**: Standard alert threshold is **5.0 km**.
- **Real-Time Pipeline**: Changes in incident status or responder location trigger immediate WebSocket broadcasts via the `wsService`.

## 🧪 Simulation & Validation

### 1. Digital Twin Simulation
To verify the 5km triage logic without a manual frontend trigger:
```bash
cd server
node scripts/simulate-movement.js
```
This script mocks a high-priority incident and simulates live patrol units moving within and out of the triage radius.

### 2. Integration Testing
```bash
cd server
npm test               # Core logic validation
node scripts/e2e-test.js # Full WebSocket/Firestore pipeline
```

---
© 2026 OmniGuard Systems • Authorized Developers Only
