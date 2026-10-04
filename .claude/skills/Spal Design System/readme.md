# Spal Design System

A design system for **SPAL** (*Spending, Profiting, Analysing, Looping*), a mobile-first, voice-first business companion for informal and small entrepreneurs across Africa: food sellers, market traders, salon, kiosk and bar owners, fashion vendors. It replaces spreadsheets and mental math with a friendly, conversational assistant. Record a sale or expense in seconds, see your real (cash-basis) profit, chat with an AI coach, and grow.

This system was built by studying SPAL's production codebase and its internal design roadmap, then tightening the visual craft (typographic hierarchy, spacing rhythm, layered depth, a geometric symbol language) without changing the product's structure or flows. Where the shipped app and the roadmap disagreed on a value, the shipped code is treated as ground truth. The roadmap's philosophy informed how existing tokens are organized and used.

## Sources
- **GitHub:** [github.com/MrItrends/spal](https://github.com/MrItrends/spal) (branch `master`). A Next.js 16 / Tailwind v4 / Framer Motion PWA. Explore it for the full product: API routes, Supabase schema, the AI advisor system, gamification, voice recording, and everything not reflected here. This system focuses on the visual language and a representative UI kit, not full functional parity.
- Two documents in that repo shaped this system directly. `DESIGN.md` is the product's aspirational "Design Operating System", a v2 vision for a more premium SPAL. `SPAL_DESIGN_SYSTEM.md` is a build reference for what is actually implemented today. Both are worth reading in full if you continue this work.
- With write access to the repo, treat this design system as a companion reference. Pull real component code from `components/ui/`, `components/shared/`, `components/records/` and similar for anything beyond the primitives rebuilt here.

## Fonts (flagged substitution)
Production SPAL loads **Satoshi** (display and brand voice) via a licensed Fontshare CDN link, and **Inter Tight** (body) via `next/font` and Google Fonts. Neither is redistributable as a committed static file under its license, so `tokens/fonts.css` loads both by URL rather than bundling binaries. This is the real typeface pairing, not a stand-in. No further action is needed unless you prefer self-hosted font files, in which case send them over and this file can point at local `@font-face` rules instead.

## Iconography (flagged substitution)
Production SPAL uses **`hugeicons-react`** exclusively (per `SPAL_DESIGN_SYSTEM.md`: "Icons: hugeicons-react ONLY, no emoji as UI icons"). It is a React-component icon library with no plain browser or CDN distribution, so it cannot be copied into a static design system. The repo's `package.json` already lists **`lucide-react`** as a secondary dependency, and Lucide ships a CDN-friendly build with a near-identical geometric, consistent-stroke, rounded-terminal style. Components in this system therefore use inline SVG glyphs styled to match that language rather than a copied hugeicons export. If you have the hugeicons license and assets, swap them in for full fidelity. No emoji are used as functional UI icons anywhere in this system, matching source.

## Content fundamentals
- **Voice:** a friendly, encouraging business coach, never a spreadsheet. Plain WhatsApp-level language, and the "3-second rule": a user should understand any line in 3 seconds.
- **You, not I:** copy speaks directly to the owner. "Your Sales Today", "Track your sales, understand your profit, and grow."
- **Celebrate, never shame:** prefer *"You spent more money than you made today"* over *"Your expenditure exceeded your revenue."*
- **Banned words:** expenditure, revenue, liabilities, assets, ledger, reconcile, and any other accounting jargon.
- **Buttons are short action phrases:** "Record Sale", "Mark paid", "Head Back Home". Verb first, no punctuation.
- **Empty states are encouraging, not apologetic:** *"No activity yet today"* plus a direct next step, never a guilt trip.
- **Emoji:** used sparingly and only in celebratory microcopy ("Welcome to {Business}! 🎉", "Nice one! 🎉"), never as functional icons or in persistent UI chrome.
- **Numbers carry weight:** currency defaults to ₦ (NGN) via `formatCurrency()`. Big figures always get the bold, tabular treatment. They are the emotional core of every screen.

## Visual foundations
- **Color philosophy: one confident accent.** Navy (`--spal-navy`) is the dominant tone for text and structure. Green (`--spal-green`) is the single primary accent for sales, primary CTAs, and success. Blue, purple and orange are supporting, purpose-bound colors (profit and AI, coach, expenses) that never carry equal visual weight to green on one screen. Orange is an expense-only action color, not a co-equal brand color.
- **Signature app background.** The canvas is a soft sage-green tint (`--spal-bg #EEF3E9`), not white or gray. This tint alone reads as SPAL.
- **Typography.** Satoshi (display, tight −0.02em tracking, bold) for headings and big numbers. Inter Tight for body copy. Never Poppins, which the source explicitly bans as "heavily associated with generic startup and AI-generated products". Financial figures get a distinct oversized, tabular, high-contrast treatment (see `guidelines/type-numbers.html`).
- **Spacing rhythm.** Tight inside components (4 to 12px gaps), generous between sections (24 to 32px), with consistent 20px page margins. The contrast between tight and generous is what reads as considered rather than padded.
- **Corner-radius hierarchy.** Seven explicit steps (10, 14, 16, 20, 24, 28, full), each a distinct size class rather than one blanket `border-radius`. Standard cards and inputs (16, the app's dominant `rounded-2xl`) read tighter than stat cards (20, `rounded-[20px]`), which read tighter than sheets (28, `rounded-t-[28px]`). These are the app's actual rendered radii. Note that the shipped `globals.css @theme` token definitions (`--radius sm/md/lg/xl` = 8/16/24/32) differ, because screens override them with inline `rounded-*` classes.
- **Depth is layered, not heavy.** Every shadow token is two co-authored layers: a tight near-black contact shadow plus a soft, larger, low-opacity ambient falloff, never a single heavy `box-shadow`. See `guidelines/elevation-shadows.html`.
- **Cards, used sparingly.** Per the product roadmap, prefer borderless sections with generous padding over stacked cards. When a card is used it gets a hairline border and one of the two-layer shadows, never a colored left border.
- **Backgrounds.** Mostly flat, tinted surfaces. Gradients are reserved for two contexts: the onboarding and AI voice canvases (soft multi-stop washes), and one vivid hero-card family (profit, sale, expense). There is no photography in the core product UI. When photography appears in marketing it shows real entrepreneurs in authentic African environments and natural light, never corporate stock photos, handshakes, or staged startup imagery.
- **Motion: flow, never bounce.** `easeOut` and custom cubic only (`cubic-bezier(0.4,0,0.2,1)` as the default, `(0.22,1,0.36,1)` for entrances). Real spring physics are banned. Entrances fade and rise 8 to 12px, staggered about 40ms apart. A single celebratory cubic (`(0.34,1.2,0.64,1)`) is allowed only for onboarding and badge-unlock moments.
- **Press states are tactile, not chromatic.** Buttons, pills and cards scale to 0.96 to 0.98 on press. Color never flashes or darkens on tap.
- **Hover states** apply on the desktop canvas only, since this is a mobile-first PWA: subtle background lightening on menu rows, opacity dips on links, never a color hue change.
- **Transparency and blur** appear in two places: the frosted bottom nav (`saturate(180%) blur(20px)` over 88% white) and glass cards over colored or photo backgrounds (`blur(20px)` over roughly 14% white). They are not used decoratively elsewhere.
- **Borders** are hairline (1 to 1.5px) and low-contrast (`neutral-200` or `rgba` tints). They define edges, they do not decorate.

## The signature: five things that make it recognizably SPAL
1. **Spacing system:** tight-in, generous-between rhythm, plus a 7-step radius hierarchy rather than uniform rounding.
2. **Color philosophy:** navy-dominant, one confident green accent, purpose-bound supporting hues that are never co-equal.
3. **Motion language:** flow. easeOut and custom cubic, fade-and-rise entrances, 0.96 to 0.98 tactile press, zero spring or bounce.
4. **Typography rhythm:** Satoshi display and Inter Tight body, tight tracking, oversized tabular treatment for money.
5. **Recurring motif, the geometric symbol system:** abstract marks (expanding rings, orbital motion, ascending layers, radiating structure) that stand in for icons and mascots wherever a business concept needs a visual anchor. This was defined in the product roadmap but not yet built in code. `components/brand/SpalSymbol.jsx` operationalizes it. Applied consistently across empty states, loading states, onboarding, and section dividers, it becomes a recognizable part of the identity.

## Components
Reconstructions of the real `components/ui/`, `components/shared/`, and `components/gamification/` inventory:
- **Core** (`components/core/`): `Button`, `Card`, `Badge`, `Input`, `PillChip`
- **Feedback** (`components/feedback/`): `InsightCard`, `UndoToast`, `Skeleton` and `SkeletonRow`
- **Navigation** (`components/navigation/`): `BottomNav`, `TopNavPills`, `QuickMenuFab`
- **Brand** (`components/brand/`): `SparkAvatar`, `SpalSymbol`
- **Gamification** (`components/gamification/`): `WeeklyChallengeCard`

**Intentional additions** (not 1:1 source files, added because the source describes the pattern without a shared component): `Skeleton` and `SkeletonRow` (DESIGN.md mandates "skeleton screens, not spinners"), `TopNavPills` (the identical nav-pill row was duplicated inline across Home, Records and Insights, so it is factored out here), and `SpalSymbol` (DESIGN.md's geometric symbol system spec, not yet built in the app).

**Not yet built.** The source defines more component families than this pass covered. Flagged here rather than silently omitted, per this system's own build rules: `AddRecordSheet`, `ExportSheet`, `SwipeableRow`, `CameraCapture` (records/), `VoiceRecorder` (voice/), `PaywallGate` (paywall/), `AchievementsSection`, `BadgeCelebration` (gamification/), `DateTimePicker`, `HomeCoachmarks`, `PWAInstallPrompt`, `RegisterSW` (shared/). The Add Sale/Expense bottom sheet is demonstrated as a working composition inside the mobile-app UI kit (`ui_kits/mobile-app/AddRecordSheet.jsx`), though not yet promoted to a standalone reusable component card.

## UI kit
`ui_kits/mobile-app/` is an interactive click-through of the SPAL mobile PWA: onboarding splash, then Home (profit hero, sale and expense split, owed banner, recent activity), then Records (a filterable, date-grouped ledger), then the Add Sale/Expense bottom sheet, with the Quick Menu FAB wired throughout. It is built directly from the real screen source (`app/(main)/home`, `app/(main)/records`, `app/(onboarding)/welcome`, `components/records/AddRecordSheet.tsx`), not from screenshots.

## Index
```
styles.css                 root stylesheet, @imports every token file below
tokens/
  fonts.css                webfont loading (Satoshi via Fontshare, Inter Tight via Google Fonts)
  colors.css               brand, tints, neutrals, semantic surfaces, category palette
  typography.css           type scale, weights, tracking
  spacing.css              spacing scale, radius hierarchy, shell width
  effects.css              shadows, motion easing and duration, gradients
guidelines/                18 foundation specimen cards (Colors, Type, Spacing, Motion, Elevation, Brand)
assets/
  logo/spal-wordmark.webp
  brand/spal-ai-orb.webp     the SPAL AI mascot orb, the one non-geometric brand asset
  illustrations/             onboarding preview cards, empty-state mascots, get-started decoration
  backgrounds/               splash and AI-voice-canvas backgrounds
  icons/                     real nav icons (SVG) and app icons (PNG) copied from source
components/
  core/          Button, Card, Badge, Input, PillChip
  feedback/      InsightCard, UndoToast, Skeleton
  navigation/    BottomNav, TopNavPills, QuickMenuFab
  brand/         SparkAvatar, SpalSymbol
  gamification/  WeeklyChallengeCard
ui_kits/mobile-app/   interactive click-through of the SPAL mobile PWA
thumbnail.html        homepage tile
SKILL.md              Claude-Code-compatible skill export
github.md             source-repo sync record
```

## Caveats and where to help next
- **Fonts and icons are flagged substitutions** (see above). Both are the real choices, loaded or drawn differently than production for licensing and portability reasons. Send real font files or hugeicons assets for exact parity.
- **Component coverage is partial.** 13 of roughly 23 source component files were rebuilt (see "Not yet built" above). The rest can be built out on request.
- **Screens not mirrored in the UI kit.** Insights, Goals, the AI chat (`/ask`), Inventory, and Profile are fully built, shipping screens in the production app (`app/(main)/insights`, `.../goals`, `.../set-goals`, `.../ask`, `.../inventory`, `.../profile`), as is the full onboarding flow. They simply are not mirrored inside this design system's UI kit yet. Pull them from source directly, or ask to have them recreated here.
- **The geometric symbol system is new code**, not a copy of anything shipped. It operationalizes DESIGN.md's spec. Review `components/brand/SpalSymbol.jsx` and the `guidelines/brand-symbols.html` card, and confirm the shapes feel right for the brand. This is the highest-leverage piece to get right for a memorable identity.
