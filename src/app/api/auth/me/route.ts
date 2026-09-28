import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";

export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
