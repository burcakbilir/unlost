import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/secret-box";

describe("secret box", () => {
  it("round-trips a secret", () => {
    const encrypted = encryptSecret("AIzaSy-example-key");
    expect(encrypted).not.toContain("AIzaSy");
    expect(decryptSecret(encrypted)).toBe("AIzaSy-example-key");
  });

  it("uses a fresh IV, so the same key never encrypts the same way twice", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("rejects tampered ciphertext instead of returning garbage", () => {
    const [version, iv, tag, ciphertext] = encryptSecret("secret").split(".");
    const flipped = Buffer.from(ciphertext!, "base64url");
    flipped[0] = flipped[0]! ^ 1;
    expect(() =>
      decryptSecret([version, iv, tag, flipped.toString("base64url")].join(".")),
    ).toThrow();
  });

  it("rejects unknown formats", () => {
    expect(() => decryptSecret("plain-text")).toThrow();
  });
});
