import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { getUserGeminiKey, maskApiKey } from "@/lib/gemini-key";
import { unauthorized } from "@/lib/http";

export async function GET() {
  const user = await getRequestUser();

  if (!user) {
    return unauthorized();
  }

  const apiKey = await getUserGeminiKey(user.id);

  return NextResponse.json({
    user,
    geminiKey: apiKey ? { masked: maskApiKey(apiKey) } : null,
  });
}
