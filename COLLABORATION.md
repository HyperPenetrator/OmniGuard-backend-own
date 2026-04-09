# OmniGuard Collaboration Guide

Welcome to the OmniGuard application development guide. This document serves as a central reference point for effective collaboration between Frontend and Backend engineers working on OmniGuard.

## System Architecture

OmniGuard is a real-time crisis management application composed of two primary layers:

1. **Frontend (React + Vite)**: A dynamic, geospatial dashboard built on React 19, Tailwind CSS v4, and React-Leaflet. It provides an interactive command center for operators to dispatch and monitor incidents.
2. **Backend (Node.js + Express + Firebase)**: A secure, high-performance API supporting real-time WebSocket communication, role-based access control (RBAC), and integration with Google's Gemini AI (v1.5 Flash) for automated triage.

### Local Development Ports
- **Frontend Server:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001/api`
- **Backend WebSockets:** `ws://localhost:3001/ws`

---

## Getting Started

### 1. Environment Configuration

#### Backend setup:
Create `server/.env` based on `server/.env.example`.
- Ensure you retrieve the proper Firebase service account json/keys from the cloud console.
- Add your Google Gemini API key to `GEMINI_API_KEY`.
- Run `npm install` within the `server/` directory.

#### Frontend setup:
The `.env` file should be at the root of the project.
- Variables:
  ```env
  VITE_API_URL=http://localhost:3001
  VITE_WS_URL=ws://localhost:3001/ws
  ```
- Run `npm install` at the project root.

### 2. Running Locally
Run the backend API:
```bash
cd server
npm run dev
```

Run the frontend app:
```bash
# At project root
npm run dev
```

### 3. Testing
To validate recent backend integrations, run the testing suites:
```bash
# Backend unit tests
cd server
npm run test

# End-to-end (E2E) integration validation 
cd server
node scripts/e2e-test.js
```

---

## API Reference

The frontend interacts with the backend using the JSON API and is automatically handled by the `api.js` client service.

### Authentication Endpoints
- `POST /api/auth/login`
  - Needs: `{ email, password }`
  - Returns: `{ success, data: { accessToken, refreshToken, user } }`
- `POST /api/auth/refresh`
  - Needs: `{ refreshToken }`
  - Returns: new generated token pairs.

### Incident Management (`/api/incidents`)
- `GET /api/incidents`
  - Query params: `status`, `severity`, `page`, `limit`
- `GET /api/incidents/:id`
- `POST /api/incidents`
  - Creates a new incident. Needs: `{ type, location, description }`
- `PATCH /api/incidents/:id/status`
  - Updates incident workflow status. Needs: `{ status }`
- `DELETE /api/incidents/:id`
- `POST /api/incidents/:id/sos`
  - Triggers SOS high-priority escalation.

### Automated Server Triage
- `POST /api/triage/manual`
  - Needs: `{ incidentId }` 
  - Forces the Gemini LLM pipeline to analyze and categorize the given incident.

### Responders (Units & Teams)
- `GET /api/responders`
  - Query Params: `teamType`, `status`
- `PATCH /api/responders/:id/location`
  - Needs: `{ lat, lng }` (Periodically pinged to update tracking maps).

---

## Real-Time WebSockets Reference

Real-time capabilities are driven by the WebSocket connection instantiated after successful authentication.

- **Connection URL**: `ws://localhost:3001/ws?token=<ACCESS_TOKEN>`
- **Internal Payload Formats**:
  All messages incoming from the backend are structured strictly as:
  ```json
  {
    "event": "EVENT_NAME",
    "payload": { ... }
  }
  ```

### Key Broadcast Events
1. **`INCIDENT_CREATED`**: Fired down to all connected dashboards when a new event happens across the domain.
2. **`INCIDENT_UPDATED`**: Emitted when status changes, manual updates, or Gemini completes triage tagging.
3. **`RESPONDER_UPDATE`**: Broadcasts periodic location differences for live map synchronization.

*Frontend developers should subscribe to these events using the imported `on('EVENT_NAME', <callback>)` from `services/ws.js`.*

---

## Design and Responsiveness Boundaries

**Frontend Developers:** Please respect the following boundaries:
1. **Design System:** We use a modern, dark-mode Glassmorphism styling based in `styles.css`. Maintain this look-and-feel — do not replace or heavily alter the core design logic.
2. **Responsive Grids:** Stick to the grid-layouts provided with Tailwind classes. Ensure map components stack properly on mobile.
3. **Components:** Build reusable stateless components when expanding UI features and wrap API communication inside hook implementations.

---
**Happy coding!** Reach out to the core engineering channel for integration questions.
