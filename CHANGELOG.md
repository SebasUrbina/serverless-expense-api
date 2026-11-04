# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-11-03

### Added

- Web: typing the detail of a movement (or the name of a recurring rule) suggests earlier movements with that title; picking one fills its category, account and, if empty, the amount. The detail now comes before the category.
- API: `GET /api/transactions/suggestions?q=&type=` returns up to 5 distinct titles from the last 12 months that contain `q` (2+ characters), prefix matches first, with the latest category, account and amount and how many times each was used. Installment rows are skipped.
- Web: deleting a movement no longer asks for confirmation. It disappears from the lists and "Deshacer" is offered for 5 seconds; the deletion is sent after that or as soon as the app goes to the background.
- Web: new movements can be registered offline. They are kept on the device, listed in a "sin sincronizar" notice and sent when the connection returns, even after closing the app. Editing still requires a connection.
- Web: tapping a category in "En esto se va tu dinero" or "Dónde te desviaste" opens its detail: this month against your average, the last 12 months, the month's latest movements and a link to all of them.
- API: `GET /api/transactions/summary/monthly` and `GET /api/transactions/summary/category-trend` accept an optional `endMonth` (`YYYY-MM`) to end the window at that month instead of today, and an optional `day` (1–31) that adds each month's expenses from day 1 to that day (`expense_to_day` and `values_to_day`). Without them, the response is unchanged.

### Changed

- Web: redesigned the home dashboard with a single visual language. The monthly summary, budget, "En esto se va tu dinero", recent transactions, monthly highlights and shared expenses now share the same card layout, and colors are reserved for income and expenses.
- Web: in "En esto se va tu dinero", the "Otras N categorías" row expands in place to show each grouped category with its amount, share and change, instead of opening the transactions page. A single leftover category is shown as a regular row.
- Web: the budget moved into the monthly summary card: a bar with spent and reserved amounts, how much is left and the daily allowance (hidden once the budget is exceeded). Tap the bar to edit the budget in a dialog. Upcoming payments are a single expandable row below, hidden when there are none.
- Web: the transactions list groups movements in one card per day with that day's spending total, shows a single summary line when filtering, and uses a narrower column on desktop.
- Web: the month selector opens a calendar of months by year, with shortcuts for this month, last month and (in transactions) every month, so earlier years are one tap away instead of stepping back month by month.
- Web: transaction filters are always visible as a row of chips under the search: month, type (expenses or income, new), category with its color, tag, shared and group. Each chip opens its own menu and an active chip shows its value with a button to remove it. The "Filtros" button and the dropdowns were removed.
- Web: the add/edit transaction dialog was reorganized. The amount is larger and focused when the dialog opens; the date is picked with "Hoy", "Ayer" and the day before, or an in-dialog calendar for any other day; categories use a compact grid with their colors; accounts are chips and the last account used is preselected. The detail is optional and defaults to the category name. Tags and installments are shown directly below the account; shared expense is a collapsible row that shows the chosen group. Instead of a disabled button, saving with missing data says what's missing and moves to that field, in Spanish.
- Web: the recurring rule dialog matches the transaction dialog (large amount, colored categories, account chips with the last one preselected, optional name that defaults to the category). The schedule asks only what each frequency needs: the day of the month (1–28) for monthly rules, the weekday for weekly ones and a date for daily and yearly ones; the next charge is derived from it and a sentence confirms the schedule ("El día 5 de cada mes. El próximo es el viernes 5 de diciembre."). The end date is "Nunca" or a date from the calendar.
- Web: recurring rules show their category color and when the next charge is ("mañana", "en 3 días").
- Web: the home and analytics month selectors no longer offer "Todos los meses", which left the budget, month comparison and monthly summary without a month.
- Web: the analytics page now compares the month with your usual spending. It opens with how far the month is above or below your average of the previous months (while the month is in progress, against what those months had spent by the same day, so rent and bills paid early don't skew it), the last 12 months of spending with the average line, and income, net and daily spending. "Dónde te desviaste" lists the categories that moved the most against their own average. The category breakdown and the income vs. expenses chart remain; the month-by-month net chart and the category trend were removed. The duplicated yearly cash-flow chart, the "Eficiencia" and "Mayor categoría" cards and the next-month savings estimate were removed earlier.
- Web: recurring rules are shown as a list grouped into active and paused, with an accessible on/off switch, the schedule and next date on each row, and monthly totals that include weekly, daily and yearly rules. On mobile, "Nueva regla" moved to the header instead of a second floating button.

- Web: settings, navigation, login, install prompts and the transaction, recurring, settle and delete dialogs share the same visual language: one accent color for selections and switches instead of orange, blue, violet and teal, sentence-case labels instead of spaced uppercase, and neutral icons instead of colored tiles.
- Web: redesigned settings. On mobile, an index lists every section with a short status (for example "3 cuentas") and each section opens on its own screen with a way back; on desktop, sections sit in a side menu next to the content. The address reflects the open section, so the browser back button works.
- Web: accounts, categories, tags, groups and the iOS Shortcuts key share one layout in settings. Tap an account or category to edit it (delete lives inside the editor), categories are split into expense and income tabs, group actions are always visible instead of appearing only on hover, and generating a new key explains that the old one stops working.
- Web: the accent and income green now come from the logo's brand greens: a deeper green in light mode and a mint green with dark text in dark mode, replacing the generic emerald, whose white text failed contrast.
- Web: the legal information page is a single readable document instead of small text in colored cards, and the offline page uses the app's standard layout.
- Web: the save button of an expense is no longer red, so it can't be mistaken for delete.
- Web: the theme selector adds an "Auto" option that follows the device, as the settings description already promised.
- Web: dialogs can be closed with Escape, move focus inside when they open and return it when they close, and are announced to screen readers. Switches, checkboxes and the selected navigation item are announced too.
- Web: animations are skipped when the device asks to reduce motion.
- Web: the dashboard uses more color. The monthly summary card is painted in the brand green, each category has its own color that stays the same in the breakdown, the analytics charts and the icon of every transaction, the budget bar turns amber at 80 % and red when exceeded, and the selected sidebar item is highlighted in green.

### Fixed

- Web: colors that depend on the theme now follow the theme selected in the app instead of the operating system, fixing unreadable amounts in dark mode.
- Web: the month net (income minus expenses) is labeled "Neto del mes" instead of "Balance", which suggested the account balance.
- Web: analytics now shows months where expenses exceeded income as negative instead of $0, and the daily average for the current month divides by the days elapsed instead of 30.
- Web: tapping inside the delete confirmation no longer also closes the dialog behind it.
- Web: settings only shows the verified mark when the email is actually confirmed.
- Web: the close button of the transaction dialog no longer turns white (invisible) on hover in light mode.
- Web: the iOS Shortcuts guide no longer refers to the app as "Miga".
- Web: the split percentage of a shared expense was white and invisible in light mode.
- Web: checking and savings accounts show 🏦 and 🐷 instead of the generic 💰, which the account picker used for every account type except cash and credit.
- API/Web: the end date of a recurring rule can be removed; `PUT /api/recurring/:id` accepts `end_date: null`, which previously kept the old date.
- Web: a monthly rule no longer asks for the next charge and the day of the month separately, which could disagree, nor offers days 29–30 that the scheduler moves to the 28th.
- Web: switching a new transaction between expense and income clears a category of the other type, which could otherwise be saved hidden (for example, an income under a grocery category).
- Web: choosing an earlier month in analytics now shows the 12 months up to that month, instead of always the 12 months up to today.

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
