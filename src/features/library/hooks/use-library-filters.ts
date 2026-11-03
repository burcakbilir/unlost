import { useMemo, useState } from "react";
import { foldCase } from "@/features/library/fold-case";
import type { LibraryFilter, LibraryItem } from "@/features/library/types";

// The type filter (sidebar and chips) and the keyword box above the list. Both
// only narrow what's already loaded; nothing here talks to the server.
export function useLibraryFilters(items: LibraryItem[]) {
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");

  const filterCounts = useMemo(() => {
    return {
      all: items.length,
      link: items.filter((item) => item.type === "link").length,
      note: items.filter((item) => item.type === "note").length,
      image: items.filter((item) => item.type === "image").length,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = foldCase(query.trim());

    return items.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.type === activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        foldCase(`${item.title} ${item.description} ${item.source}`).includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, items, query]);

  return { activeFilter, setActiveFilter, query, setQuery, filterCounts, visibleItems };
}
