import "server-only";
import { prisma } from "@/lib/prisma";

export type RateLimitRule = {
  // Namespaces the counter, e.g. "login:ip".
  name: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export function windowStartFor(now: Date, windowSeconds: number): Date {
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

// Fixed-window counter. The upsert is a single atomic statement, so concurrent
// requests can't both read "under the limit" and slip past it.
export async function consumeRateLimit(
  rule: RateLimitRule,
  identifier: string,
  now = new Date(),
): Promise<RateLimitResult> {
  const windowStart = windowStartFor(now, rule.windowSeconds);
  const key = `${rule.name}:${identifier}`;

  // Roughly 1 in 200 requests trims old windows; no cron job needed.
  if (Math.random() < 0.005) {
    pruneExpiredRateLimits().catch((error) =>
      console.error("Failed to prune rate limits:", error),
    );
  }

  const { count } = await prisma.rateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  if (count <= rule.limit) {
    return { ok: true };
  }

  const windowEndMs = windowStart.getTime() + rule.windowSeconds * 1000;
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((windowEndMs - now.getTime()) / 1000)),
  };
}

// Checks every rule (all counters are incremented) and fails if any is over.
export async function consumeRateLimits(
  checks: { rule: RateLimitRule; identifier: string }[],
): Promise<RateLimitResult> {
  const results = await Promise.all(
    checks.map(({ rule, identifier }) => consumeRateLimit(rule, identifier)),
  );
  const blocked = results.filter(
    (result): result is Extract<RateLimitResult, { ok: false }> => !result.ok,
  );

  if (blocked.length === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    retryAfterSeconds: Math.max(...blocked.map((result) => result.retryAfterSeconds)),
  };
}

// Old windows are dead weight; trim them occasionally instead of on every request.
export async function pruneExpiredRateLimits(olderThanHours = 24): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: new Date(Date.now() - olderThanHours * 3600_000) } },
  });
}

export function clientIp(request: Request): string {
  // On Vercel, x-forwarded-for is set by the platform; the first entry is the client.
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export const RATE_LIMITS = {
  loginByIp: { name: "login:ip", limit: 20, windowSeconds: 15 * 60 },
  loginByEmail: { name: "login:email", limit: 8, windowSeconds: 15 * 60 },
  registerByIp: { name: "register:ip", limit: 5, windowSeconds: 60 * 60 },
  // Protects the user's own Gemini quota from a runaway client or a stolen session.
  searchByUser: { name: "search:user", limit: 30, windowSeconds: 60 * 60 },
  answerByUser: { name: "answer:user", limit: 20, windowSeconds: 60 * 60 },
  writeByUser: { name: "write:user", limit: 60, windowSeconds: 60 * 60 },
  apiKeyByUser: { name: "api-key:user", limit: 10, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;
