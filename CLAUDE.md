# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This repository is a **pnpm workspace monorepo** containing a Cloudflare Worker backend API and a Next.js web frontend.

### Development Commands
- `pnpm dev` or `pnpm dev:all` - Start API and Web servers in parallel
- `pnpm dev:api` - Start Cloudflare Worker dev server (`wrangler dev`)
- `pnpm dev:web` - Start Next.js web dev server (`next dev`)

### Build & Lint Commands
- `pnpm build:web` - Build Next.js web application (`next build` / static export)
- `pnpm --filter web lint` - Run ESLint on the web application

### Database & D1 Migrations (`apps/api`)
- `pnpm db:setup:local` - Run local migrations and seed data in local D1
- `pnpm db:migrate:create <migration_name>` - Create a new migration file in `apps/api/migrations/`
- `pnpm db:migrate:local` - Apply pending migrations to local D1 database
- `pnpm db:migrate:apply` - Apply pending migrations to remote production D1 database
- `pnpm db:migrate:status` - Check migration status against remote D1 database
- `pnpm db:seed:local` - Seed local D1 database with sample SQL data
- `pnpm db:seed:more` - Run TypeScript script to generate additional fake test data (`tsx scripts/seed-more.ts`)

---

## Architecture & Code Structure

### Backend API (`apps/api`)
- **Framework & OpenAPI**: Hono with Chanfana (`@chanfana/openapi`) for automatic OpenAPI / Swagger spec generation and route handling.
- **Database**: Cloudflare D1 (Serverless SQLite) with SQL migration files located in `apps/api/migrations/`.
- **Validation**: Zod schemas for request validation and OpenAPI parameter declarations.
- **Authentication**: Dual auth via Supabase JWT verification (`jose`) and static API keys stored in D1 (`api_keys` table).
- **Types & Endpoints**: OpenAPI route definitions are modularized in `apps/api/src/endpoints/`.

### Web Dashboard (`apps/web`)
- **Framework**: Next.js 16 (App Router + Turbopack).
- **Styling**: Tailwind CSS v4 with semantic CSS variables defined in `apps/web/src/app/globals.css` (`@theme`).
- **State & Data Fetching**: TanStack React Query v5 for server state (with offline persistence via `localStorage`) and Zustand for local UI preferences (`usePreferences`).
- **PWA Capabilities**: Service Worker integration (`sw.js`) and PWA installation prompt controller (`PWAController.tsx`).
