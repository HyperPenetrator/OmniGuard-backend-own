[![Android Build](https://github.com/HyperPenetrator/OmniGuard-backend-own/actions/workflows/android-build.yml/badge.svg)](https://github.com/HyperPenetrator/OmniGuard-backend-own/actions/workflows/android-build.yml)[![OmniGuard CI](https://github.com/HyperPenetrator/OmniGuard-backend-own/actions/workflows/ci.yml/badge.svg)](https://github.com/HyperPenetrator/OmniGuard-backend-own/actions/workflows/ci.yml)
# OmniGuard — Tactical Crisis Command & Intelligence 🛡️

OmniGuard is a high-fidelity, real-time crisis management platform designed for enterprise industrial and hospitality sectors. It unifies distributed incident reporting, automated AI-driven triage (Gemini 1.5 Flash), and responder tactical routing into a single mission-critical ecosystem.

## 🚀 Live Infrastructure

| System Component | Status | Deployment Link |
| :--- | :--- | :--- |
| **Tactical Dashboard** | 🟢 Production | [omniguard-web.vercel.app](https://omniguard-web.vercel.app) |
| **Admin Command Center** | 🟢 Production | [omniguard-web.vercel.app/dashboard](https://omniguard-web.vercel.app/dashboard) |
| **Public Safety Portal** | 🟢 Active | [omniguard-suite.vercel.app](https://omniguard-suite.vercel.app) |
| **System API (WS/REST)** | 🟢 Operational | [OmniGuard-API (Hugging Face)](https://huggingface.co/spaces/hrishikeshdutta/OmniGuard-API) |

## 🏗️ Core Architecture

- **Autonomous Triage**: Real-time multimodal analysis via **Google Gemini 1.5 Flash**, categorizing threats in milliseconds.
- **Tactical Routing Engine**: Dynamic GPS-based navigation calculating distance, bearing, and ETA for responders.
- **Geospatial Intelligence**: High-performance interactive maps with real-time responder and incident synchronization.
- **Role-Based Command**: Specialized portals for Admin Strategists, Tactical Responders, and Public Safety.

## 🔑 System Access & Test Credentials

The environment is pre-seeded with specialized accounts for role-specific verification. Use the **Staff Login** section on the public portal to authenticate.

### 🛡️ Administrative & Command
| Role | User ID (Email) | Access Code (Password) | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin Strategist** | `coordinator@omniguard.io` | `omni2024!` | Full Command, Global Analytics, Team Management |

### 🚨 Tactical Response Units
| Unit | User ID (Email) | Access Code (Password) | Deployment View |
| :--- | :--- | :--- | :--- |
| **Fire Team Lead** | `fire_commander@omniguard.io` | `resp2024!` | Fire Suppression Dashboard |
| **Crime Team Lead** | `crime_chief@omniguard.io` | `resp2024!` | Security Task Force View |
| **Disaster Team Lead** | `disaster_lead@omniguard.io` | `resp2024!` | Bio-Hazard / Disaster Command |
| **Medical Unit M-1** | `medic1@omniguard.io` | `resp2024!` | Medical Response Dashboard |
| **Fire Engine 4** | `fire_beta@omniguard.io` | `resp2024!` | backup Fire View |
| **Police Patrol 99** | `patrol99@omniguard.io` | `resp2024!` | standard Security View |
| **Hazmat Tech Ops** | `tech_ops@omniguard.io` | `resp2024!` | field Tech View |

### 👥 Public Safety
| Role | User ID (Email) | Access Code (Password) | View |
| :--- | :--- | :--- | :--- |
| **Civilian User** | `civilian@omniguard.io` | `civ2024!` | Personal Safety Dashboard |

## 📂 Repository Layout

```text
OmniGuard/
├── OmniGuard__frontend/    # React 19 Tactical Dashboard & UI Components
├── OmniGuard__backend/     # Node.js API, WebSockets & Triage Service
│   └── server/             # Core Backend Logic (Express/Firestore)
├── COLLABORATION.md        # Integration & API reference for developers
├── ARCHITECTURE.md         # Technical design & event-driven flow
└── CONTRIBUTING.md         # Engineering standards & guidelines
```

## 🛠️ Developer Setup

Refer to the sub-directory documentation for environment-specific configurations:
- [**Frontend Configuration Guide**](./OmniGuard__frontend/README.md)
- [**Backend Configuration Guide**](./OmniGuard__backend/server/README.md)

---
© 2026 OmniGuard Systems • Authorized Personnel Only • [Security Policy](./SECURITY.md)
