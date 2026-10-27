import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { GeminiKeyError, GeminiQuotaError, embedText, toVectorLiteral } from "@/lib/gemini";
import { getUserGeminiKey } from "@/lib/gemini-key";
import {
  keywordSearch,
  keywordTerms,
  rankResults,
  semanticSearch,
  type MatchRow,
  type RankedMatch,
} from "@/lib/library-search";
import { BODY_LIMITS, BodyTooLargeError, bodyTooLarge, jsonError, readJsonBody, tooManyRequests, unauthorized } from "@/lib/http";
import { RATE_LIMITS, consumeRateLimit } from "@/lib/rate-limit";
import { firstIssueMessage, searchSchema } from "@/features/library/schema";

type SearchMode = "semantic" | "keyword";

// Finding matches costs at most one embedding request. Writing an answer from
// them is a separate, opt-in request (/api/search/answer), so a search the user
// only skims never spends generation quota.
export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return unauthorized();
  }

  let body: unknown;

  try {
    body = await readJsonBody(request, BODY_LIMITS.small);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return bodyTooLarge();
    throw error;
  }

  const parsed = searchSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(firstIssueMessage(parsed.error), 400);
  }

  const limited = await consumeRateLimit(RATE_LIMITS.searchByUser, user.id);

  if (!limited.ok) {
    return tooManyRequests(limited);
  }

  const { query } = parsed.data;
  const apiKey = await getUserGeminiKey(user.id);

  let mode: SearchMode = "keyword";
  let notice: string | null = apiKey
    ? null
    : "Add your Gemini API key in Settings to search by meaning, not just keywords.";
  let matches: RankedMatch<MatchRow>[] = [];
  const termCount = keywordTerms(query).length;

  if (apiKey) {
    try {
      const vectorLiteral = toVectorLiteral(await embedText(apiKey, query, "RETRIEVAL_QUERY"));
      // The keyword half runs in Postgres and costs no Gemini quota. It also
      // covers items that have no vector (saved before a key was added, or
      // whose embedding failed), so they don't silently disappear.
      const [semantic, keyword] = await Promise.all([
        semanticSearch(user.id, vectorLiteral),
        keywordSearch(user.id, query),
      ]);
      matches = rankResults(semantic.rows, keyword, termCount, semantic.stats);
      mode = "semantic";
    } catch (error) {
      if (error instanceof GeminiQuotaError) {
        notice = "Your Gemini key's free quota is used up for now, so this is a keyword search. It resets daily.";
      } else if (error instanceof GeminiKeyError) {
        notice = "Google rejected your Gemini API key, so this is a keyword search. Update it in Settings.";
      } else {
        console.error("Semantic search failed:", error);
        notice = "Smart search isn't available right now, so this is a keyword search.";
      }
    }
  }

  if (mode === "keyword") {
    // Text-only ranking: no similarity, so tiers come from word matches alone.
    matches = rankResults([], await keywordSearch(user.id, query), termCount, {
      baseline: null,
      total: 0,
    });
  }

  return NextResponse.json({
    mode,
    notice,
    // Only strong matches go to the model: weak ones would be noise in the answer.
    canAnswer: Boolean(apiKey) && matches.some((match) => match.confidence === "strong"),
    matches: matches.map(({ row: match, confidence }) => ({
      id: match.id,
      type: match.type,
      title: match.title,
      description: match.description,
      source: match.source,
      tags: match.tags,
      imageMimeType: match.imageMimeType,
      updatedAt: match.updatedAt,
      similarity: match.similarity,
      confidence,
    })),
  });
}
