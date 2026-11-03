"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { apiPost } from "@/lib/api-client";
import { itemImageUrl } from "@/features/library/image-url";
import type { CaptureType } from "@/features/library/types";
import { SETTINGS_TITLE_ID, SettingsPanel } from "@/features/settings/components/settings-panel";
import { Modal } from "@/components/modal";
import { PlusIcon, SearchIcon, SparkleIcon } from "@/features/library/components/icons";
import { AskPanel } from "@/features/library/components/ask-panel";
import {
  DashboardSidebar,
  FilterChips,
  filterLabel,
} from "@/features/library/components/dashboard-sidebar";
import { LibraryCard } from "@/features/library/components/library-card";
import { AskMatch } from "@/features/library/components/ask-match";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        <AskPanel
          query={ask.query}
          onQueryChange={ask.changeQuery}
          onSubmit={(event) => void ask.handleAsk(event)}
          isAsking={ask.isAsking}
        >
          {/* Announced to screen readers as results, answers and errors arrive. */}
          <div aria-live="polite" aria-busy={ask.isAsking || ask.isAnswering}>
            {ask.error ? (
              <p className="mt-4 text-sm font-medium text-red-700">{ask.error}</p>
            ) : null}

            {ask.result ? (
              <div className="mt-5">
                {ask.result.notice ? (
                  <p className="mb-3 rounded-xl border border-border px-3 py-2 text-sm text-muted">{ask.result.notice}</p>
                ) : null}

                {ask.strongMatches.length === 0 ? (
                  <p className="leading-7 text-muted">
                    {ask.weakMatches.length > 0
                      ? "No clear match in your library."
                      : "Nothing in your library looks related to that yet."}
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-muted">
                        {ask.strongMatches.length}{" "}
                        {ask.strongMatches.length === 1 ? "match" : "matches"}
                        {ask.result.mode === "keyword" ? " by keyword" : ""}
                      </p>
                      {ask.result.canAnswer && !ask.answer ? (
                        <button
                          type="button"
                          onClick={() => void ask.handleAnswer()}
                          disabled={ask.isAnswering}
                          className="inline-flex items-center gap-2 rounded-xl border border-foreground px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
                        >
                          <SparkleIcon className="size-4" />
                          {ask.isAnswering ? "Writing answer..." : "Summarize with AI"}
                        </button>
                      ) : null}
                    </div>

                    {ask.answerError ? (
                      <p className="mt-3 text-sm font-medium text-red-700">{ask.answerError}</p>
                    ) : null}
                    {ask.answer ? (
                      <p className="mt-4 whitespace-pre-line rounded-xl border-l-2 border-foreground pl-4 leading-7">
                        {ask.answer}
                      </p>
                    ) : null}

                    <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                      {ask.strongMatches.map((match, index) => (
                        <AskMatch key={match.id} match={match} citation={index + 1} />
                      ))}
                    </ol>
                  </>
                )}

                {/* Weaker signals stay folded: a vague query shouldn't present
                    noise as an answer, but nothing possibly relevant is lost. */}
                {ask.weakMatches.length > 0 ? (
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer text-muted hover:text-foreground">
                      Show {ask.weakMatches.length} weaker {ask.weakMatches.length === 1 ? "match" : "matches"}
                    </summary>
                    <ul className="mt-3 grid gap-3 opacity-80 sm:grid-cols-2">
                      {ask.weakMatches.map((match) => (
                        <AskMatch key={match.id} match={match} />
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        </AskPanel>
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

        {/* closedBy="closerequest": Esc closes it, but a stray click outside
            doesn't throw away a half-written item. */}
        <Modal
          open={composer.isOpen}
          onClose={composer.close}
          labelledBy="capture-composer-title"
          closedBy="closerequest"
        >
            <h2 id="capture-composer-title" className="font-display text-3xl">
              {composer.editingItem ? "Edit item" : "Save something new"}
            </h2>
            <form
              key={composer.editingItem?.id ?? "new"}
              onSubmit={(event) => void composer.handleSubmit(event)}
              className="mt-6 grid gap-5 lg:grid-cols-2"
            >
              <label className="grid gap-2 text-sm font-medium">
                Title
                <input
                  name="title"
                  required
                  data-autofocus
                  defaultValue={composer.editingItem?.title}
                  className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                  placeholder="What do you want to remember?"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Type
                <select
                  name="type"
                  value={composer.type}
                  onChange={(event) =>
                    composer.setType(event.target.value as CaptureType)
                  }
                  className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                >
                  <option value="note">Note</option>
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium lg:col-span-2">
                {composer.type === "link" ? "Link" : "Link (optional)"}
                <input
                  name="source"
                  type="url"
                  required={composer.type === "link"}
                  defaultValue={composer.editingItem?.source}
                  className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                  placeholder="https://..."
                />
              </label>
              {composer.type === "image" && (
                <>
                  <div className="grid gap-2 text-sm font-medium lg:col-span-2">
                    <span>Image (optional)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl border border-border px-4 py-3 font-medium hover:bg-surface"
                      >
                        Choose file
                      </button>
                      <span className="truncate text-sm text-muted">
                        {composer.imageFile?.fileName ??
                          (composer.editingItem?.imageMimeType
                            ? "Current image on file"
                            : "No file chosen")}
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="image"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={composer.handleImageChange}
                      className="hidden"
                    />
                  </div>
                  {composer.isProcessingImage ? (
                    <p role="status" className="text-sm text-muted lg:col-span-2">
                      Optimizing image...
                    </p>
                  ) : null}
                  {composer.imageError ? (
                    <p role="alert" className="text-sm text-red-600 lg:col-span-2">
                      {composer.imageError}
                    </p>
                  ) : null}
                  {composer.imageFile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={composer.imageFile.dataUrl}
                      alt="Preview of the selected image"
                      className="max-h-48 w-auto border border-border object-contain lg:col-span-2"
                    />
                  ) : composer.editingItem?.imageMimeType ? (
                    <div className="lg:col-span-2">
                      <p className="text-xs text-muted">
                        Current image — choose a new file to replace it
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={itemImageUrl(composer.editingItem)}
                        alt={`Current image for ${composer.editingItem.title}`}
                        className="mt-1 max-h-48 w-auto border border-border object-contain"
                      />
                    </div>
                  ) : null}
                </>
              )}
              <label className="grid gap-2 text-sm font-medium lg:col-span-2">
                Description
                <textarea
                  name="description"
                  required={
                    !(composer.type === "image" && (composer.imageFile || composer.editingItem?.imageMimeType))
                  }
                  rows={4}
                  defaultValue={composer.editingItem?.description}
                  className="resize-y rounded-xl border border-border px-4 py-3 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                  placeholder={
                    composer.type === "image" && geminiKey
                      ? "Why do you want to keep this? (leave blank to let AI describe the image)"
                      : "Why do you want to keep this?"
                  }
                />
              </label>

              {composer.saveError ? (
                <p role="alert" className="text-sm text-red-600 lg:col-span-2">
                  {composer.saveError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={composer.isSaving || composer.isProcessingImage}
                  className="bg-foreground px-6 py-3 text-background disabled:opacity-60 rounded-xl"
                >
                  {composer.isSaving ? "Saving..." : composer.editingItem ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={composer.close}
                  className="border border-border px-6 py-3 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
        </Modal>

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
