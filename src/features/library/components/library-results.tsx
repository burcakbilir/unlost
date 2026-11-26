"use client";

import type { LibraryFilter, LibraryItem } from "@/features/library/types";
import { PlusIcon, SearchIcon } from "@/features/library/components/icons";
import {
  FilterChips,
  filterLabel,
} from "@/features/library/components/dashboard-sidebar";
import { LibraryCard } from "@/features/library/components/library-card";

type LibraryResultsProps = {
  activeFilter: LibraryFilter;
  counts: Record<LibraryFilter, number>;
  onFilterChange: (filter: LibraryFilter) => void;
  filterQuery: string;
  onFilterQueryChange: (value: string) => void;
  isLoading: boolean;
  loadError: string | null;
  // The items left after the type filter and keyword box.
  items: LibraryItem[];
  // True when the user has saved nothing at all, not just nothing that matches.
  isLibraryEmpty: boolean;
  deletingId: string | null;
  onEdit: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
  onNewItem: () => void;
  onClearFilters: () => void;
};

// The saved items under Search: their own title, Filter box and type chips
// (both only narrow this list), the card grid, and the loading, error and
// empty states.
export function LibraryResults({
  activeFilter,
  counts,
  onFilterChange,
  filterQuery,
  onFilterQueryChange,
  isLoading,
  loadError,
  items,
  isLibraryEmpty,
  deletingId,
  onEdit,
  onDelete,
  onNewItem,
  onClearFilters,
}: LibraryResultsProps) {
  return (
    <section
      aria-labelledby="library-results-title"
      className="mt-10 border-t border-border pt-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-3">
          <h2 id="library-results-title" className="font-display text-2xl">
            {filterLabel(activeFilter)}
          </h2>
          {!isLoading && !loadError ? (
            <p aria-live="polite" className="text-sm text-muted">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          ) : null}
        </div>
        <label className="relative block sm:w-64">
          <span className="sr-only">Filter these items by a word</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="filter"
            value={filterQuery}
            onChange={(event) => onFilterQueryChange(event.target.value)}
            placeholder="Filter these items"
            className="min-h-11 w-full rounded-xl border border-border pl-9 pr-3 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </label>
      </div>

      <div className="mt-4 md:hidden">
        <FilterChips
          activeFilter={activeFilter}
          counts={counts}
          onFilterChange={onFilterChange}
        />
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-muted">Loading your library...</p>
      ) : loadError ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
          {loadError}
        </div>
      ) : (
        <>
          {items.length > 0 ? (
            <div className="mt-4 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <LibraryCard
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isDeleting={deletingId === item.id}
                />
              ))}
            </div>
          ) : isLibraryEmpty ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <h3 className="font-display text-2xl">Your library is empty</h3>
              <p className="mx-auto mt-2 max-w-sm text-muted">
                Save a link, a note or a screenshot. Later, describe it in Search to find it again.
              </p>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={onNewItem}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background"
              >
                <PlusIcon className="size-5" />
                Save your first item
              </button>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
              <h3 className="font-display text-2xl">No items match</h3>
              <p className="mt-2 text-muted">Try another keyword, or show all items.</p>
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-6 rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
