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
  // Cosine similarity to the query; null for items found only by text.
  similarity: number | null;
  // Text search only: query words found as words (or word prefixes) in the
  // item, words only found by typo tolerance, and the full-text rank.
  keywordHits?: number;
  typoHits?: number;
  textRank?: number;
};

export type Confidence = "strong" | "possible";
export type RankedMatch<T> = { row: T; confidence: Confidence };

// Search costs one embedding request and nothing more. Everything below runs
// in Postgres on data written at save time, so it's free:
// - meaning: cosine similarity between the query and each item's embedding;
// - text: Postgres full-text search over the title, description, tags and the
//   hidden keywords and example questions the model wrote when the item was
//   saved (prefix matching for Turkish suffixes, trigram matching for typos).
//
// The two rankings are merged with Reciprocal Rank Fusion, which adds up
// positions, not raw scores, so it doesn't matter that cosine scores bunch up.
//
// Results come in two tiers instead of being hidden or shown by one cutoff:
// - strong: the query's words are in the item, or its meaning clearly stands
//   out from the rest of the library for this query;
// - possible: a weaker signal. The UI folds these away, so a vague query
//   ("llm", "rag") never presents noise as an answer, but nothing that might
//   be relevant is lost either.
//
// Why no fixed cutoff decides alone: gemini-embedding-001 (768 dims) gives
// unrelated items 0.58-0.62 and related ones 0.60-0.75 depending on query
// length and language. Real searches: "yazılım" -> pgvector 0.680, UI guide
// 0.649 (relevant), card payment 0.621, rent note 0.618; "llm" -> pgvector
// 0.595, rent note 0.593 (both noise).
export const STRONG_FLOOR = 0.6;
export const POSSIBLE_FLOOR = 0.57;
// "Stands out": this far above the library's 25th-percentile score for the query.
export const DISTINCT_MARGIN = 0.025;
// With fewer items than this the baseline is meaningless; use a fixed floor.
export const MIN_ITEMS_FOR_BASELINE = 4;
export const FALLBACK_FLOOR = 0.63;
// When the best match is strong, items far behind it aren't strong.
export const RELATIVE_MARGIN = 0.08;
// At least half the query's words found in the item.
export const STRONG_KEYWORD_RATIO = 0.5;
export const MAX_STRONG = 8;
export const MAX_POSSIBLE = 3;
// Standard RRF constant: dampens the gap between rank 1 and rank 2.
const RRF_K = 60;

export type LibraryStats = {
  // 25th percentile similarity of all the user's embedded items to the query.
  baseline: number | null;
  total: number;
};

export function rankResults<T extends MatchRow>(
  semantic: T[],
  text: T[],
  termCount: number,
  stats: LibraryStats,
): RankedMatch<T>[] {
  const byId = new Map<string, T>();
  const rrf = new Map<string, number>();
  const addRank = (rows: T[]) =>
    rows.forEach((row, index) => {
      rrf.set(row.id, (rrf.get(row.id) ?? 0) + 1 / (RRF_K + index + 1));
      if (!byId.has(row.id)) byId.set(row.id, row);
    });

  // Semantic rows arrive sorted by similarity; text rows by text rank.
  addRank(semantic);
  addRank([...text].sort((a, b) => (b.textRank ?? 0) - (a.textRank ?? 0)));

  const hits = new Map(text.map((row) => [row.id, row.keywordHits ?? 0]));
  const typoHits = new Map(text.map((row) => [row.id, row.typoHits ?? 0]));
  const similarity = new Map(semantic.map((row) => [row.id, row.similarity ?? 0]));

  const best = Math.max(0, ...semantic.map((row) => row.similarity ?? 0));
  const standsOut =
    stats.total >= MIN_ITEMS_FOR_BASELINE && stats.baseline !== null
      ? Math.max(STRONG_FLOOR, stats.baseline + DISTINCT_MARGIN)
      : FALLBACK_FLOOR;
  const strongCutoff = Math.max(standsOut, best - RELATIVE_MARGIN);
  const possibleCutoff = Math.max(POSSIBLE_FLOOR, stats.baseline ?? 0);

  const ranked = [...byId.values()]
    .map((row) => {
      const ratio = termCount > 0 ? (hits.get(row.id) ?? 0) / termCount : 0;
      const sim = similarity.get(row.id);
      const strong = ratio >= STRONG_KEYWORD_RATIO || (sim !== undefined && sim >= strongCutoff);
      // A typo match alone is only ever "possible": trigram similarity also
      // pairs unrelated look-alike words ("bileti" with an unrelated note).
      const possible =
        (hits.get(row.id) ?? 0) > 0 ||
        (typoHits.get(row.id) ?? 0) > 0 ||
        (sim !== undefined && sim >= possibleCutoff);
      const confidence: Confidence | null = strong ? "strong" : possible ? "possible" : null;
      return { row, confidence, score: rrf.get(row.id) ?? 0 };
    })
    .filter((match): match is { row: T; confidence: Confidence; score: number } => match.confidence !== null)
    .sort((a, b) => b.score - a.score);

  const strong = ranked.filter((match) => match.confidence === "strong").slice(0, MAX_STRONG);
  const possible = ranked.filter((match) => match.confidence === "possible").slice(0, MAX_POSSIBLE);

  return [...strong, ...possible].map(({ row, confidence }) => ({ row, confidence }));
}

// The nearest items by meaning, plus how the whole library scored for the same
// query. One query, no extra Gemini request: the stats use stored vectors.
export async function semanticSearch(
  ownerId: string,
  vectorLiteral: string,
): Promise<{ rows: MatchRow[]; stats: LibraryStats }> {
  const rows = await prisma.$queryRaw<(MatchRow & { baseline: number | null; total: number })[]>`
    WITH scored AS (
      SELECT id, type, title, description, source, tags, "imageMimeType", "updatedAt",
             1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM library_items
      WHERE "ownerId" = ${ownerId} AND embedding IS NOT NULL
    ),
    stats AS (
      SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY similarity) AS baseline,
             count(*)::int AS total
      FROM scored
    )
    SELECT scored.*, stats.baseline, stats.total
    FROM scored CROSS JOIN stats
    ORDER BY scored.similarity DESC
    LIMIT ${MAX_STRONG}
  `;

  return {
    // The extra baseline/total columns ride along harmlessly: the route picks
    // the fields it returns explicitly.
    rows,
    stats: { baseline: rows[0]?.baseline ?? null, total: rows[0]?.total ?? 0 },
  };
}

// Words worth matching on: drops short filler like "the", "a", "ve". Letters
// and digits only, so they're safe to place inside a tsquery. No lowercasing
// here: Postgres does it, and JS lowercasing mangles Turkish "İ".
export function keywordTerms(query: string): string[] {
  const words = query
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= 3);

  return [...new Set(words)].slice(0, 8);
}

// "elbise" -> elbise:*  (prefix: also finds "elbiseler"; Turkish adds suffixes)
export function prefixQuery(terms: string[]): string {
  return terms.map((term) => `${term}:*`).join(" | ");
}

// Typos only for longer words: a 3-letter term like "rag" would loosely match
// too many unrelated words.
export const TYPO_MIN_LENGTH = 5;
export const TYPO_SIMILARITY = 0.5;

// Free text search in Postgres: works without a Gemini key, when the key's
// quota is used up, and for items that were never embedded. "simple" config:
// no language-specific stemming, because libraries mix Turkish and English.
export async function keywordSearch(ownerId: string, query: string): Promise<MatchRow[]> {
  const terms = keywordTerms(query);
  if (terms.length === 0) return [];

  return prisma.$queryRaw<MatchRow[]>`
    WITH docs AS (
      SELECT id, type, title, description, source, tags, "imageMimeType", "updatedAt",
             setweight(to_tsvector('simple', title), 'A') ||
             setweight(to_tsvector('simple',
               array_to_string(tags, ' ') || ' ' || array_to_string("searchKeywords", ' ')), 'B') ||
             setweight(to_tsvector('simple',
               description || ' ' || coalesce("imageCaption", '')), 'C') AS doc,
             concat_ws(' ', title, description, "imageCaption",
               array_to_string(tags, ' '), array_to_string("searchKeywords", ' ')) AS body
      FROM library_items
      WHERE "ownerId" = ${ownerId}
    ),
    matched AS (
      SELECT docs.*,
             ts_rank(doc, to_tsquery('simple', ${prefixQuery(terms)})) AS "textRank",
             (
               SELECT count(*)::int FROM unnest(${terms}::text[]) AS term
               WHERE doc @@ to_tsquery('simple', term || ':*')
             ) AS "keywordHits",
             (
               SELECT count(*)::int FROM unnest(${terms}::text[]) AS term
               WHERE NOT doc @@ to_tsquery('simple', term || ':*')
                 AND length(term) >= ${TYPO_MIN_LENGTH}
                 AND word_similarity(term, body) >= ${TYPO_SIMILARITY}
             ) AS "typoHits"
      FROM docs
    )
    SELECT id, type, title, description, source, tags, "imageMimeType", "updatedAt",
           NULL::float AS similarity, "keywordHits", "typoHits", "textRank"
    FROM matched
    WHERE "keywordHits" > 0 OR "typoHits" > 0
    ORDER BY "keywordHits" DESC, "textRank" DESC, "typoHits" DESC
    LIMIT ${MAX_STRONG}
  `;
}
