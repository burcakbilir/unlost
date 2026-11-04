---
name: verify
description: Verify a change in Unlost before calling it done — runs lint, typecheck, unit tests and (when needed) the production build, and reports real results. Use after any code change, before a commit, or when asked "does it work?".
---

# Verify

Run the checks and report what actually happened. Never claim a check passed without its
output.

1. `npm run check` (lint + `tsc --noEmit` + `vitest run`). Stop and fix on the first failure.
2. Run `npm run build` too when the change touches any of: `package.json` / lockfile,
   `next.config.ts`, `prisma/`, `src/proxy.ts`, a new route or page, layouts, metadata.
   Run it in the background; it takes about a minute.
3. If `prisma/schema.prisma` changed: `npx prisma validate`, then confirm a migration exists
   for the change (`npx prisma migrate status` against the local DB).
4. UI change: open the page in the preview browser (`unlost` launch config), check the
   console for errors, and look at it at mobile width (375px) as well as desktop.

Report as a short table: check, result (pass/fail), and the failing output if any.
Mention anything you skipped and why.
