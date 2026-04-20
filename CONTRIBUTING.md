# Contributing to OmniGuard 🤝

Thank you for your interest in contributing to OmniGuard. As a mission-critical tactical platform, we maintain rigorous engineering standards to ensure system stability, security, and performance.

## 🛠️ Engineering Standards

### 1. Code Excellence
- **Architecture**: Adhere to the **Service-Controller-Route** pattern on the backend and **Atomic Component Architecture** on the frontend.
- **Styling**: Exclusively use **Tailwind CSS v4** with our established design tokens. Maintain the Glassmorphism aesthetic.
- **State Management**: Prefer local hooks and context for real-time synchronization; avoid unnecessary global state overhead.

### 2. Version Control (Git)
- Use **Conventional Commits** (e.g., `feat:`, `fix:`, `refactor:`, `docs:`).
- Keep pull requests focused on a single logical change.
- Rebase your feature branch on `main` before submission to ensure a clean history.

### 3. Verification Protocol
Before submitting a PR, you MUST complete the following:
- [ ] **Linting**: Ensure no ESLint errors exist in the frontend or backend.
- [ ] **Unit Testing**: `cd server && npm test` must return 100% pass rate.
- [ ] **Integration Check**: Validate the real-time pipeline using `node scripts/e2e-test.js`.
- [ ] **Documentation**: Update `ARCHITECTURE.md` or `COLLABORATION.md` if API signatures or system flows have changed.

## 🛡️ Security Protocol

- **Zero-Trust**: Assume all client inputs are untrusted; implement strict Joi/Zod validation.
- **Secret Management**: Never commit `.env` files, Firebase JSON keys, or Gemini API keys.
- **Audit**: All changes affecting the authentication layer require a secondary senior review.

---
© 2026 OmniGuard Engineering Team • Secure • Reliable • Fast
