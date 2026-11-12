# MERN Auth — Login & Registration

Basic email/password authentication built with:

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt — deployable to Vercel as a serverless API
- **Frontend:** React + Vite + React Router — deployable to Vercel as a static SPA

The two apps are intentionally separate so they can be deployed as two Vercel projects.

## Project structure

```
test/
├── backend/                 # Express API (Vercel serverless function in api/index.js)
│   ├── api/index.js         # Serverless entry point
│   ├── src/
│   │   ├── app.js           # Express app (CORS, JSON, routes, error handling)
│   │   ├── config/db.js     # Mongoose connection with serverless-safe caching
│   │   ├── models/User.js   # User schema (bcrypt hashing, password hidden from JSON)
│   │   ├── controllers/     # register / login / me
│   │   ├── middleware/      # JWT bearer-token auth guard
│   │   └── routes/          # /api/auth routes
│   ├── server.js            # Local dev server (app.listen)
│   └── vercel.json          # Rewrites all paths to the Express function
└── frontend/
    ├── src/
    │   ├── api/client.js    # fetch wrapper, attaches Bearer token
    │   ├── context/         # AuthContext (login, register, logout, session restore)
    │   ├── components/      # ProtectedRoute
    │   └── pages/           # Login, Register, Dashboard
    └── vercel.json          # SPA fallback rewrite to index.html
```

## Features

- Register with name, email, and password (min 8 characters)
- Passwords hashed with bcrypt; never returned by the API
- Login issues a JWT (7-day expiry)
- Protected `GET /api/auth/me` verifies the token and returns the user
- Session restored on page reload; logout clears it
- Client-side protected route (`/` redirects to `/login` when signed out)
- Basic validation and friendly error messages

## Local development

### 1. Backend

```bash
cd backend
cp .env.example .env      # then edit the values
npm install
npm run dev               # http://localhost:5000
```

`.env` values:

| Variable        | Required | Description                                             |
| --------------- | -------- | ------------------------------------------------------- |
| `MONGODB_URI`   | yes      | MongoDB connection string                               |
| `JWT_SECRET`    | yes      | Long random string used to sign tokens                  |
| `CLIENT_ORIGIN` | no       | Comma-separated allowed origins (defaults to `*`)       |
| `PORT`          | no       | Local port (default `5000`)                             |
| `JWT_EXPIRES_IN`| no       | Token lifetime (default `7d`)                           |

You need a MongoDB running locally or a free MongoDB Atlas cluster (see deployment below).

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000
npm install
npm run dev               # http://localhost:5173
```

## API

| Method | Endpoint             | Auth           | Body                          | Success |
| ------ | -------------------- | -------------- | ----------------------------- | ------- |
| POST   | `/api/auth/register` | —              | `{ name, email, password }`   | `201 { token, user }` |
| POST   | `/api/auth/login`    | —              | `{ email, password }`         | `200 { token, user }` |
| GET    | `/api/auth/me`       | Bearer token   | —                             | `200 { user }` |
| GET    | `/api/health`        | —              | —                             | `200 { status: "ok" }` |

Errors return `{ "message": "..." }` with `400`, `401`, `409`, or `500`.

## Deploying to Vercel

### Step 1 — Create a MongoDB Atlas database

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user (username + password).
3. Under **Network Access**, allow `0.0.0.0/0` — Vercel functions use dynamic IPs.
4. Copy the connection string and append a database name, e.g.
   `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/mern_auth?retryWrites=true&w=majority`

### Step 2 — Deploy the backend

1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket).
2. In Vercel: **Add New → Project**, import the repo.
3. Set **Root Directory** to `backend` (framework preset: *Other*).
4. Add environment variables:
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = a long random string (e.g. output of `openssl rand -hex 32`)
   - `CLIENT_ORIGIN` = your frontend URL (you can add this after Step 3)
5. Deploy and verify `https://<backend-project>.vercel.app/api/health` returns `{ "status": "ok" }`.

`backend/vercel.json` rewrites every request to `api/index.js`, where the exported Express app handles routing. `src/config/db.js` caches the Mongoose connection so warm serverless invocations reuse it.

### Step 3 — Deploy the frontend

1. In Vercel: **Add New → Project** and import the **same repository** again.
2. Set **Root Directory** to `frontend` (framework preset: *Vite* is auto-detected).
3. Add environment variable `VITE_API_URL` = `https://<backend-project>.vercel.app` (no trailing slash).
4. Deploy.

### Step 4 — Lock CORS to your frontend

In the backend project settings, set `CLIENT_ORIGIN` to the deployed frontend origin (e.g. `https://<frontend-project>.vercel.app`) and redeploy. Multiple origins can be comma-separated.

## Notes

- **Token storage:** the JWT is kept in `localStorage` and sent as an `Authorization: Bearer` header. This works reliably across two different Vercel domains. If you later serve the frontend and API from the same site, consider httpOnly cookies instead for extra XSS protection.
- **Never commit `.env`** files — only `.env.example` is tracked.
- To change auth rules (password length, token expiry), edit `backend/src/models/User.js` and `backend/src/controllers/authController.js`.
