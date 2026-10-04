# SPAL Desktop — separate app over shared logic

SPAL Mobile (this repo) and **SPAL Desktop are different products**. This repo
stays a phone-frame app at every width (see the shell rule below). SPAL Desktop
is a **separate app** that renders a real desktop layout (sidebar + wide grid)
but reads from the **same logic layer** so the two never drift: update the logic
once → both apps change.

## The shell rule for THIS repo (do not break)

- `#app-root` is always capped at `--shell-max-w` (480px) — the centered phone
  frame — at every viewport, including desktop browsers. Never lift it behind a
  breakpoint. `BottomNav` is always the primary nav (no `lg:hidden`). No sidebar,
  no wide grid, no `components/desktop/*` here. If a screen looks squeezed at
  phone width, fix it at phone width (`RESPONSIVE.md`).

## The shared core (single source of truth)

These are UI-agnostic and are what both apps consume. Change behaviour here and
it flows to mobile + desktop:

- **Backend / data:** the Supabase project + the `app/api/*` routes.
- **Domain logic:** `lib/*` — `lib/sales.ts`, `lib/business-mode.ts`,
  `lib/orders.ts`, `lib/utils/{currency,category,dates}.ts`, etc.
- **State:** the Zustand store (`store/`), and `lib/types.ts`.
- **Dashboard hooks:** `hooks/useRetailDashboard.ts` (done) and
  `hooks/usePerishableDashboard.ts` (to extract, same pattern) return the numbers,
  insights, recent sales and flags for a dashboard with **no JSX**. The mobile
  views (`RetailHome`/`PerishableHome`) already render from these; the desktop
  views render from the exact same hooks.
- **Data-shaped view helpers:** `InsightItem[]`, payment/tint helpers in
  `lib/sales.ts`, order status in `lib/orders.ts`.

What is NOT shared: the **views** (layout). Mobile = single column + bottom nav.
Desktop = sidebar + multi-column grid. A view only maps shared data into layout.

## How the two apps actually share (pick one, recommend A)

- **A — Monorepo / workspace (recommended for true auto-sync).** Move the shared
  core into a workspace package (e.g. `packages/core`: `lib`, `store`, `types`,
  the dashboard hooks, and the API layer or its client). Both `apps/mobile`
  (this app) and `apps/desktop` import `@spal/core`. One edit updates both with
  no copying. Requires converting this repo to a workspace — do it deliberately,
  keeping this app's build/paths working.
- **B — Same backend, shared package for logic.** Desktop is its own Next app
  hitting the **same Supabase project + API routes**, and imports the domain
  logic + hooks from a shared package (git submodule or published `@spal/core`).
  Data syncs via the shared backend; logic syncs via the shared package.

Avoid plain copy-paste of `lib/`/`hooks/` into the desktop repo — that diverges
and defeats the point. If you must start that way, treat this repo's core as the
source and re-sync, and plan to move to A/B.

## Desktop layout spec (for the desktop app)

- **Sidebar** (fixed left): the **darker brand primary** for low eye strain —
  Midnight Navy `#0F172A` or a deep green — white/tinted labels, active item SPAL
  Green `#22C55E`. Destinations mirror the mobile tabs, business-mode aware
  (`isPerishable` from `lib/business-mode`): retail = Home / Sell / Inventory /
  Wallet / Profile; perishable = Home / Orders / Menu / Ingredients / Profile;
  plus Records / Insights / Ask SPAL as secondary links.
- **Top bar:** greeting + business name left; search + notifications + tan
  `#D9C7B8` avatar right — same data the mobile `AppHeader` shows, laid out wide.
- **Content:** real dashboard grid — stat cards 4-up, wider chart, insights +
  recent sales side by side. Max width ~1200px, centered, generous gutters. Same
  tokens, `rounded-2xl` cards, colors and Framer Motion easing as mobile.

## Conventions (both apps)

Next 16 App Router · TS · Tailwind v4 (`@theme`, no config file) · Satoshi/Inter
Tight · hugeicons-react (verify names) · no emoji/em-dashes in UI · verify with a
full `next build` · commit + push as **MrItrends** with the Co-Authored-By line.
