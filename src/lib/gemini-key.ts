import "server-only";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/secret-box";

// Returns the user's decrypted Gemini key, or null if they haven't added one
// (or it can no longer be decrypted, e.g. after ENCRYPTION_KEY was rotated).
export async function getUserGeminiKey(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKeyEncrypted: true },
  });

  if (!user?.geminiApiKeyEncrypted) return null;

  try {
    return decryptSecret(user.geminiApiKeyEncrypted);
  } catch (error) {
    console.error(`Could not decrypt the Gemini key for user ${userId}:`, error);
    return null;
  }
}

// Shown in settings so the user can recognize which key is saved.
export function maskApiKey(apiKey: string): string {
  return apiKey.length <= 8 ? "••••" : `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}
