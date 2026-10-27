// Usage: npx tsx scripts/create-invites.ts [count]
// Prints invite links to share. Run against production by setting DATABASE_URL.
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const count = Math.min(Number(process.argv[2] ?? 1) || 1, 50);
const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  for (let index = 0; index < count; index++) {
    // 12 characters (A-Z, 0-9): ~60 bits, unguessable but still easy to type.
    const code = randomBytes(10).toString("base64url").replace(/[-_]/g, "").slice(0, 12).toUpperCase();
    await prisma.inviteCode.create({ data: { code } });
    console.log(`${appUrl}/register?invite=${code}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
