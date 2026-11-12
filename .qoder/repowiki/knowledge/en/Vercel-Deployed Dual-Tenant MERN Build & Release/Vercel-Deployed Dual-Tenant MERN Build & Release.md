---
kind: build_system
name: Vercel-Deployed Dual-Tenant MERN Build & Release
category: build_system
scope:
    - '**'
source_files:
    - backend/package.json
    - frontend/package.json
    - backend/vercel.json
    - frontend/vercel.json
    - frontend/vite.config.js
---

## Build System Overview

This repository is a two-tenant MERN application (Express backend + React/Vite frontend) with **no shared build toolchain** at the monorepo root. Each tenant owns its own dependency manifest, scripts, and Vercel deployment configuration. There is no Makefile, Dockerfile, CI pipeline, or cross-compilation setup in this branch.

### Tools & Frameworks

- **Backend**: Node.js (`server.js` entry) built via `node --watch server.js` for development and `node server.js` for production. Runtime constraint: `engines.node >= 20` declared in `backend/package.json`.
- **Frontend**: Vite SPA (`vite.config.js`) — dev via `vite`, build via `vite build` producing a `dist/` directory, preview via `vite preview`. Frontend uses ES modules (`"type": "module"`).
- **Deployment target**: Vercel, configured per-tenant via `vercel.json` files.

### Key Files

- `backend/package.json` — declares `main: "server.js"`, scripts `dev` / `start`, Node engine pinning, and runtime dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`).
- `frontend/package.json` — declares Vite as both devDependency and runtime peer; scripts `dev`, `build`, `preview`; React 18 + react-router-dom as dependencies.
- `frontend/vite.config.js` — Vite configuration file (present but not inspected here).
- `backend/vercel.json` — rewrites all routes to `/api`, routing requests into the Express serverless handler.
- `frontend/vercel.json` — sets `buildCommand: "npm run build"`, `outputDirectory: "dist"`, and SPA rewrites to `index.html`.

### Architecture & Conventions

1. **Dual-tenant, independent builds.** The repo root has no orchestrating script (no `Makefile`, no `pnpm-workspace`, no Lerna/Nx config). Backend and frontend are deployed as separate Vercel projects/tenants.
2. **Vercel-first deployment model.** Both tenants ship a `vercel.json` that tells Vercel how to build and route:
   - Backend: every request is rewritten to `/api` so Express handles it serverlessly.
   - Frontend: standard Vite SPA build output (`dist/`) with client-side routing fallback to `index.html`.
3. **Environment variables per tenant.** Each tenant ships `.env.example` alongside its `.env` (gitignored), indicating environment-driven configuration rather than build-time injection.
4. **No shared lockfile or workspace.** `package-lock.json` exists separately under `backend/` and `frontend/`, confirming independent npm installs.
5. **Versioning is per-package.** Each `package.json` carries `version: "1.0.0"` independently; there is no centralized version bump script.

### Conventions & Constraints

- **Node version**: Backend enforces `node >= 20` via the `engines` field in `backend/package.json`.
- **Frontend module system**: Declared as ESM via `"type": "module"` in `frontend/package.json`.
- **Build outputs**: Frontend artifacts land in `dist/` (as required by `frontend/vercel.json`'s `outputDirectory`).
- **Routing conventions**: Backend API lives under `/api` (enforced by `backend/vercel.json` rewrite); frontend SPA routes fall back to `index.html` (enforced by `frontend/vercel.json` rewrite).
- **No CI/CD pipeline**: No GitHub Actions, GitLab CI, Jenkinsfile, or similar CI configuration was found in this branch.
- **No containerization**: No `Dockerfile` or `docker-compose.yml` present.
- **No Makefile or shell build scripts**: No `Makefile`, `build*.sh`, or equivalent top-level orchestration scripts exist.

### What Is Missing

There is no repository-wide build orchestration, artifact publishing, release tagging, or automated testing harness visible in this branch. The build surface is limited to each tenant's `npm run dev` / `npm run build` commands invoked by Vercel.