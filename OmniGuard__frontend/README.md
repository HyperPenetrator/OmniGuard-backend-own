# OmniGuard — Tactical Mission Control (Frontend) 🛰️

The high-fidelity geospatial dashboard for the OmniGuard crisis management system. Built for speed, reliability, and precision in high-stress environments.

## 🚀 Key Features
- **Real-Time Tactical Map**: Interactive Leaflet-based intelligence with live responder and incident tracking.
- **Dynamic Routing Engine**: Automated navigation calculating distance, bearing, and ETA to incident zones.
- **AI Triage Integration**: Live display of Gemini-processed incident metadata and resource requirements.
- **Biometric UX**: Ultra-responsive dark mode with Glassmorphism aesthetic and micro-animations.

## 🛠️ Tech Stack
- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 + Framer Motion
- **Icons**: Lucide React
- **Geospatial**: React-Leaflet + Leaflet.js
- **State**: React Context + Custom Hooks for real-time WebSockets.

## 🏃 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
```

### 3. Launch Development Server
```bash
npm run dev
```

## 🏗️ Architecture Design
The frontend follows an **Atomic Component Design**, with separate layers for services (API/WS), components (TacticalMap, Sidebar), and pages (TeamDashboard, ReportEmergency).

---
© 2026 OmniGuard Systems • Mission Critical Operations
