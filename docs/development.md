# Development workflow

How a change gets from an idea to production. Setup instructions are in the README.

## Environments

| Environment | Git | URL | Database |
|---|---|---|---|
| Local | any branch | `localhost:3000` (Claude preview: 3100) | Docker Postgres, `localhost:5434` |
| Preview | every pull request | Vercel preview URL, posted on the PR | Neon preview branch — never production data |
| Production | `main` | Vercel production URL | Neon `main` branch |

`main` is always deployable: whatever is on it goes live.

## Making a change

1. Start from an up-to-date `main`:
   ```bash
   git switch main && git pull
   git switch -c feat/short-description
   ```
   Prefixes: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`.
2. Make the change in small commits. Messages follow the existing style:
   `type(scope): what changed`, e.g. `fix(auth): reject redirect targets on other origins`.
3. Before pushing, run `npm run check` (lint + typecheck + tests). Run `npm run build` too
   if you touched dependencies, config, Prisma or routing.
4. Push and open a pull request into `main`. CI runs the same checks plus a production build
   and a critical-vulnerability audit; Vercel builds a preview deployment.
5. Test the preview URL: sign in, try the flow you changed, check it on a phone-sized screen.
6. Merge only when CI is green and the preview works. Use "Squash and merge" so `main`
   keeps one commit per change. Delete the branch after merging.
7. Vercel deploys `main` to production and runs pending migrations. Check the production
   URL and the Vercel logs right after.

## Database changes

Follow `.claude/skills/db-migration/SKILL.md`. In short: create migrations locally with
`prisma migrate dev`, review the SQL, never run anything by hand against production, and
treat any DROP or type change as a separate, planned step with a backup first.

## Rolling back

- Code: in Vercel → Deployments, "Promote" the last good deployment (instant), then fix
  forward on a branch.
- Database: migrations don't roll back automatically. Write a new migration that undoes the
  change. For data loss, restore from Neon's history (6 hours on the free plan) or the
  latest `pg_dump` backup.

## GitHub settings (one-time, in the browser)

Settings → Branches → add a rule for `main`:
- Require a pull request before merging
- Require status checks to pass → select `check`
- Do not allow bypassing the above settings (optional for a solo project)
