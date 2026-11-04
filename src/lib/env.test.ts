import { describe, expect, it } from "vitest";
import { assertValidEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  SESSION_SECRET: "a".repeat(32),
  ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64"),
};

describe("assertValidEnv", () => {
  it("accepts a complete configuration", () => {
    expect(() => assertValidEnv(valid)).not.toThrow();
    expect(() =>
      assertValidEnv({ ...valid, DIRECT_URL: valid.DATABASE_URL, APP_URL: "https://example.com" }),
    ).not.toThrow();
  });

  it("lists every missing required variable", () => {
    expect(() => assertValidEnv({})).toThrow(/DATABASE_URL.*\n.*SESSION_SECRET.*\n.*ENCRYPTION_KEY/);
  });

  it("rejects placeholders and malformed values", () => {
    expect(() => assertValidEnv({ ...valid, SESSION_SECRET: "replace-with-a-long-random-secret" })).toThrow(
      /SESSION_SECRET is invalid/,
    );
    expect(() => assertValidEnv({ ...valid, ENCRYPTION_KEY: "too-short" })).toThrow(/ENCRYPTION_KEY is invalid/);
    expect(() => assertValidEnv({ ...valid, DATABASE_URL: "mysql://x" })).toThrow(/DATABASE_URL is invalid/);
    expect(() => assertValidEnv({ ...valid, APP_URL: "not a url" })).toThrow(/APP_URL is invalid/);
  });

  it("never puts a value in the error message", () => {
    const secret = "replace-with-this-should-not-leak";
    expect(() => assertValidEnv({ ...valid, SESSION_SECRET: secret })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining(secret) }),
    );
  });
});
