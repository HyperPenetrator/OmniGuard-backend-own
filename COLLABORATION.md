# OmniGuard Engineering Collaboration & Integration Guide 🤝

This document serves as the technical source of truth for synchronization between Frontend and Backend engineering teams. OmniGuard utilizes an event-driven architecture with a focus on real-time geospatial intelligence.

## 🏗️ System Overview

1. **Tactical Frontend**: A React 19 + Vite application utilizing Tailwind CSS v4 and Framer Motion for premium, high-frequency UI updates.
2. **Command Backend**: A Node.js + Express API integrated with Google Gemini 1.5 Flash and Firebase Firestore for persistent state and autonomous triage.

## 🔑 Authentication & Access Control

OmniGuard uses JWT-based authentication with **Access Code** (Password) verification.

### 🛡️ Authorized Personnel (Test Credentials)
| Team Role | User ID (Email) | Access Code (Password) |
| :--- | :--- | :--- |
| **Admin Strategist** | `coordinator@omniguard.io` | `omni2024!` |
| **Fire Team Lead** | `fire_commander@omniguard.io` | `resp2024!` |
| **Crime Team Lead** | `crime_chief@omniguard.io` | `resp2024!` |
| **Disaster Lead** | `disaster_lead@omniguard.io` | `resp2024!` |
| **Medic Unit M-1** | `medic1@omniguard.io` | `resp2024!` |
| **Fire Engine 4** | `fire_beta@omniguard.io` | `resp2024!` |
| **Police Patrol 99** | `patrol99@omniguard.io` | `resp2024!` |
| **Hazmat Ops** | `tech_ops@omniguard.io` | `resp2024!` |

---

## 📡 API Reference Hub (`/api`)

The frontend interacts with the backend using the standardized `api.js` client.

### 🔐 Authentication (`/auth`)
- `POST /auth/login`: Issues `accessToken` and `refreshToken`.
- `POST /auth/refresh`: Rotates credentials without session loss.

### 🚨 Incident Lifecycle (`/incidents`)
- `GET /incidents`: Retrieve filtered threat streams.
- `POST /incidents/public`: Anonymous reporting for civilians (bypasses Auth).
- `PATCH /incidents/:id/status`: Transition incident states (e.g., `En Route` -> `Resolved`).
- `POST /incidents/:id/sos`: Immediate high-priority escalation.

### 📊 Intelligence & Stats (`/stats`)
- `GET /api/stats`: Retrieve success rates, response times, and team performance (Admin only).

---

## ⚡ Real-Time Tactical Synchronization (WebSockets)

WebSocket connectivity is critical for live map updates and triage broadcasts.

- **Endpoint**: `ws://[HOST]/ws?token=<ACCESS_TOKEN>`
- **Payload Schema**: `{ "event": "NAME", "payload": { ... } }`

### Critical Events
1. **`INCIDENT_CREATED`**: Immediate alert on new threat detection.
2. **`INCIDENT_UPDATED`**: Triggered by status changes or Gemini Triage completion.
3. **`RESPONDER_UPDATE`**: Live GPS coordinate propagation for tactical maps.

---

## 🎨 Design System & UX Standards

To maintain the **Glassmorphism Tactical Aesthetic**:
1. **Color Tokens**: Use HSL values defined in `index.css`. Avoid generic hex codes.
2. **Micro-interactions**: Every tactical action should trigger a Framer Motion state transition.
3. **Map Overlay**: Tactical maps must prioritize the **Target Incident** using the dynamic routing engine.

---
**Secure Communication**: All technical discussions should happen in the private `#omniguard-dev` channel.
