# Decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-10-04 | Adopt §3 defaults: Expo SDK 57, Expo Router, TypeScript strict, i18next, Jest | Repo was empty, so no existing stack to keep. |
| 2026-10-04 | Web output is `single` (SPA) via `expo export --platform web`, hosted on Vercel | Gives Joshua a live preview URL of the mobile UI; native builds still come from EAS later. Desktop approach (§19 #10) stays open. |
| 2026-10-04 | Supabase, Sentry, PostHog, offline outbox deferred to next Phase 0 step | Need Joshua's project credentials/approvals; nothing hard to reverse was chosen. |
| 2026-10-04 | Fonts (Bricolage Grotesque, Instrument Sans, JetBrains Mono) declared in tokens but not yet loaded; system fallback in use | Add `@expo-google-fonts/*` in the next step. |
