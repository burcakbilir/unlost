// The image endpoint is cached as immutable, so the URL must change whenever
// the item does — otherwise a replaced image keeps showing the old one.
export function itemImageUrl(item: { id: string; updatedAt: string }) {
  return `/api/library-items/${item.id}/image?v=${encodeURIComponent(item.updatedAt)}`;
}
