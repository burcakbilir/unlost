import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { enrichLibraryItem } from "@/lib/library-enrichment";
import { isSafeHttpUrl } from "@/lib/safe-url";

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

export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.libraryItem.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    select: itemSelect,
  });

  return NextResponse.json({ items });
}

type CreateItemBody = {
  type?: string;
  title?: string;
  description?: string;
  source?: string;
};

export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as CreateItemBody | null;

  if (!body?.title?.trim()) {
    return NextResponse.json({ message: "Title is required" }, { status: 400 });
  }

  if (body.type !== undefined && !isCaptureType(body.type)) {
    return NextResponse.json({ message: "Invalid capture type" }, { status: 400 });
  }

  const source = body.source?.trim() ?? "";

  if (source && !isSafeHttpUrl(source)) {
    return NextResponse.json(
      { message: "Link must be a valid http(s) URL" },
      { status: 400 },
    );
  }

  const item = await prisma.libraryItem.create({
    data: {
      ownerId: user.id,
      type: body.type ?? "note",
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      source,
    },
    select: itemSelect,
  });

  after(async () => {
    try {
      await enrichLibraryItem(item.id, item.title, item.description);
    } catch (error) {
      console.error(`Failed to enrich library item ${item.id}:`, error);
    }
  });

  return NextResponse.json({ item }, { status: 201 });
}
