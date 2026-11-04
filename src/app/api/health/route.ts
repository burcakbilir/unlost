import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// For uptime monitors. Plain GET only answers "the app is up" and never touches
// the database: a monitor pinging every few minutes would otherwise keep Neon's
// free compute from ever suspending and use up its monthly hours.
// ?db=1 also checks the database, for occasional manual checks.
export async function GET(request: Request) {
  const checkDb = new URL(request.url).searchParams.get("db") === "1";
  const headers = { "Cache-Control": "no-store" };

  if (!checkDb) {
    return NextResponse.json({ ok: true }, { headers });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok" }, { headers });
  } catch (error) {
    console.error("Health check: database unreachable:", error);
    return NextResponse.json({ ok: false, db: "unreachable" }, { status: 503, headers });
  }
}
