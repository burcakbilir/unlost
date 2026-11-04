import { describe, expect, it } from "vitest";
import { BodyTooLargeError, readJsonBody } from "@/lib/http";

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api", {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("readJsonBody", () => {
  it("parses JSON within the limit", async () => {
    await expect(readJsonBody(post('{"a":1}'), 100)).resolves.toEqual({ a: 1 });
  });

  it("returns null for invalid JSON so the schema reports it", async () => {
    await expect(readJsonBody(post("{oops"), 100)).resolves.toBeNull();
  });

  it("rejects a body larger than the limit while streaming", async () => {
    await expect(readJsonBody(post("x".repeat(200)), 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it("rejects early when Content-Length already says it's too large", async () => {
    const request = post("{}", { "content-length": "5000000" });
    await expect(readJsonBody(request, 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it("ignores bodies that aren't sent as JSON, like a forged cross-site form post", async () => {
    await expect(readJsonBody(post('{"a":1}', { "content-type": "text/plain" }), 100)).resolves.toBeNull();
    await expect(
      readJsonBody(post("a=1", { "content-type": "application/x-www-form-urlencoded" }), 100),
    ).resolves.toBeNull();
  });

  it("accepts JSON with a charset parameter", async () => {
    const request = post('{"a":1}', { "content-type": "application/json; charset=utf-8" });
    await expect(readJsonBody(request, 100)).resolves.toEqual({ a: 1 });
  });
});
