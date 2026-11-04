import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie } from "@/lib/auth-cookies";
import { sessionCookieName, verifySessionToken } from "@/lib/session";

// Clearing the cookie alone leaves the token itself valid until it expires, so
// a copied token would keep working. Bumping sessionVersion revokes it, and
// with it every other session of this user (sign out everywhere).
export async function POST() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (session) {
    // Conditional on the token's version: an already-revoked token can't be
    // replayed to sign the user out of their newer sessions.
    await prisma.user.updateMany({
      where: { id: session.userId, sessionVersion: session.sessionVersion },
      data: { sessionVersion: { increment: 1 } },
    });
  }

  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
