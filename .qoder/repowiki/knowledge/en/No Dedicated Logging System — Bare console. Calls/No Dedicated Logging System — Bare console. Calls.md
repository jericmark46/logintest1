---
kind: logging_system
name: No Dedicated Logging System — Bare console.* Calls
category: logging_system
scope:
    - '**'
source_files:
    - backend/server.js
    - backend/src/app.js
    - backend/src/config/db.js
---

## What system/approach is used

The repository has **no dedicated logging framework or library** (no `winston`, `pino`, `morgan`, `bunyan`, `debug`, or similar). All output goes through Node.js's built-in `console` object: `console.log` and `console.error`. There is no logger initialization, no log-level configuration, no structured fields, and no sink routing.

## Key files

- `backend/server.js` — uses `console.log` to print the server bind address.
- `backend/src/app.js` — uses `console.error(err)` in the global Express error handler to dump unhandled errors.
- `backend/src/config/db.js` — uses `console.log('MongoDB connected')` on successful Mongoose connection.

No frontend code under `frontend/` contains any logging calls; the SPA does not emit logs.

## Architecture and conventions

- **Ad-hoc `console.*` usage only.** The three occurrences are all in the backend:
  - Startup banner (`server.js:7`): `console.log(`API listening on http://localhost:${PORT}`);`
  - Unhandled error dump (`src/app.js:51`): `console.error(err);`
  - DB connection confirmation (`src/config/db.js:24`): `console.log('MongoDB connected');`
- There is no central logger module, no middleware for request logging, no request/response correlation IDs, no log levels beyond what `console.log` vs. `console.error` implicitly provides, and no environment-based log level toggling.
- Error handling in `src/app.js` returns a generic `{ message: 'Server error' }` JSON response to clients while still writing the raw error object to stderr via `console.error`.

## Conventions and constraints

- **Observed convention:** Production-facing endpoints never leak internal error details — the Express error handler swallows the error object from the client response and only emits it to stderr.
- **Constraint enforced by the codebase structure:** Because there is no logger abstraction, adding structured logging would require introducing a new dependency and a new module; nothing in the current code enforces a particular shape or level of log messages.
- No documentation or configuration file defines logging behavior; Vercel deployment relies on its default stdout/stderr capture for these `console.*` outputs.