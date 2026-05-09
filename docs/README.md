# Scroll-Learn — Documentation

> Architecture, setup, and engineering reference for the v3 Expo rewrite.

---

## Contents

| Document | What it covers |
|---|---|
| [Architecture v3](./architecture-v3.md) | Full system diagram — Expo app, backend, AI, database |
| [Developer Roles](./dev-roles.md) | Task split across the 4-person team |
| [Local Setup](./setup.md) | How to run backend + frontend locally on Windows/Mac/Linux |
| [API Reference](./api-reference.md) | Every backend endpoint with request/response shapes |
| [Recommendation Engine](./recommendation-engine.md) | How the AI video recommendation system works |
| [Deep Dive Slides](./deep-dive-slides.md) | Interactive slide system — JSON schema + slide types |

---

## Quick orientation

```
Scroll-Learn/
├── backend/          Node.js + Express API
├── frontend/         CURRENT: React + Vite (web only)
├── docs/             YOU ARE HERE — engineering wiki
├── start.bat         Windows one-click start
└── start.sh          Mac/Linux one-click start
```

The `frontend/` directory will be **replaced by an Expo app** (iOS + Android + Web)
as part of the v3 migration. See [Architecture v3](./architecture-v3.md) for the plan.
