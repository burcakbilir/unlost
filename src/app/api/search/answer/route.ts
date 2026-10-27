import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { GeminiKeyError, GeminiQuotaError, answerFromSources } from "@/lib/gemini";
import { getUserGeminiKey } from "@/lib/gemini-key";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests, unauthorized } from "@/lib/http";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { answerSchema, firstIssueMessage } from "@/features/library/schema";

// The one generation request in search, sent only when the user asks for it.
export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return unauthorized();
  }

  let body: unknown;

  try {
    body = await readJsonBody(request, BODY_LIMITS.small);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = answerSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(firstIssueMessage(parsed.error), 400);
  }

  const apiKey = await getUserGeminiKey(user.id);

  if (!apiKey) {
    return jsonError("Add your Gemini API key in Settings to get AI answers.", 400);
  }

  const limited = await consumeRateLimit(RATE_LIMITS.answerByUser, user.id);

  if (!limited.ok) {
    return tooManyRequests(limited);
  }

  const { query, itemIds } = parsed.data;

  // Re-read the items server-side, scoped to the owner: the client only says
  // which ones, never what they contain, so it can't feed the model other text.
  const items = await prisma.libraryItem.findMany({
    where: { ownerId: user.id, id: { in: itemIds } },
    select: { id: true, title: true, description: true, imageCaption: true, source: true },
  });
  const byId = new Map(items.map((item) => [item.id, item]));
  // Keep the client's order: the answer cites items as [1], [2]… in that order.
  const sources = itemIds.flatMap((id) => {
    const item = byId.get(id);
    return item
      ? [{
          title: item.title,
          description: [item.description, item.imageCaption].filter(Boolean).join("\n"),
          source: item.source,
        }]
      : [];
  });

  try {
    return NextResponse.json({ answer: await answerFromSources(apiKey, query, sources) });
  } catch (error) {
    if (error instanceof GeminiQuotaError) {
      return jsonError("Your Gemini key's free quota is used up for now. It resets daily.", 429);
    }
    if (error instanceof GeminiKeyError) {
      return jsonError("Google rejected your Gemini API key. Update it in Settings.", 400);
    }
    console.error("Failed to generate search answer:", error);
    return jsonError("Couldn't write an answer right now. Your matches are still listed.", 503);
  }
}
