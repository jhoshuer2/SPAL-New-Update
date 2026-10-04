# Decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-10-04 | **Keep the existing stack:** Next.js 16 PWA + Supabase + Vercel + Paystack. Reverses the earlier Expo scaffold (removed). | Spec §0.1 stack rule: keep a reasonable existing stack. Preserves live users/data and existing Vercel hosting; avoids a rewrite. Native (Expo) remains possible later, reusing Supabase and `src/engine`-style pure logic. |
| 2026-10-04 | Move AI from OpenAI to Anthropic Claude, server routes only | Joshua's call; spec §9. Models via env vars `SPAL_MODEL_MAIN` / `SPAL_MODEL_FAST`. |
| 2026-10-04 | Drop Termii SMS; use email OTP/links for auth | Joshua: Termii is paid, email is fine. Phone-number sign-up deferred (spec §19 #2 closed for now). |
| 2026-10-04 | Keep Paystack for payments | Joshua's call. |
| 2026-10-04 | Build in `SPAL-New-Update` (copy of old app as base); old repo `MrItrends/spal` left untouched | Joshua's call. |
| 2026-10-04 | Live Supabase project is production: no destructive migrations; new schema is additive, tested on a staging copy first | Spec §0.1 data rule. |
| OPEN | Voice: Claude has no speech-to-text or text-to-speech. Whisper/TTS routes need a replacement provider or to keep OpenAI for audio only | Spec §19 #8 |
