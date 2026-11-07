# MindPulse staging and releases

## Environments

| Purpose | Git | Vercel | Supabase |
| --- | --- | --- | --- |
| Real users | `main` | Production, `mindpulse-energy.vercel.app` | Production project `fzgphisavsmtmvserson` |
| Experiments | `feature/*` and PRs | Preview URL from Vercel | Staging project `pltvmpnrvguofhyolvps` |

Vercel's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are scoped separately to Production and Preview. Never put a service-role key in either variable. The hosted client requires `/api/config/supabase`; a failed request must not fall back to Production. A `file:` preview uses only local test data.

Staging has the app schema and feedback table but no copied production accounts or content. To rebuild a new empty staging project, apply `supabase/schema.sql`, then `supabase/today-screen-migration.sql`, then `supabase/cloud-backlog-migration.sql`, then `supabase/feedback.sql`. Do not run the other experimental SQL files merely because they exist. The current production schema does not include every experimental file.

Server-side Supabase routes use the same Preview guard as the browser config route. The legacy health API uses `DATABASE_URL`; if it is enabled for Preview, its connection URL must point to the same staging Supabase project. Without a staging `DATABASE_URL`, health endpoints are unavailable in Preview rather than connecting to Production.

Feedback submissions require a signed-in user. Apply `supabase/feedback-rate-limit.sql` after `supabase/feedback.sql`: the database enforces a shared per-user limit across Vercel instances, including direct Data API inserts. Existing anonymous feedback is retained.

## One-person release flow

1. Fetch the latest `main` and create a `feature/<short-name>` branch.
2. Make changes and run `npm test` plus relevant browser checks locally.
3. Push the branch and open a PR to `main`. Wait for the Verify workflow and Vercel Preview to finish.
4. Open the Preview URL from the PR. Confirm `/api/config/supabase` reports the staging project URL, not the production URL. Use two staging accounts to test registration, task and focus persistence, feedback, and user separation. Never test a Preview against production data.
5. Review the visual result and errors. Merge the PR only when checks and manual testing pass. Vercel then deploys `main` to Production.
6. Smoke-test the public URL with a dedicated QA account. If the new UI fails, use Vercel Instant Rollback to restore the prior deployment. A code rollback does not undo a database migration.

Do not manually push experiments to `main` or edit production tables to make a Preview work. Preview deployments may require signing in to Vercel to open; share them only with trusted testers.

## Database changes

The existing production schema was built from SQL files and direct changes; its Supabase migration history is empty. Do **not** turn on automatic `db push` against production yet. First reconcile the real production schema with a versioned baseline and its migration history in a separate, reviewed change.

Until then, keep each new schema change in a reviewed SQL file, apply it to staging first, test with two users, then explicitly apply the same backward-compatible change to production during release. Prefer add/backfill/switch/remove across separate releases. Never copy production user data into staging; use synthetic test data. For growth beyond 1,000 users, add automated migrations and monitoring when the baseline is reconciled, rather than introducing multiple permanent app servers now.
