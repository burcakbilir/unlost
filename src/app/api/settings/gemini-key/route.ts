import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/secret-box";
import { GeminiQuotaError, validateGeminiApiKey } from "@/lib/gemini";
import { maskApiKey } from "@/lib/gemini-key";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests, unauthorized } from "@/lib/http";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage } from "@/features/library/schema";

const apiKeySchema = z.object({
  apiKey: z
    .string({ error: "API key is required" })
    .trim()
    .min(20, "That doesn't look like a Gemini API key")
    .max(200, "That doesn't look like a Gemini API key")
    .regex(/^[A-Za-z0-9_-]+$/, "That doesn't look like a Gemini API key"),
});

export async function PUT(request: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await readJsonBody(request, BODY_LIMITS.small);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = apiKeySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(firstIssueMessage(parsed.error), 400);
  }

  const limited = await consumeRateLimit(RATE_LIMITS.apiKeyByUser, user.id);
  if (!limited.ok) return tooManyRequests(limited);

  const { apiKey } = parsed.data;

  // Check the key before saving it, so a typo surfaces now rather than as
  // silently missing tags and search later. This call spends no quota.
  try {
    if (!(await validateGeminiApiKey(apiKey))) {
      return jsonError("Google rejected this API key. Check that you copied all of it.", 400);
    }
  } catch (error) {
    if (error instanceof GeminiQuotaError) {
      return jsonError("Google is rate limiting this key right now. Try again in a minute.", 429);
    }
    console.error("Gemini key validation failed:", error);
    return jsonError("Couldn't reach Google to check the key. Try again shortly.", 503);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { geminiApiKeyEncrypted: encryptSecret(apiKey) },
  });

  return NextResponse.json({ geminiKey: { masked: maskApiKey(apiKey) } });
}

export async function DELETE() {
  const user = await getRequestUser();
  if (!user) return unauthorized();

  await prisma.user.update({
    where: { id: user.id },
    data: { geminiApiKeyEncrypted: null },
  });

  return NextResponse.json({ geminiKey: null });
}
