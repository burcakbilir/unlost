import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { keywordTerms } = await import("@/lib/library-search");

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
