# Perishable Dashboard — build handoff

SPAL runs **two dashboard experiences**, chosen by business type. This doc is for
building the **perishable** one in its own chat, without touching the built
**non-perishable** one.

## The split (single source of truth)

`lib/business-mode.ts`:
- **perishable** = `food_seller` (restaurant), `bar_owner` (bars/drinks). Menu-first.
- **non-perishable** = everyone else: `kiosk` (kiosk/supermarket), `fashion_vendor` (clothing), `salon`, `market_trader`, `other`. Inventory-first. **Already built.**

`app/(main)/home/page.tsx` routes: `isPerishable(type) ? <PerishableHome/> : <RetailHome/>`.

## Where to build

- `components/home/PerishableHome.tsx` — **scaffold placeholder**. Replace with the real restaurant/bar home from the designs.
- Only touch perishable-specific files. Do **not** edit `RetailHome.tsx`, the sell/stock/wallet/records/insights/ask screens, or shared APIs unless the perishable path genuinely needs a change (prefer adding new files/routes, e.g. a menu concept instead of inventory).

## What already exists (non-perishable / shared)

- **Home**: `RetailHome.tsx` — period tabs, stat cards, insight promo, Quick Access (POS/Add Item/Restock/Ask SPAL), InsightsCarousel, Recent Sales (tap → order detail; "View All Sales" when > 5), POS/SPAL-account promos.
- **Sell** (`/sell`): POS catalog (from inventory) → cart → payment (cash/bank/card/debt/link/manual, VAT from user tax rate) → receipt. Writes a sale record + deducts stock.
- **Stock** (`/inventory`): catalog, categories carousel (drag-reorder in a drawer, View More > 4), product detail drawer (auto-play image carousel, set cover, edit, quantity stepper). Add/Edit form at `/inventory/add` (images, SKU, GTIN, category, discount, variations).
- **Records** (`/records`): "All Sales" — period tabs, search, day-grouped rows, payment chips → `/records/[id]` Order Detail.
- **Insights** (`/insights`): back-header, period dropdown, white stat cards, chart, health, diagnosis cards (new tinted tones).
- **Wallet** (`/wallet`): claim SPAL account (coming-soon toast).
- **Profile** (`/profile`): grouped menu; Receipts & Tax page (`/profile/receipts`), Billing & Plan (`/billing`) + history, Billing History.
- **Ask SPAL** (`/ask`): text chat, mic voice-to-text, `+` menu (image/file OCR via GPT-4o vision, Graphs/Analytics modes render charts/metrics), Chat History (`/ask/history`), Folders (`/ask/folders`).
- **Bottom nav**: Home | Sell | Stock | Wallet | Profile. `components/ui/BottomNav.tsx` has a HIDDEN prefix list for full-screen flows.

## Conventions (match these)

- Next 16 App Router, TS, Tailwind v4 (`@theme` in `app/globals.css`, no tailwind.config).
- Fonts: Satoshi headings `var(--font-satoshi)` / Inter Tight body. App bg `#EEF3E9` (drawers `#EDF3E8`). Brand: green `#22C55E`, blue `#2563EB`, orange `#F97316`, purple `#8B5CF6`, navy `#0F172A`. Cards `rounded-2xl`, soft shadow `0 1px 6px rgba(0,0,0,0.05)`.
- Icons: `hugeicons-react` only (verify names in `node_modules/hugeicons-react/dist/hugeicons-react.d.ts`). Raster art as `.webp`.
- Framer Motion easeOut/custom-cubic, no spring. No emoji in UI, no em-dashes in copy.
- Use `window.location.href` to enter/leave full-screen gradient routes (avoids Next soft-nav chunk errors).
- Defensive API columns: strip unknown columns and retry so features degrade before a migration runs.
- **Verify with a full `next build`** (not just `tsc --noEmit`) — its type check is stricter.
- Commit + push to `origin/master` as **MrItrends** after every change; end commits with the Co-Authored-By line.

## Pending migrations to run in Supabase

019 conversations columns · 020 inventory selling_price/activity · 021 inventory product fields + storage bucket · 022 users.tax_rate · 023 chat_folders. Everything degrades gracefully until applied.
