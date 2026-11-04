---
name: db-migration
description: Safely change the Unlost database schema with Prisma — writing the schema change, creating and reviewing the migration, and shipping it to production. Use whenever prisma/schema.prisma or prisma/migrations needs to change.
---

# Database migration

Production data lives in Neon. A bad migration can't be undone with git, so go slowly.

## Make the change (local only)

1. Confirm you're on the local DB: `npx prisma migrate status` prints the datasource host,
   and it must be `localhost:5434`. Never print the connection string itself.
2. Edit `prisma/schema.prisma`. Things Prisma can't express (extensions, CHECK constraints,
   `vector` columns, GIN indexes) go as raw SQL inside the migration file.
3. `npx prisma migrate dev --name <short_snake_case>`.
4. Read the generated `migration.sql`. Look for:
   - `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN ... TYPE`, `NOT NULL` on an existing column
     without a default — these can lose data or fail on existing rows. **Stop and ask the
     user** before keeping any of them, and propose an expand → backfill → contract plan.
   - Missing `CREATE EXTENSION IF NOT EXISTS` for anything new.
5. Update any raw SQL in `src/lib/library-search.ts` / `library-enrichment.ts` that touches
   the changed columns.
6. Run the `verify` skill.

## Ship it

- Migrations reach production only through the Vercel production build
  (`prisma migrate deploy` with `DIRECT_URL`) after the PR is merged to `main`.
- Preview deployments use a separate Neon branch, never the production database.
- Never run `migrate reset`, `db push` or manual SQL against production. If production
  needs fixing by hand, write the exact SQL down and hand it to the user to run.
- For a destructive change, ask the user to take a backup (Neon branch or `pg_dump`) first.
