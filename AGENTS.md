# Project Guidelines

## Architecture

pnpm workspace monorepo with two apps:

| App     | Path        | Purpose                                                                                |
| ------- | ----------- | -------------------------------------------------------------------------------------- |
| **API** | `apps/api/` | Cloudflare Workers + Hono + Chanfana (OpenAPI). Auth middleware, D1 (SQLite), cron job |
| **Web** | `apps/web/` | Next.js 16 (static export) + React 19, TanStack Query, Zustand, Recharts, Tailwind CSS |

**Auth:** Supabase JWT (`Authorization: Bearer`) validated against JWKS in `apps/api/src/middleware/auth.ts`. Static API keys (`X-API-Key`) supported for iOS Shortcuts. The web client uses Axios with the JWT auto-injected from the Supabase session.

**Local auth shortcuts** (`X-API-Key: local-dev-api-key`, `Bearer local-token`, no header) only work when `ENVIRONMENT=development` is set in `apps/api/.dev.vars`. Never set `ENVIRONMENT` in production and never gate auth on the request URL.

**Database:** D1 (SQLite). Migrations live in `apps/api/migrations/`; `apps/api/schema.sql` is a reference snapshot. Multi-statement writes go through `DB.batch()` so they are atomic.

**Dates:** D1 runs in UTC. Use `todayLocal()` from `apps/api/src/utils/date.ts` (America/Santiago) instead of `date('now', 'localtime')`.

**Cron:** `apps/api/src/cron.ts` runs daily at 06:00 UTC, processes active recurring rules (catching up missed occurrences), inserts transactions and advances `next_run`.

**Locale:** Web strings are hardcoded in Spanish (es).

## Build & Dev Commands

Run from the repo root:

```
pnpm dev               # API (wrangler dev) + Web (next dev) in parallel
pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit for api and web
pnpm test              # node:test suites for api and web
pnpm build:web         # static export to apps/web/out
pnpm db:setup:local    # apply migrations + seed local D1
pnpm --filter api cf-typegen   # regenerate apps/api/worker-configuration.d.ts after wrangler.jsonc changes
```

CI (`.github/workflows/deploy.yml`) runs lint, typecheck and tests before deploying.

## Conventions

**API endpoints:** Classes extend `OpenAPIRoute` (Chanfana), named `<Resource><Verb>` (e.g., `TransactionCreate`, `GroupSettle`). Registered on the Hono OpenAPI router in `apps/api/src/index.ts` as `openapi.METHOD("/api/path", Class)`. Follow existing resource patterns before adding new routes.

**Validation:** Use Zod schemas via Chanfana for request/response validation. All core types live in `apps/api/src/types.ts`.

**TypeScript:** `strict: true`, `strictNullChecks: false`, `noUncheckedIndexedAccess: true`. Module resolution: `"Bundler"`.

**Styling:** Tailwind CSS with CSS variables for theming (`--text-primary`, `--bg-card`, `--border`, etc.) defined in `apps/web/src/app/globals.css`.

**State (Web):** TanStack Query for server state (persisted to `localStorage`, cleared on sign-out); Zustand for modal/UI state.

## Cloudflare Workers

STOP. Your knowledge of Cloudflare Workers APIs and limits may be outdated. Always retrieve current documentation before any Workers, KV, R2, D1, Durable Objects, Queues, Vectorize, AI, or Agents SDK task.

- Docs: https://developers.cloudflare.com/workers/
- MCP: `https://docs.mcp.cloudflare.com/mcp`
- For limits: retrieve from the product's `/platform/limits/` page (e.g., `/workers/platform/limits`)
- Node.js compat: https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- Errors: https://developers.cloudflare.com/workers/observability/errors/ (Error 1102 = CPU/memory exceeded)
- Product docs: `/kv/` · `/r2/` · `/d1/` · `/durable-objects/` · `/queues/` · `/vectorize/` · `/workers-ai/` · `/agents/`

Run `pnpm --filter api cf-typegen` after changing bindings in `apps/api/wrangler.jsonc`.
