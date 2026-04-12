# Project Guidelines

## Architecture

Three sub-projects sharing a single Cloudflare Workers REST API backend:

| Sub-project | Path | Purpose |
|-------------|------|---------|
| **API** (root) | `src/` | Cloudflare Workers + Hono + Chanfana (OpenAPI). Auth middleware, D1 (SQLite), cron job |
| **Web** | `expense-app-web/` | Next.js 16 + React 19, TanStack Query, Zustand, Recharts, Tailwind CSS |
| **Mobile** | `expense-app-mobile/` | Expo (React Native 0.81), Expo Router, NativeWind, TanStack Query |

**Auth:** Supabase JWT (`Authorization: Bearer`) validated against JWKS in `src/middleware/auth.ts`. Static API keys (`X-API-Key`) supported for iOS Shortcuts. Both clients (web + mobile) use Axios with auto-injected JWT from Supabase session.

**Database:** D1 (SQLite). Tables: `transactions`, `categories`, `accounts`, `tags`, `recurring_rules`, `shared_groups`, `api_keys`. See `schema.sql` for schema.

**Cron:** `src/cron.ts` runs daily at 06:00 UTC, processes active recurring rules, inserts transactions, updates `next_run`.

**Locale:** Both apps default to Spanish (es). Mobile uses i18next; web strings are hardcoded in Spanish.

## Build & Dev Commands

**API (root):**
```
npm run dev          # wrangler dev — local Worker
npm run deploy       # wrangler deploy
npm run cf-typegen   # regenerate worker-configuration.d.ts after wrangler.jsonc changes
```

**Web (`expense-app-web/`):**
```
npm run dev    # Next.js dev server
npm run build  # production build
npm run lint   # ESLint
```

**Mobile (`expense-app-mobile/`):**
```
npm start          # Metro bundler
npm run android    # Android emulator
npm run ios        # iOS simulator
```

## Conventions

**API endpoints:** Classes extend `OpenAPIRoute` (Chanfana), named `<Resource><Verb>` (e.g., `TransactionCreate`, `GroupSettle`). Registered on the Hono OpenAPI router in `src/index.ts` as `openapi.METHOD("/api/path", Class)`. Follow existing resource patterns before adding new routes.

**Validation:** Use Zod schemas via Chanfana for request/response validation. All core types live in `src/types.ts`.

**TypeScript:** `strict: true`, `strictNullChecks: false`, `noUncheckedIndexedAccess: true`. Module resolution: `"Bundler"`, target `"es2022"`.

**Styling:** Tailwind CSS everywhere. Web uses CSS variables for theming (`--text-primary`, `--bg-card`, `--border`, etc.). Mobile uses NativeWind.

**State (Web):** TanStack Query for server state; Zustand for modal/UI state.

## Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

- Docs: https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`
- For limits: retrieve from the product's `/platform/limits/` page (e.g., `/workers/platform/limits`)
- Node.js compat: https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- Errors: https://developers.cloudflare.com/workers/observability/errors/ (Error 1102 = CPU/memory exceeded)
- Product docs: `/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

Run `npm run cf-typegen` after changing bindings in `wrangler.jsonc`.
