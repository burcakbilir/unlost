import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GeminiKeyError,
  GeminiQuotaError,
  analyzeItem,
  answerFromSources,
  embedText,
  normalizeTags,
  validateGeminiApiKey,
} from "@/lib/gemini";

// No test here talks to Google: fetch is replaced, so the suite spends no quota.
function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const generated = (text: string) => json({ candidates: [{ content: { parts: [{ text }] } }] });

afterEach(() => vi.unstubAllGlobals());

describe("analyzeItem", () => {
  it("gets tags and an image caption from a single request", async () => {
    const fetchMock = mockFetch(generated('{"tags":["Design"," UI ","design"],"caption":"A blue dashboard."}'));

    const result = await analyzeItem("key", {
      title: "Dashboard idea",
      description: "",
      image: { data: "aGVsbG8=", mimeType: "image/png" },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ tags: ["design", "ui"], imageCaption: "A blue dashboard." });
  });

  it("sends the user's key, never one from the server environment", async () => {
    const fetchMock = mockFetch(generated('{"tags":["a"]}'));
    await analyzeItem("user-key-123", { title: "t", description: "d" });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("user-key-123");
  });

  it("returns no caption when there is no image", async () => {
    mockFetch(generated('{"tags":["a"],"caption":"ignored"}'));
    const result = await analyzeItem("key", { title: "t", description: "d" });
    expect(result.imageCaption).toBeNull();
  });
});

describe("error classification", () => {
  it("turns 429 into GeminiQuotaError", async () => {
    mockFetch(json({ error: {} }, 429));
    await expect(embedText("key", "q", "RETRIEVAL_QUERY")).rejects.toBeInstanceOf(GeminiQuotaError);
  });

  it("turns an invalid key into GeminiKeyError", async () => {
    mockFetch(json({ error: { details: [{ reason: "API_KEY_INVALID" }] } }, 400));
    await expect(embedText("key", "q", "RETRIEVAL_QUERY")).rejects.toBeInstanceOf(GeminiKeyError);
  });

  it("rejects embeddings of the wrong size", async () => {
    mockFetch(json({ embedding: { values: [0.1, 0.2] } }));
    await expect(embedText("key", "q", "RETRIEVAL_QUERY")).rejects.toThrow("unexpected shape");
  });
});

describe("validateGeminiApiKey", () => {
  it("is true for a working key and false for a rejected one", async () => {
    mockFetch(json({ models: [] }), json({}, 400));
    await expect(validateGeminiApiKey("good")).resolves.toBe(true);
    await expect(validateGeminiApiKey("bad")).resolves.toBe(false);
  });
});

describe("answerFromSources", () => {
  it("doesn't call Gemini when there is nothing to answer from", async () => {
    const fetchMock = mockFetch();
    await expect(answerFromSources("key", "q", [])).resolves.toMatch(/Nothing/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("normalizeTags", () => {
  it("lowercases, trims, de-duplicates and caps at four", () => {
    expect(normalizeTags(["A", "a ", "b", "", 3, "c", "d", "e"])).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores non-arrays", () => {
    expect(normalizeTags("nope")).toEqual([]);
  });
});
