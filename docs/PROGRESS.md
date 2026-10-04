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
