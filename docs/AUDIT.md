# Audit of old Spal (github.com/MrItrends/spal), 4 Oct 2026

**Stack:** Next.js 16.2 (App Router, webpack build), React 19, TypeScript, Tailwind 4, Zustand, react-hook-form + zod, Recharts, framer-motion. Supabase (`@supabase/ssr`), OpenAI (gpt-4o / gpt-4o-mini, Whisper, TTS), Termii SMS OTP, Gmail/Resend email, Paystack, web-push. Hosted on Vercel with 4 cron routes.
**Size:** ~64 pages, ~50 API routes, 25 SQL migrations (`supabase/migrations/001–025`).
**Covers:** auth (OTP/email/password), businesses (multi), records (sales/expenses), inventory, menu items, goals, gamification/badges/challenges, advisors/coach chat + voice, conversations + folders, notifications + push, subscriptions + coach payments (Paystack), export, receipt scan.
**Not present vs. new spec:** levels/placement/milestones, journey/moments, planning studio, Spal memory + check-ins, community, mentorship, learn, team.

## Reuse / adapt / replace
| Area | Verdict |
|---|---|
| Auth, businesses, records, inventory, goals, notifications, push, Paystack | Reuse; adapt to spec data model additively |
| OpenAI routes (10 files + `lib/openai/chat.ts`) | Replace with Claude (server-side); audio routes need a provider decision |
| Termii OTP | Remove; email only |
| Design system (`SPAL_DESIGN_SYSTEM.md`, `.claude/skills/Spal Design System`) | Reconcile with spec §5 tokens; Joshua's design system overrides spec §5 |

## Risks
- No tests anywhere.
- Money columns likely not integer kobo: verify in migrations before the new model (spec §7).
- OpenAI client constructed at module load, so `next build` fails without the key.
- Live database holds real users; schema as actually deployed has not yet been compared with migration files (Supabase host blocked in this sandbox).
- Secrets were shared in chat during this session: rotate the service-role and Anthropic keys when convenient.
