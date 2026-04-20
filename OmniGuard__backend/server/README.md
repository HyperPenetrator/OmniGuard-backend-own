# OmniGuard — Intelligence Command API (Core) 🛡️

The mission-critical engine powering OmniGuard's real-time crisis response. Orchestrates high-frequency data streams, autonomous AI triage, and secure tactical communications.

## 🛠️ Core Mission Services

### 1. Autonomous Triage Engine (`triageService.js`)
Leverages **Google Gemini 1.5 Flash** to perform multimodal analysis of incident reports. It automatically assigns:
- **Severity Levels**: Low, Medium, High, Critical.
- **Team Dispatch**: Medical, Fire, Police, Tech-Hazard.
- **Resource Tags**: Required equipment and unit count.

### 2. Tactical WebSocket Hub (`wsService.js`)
A low-latency broadcast engine that routes intelligence based on responder roles and proximity. 
- **Incident Broadcasts**: Filtered by team type and a 5km geospatial radius.
- **Telemetry Sync**: Propagation of live responder GPS coordinates to the Tactical Dashboard.

### 3. Secure Auth & RBAC (`authController.js`)
Implements strict Role-Based Access Control using JWTs and SHA-256 hashed passwords. Supports Admin, Responder, and Civilian roles.

## ⚙️ Engineering Stack
- **Runtime**: Node.js 20 (LTS)
- **Framework**: Express.js with custom middleware for security (Helmet/CORS).
- **Intelligence**: Google Generative AI (Gemini SDK).
- **Persistence**: Firebase Admin SDK (Real-time Firestore integration).

## 🚀 Deployment Architecture

The API is containerized via Docker and optimized for global accessibility on Hugging Face Spaces.

- **Primary URL**: [OmniGuard-API](https://huggingface.co/spaces/hrishikeshdutta/OmniGuard-API)
- **Environment Management**: Secrets are managed via Hugging Face Space Variables (Firebase JSON, Gemini Keys).

---
© 2026 OmniGuard Intelligence Ops • Secure Engineering
