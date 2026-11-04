import { describe, expect, it } from "vitest";
import { isSafeHttpUrl, safeRedirectPath } from "@/lib/safe-url";

describe("isSafeHttpUrl", () => {
  it("accepts http and https links", () => {
    expect(isSafeHttpUrl("https://example.com/a?b=1")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects script and data URLs that would run code when clicked (XSS)", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("JaVaScRiPt:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeHttpUrl("vbscript:msgbox(1)")).toBe(false);
  });

  it("rejects things that aren't URLs", () => {
    expect(isSafeHttpUrl("not a url")).toBe(false);
    expect(isSafeHttpUrl("")).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-site paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
  });

  it("refuses open redirects to other sites", () => {
    expect(safeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.example")).toBe("/dashboard");
    expect(safeRedirectPath(null)).toBe("/dashboard");
  });

  // URL parsing strips tabs and newlines, so "/\t/evil.example" becomes
  // "//evil.example" — another site — even though it starts with a single "/".
  it("refuses paths that only become another site once parsed", () => {
    expect(safeRedirectPath("/\t/evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\n/evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("/\r\n/evil.example")).toBe("/dashboard");
    expect(safeRedirectPath("\t//evil.example")).toBe("/dashboard");
  });

  it("keeps the query and hash of a same-site path", () => {
    expect(safeRedirectPath("/dashboard?tab=links#top")).toBe("/dashboard?tab=links#top");
  });
});
