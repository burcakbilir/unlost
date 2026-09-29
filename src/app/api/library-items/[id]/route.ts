import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { enrichLibraryItem } from "@/lib/library-enrichment";
import { isSafeHttpUrl } from "@/lib/safe-url";
import { validateImageUpload } from "@/lib/image-upload";

const captureTypes = ["link", "note", "image"] as const;

function isCaptureType(
  value: unknown,
): value is (typeof captureTypes)[number] {
  return typeof value === "string" && captureTypes.includes(value as never);
}

const itemSelect = {
  id: true,
  type: true,
  title: true,
  description: true,
  source: true,
  tags: true,
  imageMimeType: true,
  createdAt: true,
  updatedAt: true,
} as const;

type UpdateItemBody = {
  type?: string;
  title?: string;
  description?: string;
  source?: string;
  image?: { data: string; mimeType: string };
};

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existingItem = await prisma.libraryItem.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!existingItem) {
    return NextResponse.json({ message: "Item not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as UpdateItemBody | null;

  if (body?.type !== undefined && !isCaptureType(body.type)) {
    return NextResponse.json({ message: "Invalid capture type" }, { status: 400 });
  }

  const source = body?.source !== undefined ? body.source.trim() : undefined;

  if (source && !isSafeHttpUrl(source)) {
    return NextResponse.json(
      { message: "Link must be a valid http(s) URL" },
      { status: 400 },
    );
  }

  let imageBuffer: Uint8Array<ArrayBuffer> | undefined;
  let imageMimeType: string | undefined;

  if (body?.image) {
    const validation = validateImageUpload(body.image);

    if (!validation.ok) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    imageBuffer = new Uint8Array(
      Buffer.from(validation.value.data, "base64"),
    ) as Uint8Array<ArrayBuffer>;
    imageMimeType = validation.value.mimeType;
  }

  const item = await prisma.libraryItem.update({
    where: { id },
    data: {
      type: body?.type,
      title: body?.title?.trim(),
      description: body?.description?.trim(),
      source,
      imageData: imageBuffer,
      imageMimeType,
    },
    select: itemSelect,
  });

  const contentChanged =
    body?.title !== undefined ||
    body?.description !== undefined ||
    body?.image !== undefined;

  if (contentChanged) {
    after(async () => {
      try {
        await enrichLibraryItem(
          item.id,
          item.title,
          item.description,
          body?.image ? { data: body.image.data, mimeType: body.image.mimeType } : null,
        );
      } catch (error) {
        console.error(`Failed to enrich library item ${item.id}:`, error);
      }
    });
  }

  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existingItem = await prisma.libraryItem.findFirst({
    where: { id, ownerId: user.id },
  });

  if (!existingItem) {
    return NextResponse.json({ message: "Item not found" }, { status: 404 });
  }

  await prisma.libraryItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
