---
kind: dependency_management
name: NPM-based Monorepo Dependency Management (backend + frontend)
category: dependency_management
scope:
    - '**'
source_files:
    - backend/package.json
    - backend/package-lock.json
    - frontend/package.json
    - frontend/package-lock.json
---

## Approach

This is a two-package NPM monorepo: one `package.json` under `backend/` and another under `frontend/`. Each subproject declares its own dependencies and ships with a `package-lock.json`, so dependency resolution is handled by NPM per workspace rather than via a top-level lockfile or a tool like pnpm/yarn workspaces.

There is no vendored third-party code — all packages are installed into the respective `node_modules/` directories. No private registry, proxy, or `npmrc` configuration is present in the repository.

## Key Files

- `backend/package.json` — runtime dependencies for the Express/Mongoose API (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`). Declares an `engines.node >=20` constraint and scripts `dev` / `start`.
- `backend/package-lock.json` — deterministic lockfile pinning exact resolved versions of every transitive dependency.
- `frontend/package.json` — runtime dependencies (`react`, `react-dom`, `react-router-dom`) plus build-time devDependencies (`vite`, `@vitejs/plugin-react`). Uses ESM (`"type": "module"`).
- `frontend/package-lock.json` — deterministic lockfile for the frontend subtree.

## Architecture and Conventions

- **Per-subproject manifests**: The backend and frontend each maintain their own `package.json`; there is no root `package.json` orchestrating both sides.
- **Version ranges**: All dependencies use caret (`^`) ranges (e.g. `^4.21.2`, `^18.3.1`, `^6.0.7`), allowing minor/patch updates that stay within the declared major version.
- **Lockfiles committed**: Both `package-lock.json` files are tracked alongside their manifests, ensuring reproducible installs across environments.
- **Node engine pinning**: The backend pins `"engines": { "node": ">=20" }`, which NPM will warn on if the running Node version does not satisfy it.
- **No devDependency overlap**: Runtime-only libraries live under `dependencies`; build tooling (`vite`, `@vitejs/plugin-react`) lives under `devDependencies` only in the frontend package.
- **Private packages**: Both packages set `"private": true`, indicating they are not intended to be published to the public npm registry.

## Constraints and Rules

- **Enforced**: NPM resolves dependencies using the `package-lock.json` files present in each subdirectory; any change to `package.json` should be followed by regenerating the corresponding lockfile to keep the tree deterministic.
- **Enforced**: Backend requires Node.js ≥ 20 at install/run time via the `engines` field in `backend/package.json`.
- **Observed convention**: Third-party packages are never vendored into source control — they are pulled from the public npm registry at install time into `node_modules/`.
- **Observed convention**: Version bumps are expressed as caret ranges rather than fixed pins, so `npm update` can advance minor/patch versions without changing `package.json`.