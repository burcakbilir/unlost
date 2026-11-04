export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Resolves the value the way the browser will, instead of pattern-matching the
// raw string: URL parsing drops tabs and newlines and treats "\" as "/", so
// strings like "/\t/evil.example" only turn into another site after parsing.
const REDIRECT_BASE = "http://redirect.invalid";

export function safeRedirectPath(value: string | null): string {
  const fallback = "/dashboard";

  if (!value?.startsWith("/")) return fallback;

  let url: URL;
  try {
    url = new URL(value, REDIRECT_BASE);
  } catch {
    return fallback;
  }

  if (url.origin !== REDIRECT_BASE) return fallback;

  // Rebuilt from the parsed parts, so what we return is exactly what was checked.
  return `${url.pathname}${url.search}${url.hash}`;
}
