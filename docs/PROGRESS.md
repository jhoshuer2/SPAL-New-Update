# Progress

## Phase 0 · Foundation
- [x] Spec, CLAUDE.md, AUDIT.md, DECISIONS.md
- [x] Old Next.js app imported as base; production build passes
- [x] AI moved to Claude (text + vision); Whisper/TTS remain OpenAI pending decision
- [x] Termii removed; email-only verification
- [x] Vitest: engine, kobo helpers, JSON extraction (18 tests)
- [x] Migration 026 (additive, idempotent, down path) + access-rule test, verified on local Postgres 16
- [ ] Run 026 on a staging Supabase project, then production (blocked: sandbox cannot reach Supabase; live DB needs a staging copy)
- [ ] `records` money to integer kobo (separate signed-off migration; old table uses numeric amounts)
- [ ] i18n (English/Pidgin) wiring; copy is English-only for now
- [ ] Error reporting / analytics with PII scrubbing
- [ ] Offline outbox (PWA service worker + IndexedDB)

## Phase 1a · Get in and get placed (started)
- [x] B01–B10 onboarding flow at `/meet-spal`, new signups land here after password creation
- [x] Placement engine (server recomputes; client not trusted), `spal-onboarding-reflect` with 3s template fallback
- [x] Saves onboarding_responses, level_history, user_milestones, users level fields
- [ ] Voice note on B05, resume-at-last-step (needs migration run), B13 check-in rhythm
- [ ] Route guard for users with null `onboarding_completed_at`
- [ ] Live Claude call test (Anthropic account reports low credit balance)

## Phase 1b · Home and journey (built, verified with mocked data)
- [x] C01 Home: level card, today's focus, Spal line on top of the existing money home; Level 0 gets a starter-path home
- [x] C03 Quick add sheet (+ floating button)
- [x] D01 roadmap, D02 level detail, D03 milestone detail, D04 level-up celebration (confirm, then celebrate), D05 timeline, D06 add moment
- [x] Milestone engine (progress, level-up readiness, data rules first_sale / records_30_days / records_3_months) + module registry, 30 tests
- [x] APIs: /api/journey, /api/journey/milestones/[key], /api/journey/level-up, /api/moments
- [x] Bottom nav: Journey tab added; Profile opens from the Home avatar (spec §6.1)
- [x] Until migration 026 is live, every new screen shows a neutral "being set up" state and the legacy home is untouched
- [ ] Not yet: C02 daily check-in, C04 notification grouping, D10/D11 goals on the new model (existing /goals stays), D07+ (V1)
- [ ] Data rules not yet evaluable (need data the app lacks): profit_per_product, monthly_profit_goal, first_hire, salaries, meetings
- [ ] AI nudge (`spal-nudge`): templated line for now; needs Anthropic credit
- [ ] "Others who completed this recently" on D03 and user counts on D02 need community data (Phase 1e)
- [ ] Not verified against a real Supabase (blocked); API routes are type-checked and the SQL they rely on is tested locally

## Phase 1d · Spal (built; model behaviour not yet verified live)
- [x] H02 chat: the existing `/ask` now answers through Spal's companion (level-aware prompt, profile, goals, aggregated 7/30/90-day money, top sellers, ranked memory, recent moments and check-ins)
- [x] "Based on your sales from the last 30 days" note and inline actions (save as goal, save as moment) under replies; Spal only offers, the user taps
- [x] Memory extraction after each exchange (skipped if learning is paused; sensitive details filtered; de-duplicated)
- [x] Daily token budget (`SPAL_DAILY_TOKEN_BUDGET`, default 100k) with a friendly limit message; usage logged to `ai_usage`
- [x] H01 Spal home (suggested prompts by level, recent chats, modes), H07 What Spal knows (edit, delete, pause)
- [x] C02/H06 daily check-in: one question a day by level, tap or write, gentle "x of last 7 days" (hidden in hard season), warm reply, written answers become private moments
- [x] Nav: Home, Journey, Spal, Sell, Inventory; Wallet and Stock moved to the profile menu
- [x] 51 tests, including the chat/memory/budget logic with Claude and the database faked
- [ ] Not verified: real model output (Anthropic account has no credit), real Supabase
- [ ] Not built: streaming replies, Brainstorm/Challenge (V1), Voice (Later), Pidgin eval fixtures (spec §9.7), daily check-in push scheduling, `spal-nudge` AI line (templated for now)
- [ ] Distress handling relies on the prompt; helpline content record (flagged "verify") still to add

## Phase 1c · Planning and money (built; verified with mocked data and a real browser for offline)
- [x] E01–E04, E06: planning hub, idea (Spal drafts, written fallback), validation (log 5 conversations, checklist, recap), startup budget (gap and ways to close it), launch plan (ticks autosave, ends at first sale)
- [x] F01 Business overview (period, money in/out/profit, trend, top sellers, how people paid, Spal line); Level 0 opens Planning instead
- [x] F03 add sale and F06 add expense: type it ("sold 3 cartons for 45k"), payment method incl. "Will pay later" (creates a debt), personal flag
- [x] F13 debts: owed to me (part payments, mark paid, due dates) and I owe
- [x] F16 business profile (name, logo, address, CAC, TIN, bank for display, socials)
- [x] Offline outbox (spec §11): save on the phone first, sync on reconnect, idempotent via client_id; banner + "sync now"; rejected items parked, never lost
- [x] Migration 027 (additive, idempotent, down path) + access-rule test verified on local Postgres, including that it fails when security is off
- [x] 82 tests
- [ ] F02/F04/F05/F07 (sales and expense lists and details): the existing `/records` screens still serve these, linked from Business
- [ ] Receipt photo on F06; voice entry on F03 (existing legacy voice/picture flows remain available)
- [ ] Due-date and launch-task reminders need a scheduler (push exists; cron to add)
- [ ] Part payments are not reflected in the legacy "Outstanding debt" tile (it counts the full sale until fully paid)
- [ ] Overview aggregates in the API, not in a SQL view/RPC yet (fine to ~10k rows per range)
- [ ] Not verified against a real Supabase or a live model (planning drafts fall back to written text without AI credit)
