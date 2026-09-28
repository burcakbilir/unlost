import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { enrichLibraryItem } from "@/lib/library-enrichment";

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
  createdAt: true,
  updatedAt: true,
} as const;

type UpdateItemBody = {
  type?: string;
  title?: string;
  description?: string;
  source?: string;
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

  const item = await prisma.libraryItem.update({
    where: { id },
    data: {
      type: body?.type,
      title: body?.title?.trim(),
      description: body?.description?.trim(),
      source: body?.source?.trim(),
    },
    select: itemSelect,
  });

  const contentChanged = body?.title !== undefined || body?.description !== undefined;

  if (contentChanged) {
    after(async () => {
      try {
        await enrichLibraryItem(item.id, item.title, item.description);
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
