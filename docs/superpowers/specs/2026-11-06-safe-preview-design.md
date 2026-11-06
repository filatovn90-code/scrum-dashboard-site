# Safe preview environment for MindPulse

MindPulse has live users. Changes must be reviewed on a separate URL and database before they reach production. Keep the workflow small enough for one maintainer and leave room for per-PR databases later.

Production remains `main` on Vercel with the current Supabase project. Every feature branch gets a Vercel Preview deployment. All Preview deployments use a separate, empty MindPulse Staging Supabase project and test accounts. Hosted clients must fail closed when `/api/config/supabase` is unavailable; they must never use a hard-coded production fallback. The server configuration endpoint must reject a production Supabase URL in Preview.

The staging schema must support the current app, including project-less backlog tasks, daily focus, and per-user RLS. No live user data is copied. Existing production SQL history is not rewritten or replayed. New database changes must be reviewed as versioned migrations and applied to staging first; production application remains an explicit release step until the existing schema is reconciled with migration history.

Required workflow: branch from fresh `main`, open PR, run automated tests, inspect Preview with two test users, approve, merge, and smoke-test production. Rollback is code-only; database migrations must remain backward compatible. Do not add paid services or a permanent second Vercel project.
