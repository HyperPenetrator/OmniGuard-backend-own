# OmniGuard — Tactical Dashboard 🌌

The frontend for the OmniGuard Crisis Management System. A high-performance, geospatial dashboard providing real-time situational awareness.

## ✨ Features
- **Interactive Map**: Live tracking of incidents and responders via Leaflet.
- **Glassmorphic UI**: Modern, dark-mode focused aesthetic for high-stress environments.
- **Real-time Feed**: Automatic updates via WebSockets for new incidents.
- **Tactical Modal**: Quick-entry form for reporting incidents with automatic AI triage routing.

## 🛠️ Tech Stack
- React 19
- Vite
- Tailwind CSS v4
- Lucide React (Icons)
- React-Leaflet (Mapping)

## 🏃 Local Development
1. `npm install`
2. Create `.env` with `VITE_API_URL` and `VITE_WS_URL`.
3. `npm run dev`

## 🚀 Deployment
Currently deployed on Vercel: [https://omniguard-web.vercel.app](https://omniguard-web.vercel.app)