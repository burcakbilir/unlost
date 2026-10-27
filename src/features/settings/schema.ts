import { z } from "@/lib/zod";

const notAKey = "That doesn't look like a Gemini API key";

// Only a sanity check before asking Google: Google decides whether a key is
// valid. Key formats change (newer keys aren't just letters and digits), so
// anything stricter here ends up rejecting real keys.
export const apiKeySchema = z.object({
  apiKey: z
    .string({ error: "API key is required" })
    .trim()
    // Pasted with quotes, e.g. from a .env file: "AIza..."
    .transform((value) => value.replace(/^["']|["']$/g, ""))
    .pipe(
      z
        .string()
        .min(20, notAKey)
        .max(300, notAKey)
        .regex(/^[\x21-\x7E]+$/, "The key shouldn't contain spaces or special characters"),
    ),
});
