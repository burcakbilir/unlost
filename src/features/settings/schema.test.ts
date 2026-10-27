import { describe, expect, it } from "vitest";
import { apiKeySchema } from "@/features/settings/schema";

// Made-up keys with the same shape as real ones; none of these are real.
const classicKey = "AIzaFAKE-not-a-real-key-0000abcd";
const newerKey = "AQ.Ab8RN6EXAMPLE-example_1234567890.abcdefghijk";

const parse = (apiKey: string) => apiKeySchema.safeParse({ apiKey });

describe("apiKeySchema", () => {
  it("accepts classic AIza keys", () => {
    expect(parse(classicKey).success).toBe(true);
  });

  it("accepts newer key formats that contain dots", () => {
    expect(parse(newerKey).success).toBe(true);
  });

  it("strips whitespace and quotes pasted along with the key", () => {
    expect(apiKeySchema.parse({ apiKey: `  "${classicKey}"\n` }).apiKey).toBe(classicKey);
  });

  it("rejects things that clearly aren't a key", () => {
    expect(parse("abc").success).toBe(false);
    expect(parse("GEMINI_API_KEY = something with spaces in it").success).toBe(false);
  });
});
