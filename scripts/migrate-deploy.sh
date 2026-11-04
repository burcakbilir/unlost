#!/bin/sh
# Runs pending Prisma migrations during a Vercel build, but only where it's safe.
#
# - Production (VERCEL_ENV=production): always.
# - Preview: only when ALLOW_PREVIEW_MIGRATIONS=true is set in Vercel's Preview
#   environment. Set it once previews have their own database (a Neon branch).
#   Without it, a pull request's migration could reach the production database
#   before the PR is merged.
# - Anything else (local builds, CI): skipped. Locally use `prisma migrate dev`.
set -e

case "$VERCEL_ENV" in
  production)
    echo "Production build: applying migrations."
    npx prisma migrate deploy
    ;;
  preview)
    if [ "$ALLOW_PREVIEW_MIGRATIONS" = "true" ]; then
      echo "Preview build with its own database: applying migrations."
      npx prisma migrate deploy
    else
      echo "Preview build: skipping migrations (ALLOW_PREVIEW_MIGRATIONS is not true)."
    fi
    ;;
  *)
    echo "Not a Vercel production or preview build: skipping migrations."
    ;;
esac
