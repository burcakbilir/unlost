const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const GENERATION_MODEL = "gemini-3.1-flash-lite";

function requireGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "replace-with-your-gemini-api-key") {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

type EmbedTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export async function embedText(
  text: string,
  taskType: EmbedTaskType,
): Promise<number[]> {
  const apiKey = requireGeminiApiKey();

  const response = await fetch(
    `${API_BASE}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini embedContent failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] };
  };

  const values = data.embedding?.values;

  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Gemini embedContent returned an unexpected shape.");
  }

  return values;
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function suggestTags(
  title: string,
  description: string,
): Promise<string[]> {
  const apiKey = requireGeminiApiKey();

  const response = await fetch(
    `${API_BASE}/models/${GENERATION_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Suggest 2-4 short lowercase tags (single words or short phrases, no hashtags) that describe this saved item. Reply with tags only, no commentary.\n\nTitle: ${title}\nDescription: ${description}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              tags: {
                type: "array",
                items: { type: "string" },
                maxItems: 4,
              },
            },
            required: ["tags"],
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini generateContent failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error("Gemini generateContent returned no text.");
  }

  const parsed = JSON.parse(rawText) as { tags?: unknown };

  if (!Array.isArray(parsed.tags)) {
    throw new Error("Gemini generateContent returned an unexpected shape.");
  }

  return parsed.tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 4);
}

export type SearchMatch = {
  id: string;
  title: string;
  description: string;
  source: string;
};

export async function answerFromMatches(
  question: string,
  matches: SearchMatch[],
): Promise<string> {
  const apiKey = requireGeminiApiKey();

  if (matches.length === 0) {
    return "Nothing in your library looks related to that yet.";
  }

  const context = matches
    .map(
      (match, index) =>
        `[${index + 1}] ${match.title}\n${match.description}${match.source ? `\nSource: ${match.source}` : ""}`,
    )
    .join("\n\n");

  const response = await fetch(
    `${API_BASE}/models/${GENERATION_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You help someone recall things they saved earlier. Answer the question using ONLY the numbered items below — never invent information that isn't there. Cite items by their number in brackets, e.g. [1]. If none of the items actually answer the question, say so plainly instead of guessing.\n\nQuestion: ${question}\n\nSaved items:\n${context}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 300,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Gemini generateContent failed (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!answer) {
    throw new Error("Gemini generateContent returned no text.");
  }

  return answer.trim();
}
