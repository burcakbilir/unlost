// JS lowercases "İ" to "i" plus a combining dot, so "istanbul" wouldn't find
// "İstanbul". Dropping the dot makes both match.
export function foldCase(text: string): string {
  return text.toLowerCase().replace(/\u0307/g, "");
}
