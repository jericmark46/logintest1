---
kind: configuration_system
name: dotenv-based Environment Configuration for Backend and Frontend
category: configuration_system
scope:
    - '**'
source_files:
    - backend/.env
    - backend/.env.example
    - frontend/.env
    - frontend/.env.example
    - backend/server.js
    - backend/src/config/db.js
    - frontend/src/api/client.js
    - frontend/vite.config.js
    - backend/vercel.json
    - frontend/vercel.json
---

## Approach

The project uses plain `.env` files loaded via `dotenv` (backend) and Vite's built-in `import.meta.env` (frontend). There is no schema validation, config object abstraction, or feature-flag system — configuration values are consumed directly from `process.env` / `import.meta.env` at the point of use.

## Key Files

- `backend/.env`, `backend/.env.example` — backend secrets and runtime options.
- `frontend/.env`, `frontend/.env.example` — frontend-only build-time variables.
- `backend/server.js` — entry that calls `require('dotenv').config()` before anything else.
- `backend/src/config/db.js` — only place in the backend that reads a config value (`MONGODB_URI`) and validates its presence.
- `frontend/src/api/client.js` — reads `VITE_API_URL` to construct the base API URL.
- `frontend/vite.config.js` — hardcodes the dev server port (`5173`).
- `backend/vercel.json`, `frontend/vercel.json` — deployment-level routing/build configuration for Vercel.

## Architecture and Conventions

**Backend (Express)**
- `server.js` is the single bootstrap: it loads `.env` via `dotenv.config()`, then requires `./src/app`. All other modules read `process.env` directly — there is no central config module.
- The only explicit validation is in `src/config/db.js`: if `MONGODB_URI` is missing, `connectDB()` throws `Error('MONGODB_URI is not set')` before attempting a connection. Other env vars (`PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN`) have no such guard and rely on defaults elsewhere in the codebase.
- MongoDB connections are cached on `global._mongooseConnection` across Vercel serverless function invocations (commented explicitly as a serverless reuse optimization).

**Frontend (React + Vite)**
- Only variables prefixed with `VITE_` are exposed to the browser; `client.js` reads `import.meta.env.VITE_API_URL` and falls back to `'http://localhost:5000'`, stripping any trailing slash.
- The dev server port is hardcoded in `vite.config.js` as `5173`; there is no corresponding env var for it.

**Deployment configuration**
- Both sides ship a `vercel.json`:
  - Backend rewrites all routes to `/api` (single-page serverless handler).
  - Frontend sets `buildCommand: npm run build`, `outputDirectory: dist`, and rewrites all routes to `/index.html` for SPA client-side routing.

## Variables Observed

| Variable | Scope | Default / Behavior |
|---|---|---|
| `MONGODB_URI` | Backend runtime | Required; missing → thrown error in `connectDB()` |
| `JWT_SECRET` | Backend runtime | Used to sign JWTs; no default enforced here |
| `PORT` | Backend runtime | Falls back to `5000` in `server.js` |
| `JWT_EXPIRES_IN` | Backend runtime | Optional, used by JWT logic |
| `CLIENT_ORIGIN` | Backend runtime | Optional; comment says defaults to `*` when unset |
| `VITE_API_URL` | Frontend build-time | Falls back to `http://localhost:5000` in `client.js` |

## Constraints and Rules

1. **Backend secrets must be provided at runtime.** `MONGODB_URI` is explicitly required; `connectDB()` throws if it is absent. This is the only env-var check in the backend source.
2. **Only `VITE_*` variables reach the browser.** The frontend uses `import.meta.env.VITE_API_URL`; non-prefixed variables are stripped by Vite at build time.
3. **`.env` files are committed alongside `.env.example` templates.** The example files document the expected variable names and provide safe defaults (e.g., local MongoDB URI, `change-me-to-a-long-random-string` for `JWT_SECRET`).
4. **No schema validation library is used.** There is no Joi/Zod/Yup/etc. against the environment; configuration correctness relies on callers checking `process.env` values.
5. **Configuration is not centralized behind an object.** Each module reads `process.env` / `import.meta.env` directly where needed, rather than importing a shared config module.
6. **Vercel deployment is configured per-tenant via `vercel.json`** in each subproject, with route rewrites tailored to the serverless API vs. the SPA.