import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { keywordTerms, prefixQuery, rankResults } = await import("@/lib/library-search");
type Row = Parameters<typeof rankResults>[0][number];

function row(title: string, similarity: number | null, keywordHits?: number): Row {
  return {
    id: title,
    type: "note",
    title,
    description: "",
    source: "",
    tags: [],
    imageMimeType: null,
    updatedAt: new Date(0),
    similarity,
    keywordHits,
    textRank: keywordHits ? 0.1 * keywordHits : undefined,
  };
}

// Postgres percentile_cont(0.25), so tests use the same baseline the database would.
function libraryStats(similarities: number[]) {
  const sorted = [...similarities].sort((a, b) => a - b);
  const position = 0.25 * (sorted.length - 1);
  const lower = Math.floor(position);
  const baseline = sorted[lower]! + (sorted[Math.ceil(position)]! - sorted[lower]!) * (position - lower);
  return { baseline, total: sorted.length };
}

function search(semantic: Row[], text: Row[] = [], termCount = 1) {
  const ranked = rankResults(semantic, text, termCount, libraryStats(semantic.map((r) => r.similarity!)));
  return {
    strong: ranked.filter((m) => m.confidence === "strong").map((m) => m.row.title),
    possible: ranked.filter((m) => m.confidence === "possible").map((m) => m.row.title),
  };
}

const library = (scores: [string, number][]) => scores.map(([title, sim]) => row(title, sim));

describe("rankResults", () => {
  // Real scores from the app (gemini-embedding-001, 768 dims).
  it('"yazılım": the two software items are strong, payment notes are not', () => {
    const result = search(
      library([
        ["pgvector", 0.6802],
        ["Refactoring UI", 0.6493],
        ["Kart ödemesi", 0.6205],
        ["Kira artışı", 0.6177],
      ]),
    );
    expect(result.strong).toEqual(["pgvector", "Refactoring UI"]);
    expect(result.strong).not.toContain("Kira artışı");
  });

  it('"ödemeler": only the card payment is strong', () => {
    const result = search(
      library([
        ["Kart ödemesi", 0.7071],
        ["Kira artışı", 0.6178],
        ["pgvector", 0.59],
        ["Refactoring UI", 0.585],
      ]),
    );
    expect(result.strong).toEqual(["Kart ödemesi"]);
  });

  it('"llm" (real top two scores): nothing strong, the noise stays folded', () => {
    const result = search(
      library([
        ["pgvector", 0.5947],
        ["Kira artışı", 0.5933],
        ["Kart ödemesi", 0.55],
        ["Refactoring UI", 0.54],
      ]),
    );
    expect(result.strong).toEqual([]);
  });

  it('"rag": the word in pgvector\'s saved keywords makes it strong', () => {
    const result = search(
      library([
        ["Kira artışı", 0.6],
        ["pgvector", 0.5753],
        ["Kart ödemesi", 0.59],
        ["Refactoring UI", 0.585],
      ]),
      [row("pgvector", null, 1)],
    );
    expect(result.strong).toEqual(["pgvector"]);
    expect(result.strong).not.toContain("Kira artışı");
  });

  it('"uçak bileti": nothing related, nothing shown at all', () => {
    const result = search(
      library([
        ["Kart ödemesi", 0.56],
        ["Kira artışı", 0.555],
        ["pgvector", 0.55],
        ["Refactoring UI", 0.545],
      ]),
      [],
      2,
    );
    expect(result).toEqual({ strong: [], possible: [] });
  });

  it("a single matching word out of three is only a possible match", () => {
    const result = search(library([["a", 0.55], ["b", 0.54], ["c", 0.53], ["d", 0.52]]), [row("a", null, 1)], 3);
    expect(result).toEqual({ strong: [], possible: ["a"] });
  });

  it("a typo-tolerant match alone is never strong", () => {
    // "uçak bileti": trigram paired "bileti" with a look-alike word in an
    // unrelated note. Seen in real data.
    const typo = { ...row("rag sonuçlarını iyileştirmek", null), typoHits: 1 };
    const result = search(library([["a", 0.55], ["b", 0.54], ["c", 0.53], ["d", 0.52]]), [typo], 2);
    expect(result).toEqual({ strong: [], possible: ["rag sonuçlarını iyileştirmek"] });
  });

  it("finds items without an embedding by their words", () => {
    const ranked = rankResults([], [row("Saved before the key", null, 2)], 2, { baseline: null, total: 0 });
    expect(ranked).toEqual([{ row: expect.objectContaining({ title: "Saved before the key" }), confidence: "strong" }]);
  });

  it("uses a fixed floor when the library is too small to compare against", () => {
    const ranked = rankResults([row("a", 0.64), row("b", 0.62)], [], 1, { baseline: 0.6, total: 2 });
    expect(ranked.filter((m) => m.confidence === "strong").map((m) => m.row.title)).toEqual(["a"]);
  });

  it("ranks an item found by both meaning and words above one found by meaning only", () => {
    const ranked = rankResults(
      [row("meaning only", 0.7), row("both", 0.69)],
      [row("both", null, 1)],
      1,
      { baseline: 0.5, total: 4 },
    );
    expect(ranked[0]!.row.title).toBe("both");
  });
});

describe("prefixQuery", () => {
  it("matches every term as a word prefix (Turkish suffixes)", () => {
    expect(prefixQuery(["elbise", "kırmızı"])).toBe("elbise:* | kırmızı:*");
  });
});

describe("keywordTerms", () => {
  it("drops short filler words and punctuation", () => {
    expect(keywordTerms("What did I save about a red dress?")).toEqual([
      "What",
      "did",
      "save",
      "about",
      "red",
      "dress",
    ]);
  });

  it("keeps Turkish letters intact", () => {
    expect(keywordTerms("İstanbul'da gördüğüm kafe")).toEqual(["İstanbul", "gördüğüm", "kafe"]);
  });

  it("caps the number of terms", () => {
    expect(keywordTerms("one two three four five six seven eight nine ten")).toHaveLength(8);
  });
});
