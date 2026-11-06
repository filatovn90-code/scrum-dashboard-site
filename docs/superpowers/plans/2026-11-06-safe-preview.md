# Safe Preview Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Vercel Preview deployment safe to use without touching production Supabase data.

**Architecture:** Hosted browser clients use only `/api/config/supabase`, with no production fallback. Vercel Preview variables point at a separate Supabase project. A minimal CI workflow checks the project before merge.

**Tech Stack:** Static JavaScript, Node test runner, GitHub Actions, Vercel, Supabase Postgres/Auth.

**Spec:** `docs/superpowers/specs/2026-11-06-safe-preview-design.md`

## Global Constraints

- Never modify or copy production user data.
- No paid services or second Vercel project.
- Existing production schema/history stays unchanged.
- Preview must fail closed if staging settings are absent or point at production.

## Review Focus

- Preview config endpoint missing variables: return an error, not production credentials.
- Preview config accidentally points at production: reject it.
- Browser config fetch fails or returns malformed data: do not fall back to production.
- Local `file:` preview: retain its local account behavior.
- Staging RLS: two users cannot read or modify each other's tasks.

---

### Task 1: Fail-closed browser and server configuration

**Files:** `supabase-client.js`, `api/config/supabase.js`, `supabase-public-config.js`, `tests/supabase-config.test.js`.

**Interfaces:** Hosted `getSupabase()` obtains a valid URL and publishable key from the same-origin endpoint or rejects; `file:` obtains only the local client. Server returns config only when both variables exist and Preview does not target the production project.

- [ ] Write failing Node tests for hosted success, fetch failure, malformed response, missing server variables, Preview-to-production guard, and local preview behavior.
- [ ] Run the new tests and confirm relevant failures.
- [ ] Implement the smallest config changes.
- [ ] Run new and existing tests, then commit.

### Task 2: Isolated staging database and Preview variables

**Files:** `supabase/schema.sql`, `docs/staging-and-releases.md`.

**Interfaces:** Staging has the currently used tables and RLS without production data; Vercel Preview's URL/key refer to the staging project only.

- [ ] Review production table definitions/policies against checked-in SQL.
- [ ] Update the staging bootstrap SQL for project-less tasks and apply schema, today-screen, and cloud-backlog SQL to staging.
- [ ] Set Preview-scoped Supabase variables in Vercel; verify Production-scoped values are unchanged.
- [ ] Test staging signup, task creation, data persistence and isolation with two accounts.
- [ ] Document setup and release operations, then commit.

### Task 3: PR gate and end-to-end release check

**Files:** `.github/workflows/verify.yml`, `package.json`, `docs/staging-and-releases.md`.

**Interfaces:** PRs run Node tests and syntax checks; preview URL serves staging config; production URL serves production config.

- [ ] Add CI and verify it locally.
- [ ] Push feature branch, inspect Vercel Preview config and smoke-test sign-in/tasks.
- [ ] Merge only after checks pass; verify production still points to production and staging data stays separate.
- [ ] Record final status and remaining migration-history work.
