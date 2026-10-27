import "server-only";
import { NextResponse } from "next/server";
import type { RateLimitResult } from "@/lib/rate-limit";

export class BodyTooLargeError extends Error {}

// Reads the body as a stream and stops once it passes maxBytes, so an oversized
// request is rejected before it is buffered and parsed in full.
export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get("content-length"));

  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new BodyTooLargeError();
  }

  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new BodyTooLargeError();
    }
    chunks.push(value);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ message }, { status, headers });
}

export const unauthorized = () => jsonError("Unauthorized", 401);

export const bodyTooLarge = () => jsonError("Request is too large", 413);

export function tooManyRequests(result: Extract<RateLimitResult, { ok: false }>) {
  return jsonError("Too many requests. Please try again later.", 429, {
    "Retry-After": String(result.retryAfterSeconds),
  });
}

export const BODY_LIMITS = {
  // Base64 inflates by ~4/3; the image itself is capped separately.
  item: 2.5 * 1024 * 1024,
  small: 16 * 1024,
} as const;
