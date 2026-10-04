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

## Commands
`npm run typecheck` · `npm test` · `npm run lint` · `npm run build:web` (static export to `dist/`, deployed by Vercel)
