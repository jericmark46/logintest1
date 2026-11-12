Layered Express application with a clear separation of concerns:
- Entry points: `server.js` boots the dev server; `api/index.js` re-exports the Express app for Vercel serverless.
- App bootstrap (`src/app.js`) wires CORS (origin allowlist from `CLIENT_ORIGIN`), JSON parsing, a global `/api/health` endpoint, a per-request `connectDB()` middleware that caches the Mongoose connection on `global._mongooseConnection`, mounts `/api/auth` routes, then installs 404 and error handlers.
- Route layer (`src/routes/authRoutes.js`) declares REST endpoints and composes controllers through `asyncHandler` plus the `requireAuth` middleware.
- Controller layer (`src/controllers/authController.js`) validates inputs, calls the model, and returns `{ token, user }` payloads via a local `authPayload` helper.
- Middleware (`src/middleware/auth.js`) verifies Bearer tokens against `JWT_SECRET` and attaches the resolved User to `req.user`.
- Data layer (`src/models/User.js`) defines the Mongoose schema with built-in validators, a `pre('save')` hook that bcrypt-hashes passwords, a `comparePassword` method, and a `toJSON` transform that strips `_id`, `__v`, and `password` while exposing `id`.
- Config (`src/config/db.js`) provides a singleton DB connector with promise caching for Vercel cold-start reuse.
- Dependency direction is strictly top-down: entry → app → routes → controllers → models, with middleware and utils imported as needed.