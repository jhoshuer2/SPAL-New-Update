# SPAL Design System (build reference)

A single, self-contained reference for building SPAL UI consistently. Paste this into a new chat when you need work that matches the existing app. It reflects what is **actually implemented**, not aspirations. For deeper brand rationale see `DESIGN.md`; for mandatory responsive rules see `RESPONSIVE.md`.

---

## 1. What SPAL is (context for tone)

SPAL = **Spending • Profiting • Analysing • Looping**. A mobile-first, voice-first **business companion** for informal/small entrepreneurs in Africa (food sellers, market traders, salon/kiosk/bar owners, fashion vendors). It is **not** accounting or inventory software. It should feel like a friendly business coach: conversational, supportive, lightweight, encouraging, never corporate, spreadsheet-y, or shaming.

Audience reality: Android-first, WhatsApp-literate, not financially literate, impatient, inconsistent internet, mixes personal + business money. Optimise for clarity, speed, large tap targets, one primary action per screen.

---

## 2. Tech stack & hard rules

- **Next.js 16 (App Router)** + **TypeScript**
- **Tailwind CSS v4** — CSS-based `@theme` config in `app/globals.css`. **NO `tailwind.config.ts`.** Custom tokens are accessed as `bg-spal-green`, `text-spal-navy`, etc.
- **Framer Motion** for animation (`motion`, `AnimatePresence`)
- **Supabase** (Postgres + Auth), **Zustand** (`useSPALStore`, persisted to localStorage), **OpenAI** (GPT-4o-mini text, Whisper/TTS voice), **Recharts** for charts
- **PWA**: `public/sw.js` service worker + `manifest.json`
- **Icons: `hugeicons-react` ONLY.** The only non-hugeicons imagery allowed is the SPAL mascot `.webp` files. No emoji as UI icons.
- **All raster images are `.webp`** (convert PNGs with ffmpeg `-c:v libwebp -lossless 1`).
- Commit & push to `origin/master` after changes (deploys via Vercel). Run `npx tsc --noEmit` before committing.

---

## 3. Color system

### Theme tokens (`app/globals.css @theme`) — use these class names
| Token | Hex | Use |
|---|---|---|
| `spal-green` | `#22C55E` | sales, primary CTAs, success, "paid" |
| `spal-blue` | `#2563EB` | profit, AI, insights |
| `spal-orange` | `#F97316` | expenses, "owing/late" (sparingly) |
| `spal-purple` | `#8B5CF6` | coach / learn |
| `spal-navy` | `#0F172A` | primary text / headings |
| `spal-bg` | `#EEF3E9` | **app background (the soft green)** |

Each accent has tints: `-50/-100/-200` (backgrounds) and `-500/-600/-700` (text/strong). Greens e.g. `#F0FDF4`, `#DCFCE7`, `#16A34A`, `#15803D`. Oranges `#FFF7ED`, `#EA580C`, `#C2410C`. Blues `#EFF6FF`, `#1D4ED8`. Purples `#F5F3FF`, `#EDE9FE`, `#7C3AED`.

### Vivid display accents (used on dark/gradient cards & data viz — inline hex, not tokens)
- Purple `#8B3CFF` (profit hero card, SPAL AI orbs/brand)
- Blue `#2F63F5` (sale card)
- Orange `#ED712E` (expense card)
- Green `#22C55E`
These four are the **AmbientOrbs / SPAL-AI palette**.

### Semantic surfaces
- App background: `#EEF3E9`
- Cards: white `#fff`
- **Owed-to-you surface: `#D3E0C7`** (soft sage) with text `#2E3D22`, secondary `#4A5D38`, border `#BBCDA8`. Used on home, insights, and the records owing banner.
- Profit hero card bg `#8B3CFF`; Sale card `#2F63F5`; Expense card `#ED712E` (white text on all three).
- Low-stock/owing tint `#FFF7ED` + text `#C2410C`; out-of-stock `#FEF2F2` + `#B91C1C`; healthy `#F0FDF4` + `#15803D`.

---

## 4. Typography

- **Headings/display: Satoshi** → `style={{ fontFamily: "var(--font-satoshi)" }}` (or `font-[family-name:var(--font-satoshi)]`). Headings are **black/bold**, tight tracking `letter-spacing: -0.02em`, `leading-tight`.
- **Body: Inter Tight** → `var(--font-inter)`.
- **NOT Poppins.**
- Common sizes: page H1 `22–24px font-black`; section title `16px font-bold`; card label `11–13px`; body `13–15px`; metadata `11–12px text-neutral-400`.
- **Big numbers (currency) must be responsive:** use `fontSize: "clamp(16px, 5.5vw, 22px)"` (small cards) / `clamp(28px, 8vw, 38px)` (hero) plus `truncate` + `min-w-0` so large amounts never clip on 320px.

---

## 5. Iconography

- `hugeicons-react` only. Names are numbered variants — verify the exact export exists before using (e.g. `Clock05Icon` not `ClockIcon`, `Calendar03Icon`, `Tick01Icon`, `Cancel01Icon`, `ArrowLeft01Icon`, `ArrowRight01Icon`, `ArrowUp01Icon`, `ArrowDown01Icon`, `MinusSignIcon`, `PlusSignIcon`, `Mic01Icon`, `Target01Icon`, `PackageIcon`, `ReceiptIcon`, `Restaurant01Icon`, `Csv01Icon`, `File01Icon`, `Wallet01Icon`, `ChartIncreaseIcon`/`ChartDecreaseIcon`, `Idea01Icon`, `WifiOff01Icon`). hugeicons-react has **no `strokeWidth` prop**; size via `size={}` and `color={}`.
- Sale = `ChartIncreaseIcon` (green); Expense = `ChartDecreaseIcon` (orange); these stand in for the old 💰/🧾.
- **Mascot webps** (the only non-icon imagery): `/spal-ai.webp` (SPAL AI chat), `/spal-goals.webp` (Goals), `/spal-404.webp` (404), `/spal-internet-outage.webp` (offline), `/spal-wordmark.webp`. Render with `next/image` + `object-contain`.

---

## 6. Layout & shell

- Root shell `#app-root`: centered, `max-width: 480px`, `min-width: min(320px,100vw)`, `height: 100dvh`, `overflow-hidden`, `transform: translateZ(0)` (so `position:fixed` children are contained inside the mobile frame on desktop). Body is a dark full-viewport canvas behind it.
- `body` has `overflow-x: hidden`. Main scroll area uses `overflow-y-auto overflow-x-hidden ... pb-safe`.
- **Safe areas:** bottom controls use `calc(env(safe-area-inset-bottom, 0px) + Npx)`; `pb-safe` utility clears device insets. Headers start at `pt-12`.
- Responsive page padding token `--px-page` (20px, → 16px ≤374px). H1/H2 auto-clamp below 374px.
- Standard horizontal padding: `px-5`.

---

## 7. Core components & patterns

**Card** — `rounded-2xl` (or `rounded-[20px]`), `bg-white`, `boxShadow: "0 1px 4px rgba(0,0,0,0.05)"` (lists) up to `0 8px 24px rgba(0,0,0,0.12)` (popovers). Inner padding `px-4 py-4`.

**Primary button** — full width, `h-14 rounded-2xl`, `bg-#22C55E`, white bold `text-[15px]`, `active:scale-[0.98] transition-transform`, shadow `0 8px 24px rgba(34,197,94,0.4)`. Disabled `disabled:opacity-40/60`. Min tap target 48px on everything.

**Pill / segmented toggle** — `h-9/h-10 rounded-full`, active = filled accent + white text, inactive = white + `#6B7280` + `1.5px solid #E5E7EB`. Nav pills use `flex-1 + justify-center` to span full width (Home/Records/Insights row).

**Stat tile** (overview) — small card, `text-[11px] uppercase tracking` label + `text-[22px] font-black` value. Grid `grid-cols-2 gap-2.5 min-w-0`.

**Trend badge (`PctBadge`)** — rounded-full chip on colored cards. Rules:
  - up arrow (`ArrowUp01Icon`) = increase, down (`ArrowDown01Icon`) = decrease, value = % difference vs the **previous equivalent period**.
  - **Signed**: decreases show negative (e.g. `-76%`).
  - **Clamped to -100…100**.
  - **No comparison data → plain `0%`, no arrow, no dash** (muted). Arrows only appear when there's a prior period.
  - Colors: up `rgba(255,255,255,0.22)`/`#fff`, down `rgba(255,80,80,0.28)`/`#FFBBBB`, no-data `rgba(255,255,255,0.16)`/`rgba(255,255,255,0.75)`.

**Bottom sheet** — `fixed inset-x-0 bottom-0 z-[60]`, `max-w-[480px] rounded-t-[28px] bg-white pb-safe`, slide up `initial={{y:"100%"}} animate={{y:0}}`, drag handle pill on top, dimmed backdrop `rgba(10,14,26,0.5)`.

**Full-screen voice surfaces** (SPAL AI `/ask`, Goals capture) — `fixed inset-0 z-40`, light gradient background, **AmbientOrbs** (4 blurred brand-color blobs that breathe; bloom brighter when SPAL speaks), big `#121212` text **with no text-shadow**, mic/stop FAB at bottom. The Goals welcome/list use the same gradient family.

**Empty / loading / error states** — every screen defines all three. Empty = tinted icon circle + bold line + muted hint + a CTA. Loading = skeletons (`animate-pulse`, neutral) or a small spinner. Errors are friendly plain language.

---

## 8. Motion

- Framer Motion, **`easeOut` / custom cubic** `[0.4,0,0.2,1]` or `[0.22,1,0.36,1]`. **Never bounce/spring.**
- Entrances: `initial={{opacity:0, y:8-12}} animate={{opacity:1, y:0}}`, staggered by `delay: i*0.04–0.07`.
- Taps: `active:scale-95`/`active:scale-[0.98]`. Use `AnimatePresence` for mount/unmount; animate `height:"auto"` for expanding inline sections.

---

## 9. Navigation conventions

- Bottom nav was removed; primary entry is the **Quick Menu FAB** (green pill, bottom-right): Record Sale, Record Expense, Chat with SPAL, Set your goals, Manage inventory. Home/Records/Insights also have a top pill row.
- **Gotcha — gradient/voice full-screen routes** (`/ask`, `/set-goals/*`, and the add-sale/add-expense method screens `voice|picture|import`) must be entered/left via **hard navigation** `window.location.href = "..."`, not `router.push`. Soft client-side navigation into them triggers a Next.js chunk-load failure ("This page couldn't load"). The Quick Menu and method menus already do this.
- Back buttons: white circle `w-10 h-10 rounded-full bg-white` + `ArrowLeft01Icon`, `router.back()`.

---

## 10. Data & formatting conventions

- Currency via `formatCurrency()` (`lib/utils/currency`), default `NGN` (₦). Always pair big amounts with `clamp()` font + `truncate` + `min-w-0`.
- **Profit is cash-basis: `profit = sales − expenses − owed`.** Money a customer still owes is **not** profit until paid. The daily-insight API returns `owed` and a cash-basis `profit`.
- **Owing model:** each line item is its own `records` row with `payment_status` (`paid`/`owing`) + `customer_name`. Manual entry sets payment **per item**. A partial payment **splits into two records** (a paid record for the part received today + an owing record for the rest). "Mark paid" sets `payment_status:"paid"` and moves `record_date` to today (revenue recognised on the payment day).
- Trend comparisons always compare current period vs the previous equivalent period (today↔yesterday, last 7d↔prior 7d, this month↔last month).
- Schema changes need a Supabase migration (in `supabase/migrations/NNN_*.sql`) the user runs manually — code should degrade gracefully / retry-without-the-new-column until applied.

---

## 11. Writing style

- 3-second rule; plain WhatsApp-level language. Celebrate wins, never shame.
- Good: "You spent more money than you made today." Bad: "Your expenditure exceeded your revenue."
- **Banned words:** expenditure, revenue, liabilities, assets, ledger, reconcile.
- Buttons are short action phrases ("Record Sale", "Mark paid", "Head Back Home"). Empty states are encouraging, not blank.

---

## 12. Definition of done

✓ hugeicons only (no emoji icons), images are webp · ✓ Satoshi headings, no Poppins · ✓ works 320px→desktop with no horizontal scroll/clipping (test 320/360/375/390/414/430/tablet/desktop) · ✓ loading + empty + error states · ✓ 48px tap targets, safe-area insets · ✓ `easeOut` motion, no spring · ✓ `npx tsc --noEmit` clean · ✓ committed + pushed to master.
