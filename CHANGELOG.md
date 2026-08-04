# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-02

### Added

- **Cloudflare D1 Native Migrations**: Implemented native migration directory support in `apps/api/migrations/`.
- **Initial Migration Schema**: Created `0000_initial_schema.sql` migration for D1 database setup.
- **Database Scripts**: Added `db:migrate:create`, `db:migrate:local`, `db:migrate:apply`, and `db:migrate:status` commands to `package.json`.
- **pnpm Workspace Configuration**: Added `pnpm-workspace.yaml` for managing `apps/*` packages with `allowBuilds` for `esbuild`, `sharp`, `workerd`, and `unrs-resolver`.
- **CI/CD Automatic Migrations**: Updated `.github/workflows/deploy.yml` to automatically execute pending D1 migrations on release.

### Changed

- **Monorepo Restructuring**: Reorganized repository architecture into a symmetric `apps/` directory layout:
  - `apps/api/`: Cloudflare Workers Backend API.
  - `apps/web/`: Next.js 16 Web Dashboard Frontend.
  - `apps/mobile/`: Expo React Native Mobile App.
- **Package Manager Migration**: Fully migrated package management and scripts from `npm` to `pnpm`.
- **CI/CD Pipeline**: Refactored GitHub Actions workflow (`deploy.yml`) to use `pnpm/action-setup@v4`, `pnpm install`, and updated path filters for the `apps/` monorepo structure.

---

## [0.1.0] - 2026-05-24

### Added

- Initial release of Serverless Expense Tracker (V3) with Cloudflare Workers API (Hono + D1), Expo Mobile App, and Next.js Web Dashboard.
