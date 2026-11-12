The app is a flat React SPA under `src/` with four clear layers:
- Entry & shell: `main.jsx` mounts `<App />` inside `React.StrictMode`; `App.jsx` wires `react-router-dom` `<Router>`/`<Routes>` and wraps all routes with `AuthProvider`.
- Routing: `/login`, `/register` are public; `/` renders `Dashboard` behind `ProtectedRoute`, which redirects unauthenticated users to `/login`.
- State layer: `context/AuthContext.jsx` exposes `user`, `loading`, `login`, `register`, `logout` via a React context; it persists the JWT under the key `mern_auth_token` in `localStorage` and rehydrates on mount by calling `api.getMe(token)`.
- API layer: `api/client.js` exports an `api` object (`register`, `login`, `getMe`) built on a shared `request(path, {method, body, token})` helper that sets `Authorization: Bearer <token>` and throws on non-OK responses.
- Pages: `pages/Login.jsx` and `Register.jsx` are controlled forms that call `useAuth().login/register` and navigate on success; `pages/Dashboard.jsx` is the protected landing page.

Dependency direction is one-way: pages → context → api → fetch. The build target is `dist` via Vite, deployed on Vercel with a catch-all rewrite to `index.html` for client-side routing.