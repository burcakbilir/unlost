import { prisma } from "@/lib/prisma";
import { describeImage, embedText, suggestTags, toVectorLiteral } from "@/lib/gemini";

type ImageInput = {
  data: string;
  mimeType: string;
};

export async function enrichLibraryItem(
  id: string,
  title: string,
  description: string,
  image?: ImageInput | null,
): Promise<void> {
  let imageCaption: string | null = null;

  if (image) {
    try {
      imageCaption = await describeImage(image.data, image.mimeType);
      await prisma.libraryItem.update({
        where: { id },
        data: { imageCaption },
      });
    } catch (error) {
      console.error(`Failed to describe image for library item ${id}:`, error);
    }
  } else {
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

  if (!content) return;

  const [embedding, tags] = await Promise.allSettled([
    embedText(content, "RETRIEVAL_DOCUMENT"),
    suggestTags(title, searchableText),
  ]);

  const vectorLiteral =
    embedding.status === "fulfilled" ? toVectorLiteral(embedding.value) : null;
  const resolvedTags = tags.status === "fulfilled" ? tags.value : [];

  if (embedding.status === "rejected") {
    console.error(`Failed to embed library item ${id}:`, embedding.reason);
  }
  if (tags.status === "rejected") {
    console.error(`Failed to tag library item ${id}:`, tags.reason);
  }

  if (vectorLiteral) {
    await prisma.$executeRaw`
      UPDATE library_items
      SET embedding = ${vectorLiteral}::vector, tags = ${resolvedTags}
      WHERE id = ${id}
    `;
  } else if (resolvedTags.length > 0) {
    await prisma.libraryItem.update({
      where: { id },
      data: { tags: resolvedTags },
    });
  }
}
