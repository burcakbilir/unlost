import { describe, expect, it } from "vitest";
import { BodyTooLargeError, readJsonBody } from "@/lib/http";

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api", { method: "POST", body, headers });
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
});
