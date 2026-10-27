import "server-only";
import { prisma } from "@/lib/prisma";

export type MatchRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  source: string;
  tags: string[];
  imageMimeType: string | null;
  updatedAt: Date;
  similarity: number | null;
};

// Tuned on real data: unrelated items scored ~0.56-0.60 against a query, while
// genuinely relevant ones scored 0.65+. Filtering here (not just in the UI)
// means unrelated items never reach the model when the user asks for an answer.
export const MIN_SIMILARITY = 0.6;
export const MAX_MATCHES = 8;

export async function semanticSearch(
  ownerId: string,
  vectorLiteral: string,
): Promise<MatchRow[]> {
  return prisma.$queryRaw<MatchRow[]>`
    SELECT id, type, title, description, source, tags, "imageMimeType", "updatedAt", similarity
    FROM (
      SELECT id, type, title, description, source, tags, "imageMimeType", "updatedAt",
             1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM library_items
      WHERE "ownerId" = ${ownerId} AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${MAX_MATCHES}
    ) AS nearest
    WHERE similarity >= ${MIN_SIMILARITY}
    ORDER BY similarity DESC
  `;
}

// Words worth matching on: drops short filler like "the", "a", "ve".
export function keywordTerms(query: string): string[] {
  // No lowercasing here: ILIKE is already case-insensitive, and JS lowercasing
  // gets Turkish İ/I wrong one way or the other.
  const words = query
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 3);

  return [...new Set(words)].slice(0, 8);
}

function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

// Needs no AI at all, so search keeps working without a Gemini key, when the
// key's quota is used up, and for items that were never embedded. Ranks by how
// many of the query's words appear in the title, description, caption or tags.
export async function keywordSearch(
  ownerId: string,
  query: string,
  options: { onlyUnembedded?: boolean } = {},
): Promise<MatchRow[]> {
  const terms = keywordTerms(query);
  if (terms.length === 0) return [];

  const patterns = terms.map(likePattern);

  return prisma.$queryRaw<MatchRow[]>`
    SELECT id, type, title, description, source, tags, "imageMimeType", "updatedAt",
           NULL::float AS similarity
    FROM (
      SELECT *,
             (
               SELECT count(*) FROM unnest(${patterns}::text[]) AS pattern
               WHERE concat_ws(' ', title, description, "imageCaption", array_to_string(tags, ' '))
                     ILIKE pattern
             ) AS score
      FROM library_items
      WHERE "ownerId" = ${ownerId}
        AND (${!options.onlyUnembedded} OR embedding IS NULL)
    ) AS scored
    WHERE score > 0
    ORDER BY score DESC, "updatedAt" DESC
    LIMIT ${MAX_MATCHES}
  `;
}
