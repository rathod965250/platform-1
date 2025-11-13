## Scope
- Upgrade the app to Next.js 16 using official guidance and ensure full compatibility.
- Validate dev and build with Turbopack as default; address known breaking changes.

## Current Audit
- Dependencies already on v16: `next@16.0.1`, `eslint-config-next@16.0.1`, `typescript@5.9.3`, `react@19.2.0`, `react-dom@19.2.0` (c:\Users\ratho\OneDrive\Desktop\platform-1-5\package.json:42–65).
- Config is minimal; no custom Webpack: `next.config.ts` defines no `webpack` override (c:\Users\ratho\OneDrive\Desktop\platform-1-5\next.config.ts:3–7).
- Middleware uses the current convention and is async-safe (c:\Users\ratho\OneDrive\Desktop\platform-1-5\src\middleware.ts:4–6; c:\Users\ratho\OneDrive\Desktop\platform-1-5\src\lib\supabase\middleware.ts:4–11).
- Async Request APIs: `cookies()` already used asynchronously (c:\Users\ratho\OneDrive\Desktop\platform-1-5\src\lib\supabase\server.ts:16). No `headers()` or `draftMode()` found.
- No `unstable_` APIs or `experimental_ppr` flags detected.
- No Sass and no Node-native modules imported in client bundles.

## Upgrade Steps
1. Add Node runtime guard
- Enforce `engines.node ">=20.9.0"` in `package.json` to match v16 requirements.

2. Turbopack defaults
- Keep `next dev` and `next build` as-is to use Turbopack by default.
- Enable Turbopack filesystem caching in development via top-level `turbopack` config for faster restarts.

3. ESLint CLI
- Keep `"lint": "eslint"` script; ensure ESLint runs against the project with `eslint-config-next`. If a legacy `next lint` script exists anywhere, replace it with ESLint CLI.

4. Middleware compatibility
- Retain `src/middleware.ts` and `matcher` config; no migration needed from deprecated conventions.

5. Async Request APIs
- Verify all usages of `cookies`, `headers`, `draftMode` are asynchronous; fix any sync calls if discovered during validation.

6. Optional alias fallbacks
- If build errors like `Module not found: Can't resolve 'fs'` occur in client bundles, add `turbopack.resolveAlias` mapping to empty modules for browser-only code; otherwise prefer refactoring to avoid Node APIs on the client.

7. Optional Sass import cleanup (not present)
- If Sass is introduced later, remove any legacy `~` imports or use `turbopack.resolveAlias` as a temporary bridge.

## Validation
- Run `npm run dev` to confirm local development works with Turbopack.
- Run `npm run build` to confirm production build; watch for warnings about discovered Webpack config via plugins.
  - If a plugin injects Webpack options and breaks Turbopack, either:
    - Opt out temporarily with `next build --webpack`, or
    - Migrate plugin usage to Turbopack-compatible options and keep Turbopack.
- Run `npm run lint` and TypeScript checks to ensure no type or lint regressions.
- Smoke test auth flows to confirm middleware redirects and Supabase session handling are correct.

## Deliverables
- Updated `package.json` with `engines.node`.
- Updated `next.config.ts` with a `turbopack` top-level config to enable filesystem caching (dev-only).
- Validation report for dev/build/lint.

## Notes
- Cache Components migration is optional post-upgrade; can be planned after validation.
- No docs or Sass-related changes are required at this time given the audit results.
