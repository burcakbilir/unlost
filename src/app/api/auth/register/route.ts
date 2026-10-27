import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/auth-cookies";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests } from "@/lib/http";
import { RATE_LIMITS, clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/features/auth/schema";
import { firstIssueMessage } from "@/features/library/schema";

class InviteUnavailableError extends Error {}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await readJsonBody(request, BODY_LIMITS.small);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(firstIssueMessage(parsed.error), 400);
  }

  const limited = await consumeRateLimit(RATE_LIMITS.registerByIp, clientIp(request));

  if (!limited.ok) {
    return tooManyRequests(limited);
  }

  const { name, email, password, inviteCode } = parsed.data;
  const invalidInvite = jsonError("This invite code is invalid or has already been used", 400);

  const invite = await prisma.inviteCode.findUnique({ where: { code: inviteCode } });

  // usedAt, not usedById: if the account is later deleted, usedById is cleared
  // but the code must stay spent.
  if (!invite || invite.usedAt) {
    return invalidInvite;
  }

  // Invite-only sign-up means only invited people can learn whether an email is
  // taken, which keeps this 409 from being a public account-lookup tool.
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return jsonError("Email is already registered", 409);
  }

  const passwordHash = await hashPassword(password);

  let user;

  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, passwordHash },
      });

      // Conditional claim: if another sign-up redeemed this code a moment ago,
      // nothing matches and the whole transaction (including the user) rolls back.
      const { count } = await tx.inviteCode.updateMany({
        where: { code: inviteCode, usedAt: null },
        data: { usedById: created.id, usedAt: new Date() },
      });

      if (count === 0) {
        throw new InviteUnavailableError();
      }

      return created;
    });
  } catch (error) {
    if (error instanceof InviteUnavailableError) {
      return invalidInvite;
    }
    // Two concurrent sign-ups can both pass the findUnique check above.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Email is already registered", 409);
    }
    throw error;
  }

  await setSessionCookie(user.id);

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 },
  );
}
