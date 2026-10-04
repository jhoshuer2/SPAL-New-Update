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
