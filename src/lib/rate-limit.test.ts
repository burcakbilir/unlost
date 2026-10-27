import { beforeEach, describe, expect, it, vi } from "vitest";

// An in-memory stand-in for the rate_limits table.
const counters = new Map<string, number>();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    rateLimit: {
      upsert: vi.fn(async ({ where }: { where: { key_windowStart: { key: string; windowStart: Date } } }) => {
        const id = `${where.key_windowStart.key}@${where.key_windowStart.windowStart.toISOString()}`;
        const count = (counters.get(id) ?? 0) + 1;
        counters.set(id, count);
        return { count };
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}));

const { clientIp, consumeRateLimit, consumeRateLimits, windowStartFor } = await import("@/lib/rate-limit");

const rule = { name: "test", limit: 3, windowSeconds: 60 };

beforeEach(() => counters.clear());

describe("windowStartFor", () => {
  it("rounds down to the start of the window", () => {
    expect(windowStartFor(new Date("2026-01-01T00:01:59Z"), 60).toISOString()).toBe(
      "2026-01-01T00:01:00.000Z",
    );
  });
});

describe("consumeRateLimit", () => {
  it("allows up to the limit, then blocks with a Retry-After", async () => {
    const now = new Date("2026-01-01T00:00:15Z");
    for (let i = 0; i < 3; i++) {
      expect(await consumeRateLimit(rule, "user-1", now)).toEqual({ ok: true });
    }
    expect(await consumeRateLimit(rule, "user-1", now)).toEqual({ ok: false, retryAfterSeconds: 45 });
  });

  it("counts each identifier separately", async () => {
    const now = new Date("2026-01-01T00:00:00Z");
    for (let i = 0; i < 3; i++) await consumeRateLimit(rule, "user-1", now);
    expect((await consumeRateLimit(rule, "user-2", now)).ok).toBe(true);
  });

  it("starts fresh in the next window", async () => {
    for (let i = 0; i < 4; i++) await consumeRateLimit(rule, "user-1", new Date("2026-01-01T00:00:10Z"));
    expect((await consumeRateLimit(rule, "user-1", new Date("2026-01-01T00:01:10Z"))).ok).toBe(true);
  });
});

describe("consumeRateLimits", () => {
  it("blocks if any rule is over its limit", async () => {
    const strict = { name: "strict", limit: 1, windowSeconds: 60 };
    await consumeRateLimits([{ rule: strict, identifier: "a" }]);
    const result = await consumeRateLimits([
      { rule, identifier: "a" },
      { rule: strict, identifier: "a" },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(clientIp(request)).toBe("203.0.113.7");
  });
});
