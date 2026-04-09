# OmniGuard — Crisis Management System

> Industrial-grade decentralized crisis response platform for the hospitality sector.  
> Real-time incident management with AI-powered triage, role-based access control, and geospatial coordination.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite + React)              │
│  React Dashboard  ──  Leaflet Maps  ──  WebSocket Client │
└──────────────┬──────────────────────────┬────────────────┘
               │ REST API (HTTPS)         │ WebSocket (WSS)
┌──────────────▼──────────────────────────▼────────────────┐
│                   EXPRESS.JS API SERVER                    │
│                                                           │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐  │
│  │  Auth   │  │ Incidents│  │ Triage  │  │ Responder │  │
│  │ Routes  │  │  Routes  │  │ Routes  │  │  Routes   │  │
│  └────┬────┘  └────┬─────┘  └────┬────┘  └─────┬─────┘  │
│       │            │             │              │         │
│  ┌────▼────────────▼─────────────▼──────────────▼─────┐  │
│  │              MIDDLEWARE STACK                        │  │
│  │  RequestID → Helmet → CORS → RateLimit → Sanitize   │  │
│  │  → Auth (JWT) → RBAC → Validate (Zod) → ErrorHandler│  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│  ┌──────────────────────▼──────────────────────────────┐  │
│  │                  SERVICES LAYER                      │  │
│  │  FirestoreService │ TriageService │ WSService │ Audit│  │
│  └────────┬──────────┴───────┬───────┴─────┬───────────┘  │
└───────────┼──────────────────┼─────────────┼──────────────┘
            │                  │             │
   ┌────────▼────────┐  ┌─────▼─────┐  ┌────▼────┐
   │    Firestore     │  │  Gemini   │  │   WS    │
   │   (Firebase)     │  │ 1.5 Flash │  │ Clients │
   └──────────────────┘  └───────────┘  └─────────┘
```

## Quick Start

### Prerequisites
- Node.js ≥ 20.0.0
- Firebase project with Firestore enabled
- Google AI Studio API key (Gemini)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/omniguard.git
cd omniguard/server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your Firebase and Gemini credentials
```

### 3. Run Development Server

```bash
npm run dev    # Starts with nodemon auto-reload
```

Server starts at `http://localhost:3001`

### 4. Run Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### 5. Docker Deployment

```bash
# From project root
docker-compose up -d
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | None | Login, returns JWT |
| `POST` | `/api/auth/refresh` | None | Rotate refresh token |

### Incidents

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/incidents` | Bearer | All | Paginated list (filters: status, severity) |
| `GET` | `/api/incidents/:id` | Bearer | All | Single incident detail |
| `POST` | `/api/incidents` | Bearer | All | Create + auto AI triage |
| `PATCH` | `/api/incidents/:id/status` | Bearer | Coordinator, Responder | Update status |
| `DELETE` | `/api/incidents/:id` | Bearer | Coordinator | Soft-delete |
| `POST` | `/api/incidents/:id/sos` | Bearer | All | Trigger global SOS |

### Triage

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/api/triage/manual` | Bearer | Coordinator | Re-triage existing incident |

### Responders

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/responders` | Bearer | Coordinator, Responder | List responders |
| `PATCH` | `/api/responders/:id/location` | Bearer | Coordinator, Responder | Update GPS |

### System

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | None | System health check |
| `GET` | `/api/ws/health` | None | WebSocket connection stats |

### Response Format

All endpoints return:
```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "uuid-v4",
    "timestamp": "ISO-8601",
    "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
  },
  "error": null
}
```

### WebSocket Events

Connect: `ws://localhost:3001/ws?token=JWT_TOKEN`

| Event | Target | Trigger |
|-------|--------|---------|
| `CONNECTION_ACK` | Single | On connect |
| `INCIDENT_CREATED` | All | New incident |
| `INCIDENT_UPDATED` | All | Status change |
| `INCIDENT_DELETED` | Coordinators | Soft-delete |
| `SOS_TRIGGERED` | All | SOS activation |
| `TRIAGE_COMPLETE` | All | AI triage done |
| `RESPONDER_LOCATION_UPDATE` | Coordinators | GPS update |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3001` | Server port |
| `FRONTEND_ORIGIN` | No | `http://localhost:5173` | CORS origin |
| `JWT_SECRET` | **Yes** | — | JWT signing key (≥32 chars) |
| `JWT_EXPIRES_IN` | No | `30m` | Access token TTL |
| `JWT_REFRESH_SECRET` | **Yes** | — | Refresh token key (≥32 chars) |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Refresh token TTL |
| `FIREBASE_PROJECT_ID` | **Yes** | — | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | **Yes** | — | Service account email |
| `FIREBASE_PRIVATE_KEY` | **Yes** | — | Service account private key |
| `GEMINI_API_KEY` | **Yes** | — | Google AI Studio key |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | AI model |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Max login attempts per window |
| `LOG_LEVEL` | No | `info` | Winston log level |
| `LOG_DIR` | No | `./logs` | Log file directory |

---

## Project Structure

```
server/
├── server.js              # Entry point: HTTP + WebSocket
├── config/
│   ├── env.js             # Zod-validated environment config
│   └── firebase.js        # Firebase Admin SDK init
├── routes/
│   ├── auth.js            # Login + refresh
│   ├── incidents.js       # Full incident CRUD + SOS
│   ├── responders.js      # Responder management
│   ├── triage.js          # Manual re-triage
│   └── health.js          # System health check
├── controllers/
│   ├── authController.js
│   ├── incidentController.js
│   ├── responderController.js
│   └── triageController.js
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── rbac.js            # Role-based access control
│   ├── validate.js        # Zod request validation
│   ├── rateLimiter.js     # Global + auth rate limits
│   ├── sanitize.js        # XSS sanitization
│   ├── requestId.js       # UUID correlation
│   └── errorHandler.js    # Global error handler + 404
├── services/
│   ├── firestoreService.js # CRUD for all collections
│   ├── triageService.js   # Gemini AI + fallback
│   ├── wsService.js       # WebSocket management
│   ├── realtimeSync.js    # Firestore → WebSocket bridge
│   └── auditService.js    # Audit log writes
├── utils/
│   ├── logger.js          # Winston + daily rotation
│   ├── response.js        # Standard API envelope
│   └── errors.js          # Custom error hierarchy
├── tests/
│   └── unit/
│       ├── triageService.test.js
│       ├── auth.middleware.test.js
│       ├── rbac.middleware.test.js
│       └── response.errors.test.js
├── Dockerfile             # Multi-stage production build
├── .env.example           # Environment template
├── .gitignore
├── nodemon.json
└── package.json
```

## Security

- **No client-side secrets** — All API keys are server-only
- **JWT authentication** with HS256 signing and 30-minute expiry
- **RBAC** on all write endpoints (coordinator/responder/civilian)
- **Helmet.js** security headers with strict CSP in production
- **CORS** whitelist — frontend origin only
- **Rate limiting** — 100 req/15min global, 10/15min on login
- **XSS sanitization** on all request bodies
- **Input validation** via Zod schemas on every endpoint
- **Audit logging** for all state-changing operations
- **Request ID tracing** across all logs

## License

ISC
