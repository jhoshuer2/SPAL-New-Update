# Spal — Mobile Build Specification

**Version:** 1.0 · 4 October 2026
**Product owner:** Joshua Jumbo
**Audience:** Claude Code (and any engineer working on Spal)
**Scope:** The complete Spal product, from MVP through V1 to Later, built **mobile first** (iOS and Android from one codebase). Desktop follows in Phase 4.
**Companion:** the *Spal Feature Map* artifact. Screen IDs (A01 to M05) in this document match it exactly.

## Contents

0. Instructions for Claude Code · 1. The product · 2. Scope and platforms · 3. Default technology stack · 4. Repository structure · 5. Design system · 6. Navigation and routes · 7. Data model · 8. Level engine · 9. Spal, the AI companion · 10. Screen specifications (all 129) · 11. Offline and sync · 12. Notifications · 13. Security and privacy · 14. Localisation and Nigeria-specific details · 15. Analytics and success measures · 16. Testing and definition of done · 17. Build phases · 18. Desktop · 19. Open decisions · Appendix A. Level catalogue

---

## 0. Instructions for Claude Code

Read this whole document before writing any code. Then follow these rules for the entire build.

### 0.1 First session: audit before you build

Spal already exists. The earlier version was a sales and expense tracker with AI chat, built on mobile and desktop. Before changing anything:

1. Save this file into the repo as `docs/SPAL_BUILD_SPEC.md`.
2. Audit the existing codebase and write `docs/AUDIT.md` covering:
   - the stack actually in use (framework, language, backend, database, auth, AI provider, state management, styling);
   - every existing screen and feature, mapped to the screen IDs in §10 where one fits;
   - the existing data model, and how it maps to §7;
   - what is reusable as-is, what needs adapting, and what is replaced;
   - risks (missing tests, secrets in code, schema problems).
3. Create or update `CLAUDE.md` at the repo root with the rules in §0.3.
4. Propose the Phase 0 plan based on the audit, then stop and wait for Joshua's approval.

**Stack rule:** if the existing stack is reasonable, keep it, and translate §3 to its equivalents. The default stack in §3 applies only to parts that do not exist yet, or where the existing choice blocks something this spec requires. Any stack change gets proposed in `docs/DECISIONS.md` and approved before it happens.

**Data rule:** existing users' sales, expenses and chats must survive. Write migrations that carry them into the new model. Never drop a table or column holding user data without a tested migration and Joshua's sign-off.

### 0.2 How to work

- **Phase by phase** (§17). Each phase ends at a gate: acceptance criteria pass, tests are green, `docs/PROGRESS.md` is updated, and you stop for Joshua's review.
- **Vertical slices.** Within a phase, build one screen group at a time all the way through: migration → access rules → API/queries → UI → tests.
- **Screen IDs are the shared language.** Put the ID in a comment at the top of every screen file (`// B08 Level reveal`) and in the root `testID` (`screen-B08`). Use IDs in commit messages and PR titles.
- **When the spec is silent:** choose the simplest option consistent with the principles in §1, log it in `docs/DECISIONS.md` (date, decision, reason), and keep going. Ask Joshua only when the choice is hard to reverse: breaking data-model changes, paid third-party services, auth provider, anything touching money movement.
- **Content marked "verify"** (CAC, TIN, fees, legal steps, helplines) must ship as editable content records, not hard-coded text, and stays flagged until Joshua confirms it.

### 0.3 Rules to copy into CLAUDE.md

```md
# Spal — rules for every session
- Spec: docs/SPAL_BUILD_SPEC.md. Progress: docs/PROGRESS.md. Decisions: docs/DECISIONS.md.
- Mobile first. Every screen is designed for a 360–430pt wide phone before anything else.
- Screen IDs (A01–M05) go in file header comments, testIDs, commits and PRs.
- Business numbers (sales, expenses, profit, debts, documents, Spal memory) are private.
  They are never readable by community queries. Enforce this in database access rules, not only in the UI.
- Money is stored as integer kobo. Format as naira only at display time.
- The AI provider is only ever called from the server. No API keys in the app bundle.
- Spal never acts on the user's behalf (sends, posts, pays, books) without an explicit approval screen (H10).
- No destructive migrations without a down path and sign-off. Existing user data must survive.
- Every list has loading, empty and error states. Every write works offline where §11 says so.
- Never shame the user in copy. Streaks pause, they don't break.
- Stop at each phase gate and wait for review.
```

---

## 1. The product

### 1.1 What Spal is

Spal is a lifelong companion for entrepreneurs at every stage, from someone with an idea and some savings to someone running several companies. It places each person on one of six levels, shows them only what their level needs, learns their business over time, and celebrates every step forward. Around that sits a community where entrepreneurs share their journeys, find peers and mentors, and get inspired.

Think of it as first aid for entrepreneurs: before you call an expert, Spal is there, and as it learns your business you may not need the expert at all.

### 1.2 Why the rethink

The first version (sales records, expenses, AI chat) tested as useful but not lovable. People did not feel understood. The new Spal leads with being understood (the onboarding conversation and level reveal) and seeing your own journey. Tracking stays, but as one part of the journey rather than the whole product.

### 1.3 Who it's for

Nigerian entrepreneurs first: traders, food sellers, fashion and beauty businesses, service providers, tech founders, farmers, creatives. Many are phone-first, use cash, transfer and POS, extend credit to customers, and work on patchy networks.

### 1.4 Principles (use these to settle any open question)

1. **Understood first.** Every screen should feel like it knows who this person is and where they are.
2. **Show only what this level needs.** Less on screen, more relevant.
3. **Private by default.** Business numbers never leave the owner's control. Sharing is always a deliberate choice.
4. **Celebrate, never shame.** Progress is noticed and cheered. Missed days are never punished.
5. **Fast capture.** Recording a sale takes under five seconds and three taps from Home.
6. **Works on bad networks.** Core capture works offline and syncs later. Screens load light.
7. **Nigeria first.** Naira, phone-number sign-up, cash/transfer/POS/credit, CAC and TIN, Pidgin.
8. **The user approves everything Spal does.** Spal suggests and drafts. People decide.

### 1.5 The six levels (summary)

| Level | Name | In their words | Gateway milestone to next level |
|---|---|---|---|
| 0 | Dreamer | "I want to start, but I don't know where." | Make your first sale |
| 1 | Starter | "I'm selling, but it's still a hustle." | Register your business name |
| 2 | Builder | "It's real now. I need structure." | Hire your first person |
| 3 | Team | "I'm not alone in the business anymore." | Open a second location, channel or product line |
| 4 | Scaling | "It works. Now I want more of it." | Run as a company with a management team |
| 5 | Established | "I've built something. What's next?" | None; the journey continues in seasons |

Full level definitions are in Appendix A. Level logic is in §8.

---

## 2. Scope and platforms

- **Phase 0–3: mobile.** iOS and Android from one codebase. All 129 screens, in three releases: MVP (67 screens), V1 (43), Later (19).
- **Phase 4: desktop.** Desktop app and/or responsive web reusing the same backend and as much UI code as possible (§18).
- **Out of scope:** moving money (Spal records payments, it never makes them), lending, payroll processing, accounting-grade bookkeeping, tax filing.

---

## 3. Default technology stack

Use these only where the audit (§0.1) finds nothing in place. **Check current stable versions at install time and pin them.** Record final choices in `docs/DECISIONS.md`.

| Concern | Default | Notes |
|---|---|---|
| App framework | React Native with **Expo** (managed workflow, dev builds) | One codebase for iOS and Android. Web/desktop later from the same code where sensible. |
| Language | TypeScript, `strict: true` | No `any` in shared types. |
| Routing | **Expo Router** (file-based) | Route map in §6. |
| Backend | **Supabase**: Postgres, Auth, Storage, Edge Functions, Realtime | Row Level Security on every table. |
| Auth | Supabase Auth with **phone OTP** (+234) plus email, Google and Apple | SMS provider is an open decision (§19). |
| Server state | TanStack Query | Query keys namespaced by screen group. |
| Client state | Zustand | Only for UI state that is not server data. |
| Local storage / offline | expo-sqlite (outbox and cache), expo-secure-store (secrets) | See §11. |
| Forms | react-hook-form + zod | zod schemas shared between app and edge functions. |
| Styling | Design tokens in TypeScript + a small component library | No UI kit that fights the design system. |
| Animation | react-native-reanimated, Lottie for celebrations | Respect reduce-motion. |
| Charts | victory-native or react-native-svg based charts | Must render offline from cached data. |
| Notifications | expo-notifications + server-side scheduler | Catalogue in §12. |
| Biometrics / app lock | expo-local-authentication | |
| Media | expo-image-picker, expo-av (voice notes) | Compress images before upload. |
| i18n | i18next + react-i18next | English and Pidgin at launch (§14). |
| AI | Anthropic Claude API, called **only** from Supabase Edge Functions | §9. |
| Analytics | PostHog (or existing tool) | Events in §15. No business figures in analytics payloads. |
| Errors | Sentry (or existing tool) | Scrub PII. |
| Tests | Jest + React Native Testing Library; Maestro for end-to-end flows; pgTAP or SQL tests for access rules | §16. |
| CI | GitHub Actions: typecheck, lint, unit tests, access-rule tests on every PR | |

---

## 4. Repository structure (default)

```
spal/
├─ app/                      # Expo Router routes (see §6)
├─ src/
│  ├─ components/            # Design-system components (Button, Card, MoneyInput…)
│  ├─ features/              # One folder per screen group
│  │  ├─ auth/  onboarding/  home/  journey/  planning/  business/
│  │  ├─ team/  spal/  community/  mentorship/  learn/  me/
│  │  └─ each: api.ts, hooks.ts, components/, types.ts, __tests__/
│  ├─ engine/                # Pure logic: placement, milestones, level-up, modules
│  ├─ offline/               # SQLite outbox, sync worker
│  ├─ theme/                 # tokens.ts, typography.ts, ThemeProvider
│  ├─ i18n/                  # en.json, pcm.json (Nigerian Pidgin)
│  ├─ lib/                   # supabase client, money, dates, phone
│  └─ types/                 # generated DB types + shared zod schemas
├─ supabase/
│  ├─ migrations/
│  ├─ seed/                  # milestones, lessons, playbooks, circles, modules
│  ├─ functions/             # Edge functions (spal-chat, spal-checkins, …)
│  └─ tests/                 # access-rule tests
├─ e2e/                      # Maestro flows
└─ docs/                     # SPAL_BUILD_SPEC.md, AUDIT.md, PROGRESS.md, DECISIONS.md
```

The `src/engine/` folder holds pure, framework-free functions (placement scoring, milestone evaluation, module selection). They are unit-tested heavily and reused by edge functions.

---

## 5. Design system

**If Joshua provides Figma files or a design system, they override everything in this section.** Until then, build with these tokens so screens can be re-skinned in one place.

### 5.1 Colour tokens

The lime accent comes from Joshua's own flow sketch.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F3F4EF` | `#111310` | Screen background |
| `surface` | `#FFFFFF` | `#1A1D16` | Cards, sheets |
| `surfaceSunk` | `#E9EBE3` | `#23271D` | Inputs, segmented controls |
| `ink` | `#171A12` | `#ECEFE3` | Primary text |
| `muted` | `#5B6250` | `#A4AB96` | Secondary text |
| `line` | `#D8DCCD` | `#31362B` | Borders, dividers |
| `accent` | `#C5EA25` | `#C5EA25` | Primary buttons, level progress, celebration |
| `onAccent` | `#192000` | `#192000` | Text on accent |
| `accentInk` | `#425600` | `#CFEE4C` | Accent-coloured text on bg/surface |
| `success` | `#23804A` | `#62C985` | Money in, done |
| `warning` | `#A86A00` | `#E7B04B` | Due soon |
| `danger` | `#B83A2E` | `#F08A7E` | Money out (sparingly), errors |
| `info` | `#2F5FC4` | `#93B2F6` | Tips, links |

Rules: never put body text on `accent` except `onAccent`. Money in is `success`, money out is `ink` (not red) so normal spending never looks like a failure; `danger` is for overdue debts and errors only.

### 5.2 Typography

| Role | Face | Sizes (pt) |
|---|---|---|
| Display (level names, big numbers, celebration) | Bricolage Grotesque 700/800 | 32 / 28 / 24 |
| Headings | Bricolage Grotesque 700 | 20 / 17 |
| Body | Instrument Sans 400/500/600 | 16 (default), 14, 13 |
| Numbers in lists and tables | Instrument Sans with tabular figures | — |
| Labels, IDs | JetBrains Mono 500, uppercase, +0.06em tracking | 11 |

Support Dynamic Type / font scaling up to 200% without clipping. Load fonts with `expo-font`; fall back to system fonts if loading fails.

### 5.3 Spacing, radius, elevation

- Spacing scale (pt): 4, 8, 12, 16, 20, 24, 32, 40, 56. Screen side padding 16 (20 on phones ≥ 400pt wide).
- Radius: 8 (inputs, chips), 12 (cards), 16 (sheets, modals), 999 (pills, avatars).
- Elevation: cards are flat with a 1pt `line` border. Only sheets, the quick-add button and toasts get shadows.

### 5.4 Core components

Build these first (Phase 0) with all variants, states and tests, and a hidden `/dev/components` screen to preview them:

`Button` (primary, secondary, ghost, destructive; sizes; loading; disabled) · `IconButton` · `TextField` · `PhoneField` (+234 default, formats as `0803 123 4567`) · `MoneyInput` (naira keypad, shorthand "45k" → ₦45,000) · `OTPInput` · `Select` / `ChipGroup` (single and multi) · `SegmentedControl` · `Card` · `ListItem` · `EmptyState` (illustration, title, body, action, optional Spal line) · `ErrorState` · `Skeleton` · `Toast` · `BottomSheet` · `Modal` · `Avatar` · `LevelBadge` · `LevelProgressRing` · `MilestoneRow` · `StreakDot` · `MoneyText` (formats kobo, tabular figures, colour by direction) · `ChartLine`, `ChartBar` · `SpalBubble` (Spal's voice in UI, with avatar) · `ChatMessage` · `VoiceRecorder` · `PostCard` · `ShareCard` (renders to image) · `OfflineBanner` · `SyncStatus` · `TabBar` (five tabs, raised centre Spal tab) · `QuickAddFAB`.

### 5.5 Spal's presence

Spal has a consistent visual presence (a simple animated mark or avatar, not a human face) used in onboarding, nudges, check-ins and chat. It has three animation states: idle, listening/thinking, celebrating. Keep it light enough for low-end Android devices.

### 5.6 Accessibility

Touch targets ≥ 44×44pt. Text contrast WCAG AA in both themes. Every interactive element has an accessibility label. Charts have a text summary. Celebrations respect reduce-motion (fade instead of confetti). Never rely on colour alone (money in/out also uses + / − signs).

---

## 6. Navigation and routes

### 6.1 Structure

- **Mobile tabs (bottom):** Home · Journey · **Spal** (raised centre) · Business · Community.
- At **Level 0** the Business tab opens Planning (E01) instead of Business overview (F01). From Level 1 it opens F01, with Planning still reachable from it.
- **Me** (L01) opens from the avatar on Home.
- **Learn** (K) opens from Home modules, Journey (milestones and level detail) and search; it is not a tab.
- **Mentorship** (J) lives inside Community.
- **Team** (G) lives inside Business and appears from Level 3.
- **Quick add** (C03) floats on Home and Business.

### 6.2 Route guards

1. No session → `(auth)` stack.
2. Session but `profiles.onboarding_completed_at` is null → `(onboarding)` stack, resuming at the last unanswered step.
3. Otherwise → `(tabs)`.
4. App lock enabled → lock screen on cold start and after 5 minutes in background.

### 6.3 Level gating

Gating controls what is on the surface (tabs, modules, menu items). It never hard-blocks: any screen is reachable from search, Learn or a deep link, with a short "This is usually for Level X" note where relevant.

| Area | L0 | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|---|
| Planning studio (E) as Business tab root | ● | – | – | – | – | – |
| Planning studio reachable from Business | ● | ● | ● | – | – | – |
| Business tracking (F01–F07, F13, F16) | – | ● | ● | ● | ● | ● |
| Products, customers, reports (F08, F09, F11, F12, F14, F15) | – | ● | ● | ● | ● | ● |
| Stock, documents (F10, F19) | – | – | ● | ● | ● | ● |
| Compliance (F18) | – | ● | ● | ● | ● | ● |
| Team & operations (G) | – | – | – | ● | ● | ● |
| Become a mentor (J07, J08) | – | – | – | – | ● | ● |
| Multiple businesses (F17) | – | – | – | – | – | ● |
| Journey, Spal, Community, Learn, Me | ● | ● | ● | ● | ● | ● |

### 6.4 Route map

Routes for every screen are listed with each screen in §10. Modals use Expo Router's modal presentation. Deep links use the scheme `spal://` and universal links on the production domain, mirroring the route paths.


---

## 7. Data model

Postgres (Supabase). Conventions:

- Primary keys `uuid` (default `gen_random_uuid()`), `created_at` / `updated_at timestamptz` on every table, `updated_at` maintained by trigger.
- **Money is `bigint` kobo** (₦1 = 100 kobo). Never floats.
- Records the user can create offline carry `client_id uuid unique` for idempotent sync (§11).
- User-facing records are soft-deleted (`deleted_at`) and purged after 30 days.
- Enums as Postgres enums or `text` with check constraints; pick one style and keep it.
- Generate TypeScript types from the schema into `src/types/db.ts`.

Tables are grouped by the screen sections that use them. The phase column says when the table must exist.

### 7.1 People and businesses

| Table | Key columns | Phase |
|---|---|---|
| `profiles` | `id` (= auth user id), `full_name`, `display_name`, `phone`, `email`, `state`, `city`, `age_range`, `language` (`en`/`pcm`), `avatar_url`, `bio`, `current_level smallint 0–5`, `hard_season bool`, `onboarding_step text`, `onboarding_completed_at`, `checkin_frequency` (`daily`/`few_weekly`/`weekly`), `checkin_time time`, `profile_visibility` (`public`/`connections`/`hidden`), `anonymous_default bool`, `memory_paused bool`, `active_business_id` | 0 |
| `businesses` | `owner_id`, `name`, `type` (enum: trading, food, fashion_beauty, services, tech, agriculture, creative, manufacturing, other), `work_mode` (solo/partner/team), `sell_channel` (online/physical/both), `logo_url`, `address`, `cac_number`, `tin`, `bank_display`, `socials jsonb`, `archived_at` | 0 |
| `business_members` | `business_id`, `user_id`, `role` (owner/manager/staff), `permissions jsonb` (e.g. `{add_sales:true, view_reports:false}`), `status` (invited/active/removed), `invited_phone`, `joined_at` | 2 |

A user always has at least one business row from onboarding, even at Level 0 (named "My idea" until they name it). This keeps every record scoped to a business and makes F17 (multiple businesses) a small change later.

### 7.2 Onboarding, levels, journey

| Table | Key columns | Phase |
|---|---|---|
| `onboarding_responses` | `user_id`, `answers jsonb` (all B02–B06 answers), `computed_level`, `confidence` (0–1), `signals jsonb`, `chosen_level`, `begin_choice`, `completed_at` | 1 |
| `level_history` | `user_id`, `business_id`, `from_level`, `to_level`, `reason` (placement/adjusted/milestones/manual), `created_at` | 1 |
| `milestones` (seeded catalogue) | `key` unique, `level`, `position`, `title`, `description`, `completion_type` (manual/data/spal), `data_rule jsonb`, `playbook_id`, `is_gateway bool` | 1 |
| `user_milestones` | `user_id`, `business_id`, `milestone_id`, `status` (locked/in_progress/done), `completed_at`, `proof_url`, `proof_note`, `completed_by` (user/data/spal) | 1 |
| `goals` | `user_id`, `business_id`, `title`, `metric` (null or e.g. `monthly_sales`, `monthly_profit`, `repeat_customers`), `target_value`, `deadline`, `status` (active/done/dropped), `steps jsonb` | 1 |
| `moments` | `user_id`, `business_id`, `kind` (auto/manual), `type` (day_one, win, struggle, lesson, decision, first_sale, registered, first_hire, level_up, milestone), `text`, `media_urls text[]`, `voice_url`, `occurred_on date`, `post_id` (if shared), `client_id` | 1 |
| `dashboard_layouts` | `user_id`, `business_id`, `modules jsonb` (ordered module keys + hidden flags), `customized bool` | 2 |

### 7.3 Planning studio (Level 0–1)

| Table | Key columns | Phase |
|---|---|---|
| `ideas` | `business_id`, `raw_text`, `voice_url`, `summary`, `alternatives jsonb` | 1 |
| `validations` | `idea_id`, `checklist jsonb`, `customer_conversations jsonb` (name, date, what they said), `summary` | 1 |
| `budgets` | `business_id`, `items jsonb` ({name, cost_kobo, have bool}), `available_kobo` | 1 |
| `launch_plans` | `business_id`, `weeks jsonb` (tasks with done flags and reminder times) | 1 |
| `business_plans` | `business_id`, `sections jsonb` (customer, problem, offer, price, channels, costs, first_90_days), `exported_at` | 2 |

### 7.4 Business tracking

| Table | Key columns | Phase |
|---|---|---|
| `products` | `business_id`, `name`, `photo_url`, `price_kobo`, `cost_kobo`, `track_stock bool`, `stock_qty`, `low_stock_at`, `archived_at` | 1 (basic), 2 (stock) |
| `customers` | `business_id`, `name`, `phone`, `notes` | 1 |
| `sales` | `business_id`, `client_id`, `created_by`, `total_kobo`, `payment_method` (cash/transfer/pos/credit), `customer_id`, `note`, `occurred_at`, `deleted_at` | 1 |
| `sale_items` | `sale_id`, `product_id` (nullable), `description`, `qty numeric`, `unit_price_kobo` | 1 |
| `expenses` | `business_id`, `client_id`, `created_by`, `amount_kobo`, `category` (stock, transport, rent, salaries, data_airtime, utilities, marketing, equipment, other), `note`, `receipt_url`, `is_personal bool`, `occurred_at`, `deleted_at` | 1 |
| `debts` | `business_id`, `client_id`, `direction` (owed_to_me/i_owe), `counterparty_name`, `customer_id`, `amount_kobo`, `paid_kobo`, `due_on`, `sale_id`, `status` (open/paid/written_off), `remind bool` | 1 |
| `debt_payments` | `debt_id`, `amount_kobo`, `paid_at` | 1 |
| `stock_movements` | `product_id`, `delta numeric`, `reason` (sale/restock/adjust), `ref_id`, `created_at` | 2 |
| `compliance_items` | `business_id`, `type` (cac/tin/permit/annual_return/other), `status` (not_started/in_progress/done), `due_on`, `reference`, `notes` | 2 |
| `documents` | `business_id`, `title`, `type`, `file_path` (private bucket), `expires_on` | 2 |

Derived figures (money in, money out, profit, top products, payment-method split) come from SQL views or RPC functions, e.g. `business_summary(business_id, from, to)`. Never let the client sum thousands of rows.

A credit sale (`payment_method = credit`) creates a linked `debts` row with `direction = owed_to_me` in the same transaction.

### 7.5 Team and operations (Level 3+)

| Table | Key columns | Phase |
|---|---|---|
| `salaries` | `business_id`, `member_id`, `amount_kobo`, `frequency` (weekly/monthly), `next_due_on` | 2 |
| `salary_payments` | `salary_id`, `amount_kobo`, `paid_on`, `note` | 2 |
| `tasks` | `business_id`, `title`, `assignee_id`, `status` (todo/doing/done), `due_on`, `source_meeting_id` | 2 |
| `job_openings` | `business_id`, `title`, `description`, `status` | 3 |
| `candidates` | `opening_id`, `name`, `phone`, `stage` (applied/interview/offer/hired/declined), `notes` | 3 |
| `meetings` | `business_id`, `title`, `scheduled_at`, `status`, `consents jsonb` (member_id → bool, timestamp) | 3 |
| `meeting_notes` | `meeting_id`, `audio_path`, `transcript`, `live_notes`, `summary jsonb` (decisions, actions, questions) | 3 |

### 7.6 Spal (AI)

| Table | Key columns | Phase |
|---|---|---|
| `spal_conversations` | `user_id`, `business_id`, `mode` (chat/brainstorm/challenge/voice), `title`, `last_message_at` | 1 |
| `spal_messages` | `conversation_id`, `role` (user/assistant), `content`, `data_refs jsonb` (what data the answer used), `actions jsonb` (inline actions offered), `created_at` | 1 |
| `spal_memory` | `user_id`, `business_id`, `fact`, `category` (person/business/goal/struggle/preference/history), `source` (onboarding/checkin/chat/records/moment), `source_ref`, `confidence`, `deleted_at` | 1 |
| `checkins` | `user_id`, `question`, `context` (why Spal asks), `scheduled_for`, `answer`, `answer_type`, `answered_at` | 1 |
| `insights` | `business_id`, `kind`, `title`, `body`, `suggested_action jsonb`, `status` (new/seen/acted/dismissed) | 2 |
| `agent_actions` | `user_id`, `type`, `payload jsonb`, `preview text`, `status` (proposed/approved/cancelled/done/failed), `result jsonb`, `approved_at` | 3 |
| `ai_usage` | `user_id`, `function`, `input_tokens`, `output_tokens`, `created_at` | 1 |

### 7.7 Community

| Table | Key columns | Phase |
|---|---|---|
| `posts` | `author_id`, `type` (update/win/struggle/question/milestone), `body`, `media_urls`, `attachment jsonb` (moment or milestone card; never raw numbers), `audience` (public/connections/circle), `circle_id`, `anonymous bool`, `author_level smallint` (snapshot), `topic`, `deleted_at` | 1 |
| `comments` | `post_id`, `author_id`, `parent_id`, `body`, `anonymous`, `is_helpful bool` | 1 |
| `reactions` | `post_id`, `user_id`, `kind` | 1 |
| `votes` | `comment_id`, `user_id` (Q&A upvotes) | 2 |
| `saves` | `user_id`, `item_type`, `item_id` | 1 |
| `circles` | `name`, `kind` (industry/level/location), `description`, `rules` | 2 |
| `circle_members` | `circle_id`, `user_id`, `role` | 2 |
| `connections` | `requester_id`, `addressee_id`, `status` (pending/accepted/declined) | 2 |
| `dm_threads`, `dm_participants`, `dm_messages` | standard 1:1 messaging; `is_request` until the recipient accepts | 2 |
| `events`, `event_rsvps` | `title`, `host_id`, `circle_id`, `starts_at`, `location` or `online_url`, `city` | 3 |
| `reports` | `reporter_id`, `target_type`, `target_id`, `reason`, `status` | 1 |
| `blocks` | `blocker_id`, `blocked_id` | 1 |

**Anonymous posts:** `author_id` is stored (for moderation) but the client reads posts only through a view (`posts_public`) that nulls `author_id` and author fields when `anonymous = true`.

### 7.8 Mentorship and Learn

| Table | Key columns | Phase |
|---|---|---|
| `mentors` | `user_id`, `headline`, `areas text[]`, `languages`, `location`, `availability jsonb`, `is_paid`, `rate_kobo`, `status` (applied/approved/paused) | 2 |
| `mentorship_requests` | `mentee_id`, `mentor_id`, `need`, `shared_brief jsonb` (only what the mentee approved), `status` | 2 |
| `mentorship_sessions` | `request_id`, `scheduled_at`, `meeting_link`, `agenda`, `notes`, `takeaways jsonb`, `rating` | 2 |
| `lessons` | `title`, `format` (text/video/audio), `body_md`, `media_url`, `levels int[]`, `topics text[]`, `language` | 2 |
| `playbooks` | `title`, `levels int[]`, `verified_at` (null = needs verification) | 2 |
| `playbook_steps` | `playbook_id`, `position`, `body_md`, `checklist jsonb`, `docs_needed`, `time_estimate`, `cost_estimate` | 2 |
| `templates` | `title`, `kind` (budget/invoice/offer_letter/job_post), `schema jsonb` | 2 |
| `user_progress` | `user_id`, `item_type`, `item_id`, `status` | 2 |

### 7.9 System

| Table | Key columns | Phase |
|---|---|---|
| `notifications` | `user_id`, `category` (spal/journey/community/reminders), `title`, `body`, `deep_link`, `read_at` | 1 |
| `notification_prefs` | `user_id`, `category`, `enabled`, `quiet_start`, `quiet_end` | 1 |
| `push_tokens` | `user_id`, `token`, `platform`, `last_seen_at` | 1 |
| `subscriptions` | `user_id`, `plan` (free/pro), `status`, `provider`, `current_period_end` | 3 |
| `content_flags` | `table_name`, `row_id`, `flag` ("verify"), `note` | 1 |
| `account_deletions` | `user_id`, `requested_at`, `purge_after` | 1 |

### 7.10 Access rules (Row Level Security)

Write access-rule tests for every rule below before building UI on top of it.

1. **Private business data** (`sales`, `sale_items`, `expenses`, `debts`, `debt_payments`, `products`, `customers`, `stock_movements`, `compliance_items`, `documents`, `budgets`, `ideas`, `validations`, `launch_plans`, `business_plans`, `insights`, `salaries`, `salary_payments`): readable and writable only by the business owner, and by active `business_members` whose `permissions` allow it. Salaries are owner-only.
2. **Spal data** (`spal_*`, `checkins`, `agent_actions`, `ai_usage`): owner of the row only. Edge functions use the service role, and must scope every query by the authenticated user id they receive.
3. **Journey** (`moments`, `goals`, `user_milestones`, `level_history`): owner only. Sharing a moment creates a separate `posts` row with a curated attachment; the moment itself stays private.
4. **Community** (`posts_public` view, comments, reactions): readable by any signed-in user according to `audience` (public / accepted connections / circle members), excluding authors the reader has blocked or who blocked the reader.
5. **Profiles**: other users see only the public profile fields via a `profiles_public` view, filtered by `profile_visibility`. Phone and email are never exposed.
6. **No join path** from any community view to any private table. Add a test that a second user cannot read a single row of another user's private tables through any view or RPC.

---

## 8. Level engine

All functions in this section live in `src/engine/` as pure TypeScript, are unit-tested, and are shared with edge functions.

### 8.1 Placement (B04 → B08)

Inputs from B04: `hasSold`, `isRegistered`, `paidStaffCount`, `locationsOrChannels`, `isIncorporatedWithMgmt`, `businessCount`, `revenueBand?`, `monthsRunning?`.

```ts
export function placeLevel(a: PlacementAnswers): Placement {
  let level: Level;
  if (!a.hasSold) level = 0;
  else if (!a.isRegistered) level = 1;
  else if (a.paidStaffCount === 0) level = 2;
  else if (a.locationsOrChannels <= 1 && !a.hasManagers) level = 3;
  else if (!(a.isIncorporatedWithMgmt || a.businessCount > 1)) level = 4;
  else level = 5;

  // Revenue and time running only adjust confidence, never the level.
  const confidence = scoreConfidence(a, level); // 0–1
  const signals = explainSignals(a, level);      // 3 short human-readable reasons for B08
  return { level, confidence, signals };
}
```

- If two answers conflict (e.g. "never sold" but revenue band > 0), B04 shows one follow-up question before placement.
- B08 shows the three `signals`. B09 lets the user pick any level. Store both `computed_level` and `chosen_level`, and write `level_history` with reason `placement` or `adjusted`.
- After placement, create `user_milestones` rows: all milestones for the chosen level `in_progress`, earlier levels `done` (with `completed_by = placement`), later levels `locked`.

### 8.2 Milestones

Seed the catalogue from Appendix A (4 milestones per level, the last is the gateway). Each milestone has a `completion_type`:

- **manual:** the user marks it done in D03 (optionally with proof).
- **data:** evaluated automatically from records. Initial rules:
  - `first_sale`: at least one sale exists.
  - `records_30_days`: sales or expenses on 30 distinct days within any 60-day window.
  - `records_3_months`: entries in each of the last 3 calendar months, at least 8 days each.
  - `profit_per_product`: every active product has `cost_kobo` set.
  - `monthly_profit_goal`: a `monthly_profit` goal reached in a closed month.
  - `salaries_on_time_3`: 3 consecutive salary cycles marked paid on or before due date.
  - `first_hire`: at least one active `business_members` row with role staff or manager, or one `salaries` row.
- **spal:** Spal notices from conversation or check-ins ("I registered the business last week") and asks the user to confirm. Nothing completes without that confirmation.

Run data rules after relevant writes (database trigger enqueues an evaluation) and nightly as a backstop. Completing a milestone creates a `moments` row (`type = milestone`) and a notification.

### 8.3 Level up

When the gateway milestone of the current level is done:

1. Spal suggests the level up (notification + card on Home).
2. The user confirms → `profiles.current_level` increments, `level_history` row written, next level's milestones become `in_progress`, a `level_up` moment is created, the dashboard layout is regenerated (unless customised, in which case new modules are added at the top with a "New for Level X" tag).
3. D04 celebration shows.

The user can also request a level change from D02 (reason `manual`). **Spal never moves anyone down automatically.**

### 8.4 Hard season mode

A softer mode for difficult periods. Spal offers it (never switches it on alone) when:
- the user says things are hard in a check-in or chat (detected by the check-in/chat functions), or
- money in drops 40% or more month on month for two consecutive months.

While on: fewer check-ins (weekly at most), no streak indicators, nudges focus on cash, costs and wellbeing, copy is gentler. The user can turn it off any time from Home or Me.

### 8.5 Dashboard modules

A module registry in `src/engine/modules.ts`:

```ts
type ModuleDef = {
  key: string;              // 'today_money', 'idea_card', 'salaries_due'…
  levels: Level[];          // where it appears by default
  priority: number;         // default order
  requires?: Phase;         // hide until the feature ships
  component: () => JSX.Element;
};
```

`selectModules(level, beginChoice, goals, recentActivity)` returns the ordered list. The `begin_choice` from B10 pins its matching module to the top for the first 14 days. Default modules per level are in Appendix A.

---

## 9. Spal, the AI companion

### 9.1 Architecture

- All AI calls go through **Supabase Edge Functions**. The app never holds an AI key.
- Model names come from environment variables: `SPAL_MODEL_MAIN` for conversation and drafting, `SPAL_MODEL_FAST` for classification, extraction and short tasks. At the time of writing, sensible defaults are `claude-sonnet-5-5` and `claude-haiku-4-5-20251001`; confirm current model names and pricing in Anthropic's documentation before setting them.
- Streaming responses for chat (H02).
- Every call logs token usage to `ai_usage`. Enforce a per-user daily budget (configurable) and show a friendly limit message if reached.

### 9.2 Edge functions

| Function | Used by | Phase | What it does |
|---|---|---|---|
| `spal-onboarding-reflect` | B07, B08 | 1 | Turns onboarding answers into 2–3 playback sentences and the level explanation. Falls back to templated text if the call fails or times out (3s). |
| `spal-chat` | H02, Spal panel | 1 | Main conversation. Builds context (§9.3), streams the reply, returns `data_refs` and inline `actions`. |
| `spal-memory-extract` | after chats and check-ins | 1 | Extracts durable facts into `spal_memory` (dedupes, updates, never stores sensitive personal data beyond the business). Skipped when `memory_paused`. |
| `spal-checkins` | C02, H06 (scheduled) | 1 | Daily job: picks one question per user based on level, recent activity, goals, gaps in records and the user's rhythm. Respects quiet hours and hard season mode. |
| `spal-nudge` | C01 | 1 | One short, contextual line for the Home dashboard. Cached for the day. |
| `spal-privacy-guard` | I03, I04 | 1 | Checks a draft post for naira amounts, phone numbers, account numbers and customer names; returns highlights so the UI can warn before posting. |
| `spal-draft` | E02, E03, E05, D11, G06 | 1–3 | Structured drafting: idea summaries, validation summaries, plan sections, goal steps, job posts. Returns JSON validated by zod. |
| `spal-insights` | H08, F14 | 2 | Nightly per business: spending spikes, best days, slow periods, unpaid debts, low stock. Writes `insights` rows with a suggested action. |
| `spal-brainstorm`, `spal-challenge` | H03, H04 | 2 | Structured modes with their own prompts and output schemas. |
| `spal-mentor-brief` | J05 | 2 | Builds a session brief from only the sections the user approves. |
| `spal-meeting` | G08, G09 | 3 | Transcription (provider is an open decision, §19) then summary into decisions, actions, questions. |
| `spal-agent` | H09, H10 | 3 | Proposes actions using tools; executes only after approval. |
| `spal-year-review` | D09 | 3 | Year recap copy for the share cards. |

### 9.3 Context builder

For each conversational call, assemble (and keep under a token budget):

1. Profile: display name, language, level and level name, business type, work mode, location (state), hard season flag.
2. Goals (active) and current level milestones with status.
3. Up to 20 `spal_memory` facts, most relevant first (recency + category match to the user's message).
4. **Aggregated** numbers only: money in/out/profit for last 7, 30, 90 days; top 3 products; open debts total; never raw rows unless the user asks about a specific record.
5. Last 3 moments and last 5 check-in answers.
6. The last N messages of the conversation.

When an answer uses the user's data, return `data_refs` (e.g. `{"type":"sales","range":"last_30_days"}`) so the UI can show "Based on your sales from the last 30 days".

### 9.4 Spal's voice (system prompt essentials)

Write the full system prompt in `supabase/functions/_shared/prompts/spal.ts`. It must cover:

- **Who Spal is:** a warm, sharp companion for Nigerian entrepreneurs. Encouraging but honest. Talks like a smart friend who knows business, not like a consultant or a textbook.
- **Level-aware behaviour** (Appendix A, "How Spal behaves"): Level 0 asks lots of questions and pushes toward a first real test; Level 1 builds habits; Level 2 systems and growth; Level 3 leadership and operations; Level 4 strategy; Level 5 advisor.
- **Language:** reply in the user's language setting (English or Nigerian Pidgin), and switch if the user writes in the other one.
- **Short by default:** 2–5 sentences on mobile unless the user asks for more. One question at a time.
- **Grounded:** use the provided data; never invent figures. If data is missing, say so and suggest recording it.
- **Honest limits:** Spal is not a lawyer, accountant or financial adviser. For legal, tax and registration questions, give general guidance and tell the user to confirm with the relevant agency or a professional. No investment recommendations.
- **Never shame.** Missed records, slow sales and mistakes are met with practical next steps.
- **Wellbeing:** if the user expresses distress or crisis, respond with care, suggest talking to someone they trust, and surface support resources (content record flagged "verify" for Nigerian helplines). Do not continue with business coaching in that turn.
- **Actions:** Spal may offer inline actions (save as goal, save as moment, create task, set reminder) as structured output; it never claims to have done something the app has not done.

### 9.5 Memory

- Facts come from onboarding, check-ins, chats, moments and record patterns.
- H07 lists every fact in plain language, grouped by category, each with edit and delete. "Pause learning" sets `memory_paused`; extraction stops and existing facts stay until deleted.
- Deleting a fact soft-deletes it immediately and excludes it from context.
- Do not store health, religion, politics or other sensitive personal details as memory facts even if mentioned.

### 9.6 Agent actions (Later)

Allowed tools, each producing an `agent_actions` row in `proposed` state with a human-readable `preview`:

`draft_invoice` (PDF to share), `draft_customer_message` (text to copy or share via the OS share sheet), `create_reminder`, `create_plan` (goal + steps), `create_tasks`, `fill_template`.

H10 shows the preview, lets the user edit, then approve or cancel. Only `approved` actions execute. Spal never sends messages, posts, pays or books anything itself.

### 9.7 Evaluating Spal

Keep `supabase/functions/_shared/evals/` with fixture conversations for each level (at least 5 per level, plus Pidgin cases, distress cases and legal/tax questions). Run them before changing prompts or models, and review outputs for tone, grounding and honesty.


---

## 10. Screen specifications

Every screen in Spal, grouped by section. For each: route, release phase, which levels see it on the surface, purpose, what is on it, states to design beyond the standard loading/empty/error (§16.2), and where it leads.

**Universal acceptance criteria for every screen:** matches the design system (§5); works in light and dark; works at 360pt width and with 200% text; has loading, empty and error states; all copy comes from i18n keys (English and Pidgin); has the screen ID as root `testID`; analytics view event fires (§15); every "Goes to" link works.

### A · Entry & access

Getting in. Phone-first, quick, and private from the start.

#### A01 · Splash

- **Route:** `app/index.tsx (launch + redirect)`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Brand moment while the app loads and checks whether the user is already signed in.
- **On this screen:**
  - Spal mark and wordmark animation
  - Tagline: every stage of your business
  - Silent session check
- **States to design:**
  - Signed in → C01
  - New or signed out → A02
  - No network → cached C01 if signed in
- **Goes to:** A02 Welcome slides · C01 Home dashboard

#### A02 · Welcome slides

- **Route:** `app/(auth)/welcome.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Show what Spal is in three quick slides before asking for anything.
- **On this screen:**
  - Slide 1: your whole journey in one place
  - Slide 2: Spal learns your business
  - Slide 3: you’re not building alone
  - Create account (primary)
  - I already have an account
- **Goes to:** A03 Sign up · A06 Log in

#### A03 · Sign up

- **Route:** `app/(auth)/sign-up.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Create an account with the least friction possible.
- **On this screen:**
  - Phone number with +234 default, or email
  - Continue with Google / Apple
  - Full name
  - Terms and privacy links
- **States to design:**
  - Number already registered → offer log in
  - Invalid number
- **Goes to:** A04 Verify code · A06 Log in

#### A04 · Verify code

- **Route:** `app/(auth)/verify.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Confirm the phone number or email.
- **On this screen:**
  - 6-digit code by SMS or WhatsApp
  - Resend with countdown
  - Change number
  - Auto-read code on Android
- **States to design:**
  - Wrong code
  - Expired code
  - Too many attempts
- **Goes to:** A05 Password & app lock

#### A05 · Password & app lock

- **Route:** `app/(auth)/secure.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Protect private business data from day one.
- **On this screen:**
  - Password with strength hint
  - Optional PIN or fingerprint/face unlock
  - One line on why: your numbers stay private
- **Goes to:** B01 Meet Spal

#### A06 · Log in

- **Route:** `app/(auth)/log-in.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Returning users get straight back to their dashboard at their current level.
- **On this screen:**
  - Phone/email + password
  - Google / Apple
  - Fingerprint/face quick login if enabled
  - Forgot password
- **States to design:**
  - Wrong details
  - Account locked
- **Goes to:** C01 Home dashboard · A07 Reset password

#### A07 · Reset password

- **Route:** `app/(auth)/reset-password.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Recover access.
- **On this screen:**
  - Enter phone or email
  - Verify code
  - Set new password
- **Goes to:** A06 Log in

#### A08 · Notification primer

- **Route:** `app/notifications-primer.tsx (modal)`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Explain the value before the system permission prompt.
- **On this screen:**
  - What you’ll get: check-ins, reminders, cheers
  - Allow notifications
  - Not now
- **Goes to:** C01 Home dashboard

### B · Onboarding & placement

The conversation that places someone on a level. Your sketch’s ‘Type of entrepreneur’, levels, ‘Where will you like to begin?’ and ‘recommended options’ all live here.

#### B01 · Meet Spal

- **Route:** `app/(onboarding)/meet-spal.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Introduce Spal as a companion and set a warm, conversational tone for onboarding.
- **On this screen:**
  - Spal avatar or presence animation
  - Greeting by first name
  - ‘A few questions so I can understand your business’
  - About 2 minutes
  - Skip for now (starts at Level 0 with a prompt to finish later)
- **Goes to:** B02 About you

#### B02 · About you

- **Route:** `app/(onboarding)/about-you.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Basic personal context.
- **On this screen:**
  - What should Spal call you?
  - State and city
  - Age range (optional)
  - Preferred language: English or Pidgin
- **Goes to:** B03 Type of entrepreneur

#### B03 · Type of entrepreneur

- **Route:** `app/(onboarding)/business-type.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** From your sketch. What kind of business and how it runs.
- **On this screen:**
  - Business type chips: trading/retail, food & drinks, fashion & beauty, services, tech & digital, agriculture, creative, manufacturing, other
  - How you work: solo, with a partner, with a team
  - Where you sell: online, physical, both
  - ‘I don’t have a business yet’ path
- **Goes to:** B04 Where are you now?

#### B04 · Where are you now?

- **Route:** `app/(onboarding)/where-now.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** The placement questions, one per card, in plain language. These decide the level.
- **On this screen:**
  - Have you sold anything yet?
  - Is your business registered with CAC?
  - Do you pay anyone to work with you? How many?
  - How many locations or sales channels?
  - Roughly how much comes in a month (bands, optional, private)
  - How long have you been running?
- **States to design:**
  - Conflicting answers → Spal asks one follow-up
- **Goes to:** B05 What’s on your mind

#### B05 · What’s on your mind

- **Route:** `app/(onboarding)/on-your-mind.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Capture the current struggle so Spal’s first advice is relevant.
- **On this screen:**
  - Biggest challenges (multi-select): don’t know where to start, not enough customers, money is unclear, pricing, staff, registration, funding, feeling overwhelmed
  - ‘Anything else?’ free text
  - Voice note option
- **Goes to:** B06 Your goals

#### B06 · Your goals

- **Route:** `app/(onboarding)/goals.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** What success looks like in the next 12 months.
- **On this screen:**
  - Goal suggestions tailored to B04 answers
  - Custom goal
  - ‘What does success look like to you?’
- **Goes to:** B07 Spal is getting to know you

#### B07 · Spal is getting to know you

- **Route:** `app/(onboarding)/reading.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** A short reflective pause that proves Spal listened.
- **On this screen:**
  - Thinking animation
  - Plays back 2–3 things it heard, e.g. ‘You sell food, you’ve been at it 8 months, and keeping track of money is the headache’
- **Goes to:** B08 Level reveal

#### B08 · Level reveal

- **Route:** `app/(onboarding)/level-reveal.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** The hook moment: being read correctly.
- **On this screen:**
  - ‘You’re at Level 2: Builder’
  - Why Spal thinks so: the 3 signals from your answers
  - The six-level ladder with you marked
  - Sounds right / Not quite
- **Goes to:** B10 Where would you like to begin? · B09 Adjust my level

#### B09 · Adjust my level

- **Route:** `app/(onboarding)/adjust-level.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Let users correct the placement.
- **On this screen:**
  - Six level cards with a description and ‘this is me if…’ examples
  - Select one
  - Spal acknowledges the change
- **Goes to:** B10 Where would you like to begin?

#### B10 · Where would you like to begin?

- **Route:** `app/(onboarding)/begin.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** From your sketch. Level-specific starting options (see the Levels section).
- **On this screen:**
  - 3–4 options for the user’s level
  - Each with a one-line outcome
  - Pick one; others stay available on the dashboard
- **Goes to:** B11 Your starter path

#### B11 · Your starter path

- **Route:** `app/(onboarding)/starter-path.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** From your sketch’s ‘recommended options specific to this level’. Turns the choice into concrete first steps.
- **On this screen:**
  - First 3 actions for the chosen focus
  - Preview of the first milestone
  - Add to my dashboard
- **Goes to:** B12 Your privacy

#### B12 · Your privacy

- **Route:** `app/(onboarding)/privacy.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Make the safe-space promise explicit before anything is shared.
- **On this screen:**
  - Business numbers: always private (locked, explained)
  - Community profile: public, connections only, or hidden
  - Post anonymously by default? (toggle)
  - Spal memory: on, reviewable anytime
- **Goes to:** B13 Check-in rhythm

#### B13 · Check-in rhythm

- **Route:** `app/(onboarding)/check-ins.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** How often Spal reaches out.
- **On this screen:**
  - Daily, a few times a week, or weekly
  - Preferred time
  - Channels: push, email (WhatsApp later)
- **Goes to:** B14 Day one

#### B14 · Day one

- **Route:** `app/(onboarding)/day-one.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Records where the user started, for every future ‘then vs now’.
- **On this screen:**
  - Creates the first Journey moment: ‘Day one on Spal’
  - Captures level and their own words from B05
  - Optional photo
  - Go to my dashboard
- **Goes to:** C01 Home dashboard

### C · Home

The dynamic dashboard. Different for every level and every person.

#### C01 · Home dashboard

- **Route:** `app/(tabs)/home/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** The main screen. Layout and modules change with level, goals and recent activity.
- **On this screen:**
  - Header: greeting, avatar → Me, notification bell
  - Level card: level name, % to next level, next milestone
  - Today’s focus: one thing to do today
  - Spal nudge: a contextual message, tap to chat
  - Level modules (see Levels section)
  - Quick add button
  - One community post from people at your level
- **States to design:**
  - Brand-new user: only the starter path
  - Quiet day
  - Hard season mode: softer tone, fewer asks
  - Offline: cached data with banner
- **Goes to:** C02 Daily check-in · C03 Quick add · C04 Notifications · C06 Customize dashboard · D01 Journey roadmap · D03 Milestone detail · H02 Conversation · I01 Feed
- **Platform note:** Desktop: module grid in the main pane with the Spal panel on the right.

#### C02 · Daily check-in

- **Route:** `app/(tabs)/home/check-in.tsx (modal)`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Spal asks one tailored question a day. This is how it learns.
- **On this screen:**
  - Question card, e.g. ‘How did sales go today?’ or ‘Did the supplier deliver?’
  - Answer by tap, text or voice
  - Answer is logged to records or the timeline
  - Gentle streak indicator
- **Goes to:** C01 Home dashboard · H02 Conversation

#### C03 · Quick add

- **Route:** `app/quick-add.tsx (bottom sheet)`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Capture anything in two taps.
- **On this screen:**
  - Sale
  - Expense
  - Moment or note
  - Milestone done
  - Goal
  - Ask Spal
  - Recent items for one-tap repeat
- **Goes to:** F03 Add sale · F06 Add expense · D06 Add moment · D03 Milestone detail · D11 Goal detail / new goal · H02 Conversation

#### C04 · Notifications

- **Route:** `app/notifications.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Everything Spal and the community want to tell you.
- **On this screen:**
  - Groups: Spal, Journey, Community, Reminders
  - Mark all read
  - Settings shortcut
- **Goes to:** H06 Spal check-in · D04 Level-up celebration · I02 Post detail · F13 Debts & credit · L05 Notification settings

#### C05 · Search

- **Route:** `app/search.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Find anything across the app.
- **On this screen:**
  - Records, posts, people, lessons, Spal chats
  - Recent searches
  - Type filters
- **Goes to:** F04 Sale detail · I02 Post detail · I09 Entrepreneur profile · K02 Lesson · H02 Conversation

#### C06 · Customize dashboard

- **Route:** `app/(tabs)/home/customize.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Let users shape their own home.
- **On this screen:**
  - Show, hide and reorder modules
  - Module library with ‘recommended for your level’ badges
  - Reset to Spal’s layout
- **Goes to:** C01 Home dashboard

### D · Journey

The lifelong record of how far someone has come: levels, milestones, moments, goals.

#### D01 · Journey roadmap

- **Route:** `app/(tabs)/journey/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** See the whole path and where you are on it.
- **On this screen:**
  - Six levels as a path with ‘you are here’
  - Completed levels collapsed, with dates reached
  - Current level milestones with progress
  - Preview of the next level
- **Goes to:** D02 Level detail · D03 Milestone detail · D05 Journey timeline
- **Platform note:** Desktop: horizontal path across the top, milestones below.

#### D02 · Level detail

- **Route:** `app/(tabs)/journey/level/[level].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** What a level means and how to finish it.
- **On this screen:**
  - What this level is about
  - How many Spal users are here
  - Milestone checklist
  - Common challenges at this level
  - Recommended playbooks
- **Goes to:** D03 Milestone detail · K03 Playbooks · I05 Circles

#### D03 · Milestone detail

- **Route:** `app/(tabs)/journey/milestone/[id].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Everything needed to complete one milestone.
- **On this screen:**
  - What and why
  - Steps or linked playbook
  - Ask Spal for help
  - Mark complete, with optional proof (photo, document, number)
  - Others who completed it recently
- **States to design:**
  - Locked (future level, viewable)
  - In progress
  - Done
- **Goes to:** K03 Playbooks · H02 Conversation · D04 Level-up celebration · I04 Share card

#### D04 · Level-up celebration

- **Route:** `app/level-up.tsx (full-screen modal)`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Make the step up feel earned.
- **On this screen:**
  - Full-screen celebration
  - New level name and badge
  - What changed on your dashboard
  - ‘Look how far you’ve come’ snippet
  - Share card (optional)
- **Goes to:** C01 Home dashboard · I04 Share card · D08 Then vs now

#### D05 · Journey timeline

- **Route:** `app/(tabs)/journey/timeline.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** The lifelong story of the business.
- **On this screen:**
  - Vertical timeline
  - Automatic moments: first sale, registration, first hire, level ups
  - Manual moments with photos
  - Filter by year and type
- **Goes to:** D06 Add moment · D07 Moment detail · D08 Then vs now · D09 Year in review

#### D06 · Add moment

- **Route:** `app/(tabs)/journey/moment/new.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Record a win, struggle, lesson or decision.
- **On this screen:**
  - Text, photo or voice note
  - Date
  - Tag: win, struggle, lesson, decision
  - Private by default
  - Also share to community (toggle)
- **Goes to:** D05 Journey timeline · I03 Create post

#### D07 · Moment detail

- **Route:** `app/(tabs)/journey/moment/[id].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Revisit a moment.
- **On this screen:**
  - Full entry
  - Spal reflection, e.g. ‘Back then you said…’
  - Edit
  - Share
- **Goes to:** D06 Add moment · I03 Create post

#### D08 · Then vs now

- **Route:** `app/(tabs)/journey/then-vs-now.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Remind users how far they’ve come.
- **On this screen:**
  - Day one words and numbers beside today’s
  - What you’ve learned (from moments)
  - What you’re still working on
  - Spal cheer
- **Goes to:** D05 Journey timeline · I04 Share card

#### D09 · Year in review

- **Route:** `app/(tabs)/journey/year/[year].tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** Annual recap.
- **On this screen:**
  - Growth, milestones, best month, biggest lesson
  - Shareable cards (numbers hidden by default)
- **Goes to:** I04 Share card

#### D10 · Goals

- **Route:** `app/(tabs)/journey/goals/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Active goals in one place.
- **On this screen:**
  - Goals with progress bars
  - Linked metric, e.g. monthly sales
  - Add goal
- **Goes to:** D11 Goal detail / new goal

#### D11 · Goal detail / new goal

- **Route:** `app/(tabs)/journey/goals/[id].tsx (id = "new" to create)`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Set and follow a goal.
- **On this screen:**
  - Target and deadline
  - Link to a metric or track manually
  - Spal breaks it into weekly steps
  - Progress history
- **Goes to:** D10 Goals · H02 Conversation

### E · Planning studio

For Level 0 and early Level 1: shaping the idea, budget and launch.

#### E01 · Planning home

- **Route:** `app/(tabs)/business/planning/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Levels 0–1
- **Purpose:** Hub for people who haven’t started or just started. Replaces Business in the tab bar at Level 0.
- **On this screen:**
  - Idea, validation, budget, plan, launch
  - Progress on each
- **Goes to:** E02 My idea · E03 Validate my idea · E04 Startup budget · E05 Business plan builder · E06 Launch plan

#### E02 · My idea

- **Route:** `app/(tabs)/business/planning/idea.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Levels 0–1
- **Purpose:** Turn a rough idea into a clear offer.
- **On this screen:**
  - Describe the idea in your own words (voice OK)
  - Spal asks clarifying questions
  - Idea summary card
  - Alternatives explored
- **Goes to:** E03 Validate my idea · H03 Brainstorm

#### E03 · Validate my idea

- **Route:** `app/(tabs)/business/planning/validate.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Levels 0–1
- **Purpose:** Test before spending.
- **On this screen:**
  - Checklist: talk to 5 potential customers (log each), check competitors, test a price, run a small pilot
  - Spal summary of what you learned
- **Goes to:** E04 Startup budget

#### E04 · Startup budget

- **Route:** `app/(tabs)/business/planning/budget.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Levels 0–1
- **Purpose:** Know what you need and what you have.
- **On this screen:**
  - Items to buy with costs
  - What you already have
  - The gap
  - Ways to close it: save, start smaller, partner
- **Goes to:** E06 Launch plan

#### E05 · Business plan builder

- **Route:** `app/(tabs)/business/planning/business-plan.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Levels 0–2
- **Purpose:** A one-page plan Spal drafts with you.
- **On this screen:**
  - Customer, problem, offer, price, channels, costs, first 90 days
  - Spal drafts each section from your answers
  - Export as PDF
- **Goes to:** E06 Launch plan · F15 Export report
- **Platform note:** Best on desktop.

#### E06 · Launch plan

- **Route:** `app/(tabs)/business/planning/launch.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Levels 0–1
- **Purpose:** Week by week to the first sale.
- **On this screen:**
  - Weekly tasks with reminders
  - Mark done
  - Ends at the milestone ‘First sale’
- **Goes to:** D03 Milestone detail · F03 Add sale

### F · Business tracking

Sales, expenses, customers, debts, stock, reports and compliance. Always private.

#### F01 · Business overview

- **Route:** `app/(tabs)/business/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** Money at a glance.
- **On this screen:**
  - Money in, money out, profit
  - Period: today, week, month, custom
  - Trend chart
  - Top products
  - Cash, transfer, POS split
  - One-line Spal comment
- **States to design:**
  - No data → guided first entry
- **Goes to:** F02 Sales · F05 Expenses · F13 Debts & credit · F14 Reports & insights
- **Platform note:** Desktop: wide chart with records list beside it.

#### F02 · Sales

- **Route:** `app/(tabs)/business/sales/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** All sales.
- **On this screen:**
  - Grouped by day with daily totals
  - Filters and search
- **Goes to:** F03 Add sale · F04 Sale detail

#### F03 · Add sale

- **Route:** `app/(tabs)/business/sales/new.tsx (also from C03)`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** Record a sale fast.
- **On this screen:**
  - Amount
  - Item from catalogue or free text, quantity
  - Customer (optional)
  - Payment: cash, transfer, POS, or ‘will pay later’
  - Date
  - Voice entry, e.g. ‘sold 3 cartons for 45k’
- **States to design:**
  - ‘Will pay later’ creates a debt in F13
- **Goes to:** F02 Sales · F13 Debts & credit

#### F04 · Sale detail

- **Route:** `app/(tabs)/business/sales/[id].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** View or change a sale.
- **On this screen:**
  - Details
  - Edit, delete
  - Share receipt (later)
- **Goes to:** F03 Add sale

#### F05 · Expenses

- **Route:** `app/(tabs)/business/expenses/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** All spending.
- **On this screen:**
  - List by category with totals
  - Filters
- **Goes to:** F06 Add expense · F07 Expense detail

#### F06 · Add expense

- **Route:** `app/(tabs)/business/expenses/new.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** Record spending.
- **On this screen:**
  - Amount
  - Category: stock, transport, rent, salaries, data & airtime, utilities, other
  - Note
  - Receipt photo
  - Business or personal flag
- **Goes to:** F05 Expenses

#### F07 · Expense detail

- **Route:** `app/(tabs)/business/expenses/[id].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** View or change an expense.
- **On this screen:**
  - Details and receipt
  - Edit, delete
- **Goes to:** F06 Add expense

#### F08 · Products & services

- **Route:** `app/(tabs)/business/products/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** What you sell.
- **On this screen:**
  - Catalogue with price, cost and margin
- **Goes to:** F09 Product detail / add product

#### F09 · Product detail / add product

- **Route:** `app/(tabs)/business/products/[id].tsx (id = "new")`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** One product.
- **On this screen:**
  - Name, photo
  - Price, cost, profit per item
  - Stock (if tracked)
  - Sales history
- **Goes to:** F10 Stock

#### F10 · Stock

- **Route:** `app/(tabs)/business/stock.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 2+
- **Purpose:** Inventory levels.
- **On this screen:**
  - Current stock
  - Low-stock alerts
  - Restock log
- **Goes to:** F09 Product detail / add product

#### F11 · Customers

- **Route:** `app/(tabs)/business/customers/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** Who buys from you.
- **On this screen:**
  - Customer list
  - Top customers
  - Repeat rate
- **Goes to:** F12 Customer detail

#### F12 · Customer detail

- **Route:** `app/(tabs)/business/customers/[id].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** One customer.
- **On this screen:**
  - Purchase history
  - Amount owed
  - Notes
  - Phone number (copy)
- **Goes to:** F13 Debts & credit

#### F13 · Debts & credit

- **Route:** `app/(tabs)/business/debts.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** Who owes you, and who you owe.
- **On this screen:**
  - Two tabs: owed to me, I owe
  - Due dates and reminders
  - Mark paid, part payments
- **Goes to:** F12 Customer detail · C04 Notifications

#### F14 · Reports & insights

- **Route:** `app/(tabs)/business/reports/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** Understand the numbers.
- **On this screen:**
  - Monthly profit and loss
  - Trends, best days and products
  - Expense breakdown
  - Spal explains in plain words
- **Goes to:** F15 Export report · H08 Insights
- **Platform note:** Desktop first.

#### F15 · Export report

- **Route:** `app/(tabs)/business/reports/export.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** Share figures with a bank, lender or partner.
- **On this screen:**
  - Pick period and sections
  - PDF or CSV
- **Goes to:** F14 Reports & insights

#### F16 · Business profile

- **Route:** `app/(tabs)/business/profile.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** Level 1+
- **Purpose:** The business identity.
- **On this screen:**
  - Name, logo, type
  - Address
  - CAC number, TIN
  - Bank details (display only)
  - Social handles
- **Goes to:** F18 Registration & compliance

#### F17 · Switch business

- **Route:** `app/switch-business.tsx (sheet)`
- **Release:** Phase 3 · Later · **Shown to:** Level 5
- **Purpose:** Run several businesses.
- **On this screen:**
  - Business switcher
  - Portfolio overview across businesses
- **Goes to:** C01 Home dashboard

#### F18 · Registration & compliance

- **Route:** `app/(tabs)/business/compliance.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** Stay legal without the stress.
- **On this screen:**
  - Status: CAC registration, TIN, permits, annual returns
  - Due dates and reminders
  - Linked playbooks
- **Goes to:** K03 Playbooks

#### F19 · Document vault

- **Route:** `app/(tabs)/business/documents.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 2+
- **Purpose:** Keep important papers safe.
- **On this screen:**
  - Certificates, contracts, receipts
  - Private storage
  - Expiry reminders
- **Goes to:** F18 Registration & compliance

### G · Team & operations

Appears from Level 3: staff, salaries, tasks and meetings.

#### G01 · Team

- **Route:** `app/(tabs)/business/team/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 3+
- **Purpose:** Everyone in the business.
- **On this screen:**
  - Members with roles and status
  - Invite
- **Goes to:** G02 Invite member · G03 Member profile

#### G02 · Invite member

- **Route:** `app/(tabs)/business/team/invite.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 3+
- **Purpose:** Bring staff in with the right access.
- **On this screen:**
  - Invite by phone number
  - Role: owner, manager, staff
  - Permissions: add sales, see reports, manage stock…
- **Goes to:** G01 Team

#### G03 · Member profile

- **Route:** `app/(tabs)/business/team/[memberId].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 3+
- **Purpose:** One team member.
- **On this screen:**
  - Role and start date
  - Pay details (owner only)
  - Tasks
  - Notes
- **Goes to:** G04 Salaries · G05 Tasks

#### G04 · Salaries

- **Route:** `app/(tabs)/business/team/salaries.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 3+
- **Purpose:** Never miss payday.
- **On this screen:**
  - Pay schedule and amounts
  - Mark paid, history
  - Reminders (tracking only, no payments)
- **Goes to:** C04 Notifications

#### G05 · Tasks

- **Route:** `app/(tabs)/business/team/tasks.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 3+
- **Purpose:** Who is doing what.
- **On this screen:**
  - Board: to do, doing, done
  - Assign and set due dates
  - Tasks created from meetings
- **Goes to:** G09 Meeting summary

#### G06 · Hiring

- **Route:** `app/(tabs)/business/team/hiring.tsx`
- **Release:** Phase 3 · Later · **Shown to:** Level 3+
- **Purpose:** Find the right people.
- **On this screen:**
  - Open roles
  - Candidates by stage
  - Spal drafts the job post
- **Goes to:** G02 Invite member

#### G07 · Meetings

- **Route:** `app/(tabs)/business/team/meetings/index.tsx`
- **Release:** Phase 3 · Later · **Shown to:** Level 3+
- **Purpose:** Team meetings.
- **On this screen:**
  - Upcoming and past
  - Start a meeting
- **Goes to:** G08 Meeting room · G09 Meeting summary

#### G08 · Meeting room

- **Route:** `app/(tabs)/business/team/meetings/[id]/live.tsx`
- **Release:** Phase 3 · Later · **Shown to:** Level 3+
- **Purpose:** Spal listens in and keeps notes.
- **On this screen:**
  - Consent from everyone, visible ‘Spal is listening’ indicator
  - Live notes
  - Ask Spal mid-meeting
  - End meeting
- **States to design:**
  - Consent not given → manual notes only
- **Goes to:** G09 Meeting summary

#### G09 · Meeting summary

- **Route:** `app/(tabs)/business/team/meetings/[id]/summary.tsx`
- **Release:** Phase 3 · Later · **Shown to:** Level 3+
- **Purpose:** Turn talk into action.
- **On this screen:**
  - Decisions
  - Action items → tasks
  - Open questions
  - Share with team
- **Goes to:** G05 Tasks

### H · Spal companion

The AI that learns the business, checks in, brainstorms and eventually acts.

#### H01 · Spal home

- **Route:** `app/(tabs)/spal/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** The companion’s front door.
- **On this screen:**
  - Recent chats
  - Suggested prompts based on level and recent data
  - Modes: Chat, Brainstorm, Challenge, Voice
- **Goes to:** H02 Conversation · H03 Brainstorm · H04 Challenge mode · H05 Voice

#### H02 · Conversation

- **Route:** `app/(tabs)/spal/[conversationId].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Talk to Spal about anything in the business.
- **On this screen:**
  - Chat
  - Answers grounded in your data, with a note on what was used
  - Inline actions: save as goal, save as moment, create task
- **States to design:**
  - Thinking
  - Offline: message queued
- **Goes to:** D11 Goal detail / new goal · D06 Add moment · G05 Tasks · H10 Review & approve
- **Platform note:** Desktop: lives in the right-hand panel on every screen.

#### H03 · Brainstorm

- **Route:** `app/(tabs)/spal/brainstorm.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Think out loud with Spal.
- **On this screen:**
  - Spal asks, you throw ideas
  - Ends with an idea board you can save
- **Goes to:** E02 My idea

#### H04 · Challenge mode

- **Route:** `app/(tabs)/spal/challenge.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Bring a problem, leave with a plan.
- **On this screen:**
  - Describe the problem
  - Spal asks clarifying questions
  - 2–3 options with trade-offs
  - Pick one → action plan
- **Goes to:** D11 Goal detail / new goal

#### H05 · Voice

- **Route:** `app/(tabs)/spal/voice.tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** Hands-free conversation.
- **On this screen:**
  - Push to talk
  - English and Pidgin
- **Goes to:** H02 Conversation

#### H06 · Spal check-in

- **Route:** `component SpalCheckInCard + app/(tabs)/spal/check-in/[id].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** When Spal starts the conversation.
- **On this screen:**
  - Question card
  - Why Spal is asking
  - Reply inline
- **Goes to:** H02 Conversation

#### H07 · What Spal knows

- **Route:** `app/(tabs)/spal/memory.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Full transparency on what Spal has learned.
- **On this screen:**
  - Plain-language list of facts about you and your business
  - Edit or delete any item
  - Pause learning
- **Goes to:** L03 Privacy centre

#### H08 · Insights

- **Route:** `app/(tabs)/spal/insights.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** Level 1+
- **Purpose:** Patterns Spal has spotted.
- **On this screen:**
  - Examples: spending spike, best sales days, slow months, unpaid debts
  - Each with a suggested action
- **Goes to:** F14 Reports & insights · H02 Conversation

#### H09 · Spal can do it

- **Route:** `app/(tabs)/spal/actions/index.tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** Spal as an agent.
- **On this screen:**
  - Draft an invoice
  - Draft a message to a customer
  - Set a reminder
  - Build a plan
  - Fill a form
- **Goes to:** H10 Review & approve

#### H10 · Review & approve

- **Route:** `app/(tabs)/spal/actions/[id].tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** Nothing happens without the user.
- **On this screen:**
  - Preview of the action
  - Edit
  - Approve or cancel
- **Goes to:** H09 Spal can do it

#### H11 · Cheer moment

- **Route:** `app/cheer.tsx (modal)`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Celebrate wins as they happen.
- **On this screen:**
  - First full week of records, best month, debt cleared
  - Tone matched to the user
- **Goes to:** I04 Share card

### I · Community

Feed, circles, Q&A, profiles and messages. A safe space to share the journey.

#### I01 · Feed

- **Route:** `app/(tabs)/community/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Stories from other entrepreneurs.
- **On this screen:**
  - Tabs: For you, My level, Following
  - Post types: update, win, struggle, question, milestone card
  - React, comment, save
- **Goes to:** I02 Post detail · I03 Create post · I09 Entrepreneur profile

#### I02 · Post detail

- **Route:** `app/(tabs)/community/post/[id].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** One post and its conversation.
- **On this screen:**
  - Post
  - Comments and replies
  - React
  - Report
- **Goes to:** I09 Entrepreneur profile · I15 Report & block

#### I03 · Create post

- **Route:** `app/(tabs)/community/post/new.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Share part of the journey safely.
- **On this screen:**
  - Type: update, win, struggle, question
  - Text and photos
  - Attach a milestone or moment
  - Audience: public, connections, a circle
  - Post anonymously
  - Spal warns if private numbers are about to be shared
- **Goes to:** I01 Feed

#### I04 · Share card

- **Route:** `app/share-card.tsx (modal)`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** A designed card for a milestone or level up.
- **On this screen:**
  - Auto-generated design
  - Choose what to show (numbers hidden by default)
  - Share in Spal or to WhatsApp, Instagram
- **Goes to:** I03 Create post

#### I05 · Circles

- **Route:** `app/(tabs)/community/circles/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Smaller groups by industry, level or location.
- **On this screen:**
  - Suggested circles, e.g. Abuja food sellers
  - Joined circles
  - Join
- **Goes to:** I06 Circle detail

#### I06 · Circle detail

- **Route:** `app/(tabs)/community/circles/[id].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** One circle.
- **On this screen:**
  - Circle feed
  - Members
  - Rules
  - Events
- **Goes to:** I02 Post detail · I14 Event detail

#### I07 · Ask the community

- **Route:** `app/(tabs)/community/questions/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Q&A forum.
- **On this screen:**
  - Questions by topic
  - Filter by level
  - Ask a question
- **Goes to:** I08 Question detail

#### I08 · Question detail

- **Route:** `app/(tabs)/community/questions/[id].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Answers to one question.
- **On this screen:**
  - Answers with upvotes
  - Mark helpful
  - Spal summary of the answers
- **Goes to:** I09 Entrepreneur profile

#### I09 · Entrepreneur profile

- **Route:** `app/(tabs)/community/people/[id].tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** A public view of someone’s journey.
- **On this screen:**
  - Level badge, business type, location
  - Shared milestones and posts
  - Connect, message (if allowed)
  - Mentor badge if they mentor
- **Goes to:** I10 Connections · I12 Chat · J03 Mentor profile

#### I10 · Connections

- **Route:** `app/(tabs)/community/connections.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Your network.
- **On this screen:**
  - Connections
  - Requests
  - Suggestions by industry, level, location
- **Goes to:** I09 Entrepreneur profile

#### I11 · Messages

- **Route:** `app/(tabs)/community/messages/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Direct messages.
- **On this screen:**
  - Conversation list
  - Requests from non-connections
- **Goes to:** I12 Chat

#### I12 · Chat

- **Route:** `app/(tabs)/community/messages/[threadId].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** One conversation.
- **On this screen:**
  - Messages
  - Share a post or profile
  - Report
- **Goes to:** I15 Report & block

#### I13 · Events

- **Route:** `app/(tabs)/community/events/index.tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** Meetups and live sessions.
- **On this screen:**
  - Upcoming events
  - Filter by city or online
- **Goes to:** I14 Event detail

#### I14 · Event detail

- **Route:** `app/(tabs)/community/events/[id].tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** One event.
- **On this screen:**
  - Details, host, location
  - RSVP
  - Add to calendar
- **Goes to:** I13 Events

#### I15 · Report & block

- **Route:** `app/report.tsx (modal)`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Keep the space safe.
- **On this screen:**
  - Reasons
  - Block user
  - Safety tips
- **Goes to:** I01 Feed

### J · Mentorship

Finding mentors, sessions prepared by Spal, and becoming a mentor at higher levels.

#### J01 · Mentorship home

- **Route:** `app/(tabs)/community/mentors/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Mentors in one place.
- **On this screen:**
  - My mentors
  - Upcoming sessions
  - Recommended mentors for your level
  - Find a mentor
- **Goes to:** J02 Find a mentor · J05 Session prep

#### J02 · Find a mentor

- **Route:** `app/(tabs)/community/mentors/find.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Browse mentors.
- **On this screen:**
  - Filters: industry, level reached, location, language, free or paid
- **Goes to:** J03 Mentor profile

#### J03 · Mentor profile

- **Route:** `app/(tabs)/community/mentors/[id].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Who this mentor is.
- **On this screen:**
  - Background and journey
  - Areas of help
  - Availability
  - Reviews
- **Goes to:** J04 Request a session

#### J04 · Request a session

- **Route:** `app/(tabs)/community/mentors/[id]/request.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Ask for help.
- **On this screen:**
  - What you need help with
  - Spal suggests what to share
  - Pick a time
- **Goes to:** J05 Session prep

#### J05 · Session prep

- **Route:** `app/(tabs)/community/mentors/sessions/[id].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Arrive prepared.
- **On this screen:**
  - Brief Spal prepares from your data, only what you approve
  - Agenda
  - Meeting link (copy)
- **Goes to:** J06 Session notes

#### J06 · Session notes

- **Route:** `app/(tabs)/community/mentors/sessions/[id]/notes.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Keep what you learned.
- **On this screen:**
  - Notes and takeaways
  - Turn takeaways into goals or tasks
  - Rate the session
- **Goes to:** D11 Goal detail / new goal

#### J07 · Become a mentor

- **Route:** `app/(tabs)/community/mentors/apply.tsx`
- **Release:** Phase 3 · Later · **Shown to:** Level 4+
- **Purpose:** Give back.
- **On this screen:**
  - Application
  - Areas and availability
- **Goes to:** J08 Mentor dashboard

#### J08 · Mentor dashboard

- **Route:** `app/(tabs)/community/mentors/dashboard.tsx`
- **Release:** Phase 3 · Later · **Shown to:** Level 4+
- **Purpose:** For mentors.
- **On this screen:**
  - Requests
  - Mentees
  - Sessions
  - Impact
- **Goes to:** J05 Session prep

### K · Learn

Lessons, step-by-step playbooks and templates, recommended by level.

#### K01 · Learn home

- **Route:** `app/learn/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Learning picked for your level and challenges.
- **On this screen:**
  - Recommended for you
  - Continue learning
  - Topics
- **Goes to:** K02 Lesson · K03 Playbooks · K05 Templates

#### K02 · Lesson

- **Route:** `app/learn/lesson/[id].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Short lessons.
- **On this screen:**
  - Text, video or audio
  - Key points
  - Ask Spal about this
  - Mark done
- **Goes to:** H02 Conversation

#### K03 · Playbooks

- **Route:** `app/learn/playbooks/index.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Step-by-step guides for real tasks.
- **On this screen:**
  - Register a business name with CAC
  - Open a business bank account
  - Get a TIN
  - Price your products
  - Hire your first staff
- **Goes to:** K04 Playbook step

#### K04 · Playbook step

- **Route:** `app/learn/playbooks/[id]/[step].tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** One step of a playbook.
- **On this screen:**
  - Instructions and checklist
  - Documents needed
  - Time and cost estimates (verify before launch)
  - Mark done (feeds milestones)
- **Goes to:** D03 Milestone detail

#### K05 · Templates

- **Route:** `app/learn/templates.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Ready-made business documents.
- **On this screen:**
  - Budget, invoice, offer letter, job post
  - Fill with Spal
- **Goes to:** E04 Startup budget

#### K06 · Saved

- **Route:** `app/learn/saved.tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** Everything bookmarked.
- **On this screen:**
  - Saved lessons, posts, templates
- **Goes to:** K02 Lesson

### L · Me & settings

Profile, privacy centre, security and account.

#### L01 · Me

- **Route:** `app/me/index.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Profile and settings hub.
- **On this screen:**
  - Photo, name, level
  - Business profile link
  - Settings list
- **Goes to:** L02 Edit profile · L03 Privacy centre · L04 Security · L05 Notification settings · L07 Help & feedback · F16 Business profile

#### L02 · Edit profile

- **Route:** `app/me/edit.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Personal details.
- **On this screen:**
  - Photo, name, bio
  - Business type, location
  - Preview of public profile
- **Goes to:** I09 Entrepreneur profile

#### L03 · Privacy centre

- **Route:** `app/me/privacy.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Every privacy control in one place.
- **On this screen:**
  - What is always private
  - Profile visibility
  - Anonymous posting default
  - What Spal remembers
  - Mentor data sharing
  - Export data
  - Delete account
- **Goes to:** H07 What Spal knows · L09 Export my data · L10 Delete account

#### L04 · Security

- **Route:** `app/me/security.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Account protection.
- **On this screen:**
  - Change password
  - App lock: PIN, fingerprint, face
  - Signed-in devices
  - Log out everywhere

#### L05 · Notification settings

- **Route:** `app/me/notifications.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Control what reaches you.
- **On this screen:**
  - Toggles per category
  - Quiet hours
  - Check-in rhythm

#### L06 · Plan & billing

- **Route:** `app/me/plan.tsx`
- **Release:** Phase 3 · Later · **Shown to:** All levels
- **Purpose:** Free and Pro.
- **On this screen:**
  - Plan comparison
  - Subscribe in naira through a payment provider
  - Billing history

#### L07 · Help & feedback

- **Route:** `app/me/help.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Get help.
- **On this screen:**
  - FAQs
  - Contact support
  - Send feedback
  - Report a bug

#### L08 · Language

- **Route:** `app/me/language.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Choose the app language.
- **On this screen:**
  - English, Pidgin
  - Yoruba, Hausa, Igbo later

#### L09 · Export my data

- **Route:** `app/me/export.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Take your data with you.
- **On this screen:**
  - Records, journey, posts
  - Choose format

#### L10 · Delete account

- **Route:** `app/me/delete.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Leave cleanly.
- **On this screen:**
  - What gets deleted
  - Confirm with password
  - Grace period

#### L11 · About & legal

- **Route:** `app/me/about.tsx`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Terms and version.
- **On this screen:**
  - Terms, privacy policy
  - App version

### M · System states

Cross-cutting states every screen relies on.

#### M01 · Offline mode

- **Route:** `component OfflineBanner + offline module (§11)`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Spal keeps working on bad networks.
- **On this screen:**
  - Offline banner
  - Entries saved on device and synced later
  - Spal chat unavailable message

#### M02 · Empty states

- **Route:** `component EmptyState`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Every list has a designed empty state.
- **On this screen:**
  - Illustration
  - First action button
  - A line from Spal

#### M03 · Error states

- **Route:** `component ErrorState`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Plain-language errors.
- **On this screen:**
  - What went wrong
  - How to fix it
  - Retry, keeping the user’s input

#### M04 · Loading

- **Route:** `components Skeleton, SpalThinking`
- **Release:** Phase 1 · MVP · **Shown to:** All levels
- **Purpose:** Nothing feels frozen.
- **On this screen:**
  - Skeletons for dashboard modules and lists
  - Spal thinking indicator

#### M05 · Update & maintenance

- **Route:** `app/update-required.tsx, app/maintenance.tsx`
- **Release:** Phase 2 · V1 · **Shown to:** All levels
- **Purpose:** Keep the app current.
- **On this screen:**
  - Update required screen
  - Maintenance screen



---

## 11. Offline and sync

Many users work on patchy networks. Capture must never fail because of signal.

### 11.1 What works offline

| Works fully offline (queued, synced later) | Read-only offline (cached) | Online only |
|---|---|---|
| Add/edit sale, expense, debt, debt payment (F03, F06, F13) · Add moment (D06) · Answer check-in (C02) · Mark manual milestone done (D03) · Draft a post (I03, saved as draft) | Home (C01), Business overview (F01), lists of sales/expenses/debts/customers/products, Journey (D01, D05), goals, lessons already opened | Spal chat and all AI features, community feed and posting, mentorship, search across the server, sign-up and log-in |

### 11.2 How it works

- Local SQLite mirrors the user's recent private records (last 90 days plus all open debts and all products/customers).
- Every offline write goes into an **outbox** table with a `client_id` (uuid generated on device), operation, payload and attempt count, and is applied to the local mirror immediately so the UI updates.
- A sync worker drains the outbox when connectivity returns (and on app foreground), in order, using `upsert ... on conflict (client_id)` so retries never duplicate records.
- Conflicts: last write wins on `updated_at`, and the overwritten version is kept in a `sync_conflicts` local table for debugging. Deletes win over edits.
- UI: `OfflineBanner` when offline; `SyncStatus` shows "Saved on this phone, will sync" on queued items and clears when synced. Never show a blocking error for a queued write.
- Spal screens offline show a calm message ("Spal needs a connection. Your message is saved and will send when you're back online.") and queue the message.

---

## 12. Notifications catalogue

All notifications respect `notification_prefs` (per category on/off and quiet hours, default quiet 21:00–07:00 Africa/Lagos) and hard season mode. Every notification also appears in C04.

| Key | Category | Trigger | Example copy | Opens | Phase |
|---|---|---|---|---|---|
| `checkin_daily` | Spal | Scheduled by `spal-checkins` at the user's chosen time and rhythm | "Quick one, Ada: how did sales go today?" | C02 | 1 |
| `spal_nudge` | Spal | Spal has a timely suggestion (max 1 per day) | "You've recorded 6 days in a row. Want to see your week?" | C01 | 1 |
| `milestone_done` | Journey | A milestone completes | "Milestone done: Know your profit on each product" | D03 | 1 |
| `level_up_ready` | Journey | Gateway milestone done | "You're ready for Level 2: Builder" | D04 | 1 |
| `anniversary` | Journey | 30, 100, 365 days since Day one | "100 days on Spal. Look how far you've come." | D08 | 2 |
| `debt_due` | Reminders | Debt due tomorrow / overdue (owed to me and I owe) | "A payment from Chidi is due tomorrow" | F13 | 1 |
| `compliance_due` | Reminders | Compliance item due in 30 / 7 days | "Annual returns due in 7 days" | F18 | 2 |
| `salary_due` | Reminders | Salary due tomorrow | "Salaries due tomorrow: 3 people" | G04 | 2 |
| `low_stock` | Reminders | Product below `low_stock_at` | "Only 4 cartons of Indomie left" | F10 | 2 |
| `launch_task` | Reminders | Launch plan task reminder | "This week: test your price with 3 customers" | E06 | 1 |
| `comment_reply` | Community | Reply or comment on your post | "Funke replied to your post" | I02 | 1 |
| `reaction_batch` | Community | Reactions batched hourly | "12 people cheered your win" | I02 | 1 |
| `connection_request` | Community | New request / accepted | "Tunde wants to connect" | I10 | 2 |
| `dm_message` | Community | New direct message | "New message from Amaka" | I12 | 2 |
| `mentor_session` | Community | Session confirmed / starts in 1 hour | "Your session with Bola starts in 1 hour" | J05 | 2 |
| `insight_new` | Spal | New insight from nightly job (max 2 per week) | "Your transport costs doubled this month" | H08 | 2 |
| `action_ready` | Spal | Agent action needs approval | "Your invoice draft is ready to review" | H10 | 3 |
| `event_reminder` | Community | Event tomorrow | "Abuja food sellers meetup is tomorrow" | I14 | 3 |

Copy notes: never mention business figures in a push notification that shows on the lock screen unless the user enabled "Show amounts in notifications" (default off). The debt example above shows the amount only with that setting on; otherwise "A payment is due tomorrow".

---

## 13. Security and privacy

- **Secrets:** no keys in the app. Supabase anon key only, with RLS doing the work. Service role and AI keys only in edge function secrets.
- **Session:** tokens in `expo-secure-store`. Optional app lock (PIN or biometrics) from A05/L04, required on cold start and after 5 minutes in background.
- **Access rules:** §7.10, enforced and tested at the database layer.
- **Storage:** private buckets for receipts, documents, voice notes and proof uploads, accessed through short-lived signed URLs. Public bucket only for avatars and post media.
- **Uploads:** strip EXIF location from photos before upload. Compress images to max 1600px.
- **Logs and analytics:** no names, phone numbers, amounts or message contents in logs, error reports or analytics events.
- **Data export (L09):** generates a ZIP (JSON + CSV) of all the user's data via an edge function, delivered as a signed download link in-app.
- **Account deletion (L10):** soft-delete immediately (sign out everywhere, hide profile and posts), hard-delete all personal data after a 30-day grace period unless the user cancels. Anonymised aggregate analytics may remain.
- **Regulation:** Spal processes personal data of Nigerian users. Joshua should confirm obligations under the Nigeria Data Protection Act 2023 (privacy policy, lawful basis, data processing records, breach handling) before public launch. Mark this as a launch checklist item, not a coding task.
- **Moderation:** reports (I15) go to an admin queue (a simple Supabase table view or internal admin screen in Phase 2). Blocked users disappear from each other's feeds, comments, search and messages.

---

## 14. Localisation and Nigeria-specific details

- **Languages:** English (`en`) and Nigerian Pidgin (`pcm`) at launch; Yoruba, Hausa and Igbo later. All UI copy in i18n files. Pidgin copy is written by a native speaker, not machine-translated; ship English as fallback for missing keys.
- **Currency:** naira only. Store kobo; display `₦1,250,000`. Short forms in charts (`₦1.25m`, `₦45k`). `MoneyInput` accepts "45k", "1.2m".
- **Phone numbers:** default +234, accept `0803…` and `+234803…`, store E.164.
- **Dates and time:** display `4 Oct 2026`; default time zone Africa/Lagos; week starts Monday.
- **Locations:** the 36 states plus FCT as a seeded list; city as free text.
- **Payment methods:** cash, transfer, POS, credit ("will pay later").
- **Regulatory content (verify):** CAC business-name and company registration, TIN, annual returns, permits. Ship as content records flagged "verify" (§0.2); Joshua confirms current steps and fees before they go live.
- **Low-end devices and data:** keep the JS bundle lean, lazy-load heavy screens (charts, community media), use thumbnails, and add a "Data saver" toggle in L05/L08 that disables autoplay and full-size images.

---

## 15. Analytics and success measures

Track product health without collecting sensitive data. Event names are `snake_case`; properties never include amounts, names or message text.

**Core events:** `screen_viewed {screen_id}` · `onboarding_step_completed {step}` · `onboarding_completed {level, adjusted:boolean, begin_choice}` · `level_revealed {computed_level, confidence}` · `level_adjusted {from, to}` · `sale_added {method, offline:boolean, via:'quick_add'|'form'|'voice'}` · `expense_added {category, offline}` · `checkin_answered {answer_type}` · `milestone_completed {key, completed_by}` · `level_up_confirmed {to}` · `spal_message_sent {mode}` · `spal_action_used {action}` · `memory_fact_deleted` · `post_created {type, anonymous, audience}` · `privacy_guard_warned {kind}` · `report_submitted {target_type}`.

**MVP success measures (for Joshua's next round of user testing):**
- Onboarding completion rate (A03 → B14).
- Level acceptance rate at B08 (accepted without adjusting).
- Day-7 and day-30 retention.
- Weekly check-in answer rate.
- Share of users recording at least 3 sales or expenses a week (Level 1+).
- Qualitative: "Did Spal understand you?" one-tap prompt after the first week.

---

## 16. Testing and definition of done

### 16.1 Test layers

- **Unit (Jest):** everything in `src/engine/` (placement, milestone rules, module selection, money formatting and parsing, phone parsing) with table-driven tests. Target ≥ 90% coverage for `src/engine` and `src/lib`.
- **Component (React Native Testing Library):** design-system components and each screen's main states.
- **Access rules (SQL tests):** for every private table, a second user cannot select, insert, update or delete the first user's rows; anonymous posts never expose `author_id`; no community view returns private data.
- **Edge functions:** unit tests with a mocked AI client; contract tests on zod output schemas; the Spal eval set (§9.7) before prompt or model changes.
- **End-to-end (Maestro):** at minimum these flows, run on Android (low-end emulator profile) and iOS:
  1. New user: A02 → B14 → C01, placed at Level 1.
  2. Adjust level at B08 → B09 → Level 0 → Business tab shows Planning.
  3. Add sale offline, go online, sale syncs once (no duplicate).
  4. Credit sale creates a debt; mark it paid.
  5. Complete Level 0 gateway (first sale) → level-up suggestion → D04 → Home shows Level 1 modules.
  6. Ask Spal a question that uses sales data; answer shows the data note.
  7. Delete a memory fact in H07; it no longer appears.
  8. Create a post containing "₦50,000" → privacy guard warns.
  9. Report and block a user; their posts disappear.

### 16.2 Standard states (every screen)

- **Loading:** skeletons shaped like the content, never a lone spinner on a full screen.
- **Empty:** `EmptyState` with a first action and, where natural, a line from Spal.
- **Error:** plain-language explanation, a retry, and the user's input preserved.
- **Offline:** per §11.
- **Permission denied** (camera, microphone, notifications): explain why it's needed and link to settings.

### 16.3 Definition of done (per screen)

- Built to §10 and §5, in light and dark, at 360pt and 430pt widths, and with 200% text.
- All states in §16.2 plus any listed for the screen.
- Copy in i18n (English complete, Pidgin key present).
- Accessibility labels; touch targets ≥ 44pt.
- Analytics event(s) wired.
- Tests written and passing; no TypeScript errors; lint clean.
- `docs/PROGRESS.md` updated with the screen ID.

---

## 17. Build phases

Mobile only until Phase 4. Each phase ends with a **gate**: acceptance criteria met, all tests green, a build installable on Joshua's phone (EAS internal distribution or equivalent), `docs/PROGRESS.md` updated, then **stop and wait for review**.

### Phase 0 · Foundation

1. Audit and `docs/AUDIT.md`, `CLAUDE.md`, `docs/DECISIONS.md` (§0.1).
2. Project setup or upgrade: TypeScript strict, Expo Router, lint, formatting, CI.
3. Theme tokens, fonts, light/dark, the core components in §5.4, and a `/dev/components` preview screen.
4. Supabase project, environments (dev, staging, prod), migrations for Phase 1 tables (§7), access rules and their tests, seed data (milestones, states list, circles placeholder, modules).
5. i18n setup with English and Pidgin files.
6. Offline outbox skeleton (§11) with tests.
7. Analytics and error reporting wired with PII scrubbing.
8. Migration plan for existing users' data from the old Spal model (written, tested on a copy, not yet run in production).

**Gate:** app builds on both platforms; component preview works in both themes; access-rule tests pass; Joshua approves the audit and decisions.

### Phase 1 · MVP (67 screens)

Build in this order, one slice at a time:

- **1a · Get in and get placed:** A01–A07 · B01–B12, B14 · `src/engine` placement · edge function `spal-onboarding-reflect`. Until B13 ships in Phase 2, B12 goes straight to B14 and check-ins default to a few times a week at 18:00.
- **1b · Home and journey:** C01–C04 · D01–D06, D10–D11 · milestone engine (§8.2–8.3) · module registry (§8.5) with Level 0–2 modules.
- **1c · Planning and money:** E01–E04, E06 · F01–F07, F13, F16 · offline capture (§11).
- **1d · Spal:** H01–H02, H06–H07 · edge functions `spal-chat`, `spal-memory-extract`, `spal-checkins`, `spal-nudge`, `spal-draft`.
- **1e · Community basics:** I01–I03, I09, I15 · `spal-privacy-guard`.
- **1f · Me and system:** L01–L05, L07, L10–L11 · M01–M04 · notifications from §12 marked Phase 1.
- Run the existing-user data migration.

**Gate:** all Phase 1 Maestro flows pass (§16.1 flows 1–9); a fresh user can go from download to a personalised dashboard in about three minutes; Joshua runs a round of user testing with the §15 measures.

### Phase 2 · V1 (47 screens)

- **2a · Deeper tracking:** F08–F12, F14–F15, F18–F19 · `business_summary` reporting functions · PDF/CSV export.
- **2b · Team basics (Level 3+):** G01–G05.
- **2c · Smarter Spal:** H03–H04, H08, H11 · edge functions `spal-insights`, `spal-brainstorm`, `spal-challenge`.
- **2d · Journey and home extras:** A08 · B13 · C05–C06 · D07–D08 · E05.
- **2e · Community depth:** I04–I08, I10–I12 · moderation admin view.
- **2f · Mentorship and Learn:** J01–J06 · K01–K05 · `spal-mentor-brief` · Learn and playbook content (flagged "verify").
- **2g · Settings:** L08–L09 · M05.
- Level 3–5 dashboard modules.

**Gate:** all V1 screens done to §16.3; access-rule tests extended to team permissions, circles, connections and DMs; mentorship flow tested end to end with a real mentor.

### Phase 3 · Later (15 screens)

- **3a · Operations:** G06–G09 · `spal-meeting` (needs the transcription decision in §19).
- **3b · Spal as agent:** H05, H09–H10 · `spal-agent` with the approval flow (§9.6).
- **3c · Scale:** F17 (multiple businesses: business switcher, portfolio view, per-business scoping everywhere).
- **3d · Community and mentors:** I13–I14 · J07–J08.
- **3e · Extras:** D09 · K06 · L06 (needs the payments decision in §19).

**Gate:** all 129 mobile screens complete; full regression of Maestro flows; performance check on a low-end Android device (cold start, Home render, sale entry).

### Phase 4 · Desktop

See §18.

---

## 18. Desktop (Phase 4)

Build after mobile is complete. Reuse the backend entirely and share as much code as possible (engine, API hooks, i18n, tokens; components where layouts allow).

- **Approach:** decide in Phase 4 between a responsive web app (Expo web or a separate web framework sharing `src/engine`, `src/lib` and API hooks) wrapped for desktop, or web only. If the existing Spal desktop app is already in a framework that works, keep it and connect it to the new backend. Record the decision in DECISIONS.md.
- **Layout:** left sidebar (Home, Journey, Business, Team, Community, Mentors, Learn, Me), main pane, and a persistent **Spal panel** on the right that knows the current screen and offers help for it.
- **Patterns:** list + detail side by side for sales, expenses, customers, posts and chats; dashboard as a module grid; reports and exports full width.
- **Desktop-first screens:** F14 reports, F15 export, E05 business plan builder, G05 tasks, G07–G09 meetings, J05 session prep.
- **Keyboard:** shortcuts for quick add (N), search (/), and Spal panel toggle.

---

## 19. Open decisions for Joshua

Claude Code should raise these at the phase where they are needed, with a short recommendation, rather than guessing.

| # | Decision | Needed by | Notes |
|---|---|---|---|
| 1 | Keep the existing stack or adopt §3 defaults where they differ | Phase 0 | Based on the audit. |
| 2 | SMS / WhatsApp OTP provider for Nigerian numbers | Phase 0 | Deliverability and cost in Nigeria matter more than brand. |
| 3 | Spal's visual presence (mark, avatar, animation) and final brand tokens | Phase 1a | §5 tokens are placeholders until Figma exists. |
| 4 | Pidgin copywriter | Phase 1 | Native speaker for UI copy and Spal tone review. |
| 5 | Daily AI budget per user (free tier) | Phase 1d | Sets the cap in §9.1. |
| 6 | Who verifies CAC, TIN and compliance content, and how often | Phase 2f | Content stays flagged until verified. |
| 7 | Mentors: free only, or paid sessions too | Phase 2f | Paid sessions need payments (#9). |
| 8 | Speech-to-text provider for voice (H05) and meetings (G08), including Pidgin quality | Phase 3a | Test with real Nigerian voice samples first. |
| 9 | Payments provider for subscriptions (L06) and pricing of Free vs Pro | Phase 3e | |
| 10 | Desktop approach | Phase 4 | §18. |


---

## Appendix A. Level catalogue

Seed data for `milestones`, the module registry (§8.5), B10 options and Spal's behaviour. Milestone completion types are suggestions; adjust in the seed if a rule proves unworkable, and log it in DECISIONS.md.

### Level 0 · Dreamer

*“I want to start, but I don’t know where.”* Has an idea, a skill or some money, but hasn’t sold anything yet.

**Placement signals:** No sales yet; No registered business; Often has savings ready but no clear direction.

**B10 “Where would you like to begin?” options:**

| Option | Outcome shown |
|---|---|
| Shape my idea | Turn a rough idea into a clear offer |
| Find an idea that fits me | Spal asks about your skills, money and time, then suggests options |
| Plan my startup budget | Know what you need and what you have |
| Learn the basics | Short lessons for first-timers |

**Default Home modules (in order):** Idea card (E02) · Validation checklist (E03) · Startup budget (E04) · Launch plan progress (E06) · Learn for you (K01) · People who just started (I01)

**Milestones:**

| # | Milestone | Completion |
|---|---|---|
| 1 | Describe your idea in one sentence | manual |
| 2 | Talk to 5 potential customers | spal |
| 3 | Set your startup budget | manual |
| 4 (gateway) | Make your first sale → Level 1 | data: first_sale |

**How Spal behaves:** Clarity and confidence. Asks lots of questions, helps narrow things down, and pushes gently toward a first real test.

**In the community:** Reads and asks. Sees beginner circles and ‘how I started’ stories.

### Level 1 · Starter

*“I’m selling, but it’s still a hustle.”* Making sales, usually informally or part-time, often mixing business and personal money.

**Placement signals:** Has made sales; Not registered; Works alone or with family help.

**B10 “Where would you like to begin?” options:**

| Option | Outcome shown |
|---|---|
| Track my sales and spending | See where the money goes |
| Price my products right | Know your real profit per item |
| Get more customers | Ideas matched to what you sell |
| Separate business and personal money | Simple habits that make growth possible |

**Default Home modules (in order):** Today’s money in and out (F01) · Quick add (C03) · This week’s sales chart · Who owes me (F13) · Pricing helper (F09) · Spal tip of the day

**Milestones:**

| # | Milestone | Completion |
|---|---|---|
| 1 | Record sales for 30 days | data: records_30_days |
| 2 | Know your profit on each product | data: profit_per_product |
| 3 | Separate business and personal money | manual |
| 4 (gateway) | Register your business name → Level 2 | manual (proof: CAC certificate photo) |

**How Spal behaves:** Habits. Builds the record-keeping habit, explains profit plainly, celebrates consistency.

**In the community:** Shares wins and questions. Joins industry circles.

### Level 2 · Builder

*“It’s real now. I need structure.”* Registered business with steady sales, starting to organise.

**Placement signals:** Registered with CAC; Business bank account; Consistent monthly sales.

**B10 “Where would you like to begin?” options:**

| Option | Outcome shown |
|---|---|
| Get my records in order | Clean books you can show a bank |
| Plan my growth | A 6-month plan with targets |
| Sort out tax and compliance | TIN, returns and reminders |
| Build my brand | Name, look and voice that stick |

**Default Home modules (in order):** Profit and loss this month (F14) · Compliance tracker (F18) · Stock levels (F10) · Top customers (F11) · Monthly goal (D10) · Spal insights (H08)

**Milestones:**

| # | Milestone | Completion |
|---|---|---|
| 1 | Keep 3 months of complete records | data: records_3_months |
| 2 | Get your TIN | manual (proof optional) |
| 3 | Hit a monthly profit goal | data: monthly_profit_goal |
| 4 (gateway) | Hire your first person → Level 3 | data: first_hire |

**How Spal behaves:** Systems and growth. Spots patterns in the numbers, flags compliance dates, pushes toward a growth plan.

**In the community:** Answers questions from Levels 0–1. Finds peers to grow with.

### Level 3 · Team

*“I’m not alone in the business anymore.”* Pays at least one person. Roles are forming.

**Placement signals:** Pays at least one person; Owner starting to delegate; One main location or channel.

**B10 “Where would you like to begin?” options:**

| Option | Outcome shown |
|---|---|
| Hire the right people | Roles, job posts and interviews |
| Set up salaries | Schedules and reminders |
| Give everyone clear roles | Who does what, written down |
| Run better meetings | Spal takes notes and tracks actions |

**Default Home modules (in order):** Team today (G01) · Salaries due (G04) · Open tasks (G05) · Next meeting (G07) · Profit and loss (F14) · Hiring (G06)

**Milestones:**

| # | Milestone | Completion |
|---|---|---|
| 1 | Write down every role | manual |
| 2 | Pay salaries on time 3 months running | data: salaries_on_time_3 |
| 3 | Run a meeting with a Spal summary | data: meeting summary exists |
| 4 (gateway) | Open a second location, channel or product line → Level 4 | manual |

**How Spal behaves:** Leadership and operations. Helps write roles, prepares meetings, follows up on action items.

**In the community:** Swaps hiring and management stories. Starts mentoring informally.

### Level 4 · Scaling

*“It works. Now I want more of it.”* Growing team across several locations or channels, looking at funding.

**Placement signals:** More than one location or channel; Managers forming; Considering loans or investment.

**B10 “Where would you like to begin?” options:**

| Option | Outcome shown |
|---|---|
| Expand to a new location or market | Test before you commit |
| Build systems and SOPs | So it runs without you |
| Get funding-ready | Numbers and story for lenders or investors |
| Find a mentor | Someone who has done it |

**Default Home modules (in order):** Growth by location or channel · Cash flow forecast · Funding readiness · Team performance · Mentor sessions (J01) · Compliance (F18)

**Milestones:**

| # | Milestone | Completion |
|---|---|---|
| 1 | Document your key processes | manual |
| 2 | Build a 6-month cash flow forecast | manual (built in F14 forecast) |
| 3 | Prepare a funding-ready pack | manual |
| 4 (gateway) | Run as a company with a management team → Level 5 | manual |

**How Spal behaves:** Strategy. Forecasts cash flow, prepares loan or investor packs, stress-tests expansion plans.

**In the community:** Mentors Levels 1–3. Leads circles.

### Level 5 · Established

*“I’ve built something. What’s next?”* Mature company, maybe several businesses, thinking about investment and legacy.

**Placement signals:** Incorporated company; Management team in place; Several businesses or major scale.

**B10 “Where would you like to begin?” options:**

| Option | Outcome shown |
|---|---|
| Manage all my businesses in one place | Portfolio view |
| Prepare for investment | Board-ready reporting |
| Give back as a mentor | Guide the next generation |
| Plan the long term | Succession and legacy |

**Default Home modules (in order):** Portfolio overview (F17) · Investor report · Mentor dashboard (J08) · Legacy timeline (D05) · Company health

**Milestones:**

| # | Milestone | Completion |
|---|---|---|
| 1 | Mentor someone at Levels 0–2 | manual |
| 2 | Publish your year in review (D09) | data: year review published |
| 3 | Start or acquire another venture | manual |
| 4 (gateway) | The journey continues in seasons | none (no level beyond 5) |

**How Spal behaves:** Advisor. Big-picture reviews, portfolio comparisons, succession thinking.

**In the community:** Mentors, speaks at events, leads circles.

