import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { burnPasswordCheck, verifyPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth-cookies";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { RATE_LIMITS, clientIp, consumeRateLimits } from "@/lib/rate-limit";
import { loginSchema } from "@/features/auth/schema";
import { firstIssueMessage } from "@/features/library/schema";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await readJsonBody(request, BODY_LIMITS.small);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(firstIssueMessage(parsed.error), 400);
  }

  const { email, password } = parsed.data;

  // Per-IP stops one machine guessing across many accounts; per-email stops
  // many machines guessing one account's password.
  const limited = await consumeRateLimits([
    { rule: RATE_LIMITS.loginByIp, identifier: clientIp(request) },
    { rule: RATE_LIMITS.loginByEmail, identifier: email },
  ]);

  if (!limited.ok) {
    return tooManyRequests(limited);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Same message — and, via burnPasswordCheck, the same timing — whether the
  // email is unknown or the password is wrong, so this endpoint can't be used
  // to discover which emails exist.
  const invalidCredentials = jsonError("Invalid email or password", 401);

  if (!user) {
    await burnPasswordCheck(password);
    return invalidCredentials;
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    return invalidCredentials;
  }

  await setSessionCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email },
  });
}
