import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { scheduleEnrichment } from "@/lib/library-enrichment";
import { validateImageUpload, type ImageUpload } from "@/lib/image-upload";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests, unauthorized } from "@/lib/http";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { createItemSchema, firstIssueMessage, itemSelect } from "@/features/library/schema";

export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return unauthorized();
  }

  const items = await prisma.libraryItem.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: itemSelect,
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return unauthorized();
  }

  let body: unknown;

  try {
    body = await readJsonBody(request, BODY_LIMITS.item);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = createItemSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(firstIssueMessage(parsed.error), 400);
  }

  const limited = await consumeRateLimit(RATE_LIMITS.writeByUser, user.id);

  if (!limited.ok) {
    return tooManyRequests(limited);
  }

  const data = parsed.data;
  let image: ImageUpload | undefined;

  if (data.image) {
    const validation = validateImageUpload(data.image);

    if (!validation.ok) {
      return jsonError(validation.error, 400);
    }

    image = validation.value;
  }

  const item = await prisma.libraryItem.create({
    data: {
      ownerId: user.id,
      type: data.type,
      title: data.title,
      description: data.description,
      source: data.source,
      imageData: image?.bytes,
      imageMimeType: image?.mimeType,
    },
    select: itemSelect,
  });

  await scheduleEnrichment(after, user.id, item, image ?? null);

  return NextResponse.json({ item }, { status: 201 });
}
