"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { SETTINGS_TITLE_ID, SettingsPanel } from "@/features/settings/components/settings-panel";
import { Modal } from "@/components/modal";
import { PlusIcon, SearchIcon } from "@/features/library/components/icons";
import {
  DashboardSidebar,
  FilterChips,
  filterLabel,
} from "@/features/library/components/dashboard-sidebar";
import { LibraryCard } from "@/features/library/components/library-card";
import { AskSection } from "@/features/library/components/ask-section";
import { ItemComposer } from "@/features/library/components/item-composer";
import { useGreeting } from "@/features/library/hooks/use-greeting";
import { useApiErrorHandler } from "@/features/library/hooks/use-api-error-handler";
import { useLibraryData } from "@/features/library/hooks/use-library-data";
import { useLibraryFilters } from "@/features/library/hooks/use-library-filters";
import { useAsk } from "@/features/library/hooks/use-ask";
import { useDeleteItem } from "@/features/library/hooks/use-delete-item";
import { useItemComposer } from "@/features/library/hooks/use-item-composer";

export function LibraryDashboard() {
  const router = useRouter();
  const greeting = useGreeting();
  const handleApiError = useApiErrorHandler();
  const { user, items, setItems, isLoading, loadError, geminiKey, setGeminiKey } =
    useLibraryData(handleApiError);
  const { activeFilter, setActiveFilter, query, setQuery, filterCounts, visibleItems } =
    useLibraryFilters(items);
  const ask = useAsk(handleApiError);
  const { deletingId, handleDelete } = useDeleteItem(handleApiError, (id) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    ask.syncItem(id, null);
  });
  const composer = useItemComposer(handleApiError, (item, wasEditing) => {
    if (wasEditing) {
      setItems((currentItems) =>
        currentItems.map((current) => (current.id === item.id ? item : current)),
      );
      ask.syncItem(item.id, item);
    } else {
      setItems((currentItems) => [item, ...currentItems]);
    }
    setActiveFilter("all");
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  async function handleSignOut() {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {
      // Signing out is best-effort: go to the login page either way.
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <DashboardSidebar
        user={user}
        activeFilter={activeFilter}
        counts={filterCounts}
        onFilterChange={setActiveFilter}
        onNewItem={composer.openNew}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={() => void handleSignOut()}
      />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="min-h-5 text-sm text-muted">
              {greeting}
              {greeting && user ? `, ${user.name.split(" ")[0]}` : ""}
            </p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl">{filterLabel(activeFilter)}</h1>
          </div>
          <label className="relative block sm:w-80">
            <span className="sr-only">Filter your library by keyword</span>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="filter"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by keyword"
              className="min-h-11 w-full rounded-xl border border-border pl-10 pr-4 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
            />
          </label>
        </header>

        <div className="mt-6">
        <AskSection ask={ask} />
        </div>

        <Modal
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          labelledBy={SETTINGS_TITLE_ID}
        >
          <SettingsPanel
            geminiKey={geminiKey}
            onGeminiKeyChange={setGeminiKey}
            onApiError={handleApiError}
            onClose={() => setIsSettingsOpen(false)}
            onAccountDeleted={() => {
              router.replace("/");
              router.refresh();
            }}
          />
        </Modal>

        <ItemComposer composer={composer} geminiKey={geminiKey} />

        <section aria-labelledby="library-results-title" className="mt-8">
          <h2 id="library-results-title" className="sr-only">
            Saved items
          </h2>
          <FilterChips
            activeFilter={activeFilter}
            counts={filterCounts}
            onFilterChange={setActiveFilter}
          />

          {isLoading ? (
            <p className="mt-5 text-sm text-muted">Loading your library...</p>
          ) : loadError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
              {loadError}
            </div>
          ) : (
            <>
              <p aria-live="polite" className="mt-4 text-sm text-muted md:mt-0">
                {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
              </p>

              {visibleItems.length > 0 ? (
                <div className="mt-3 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleItems.map((item) => (
                    <LibraryCard
                      key={item.id}
                      item={item}
                      onEdit={composer.openEdit}
                      onDelete={(id) => void handleDelete(id)}
                      isDeleting={deletingId === item.id}
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                  <h3 className="font-display text-2xl">Your library is empty</h3>
                  <p className="mx-auto mt-2 max-w-sm text-muted">
                    Save a link, a note or a screenshot. Later, describe it in Ask your library to find it again.
                  </p>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={composer.openNew}
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
                    onClick={() => {
                      setQuery("");
                      setActiveFilter("all");
                    }}
                    className="mt-6 rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}
