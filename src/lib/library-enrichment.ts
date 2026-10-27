import "server-only";
import { prisma } from "@/lib/prisma";
import { analyzeItem, embedText, toVectorLiteral } from "@/lib/gemini";
import { getUserGeminiKey } from "@/lib/gemini-key";

type ImageInput = {
  data: string;
  mimeType: string;
};

// `version` is the item's updatedAt when this run was scheduled. Every write is
// conditional on it, so a slow run for an older edit can't overwrite results
// from a newer one. Writes also pin updatedAt to the same value, so enrichment
// itself doesn't count as an edit.
//
// Costs the user's quota at most two requests: one generation (tags, plus an
// image caption when there's a new image) and one embedding.
export async function enrichLibraryItem(
  apiKey: string,
  id: string,
  version: Date,
  title: string,
  description: string,
  image?: ImageInput | null,
): Promise<void> {
  let imageCaption: string | null = null;
  let tags: string[] | null = null;

  try {
    const analysis = await analyzeItem(apiKey, { title, description, image });
    tags = analysis.tags;
    imageCaption = analysis.imageCaption;
  } catch (error) {
    console.error(`Failed to analyze library item ${id}:`, error);
  }

  if (!image) {
    // No new image: keep the caption written for the current one, if any.
    const existing = await prisma.libraryItem.findUnique({
      where: { id },
      select: { imageCaption: true },
    });
    imageCaption = existing?.imageCaption ?? null;
  }

  // imageCaption is never shown to the user — it only feeds search/tagging,
  // so the visible `description` stays exactly what the user typed (or empty).
  const searchableText = [description, imageCaption].filter(Boolean).join("\n");
  const content = `${title}\n${searchableText}`.trim();

  let vectorLiteral: string | null = null;

  if (content) {
    try {
      vectorLiteral = toVectorLiteral(await embedText(apiKey, content, "RETRIEVAL_DOCUMENT"));
    } catch (error) {
      console.error(`Failed to embed library item ${id}:`, error);
    }
  }

  await prisma.$transaction(async (tx) => {
    // updateMany locks the row, so a concurrent PATCH waits for this to finish.
    const { count } = await tx.libraryItem.updateMany({
      where: { id, updatedAt: version },
      data: {
        ...(tags && { tags }),
        ...(image && { imageCaption }),
        updatedAt: version,
      },
    });

    if (count === 0 || !vectorLiteral) return;

    await tx.$executeRaw`
      UPDATE library_items SET embedding = ${vectorLiteral}::vector WHERE id = ${id}
    `;
  });
}

// Runs enrichment after the response is sent, on the owner's own Gemini key.
// Without a key the item is still saved and findable by keyword search; it just
// gets no tags or semantic embedding.
export async function scheduleEnrichment(
  schedule: (task: () => Promise<void>) => void,
  ownerId: string,
  item: { id: string; updatedAt: Date; title: string; description: string },
  image: ImageInput | null,
): Promise<void> {
  const apiKey = await getUserGeminiKey(ownerId);
  if (!apiKey) return;

  schedule(async () => {
    try {
      await enrichLibraryItem(apiKey, item.id, item.updatedAt, item.title, item.description, image);
    } catch (error) {
      console.error(`Failed to enrich library item ${item.id}:`, error);
    }
  });
}
