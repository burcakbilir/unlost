import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/auth";
import { answerFromMatches, embedText, toVectorLiteral } from "@/lib/gemini";

type SearchBody = { query?: string };

type MatchRow = {
  id: string;
  type: string;
  title: string;
  description: string;
  imageCaption: string | null;
  source: string;
  tags: string[];
  updatedAt: Date;
  similarity: number;
};

export async function POST(request: Request) {
  const user = await getRequestUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SearchBody | null;
  const query = body?.query?.trim();

  if (!query) {
    return NextResponse.json({ message: "Query is required" }, { status: 400 });
  }

  let queryEmbedding: number[];

  try {
    queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");
  } catch (error) {
    console.error("Failed to embed search query:", error);
    return NextResponse.json(
      { message: "Search isn't available right now. Check that GEMINI_API_KEY is set." },
      { status: 503 },
    );
  }

  const vectorLiteral = toVectorLiteral(queryEmbedding);

  const matches = await prisma.$queryRaw<MatchRow[]>`
    SELECT id, type, title, description, "imageCaption", source, tags, "updatedAt",
           1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM library_items
    WHERE "ownerId" = ${user.id} AND embedding IS NOT NULL
    ORDER BY embedding <=> ${vectorLiteral}::vector
    LIMIT 8
  `;

  let answer: string;

  try {
    answer = await answerFromMatches(
      query,
      matches.map((match) => ({
        id: match.id,
        title: match.title,
        description: [match.description, match.imageCaption].filter(Boolean).join("\n"),
        source: match.source,
      })),
    );
  } catch (error) {
    console.error("Failed to synthesize search answer:", error);
    answer = "Found some matches, but couldn't generate a summary right now.";
  }

  return NextResponse.json({
    answer,
    matches: matches.map((match) => ({
      id: match.id,
      type: match.type,
      title: match.title,
      description: match.description,
      source: match.source,
      tags: match.tags,
      updatedAt: match.updatedAt,
      similarity: match.similarity,
    })),
  });
}
