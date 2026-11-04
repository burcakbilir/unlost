import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

// Same value vitest.config.ts puts in SESSION_SECRET.
const secret = process.env.SESSION_SECRET!;

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = cookieJar.get(name);
      return value === undefined ? undefined : { value };
    },
  }),
}));

const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique } } }));

const { createSessionToken, sessionCookieName, verifySessionToken } = await import("@/lib/session");
const { getRequestUser } = await import("@/lib/auth");

describe("session tokens", () => {
  it("round-trips the user id and session version", () => {
    expect(verifySessionToken(createSessionToken("user_1", 3))).toEqual({
      userId: "user_1",
      sessionVersion: 3,
    });
  });

  it("treats tokens issued before versions existed as version 0", () => {
    const legacy = jwt.sign({ userId: "user_1" }, secret, { expiresIn: 60 });
    expect(verifySessionToken(legacy)).toEqual({ userId: "user_1", sessionVersion: 0 });
  });

  it("rejects unsigned tokens", () => {
    const unsigned = jwt.sign({ userId: "user_1" }, "", { algorithm: "none" });
    expect(verifySessionToken(unsigned)).toBeNull();
  });

  it("rejects tokens signed with another algorithm, even with the right secret", () => {
    const hs512 = jwt.sign({ userId: "user_1", v: 0 }, secret, { algorithm: "HS512" });
    expect(verifySessionToken(hs512)).toBeNull();
  });

  it("rejects tokens signed with another secret", () => {
    const forged = jwt.sign({ userId: "user_1", v: 0 }, "x".repeat(48));
    expect(verifySessionToken(forged)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const expired = jwt.sign({ userId: "user_1", v: 0, exp: 1 }, secret);
    expect(verifySessionToken(expired)).toBeNull();
  });
});

describe("getRequestUser", () => {
  const user = { id: "user_1", name: "Test", email: "test@example.com" };

  it("accepts a token whose version matches the user's", async () => {
    cookieJar.set(sessionCookieName, createSessionToken("user_1", 2));
    findUnique.mockResolvedValueOnce({ ...user, sessionVersion: 2 });
    expect(await getRequestUser()).toEqual(user);
  });

  it("rejects a token issued before the user signed out", async () => {
    cookieJar.set(sessionCookieName, createSessionToken("user_1", 2));
    findUnique.mockResolvedValueOnce({ ...user, sessionVersion: 3 });
    expect(await getRequestUser()).toBeNull();
  });

  it("rejects a token for a deleted user", async () => {
    cookieJar.set(sessionCookieName, createSessionToken("user_1", 0));
    findUnique.mockResolvedValueOnce(null);
    expect(await getRequestUser()).toBeNull();
  });
});
