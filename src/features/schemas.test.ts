import { describe, expect, it } from "vitest";
import { registerSchema } from "@/features/auth/schema";
import { answerSchema, createItemSchema, updateItemSchema } from "@/features/library/schema";

const validRegistration = {
  name: "Ada",
  email: " Ada@Example.com ",
  password: "correct horse",
  inviteCode: "ABC123",
};

describe("registerSchema", () => {
  it("normalizes the email", () => {
    expect(registerSchema.parse(validRegistration).email).toBe("ada@example.com");
  });

  it("requires an invite code", () => {
    expect(registerSchema.safeParse({ ...validRegistration, inviteCode: " " }).success).toBe(false);
  });

  it("rejects passwords bcrypt would silently truncate", () => {
    expect(registerSchema.safeParse({ ...validRegistration, password: "x".repeat(73) }).success).toBe(false);
  });
});

describe("library schemas", () => {
  it("rejects javascript: links", () => {
    const result = createItemSchema.safeParse({ title: "t", source: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("doesn't reset the type to a default on partial updates", () => {
    expect(updateItemSchema.parse({ title: "new" })).toEqual({ title: "new" });
  });

  it("limits how many items an answer can be built from", () => {
    const itemIds = Array.from({ length: 9 }, (_, index) => `id${index}`);
    expect(answerSchema.safeParse({ query: "q", itemIds }).success).toBe(false);
  });
});
