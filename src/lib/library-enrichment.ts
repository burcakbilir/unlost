import { prisma } from "@/lib/prisma";
import { embedText, suggestTags, toVectorLiteral } from "@/lib/gemini";

export async function enrichLibraryItem(
  id: string,
  title: string,
  description: string,
): Promise<void> {
  const content = `${title}\n${description}`.trim();

  if (!content) return;

  const [embedding, tags] = await Promise.allSettled([
    embedText(content, "RETRIEVAL_DOCUMENT"),
    suggestTags(title, description),
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
