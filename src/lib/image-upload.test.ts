import { describe, expect, it } from "vitest";
import { validateImageUpload } from "@/lib/image-upload";

const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const html = Buffer.from("<html><script>alert(1)</script></html>");

describe("validateImageUpload", () => {
  it("accepts a file whose bytes match its declared type", () => {
    const result = validateImageUpload({ data: pngHeader.toString("base64"), mimeType: "image/png" });
    expect(result.ok).toBe(true);
  });

  it("rejects a disguised file (HTML declared as PNG)", () => {
    const result = validateImageUpload({ data: html.toString("base64"), mimeType: "image/png" });
    expect(result).toEqual({ ok: false, error: "File contents don't match its image type" });
  });

  it("rejects types that can carry script, like SVG", () => {
    const result = validateImageUpload({ data: html.toString("base64"), mimeType: "image/svg+xml" });
    expect(result.ok).toBe(false);
  });

  it("rejects images over the size limit", () => {
    const big = Buffer.concat([pngHeader, Buffer.alloc(2 * 1024 * 1024)]);
    const result = validateImageUpload({ data: big.toString("base64"), mimeType: "image/png" });
    expect(result).toEqual({ ok: false, error: "Image must be smaller than 1.5MB" });
  });
});
