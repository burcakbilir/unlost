import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM: encrypts and authenticates, so a tampered value fails to decrypt
// instead of producing garbage. Format: v1.<iv>.<auth tag>.<ciphertext> (base64url).
const VERSION = "v1";
const IV_BYTES = 12;

function encryptionKey(): Buffer {
  const value = process.env.ENCRYPTION_KEY;
  const key = value ? Buffer.from(value, "base64") : null;

  if (!key || key.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be 32 random bytes, base64-encoded (openssl rand -base64 32).",
    );
  }

  return key;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return [VERSION, iv, cipher.getAuthTag(), ciphertext]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

export function decryptSecret(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(".");

  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error("Unrecognized encrypted secret format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
