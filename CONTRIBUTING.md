# Contributing to OmniGuard 🤝

We welcome contributions! To maintain the high-quality standards of this tactical platform, please follow these guidelines.

## Development Standards

### 1. Code Style
- **JavaScript**: Follow the modular service-controller pattern used in the backend.
- **React**: Use functional components with hooks. Avoid inline styling; use Tailwind v4 utility classes.
- **Git**: Use descriptive commit messages (e.g., `feat: add real-time responder tracking`).

### 2. Environment Setup
- You must have a local `.env` file in both `OmniGuard__frontend` and `OmniGuard__backend/server`.
- Refer to `.env.example` in each directory.

### 3. Testing
- **Backend**: Run `npm test` before pushing any changes.
- **E2E**: Run `node scripts/e2e-test.js` to ensure the WebSocket-Firestore pipeline is intact.

## Pull Request Process
1. Create a feature branch from `main`.
2. Ensure linting passes.
3. Update relevant documentation if you add new features.
4. Open a PR with a detailed description of the changes.

---
**Note:** Military-grade security is a priority. Never commit your `.env` files or private keys to the repository.
