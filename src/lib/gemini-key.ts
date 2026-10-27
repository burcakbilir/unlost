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

// The only form of the key that ever leaves the server: enough for the user to
// recognize which key is saved (the last 4 characters, as GitHub and Stripe
// show tokens), too little to use it. The prefix is left out on purpose too;
// every Gemini key starts with the same "AIza", so it would only add noise.
export function maskApiKey(apiKey: string): string {
  return apiKey.length < 12 ? "••••" : `••••${apiKey.slice(-4)}`;
}
