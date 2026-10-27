import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet, isUnauthorizedError } from "@/lib/api-client";

afterEach(() => vi.unstubAllGlobals());

describe("api client errors", () => {
  it("keeps the HTTP status so a 401 can redirect to sign in", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"message":"Unauthorized"}', { status: 401 })));

    const error = await apiGet("/api/auth/me").catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(isUnauthorizedError(error)).toBe(true);
    expect((error as ApiError).message).toBe("Unauthorized");
  });

  it("reports network failures as offline rather than a bare TypeError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(apiGet("/x")).rejects.toThrow(/offline/);
  });
});
