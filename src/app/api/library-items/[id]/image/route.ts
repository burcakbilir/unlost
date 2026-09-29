import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.libraryItem.findFirst({
    where: { id, ownerId: user.id },
    select: { imageData: true, imageMimeType: true },
  });

  if (!item?.imageData || !item.imageMimeType) {
    return NextResponse.json({ message: "Image not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(item.imageData), {
    headers: {
      "Content-Type": item.imageMimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
