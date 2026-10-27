import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { scheduleEnrichment } from "@/lib/library-enrichment";
import { validateImageUpload, type ImageUpload } from "@/lib/image-upload";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests, unauthorized } from "@/lib/http";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage, itemSelect, updateItemSchema } from "@/features/library/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;

  const existingItem = await prisma.libraryItem.findFirst({
    where: { id, ownerId: user.id },
    select: { updatedAt: true, type: true },
  });

  if (!existingItem) {
    return jsonError("Item not found", 404);
  }

  let body: unknown;

  try {
    body = await readJsonBody(request, BODY_LIMITS.item);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = updateItemSchema.safeParse(body);

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

  const nextType = data.type ?? existingItem.type;

  if (image && nextType !== "image") {
    return jsonError("Only image items can have an image", 400);
  }

  // Turning an image item into a link or note drops its image, so no hidden
  // image (or its AI caption) lingers in storage and in search.
  const dropsImage = existingItem.type === "image" && nextType !== "image";

  const contentChanged =
    data.title !== undefined ||
    data.description !== undefined ||
    image !== undefined ||
    dropsImage;

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.libraryItem.update({
      where: { id },
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        source: data.source,
        imageData: dropsImage ? null : image?.bytes,
        imageMimeType: dropsImage ? null : image?.mimeType,
        // A new (or removed) image makes the old AI caption wrong; enrichment
        // writes a fresh one for a new image.
        imageCaption: image || dropsImage ? null : undefined,
        // Enrichment treats a changed updatedAt as "superseded". Only edits that
        // schedule a fresh enrichment may bump it, or an in-flight run is dropped
        // with nothing to replace it.
        updatedAt: contentChanged ? undefined : existingItem.updatedAt,
      },
      select: itemSelect,
    });

    if (contentChanged) {
      // The old vector describes the old content. Clearing it means search
      // falls back to keywords for this item until re-embedding succeeds,
      // instead of matching on text that no longer exists.
      await tx.$executeRaw`UPDATE library_items SET embedding = NULL WHERE id = ${id}`;
    }

    return updated;
  });

  if (contentChanged) {
    await scheduleEnrichment(after, user.id, item, image ?? null);
  }

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return unauthorized();
  }

  const { id } = await params;

  // deleteMany scoped to the owner: one query, and another user's id simply
  // matches nothing.
  const { count } = await prisma.libraryItem.deleteMany({
    where: { id, ownerId: user.id },
  });

  if (count === 0) {
    return jsonError("Item not found", 404);
  }

  return NextResponse.json({ ok: true });
}
