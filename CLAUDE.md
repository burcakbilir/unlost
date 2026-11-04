@AGENTS.md

# Unlost

Personal "save it, find it later" library: links, notes and screenshots, found again by
semantic + keyword search. Next.js 16 (App Router, Route Handlers, no Server Actions),
React 19, Prisma 7 + PostgreSQL (pgvector, pg_trgm), Tailwind 4, Zod 4, Vitest. npm.

## Commands

- `npm run dev` — dev server (Claude preview: `unlost` on port 3100, `unlost-prod` on 3101)
- `npm run check` — lint + typecheck + unit tests; run before saying a change works
- `npm run build` — production build; run after dependency, config or routing changes
- `docker compose up -d` — local Postgres with pgvector on port 5434
- `npx prisma migrate dev --name <name>` — new migration (local DB only)
- `npm run invites -- <n>` — print invite links for the DB in `DATABASE_URL`

## Structure

Feature-based, not layer-based:
- `src/app/**` — routing only (pages, layouts, `api/**/route.ts`)
- `src/features/<feature>/` — components, hooks, schemas for one feature
- `src/lib/` — shared server and client utilities
- `src/proxy.ts` — route protection (Next 16's name for middleware)

Put new code in the feature it belongs to; a feature must not import another feature's
components. Shared helpers go in `src/lib`.

## Rules

- Every API route: `getRequestUser()` first, then validate the body with a Zod schema via
  `readJsonBody`, then rate-limit. Every query on user data filters by `ownerId: user.id`.
- Never read or print `.env*` values (except `.env.example`). Never put secrets in code,
  logs, URLs or chat.
- Never run migrations, `prisma db push`, `migrate reset` or raw SQL writes against a
  non-local database. Production migrations run only from the Vercel production build.
- Migrations are additive by default. Ask before any DROP, column type change or data delete.
- Don't add dependencies without asking. Prefer the platform and what's already installed.
- Code comments explain *why*. Match the surrounding style.
- Work on a feature branch, never commit straight to `main`. Commit only when asked.

## Verify before claiming done

Use the `verify` skill. For UI changes also check the page in the preview browser.
