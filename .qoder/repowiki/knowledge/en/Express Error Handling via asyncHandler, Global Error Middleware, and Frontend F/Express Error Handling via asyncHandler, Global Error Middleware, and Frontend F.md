---
kind: error_handling
name: Express Error Handling via asyncHandler, Global Error Middleware, and Frontend Fetch Wrapper
category: error_handling
scope:
    - '**'
source_files:
    - backend/src/utils/asyncHandler.js
    - backend/src/app.js
    - backend/src/controllers/authController.js
    - backend/src/middleware/auth.js
    - frontend/src/api/client.js
---

## Overview

The MERN Auth Monorepo uses a straightforward Express error-handling pattern on the backend and a thin `fetch` wrapper on the frontend. There is no custom error-class hierarchy, no sentinel-error module, and no structured logging framework — errors are represented as plain JavaScript `Error` objects and propagated through Express's built-in `(err, req, res, next)` middleware chain.

## Backend (Express)

### Async handler wrapper
- File: `backend/src/utils/asyncHandler.js`
- A single higher-order function that wraps an async controller so rejected promises are forwarded to Express via `next(err)`. Controllers are composed with it at route registration time (see `authRoutes.js`).

### Global error middleware
- File: `backend/src/app.js`, lines 47–53
- The final middleware in the chain handles all uncaught errors:
  - If `err.type === 'entity.parse.failed'` (Express's body-parser error), it returns `400 { message: 'Invalid JSON body' }`.
  - Otherwise it logs the error with `console.error` and returns `500 { message: 'Server error' }`.
- This is the only place where HTTP status codes are assigned for unexpected failures; controllers return early with their own status codes for known validation/business cases.

### Controller-level handling
- File: `backend/src/controllers/authController.js`
- Input validation errors return `400` responses directly (`message` field).
- Duplicate email during `User.create` is caught by checking `err.code === 11000` (MongoDB duplicate-key code) and converted to `409 { message: 'An account with this email already exists' }`; other DB errors are re-thrown to the global handler.
- Missing `JWT_SECRET` throws a plain `Error('JWT_SECRET is not set')` from `signToken`.

### Authentication middleware
- File: `backend/src/middleware/auth.js`
- Missing or malformed `Authorization` header → `401 { message: 'Not authorized' }`.
- Invalid JWT or missing user → `401 { message: 'Not authorized' }`.
- All auth failures short-circuit with a response; they do not call `next(err)`.

### Database connection error propagation
- File: `backend/src/app.js`, lines 32–39
- A per-request middleware calls `connectDB()` inside a try/catch and forwards any connection failure via `next(err)` so the global error middleware can respond.

### No 404 fallback
- File: `backend/src/app.js`, lines 43–45
- A catch-all route returns `404 { message: 'Not found' }` for unmatched paths.

## Frontend (React + Vite)

### Centralized API client
- File: `frontend/src/api/client.js`
- The `request(path, options)` function wraps every fetch:
  - Network failures (e.g., server down) throw `new Error('Cannot reach the server. Is the backend running?')`.
  - Non-OK responses parse the body with `.json().catch(() => ({}) )` and throw `new Error(data.message || \`Request failed (${response.status})\`)`.
- Public exports `api.register`, `api.login`, `api.getMe` delegate to `request`.

### Page-level consumption
- Pages (`Login.jsx`, `Register.jsx`, `Dashboard.jsx`) consume the `api` client and handle thrown errors locally (e.g., showing toast messages); there is no global React error boundary or centralized error interceptor.

## Conventions Observed

1. **Controllers never use try/catch** — they rely on `asyncHandler` to funnel promise rejections into Express's error middleware.
2. **Errors are plain `Error` objects**, not custom classes or sentinel values; domain-specific cases (MongoDB duplicate key) are detected by inspecting properties like `err.code === 11000`.
3. **HTTP status codes are returned inline** in controllers/middleware rather than raised as typed exceptions.
4. **All unexpected server errors go through one global middleware** in `app.js` that logs via `console.error` and responds with `500`.
5. **Frontend errors are surfaced as thrown `Error` strings** from the `client.request` wrapper; callers decide how to present them.
6. **No structured logging library** is used — `console.error` is the sole error logger on the backend.