import { NextResponse } from "next/server";
import { z } from "@/lib/zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { clearSessionCookie } from "@/lib/auth-cookies";
import { verifyPassword } from "@/lib/password";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests, unauthorized } from "@/lib/http";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/features/library/schema";

const deleteAccountSchema = z.object({
  password: z.string({ error: "Password is required" }).min(1, "Password is required").max(200),
});

// Permanently deletes the account and, via the cascade, every saved item and
// image. Asking for the password again means a hijacked session alone can't do it.
export async function DELETE(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await readJsonBody(request, BODY_LIMITS.small);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(firstIssueMessage(parsed.error), 400);
  }

  const limited = await consumeRateLimit(RATE_LIMITS.loginByEmail, user.email);
  if (!limited.ok) return tooManyRequests(limited);

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!account || !(await verifyPassword(parsed.data.password, account.passwordHash))) {
    return jsonError("Incorrect password", 401);
  }

  await prisma.user.delete({ where: { id: user.id } });
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
