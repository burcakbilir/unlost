import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Only the Prisma CLI (migrations) uses this; the app connects through the
    // adapter in src/lib/prisma.ts. Migrations take advisory locks, which a
    // pooled connection (Neon's PgBouncer) doesn't support, so in production
    // DIRECT_URL points at the unpooled host. Locally DATABASE_URL is direct.
    url: process.env.DIRECT_URL || env("DATABASE_URL"),
  },
});
