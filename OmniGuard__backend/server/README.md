---
title: OmniGuard API
emoji: 🚨
colorFrom: red
colorTo: gray
sdk: docker
pinned: false
---

# OmniGuard — Command & Control API 🛡️

The industrial-grade backend for the OmniGuard system. It orchestrates real-time incident processing, Firebase synchronization, and Gemini AI triage.

## 🛠️ Core Services
- **Auth Service**: Secure JWT-based sessions with RBAC.
- **WebSocket Hub**: Real-time broadcast engine for incident distribution.
- **Triage Engine**: Automated severity classification using Gemini 1.5 Flash.
- **Firestore Sync**: Real-time database monitoring for multi-client state consistency.

## ⚙️ Tech Stack
- Node.js 20+
- Express.js
- Firebase Admin SDK
- Google Generative AI (Gemini)
- WebSocket (`ws`)

## 🏃 Getting Started
1. `npm install`
2. Configure `.env` (see `.env.example`).
3. `npm run dev`

## 🧪 Testing
Run the audit suite to ensure system integrity:
- `npm test` (Unit tests)
- `node scripts/e2e-test.js` (E2E Integration)

## 🚀 Deployment
Containerized via Docker and deployed to Hugging Face Spaces.
URL: [https://huggingface.co/spaces/hrishikeshdutta/OmniGuard-API](https://huggingface.co/spaces/hrishikeshdutta/OmniGuard-API)
