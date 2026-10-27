import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
const { maskApiKey } = await import("@/lib/gemini-key");

describe("maskApiKey", () => {
  it("shows only the last 4 characters", () => {
    expect(maskApiKey("AIzaFAKE-not-a-real-key-0000abcd")).toBe("••••abcd");
  });

  it("never reveals any of a short value", () => {
    expect(maskApiKey("short-key")).toBe("••••");
  });
});
