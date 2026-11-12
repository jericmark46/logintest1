---
kind: frontend_style
name: Plain CSS with Utility-Style Classes in a Minimal Vite + React SPA
category: frontend_style
scope:
    - '**'
source_files:
    - frontend/src/index.css
    - frontend/package.json
    - frontend/vite.config.js
---

## Approach

The frontend is a React 18 + Vite SPA that uses **plain CSS** (no CSS-in-JS, no Sass/Less, no Tailwind, no component library). All visual styling lives in a single stylesheet `frontend/src/index.css`, imported once by `main.jsx`. There are no design-token files, no theme configuration, and no responsive breakpoints — the layout relies on Flexbox/Grid and percentage-based sizing.

## Key Files

- `frontend/src/index.css` — the only stylesheet in the project; defines global resets, page backgrounds, and every UI class used across pages.
- `frontend/package.json` — confirms no CSS preprocessor or utility framework is installed (`react`, `react-dom`, `react-router-dom` are the only runtime deps).
- `frontend/vite.config.js` — standard Vite config; no style plugin beyond the default React one.

## Architecture & Conventions Observed

- **Single-file stylesheet**: All styles are centralized in `index.css`; there are no per-component CSS modules, SCSS files, or styled-components.
- **CSS custom properties as tokens**: A small set of design values is exposed via `:root` — font family (`'Segoe UI', system-ui, -apple-system, sans-serif`), text color (`#0f172a`), background (`#eef2ff`). These are referenced directly rather than through a token layer.
- **BEM-like class naming without BEM semantics**: Class names are flat and descriptive (`.auth-page`, `.auth-card`, `.auth-card h1`, `.switch`, `.alert`, `.dashboard`, `.avatar`, `.profile`, `.page-loading`). No block/element/modifier nesting convention is followed consistently.
- **Color palette**: The palette is hardcoded throughout the file using Tailwind-inspired hex values (`#6366f1` / indigo, `#4f46e5`, `#0ea5e9` / sky, `#cbd5e1`, `#e2e8f0`, `#f1f5f9`, `#f8fafc`, `#64748b`, `#334155`, `#b91c1c`, `#fef2f2`, `#fecaca`) but without a shared variable layer — colors are duplicated across selectors.
- **Global reset**: `* { box-sizing: border-box; }` plus a body reset with a two-point radial-gradient background over `#eef2ff`.
- **Layout strategy**: Centered auth forms use `display: grid; place-items: center` on `.auth-page`; cards use Flexbox with `gap` for spacing. No media queries exist in the stylesheet, so responsiveness is achieved through `width: 100%` + `max-width: 400px` and relative units.
- **Component-level variants via classes**: Buttons have a primary gradient variant (`background: linear-gradient(135deg, #6366f1, #4f46e5)`) and a secondary variant applied via an additional `.secondary` class (`.auth-card button.secondary`).
- **Interaction states**: Hover/active/disabled states are defined inline on button selectors (`filter: brightness(...)`, `transform: translateY(1px)`, `opacity: 0.65`); input focus uses `border-color: #6366f1` with a soft ring shadow.

## Constraints & Rules

- No CSS preprocessor or utility framework is configured or installed — adding one would require changes to `package.json` and `vite.config.js`.
- Styles are not scoped to components; all classes are globally available from `index.css`.
- There is no linting or formatting toolchain visible for CSS (no `.stylelintrc`, no Prettier config for CSS) — conventions are enforced only by developer discipline.
- The stylesheet contains no responsive breakpoints; mobile/tablet/desktop adaptation is not implemented.