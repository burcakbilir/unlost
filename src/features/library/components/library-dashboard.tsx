"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { apiDelete, apiGet, apiPatch, apiPost, isUnauthorizedError } from "@/lib/api-client";
import { ALLOWED_IMAGE_TYPES, MAX_SOURCE_IMAGE_BYTES } from "@/features/library/constants";
import { compressImage } from "@/features/library/compress-image";
import { itemImageUrl } from "@/features/library/image-url";
import type {
  CaptureType,
  LibraryFilter,
  LibraryItem,
  SearchMatch,
  SearchResponse,
} from "@/features/library/types";
import {
  SETTINGS_TITLE_ID,
  SettingsPanel,
  type GeminiKeyStatus,
} from "@/features/settings/components/settings-panel";
import { Modal } from "@/components/modal";
import { PlusIcon, SearchIcon, SparkleIcon } from "@/features/library/components/icons";
import { AskPanel } from "@/features/library/components/ask-panel";
import {
  DashboardSidebar,
  FilterChips,
  filterLabel,
} from "@/features/library/components/dashboard-sidebar";
import { LibraryCard, displayHost } from "@/features/library/components/library-card";

// One search result in the Ask panel. `citation` is its [n] in an AI answer;
// weaker matches have none because they're never sent to the model.
function AskMatch({ match, citation }: { match: SearchMatch; citation?: number }) {
  return (
    <li className="rounded-xl border border-border p-3 text-sm">
      {citation ? (
        <p className="text-xs text-muted" aria-hidden="true">
          [{citation}]
        </p>
      ) : null}
      {match.imageMimeType && (
        <div className="mt-1 flex max-h-56 items-center justify-center overflow-hidden rounded-lg bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={itemImageUrl(match)}
            alt={match.title}
            loading="lazy"
            decoding="async"
            className="max-h-56 w-full object-contain"
          />
        </div>
      )}
      <p className="mt-1 font-medium">{match.title}</p>
      {match.description && <p className="mt-1 line-clamp-4 text-muted">{match.description}</p>}
      {match.source && (
        <a
          href={match.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block truncate text-xs text-muted underline-offset-4 hover:underline"
        >
          {displayHost(match.source)}
        </a>
      )}
    </li>
  );
}

function isCaptureType(value: string): value is CaptureType {
  return value === "link" || value === "note" || value === "image";
}

type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function LibraryDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [composerType, setComposerType] = useState<CaptureType>("note");
  const [imageFile, setImageFile] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [askQuery, setAskQuery] = useState("");
  const [askResult, setAskResult] = useState<
    (SearchResponse & { query: string }) | null
  >(null);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const askRequestId = useRef(0);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [geminiKey, setGeminiKey] = useState<GeminiKeyStatus>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // An expired or revoked session surfaces as a 401 from any request. Send the
  // user to sign in (and back here afterwards) instead of showing "Unauthorized".
  function handleApiError(error: unknown, fallback: string): string {
    if (isUnauthorizedError(error)) {
      router.replace("/login?next=/dashboard");
      return "Your session has expired. Redirecting to sign in...";
    }
    return error instanceof Error ? error.message : fallback;
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [meResponse, itemsResponse] = await Promise.all([
          apiGet<{ user: CurrentUser; geminiKey: GeminiKeyStatus }>("/api/auth/me"),
          apiGet<{ items: LibraryItem[] }>("/api/library-items"),
        ]);

        if (isMounted) {
          setUser(meResponse.user);
          setGeminiKey(meResponse.geminiKey);
          setItems(itemsResponse.items);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(handleApiError(error, "Could not load your library"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
    // Runs once on mount; handleApiError only uses the stable router.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filterCounts = useMemo(() => {
    return {
      all: items.length,
      link: items.filter((item) => item.type === "link").length,
      note: items.filter((item) => item.type === "note").length,
      image: items.filter((item) => item.type === "image").length,
    };
  }, [items]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.type === activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${item.title} ${item.description} ${item.source}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, items, query]);

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    setImageError(null);

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Image must be PNG, JPEG, or WebP");
      input.value = "";
      return;
    }

    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setImageError("Image must be smaller than 20MB");
      input.value = "";
      return;
    }

    setIsProcessingImage(true);

    try {
      const compressed = await compressImage(file);
      setImageFile({ ...compressed, fileName: file.name });
    } catch (error) {
      setImageFile(null);
      setImageError(error instanceof Error ? error.message : "Could not read this file");
      input.value = "";
    } finally {
      setIsProcessingImage(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const source = String(formData.get("source") ?? "").trim();
    const rawType = String(formData.get("type") ?? "note");
    const type: CaptureType = isCaptureType(rawType) ? rawType : "note";
    const hasImage =
      composerType === "image" &&
      (Boolean(imageFile) || Boolean(editingItem?.imageMimeType));

    if (!title || (!description && !hasImage)) return;

    setIsSaving(true);
    setSaveError(null);

    const image = imageFile
      ? { data: imageFile.base64, mimeType: imageFile.mimeType }
      : undefined;

    try {
      if (editingItem) {
        const { item } = await apiPatch<{ item: LibraryItem }>(
          `/api/library-items/${editingItem.id}`,
          { type, title, description, source, image },
        );
        setItems((currentItems) =>
          currentItems.map((current) => (current.id === item.id ? item : current)),
        );
      } else {
        const { item } = await apiPost<{ item: LibraryItem }>(
          "/api/library-items",
          { type, title, description, source, image },
        );
        setItems((currentItems) => [item, ...currentItems]);
      }

      setImageFile(null);
      setImageError(null);

      form.reset();
      setActiveFilter("all");
      setIsComposerOpen(false);
      setEditingItem(null);
    } catch (error) {
      setSaveError(handleApiError(error, "Could not save this item"));
    } finally {
      setIsSaving(false);
    }
  }

  function openNewItem() {
    setEditingItem(null);
    setComposerType("note");
    setSaveError(null);
    setImageFile(null);
    setImageError(null);
    setIsComposerOpen(true);
  }

  function closeComposer() {
    setIsComposerOpen(false);
    setEditingItem(null);
    setComposerType("note");
    setImageFile(null);
    setImageError(null);
  }

  function handleEdit(item: LibraryItem) {
    setEditingItem(item);
    setComposerType(item.type);
    setSaveError(null);
    setImageFile(null);
    setImageError(null);
    setIsComposerOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this item? This can't be undone.")) return;

    setDeletingId(id);

    try {
      await apiDelete(`/api/library-items/${id}`);
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch (error) {
      const message = handleApiError(error, "Could not delete this item");
      if (!isUnauthorizedError(error)) window.alert(message);
    } finally {
      setDeletingId(null);
    }
  }

  const strongMatches = askResult?.matches.filter((match) => match.confidence === "strong") ?? [];
  const weakMatches = askResult?.matches.filter((match) => match.confidence === "possible") ?? [];

  function resetAsk() {
    askRequestId.current++;
    setAskResult(null);
    setAskError(null);
    setAskAnswer(null);
    setAnswerError(null);
    setIsAsking(false);
    setIsAnswering(false);
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = askQuery.trim();
    if (!trimmedQuery) return;

    const requestId = ++askRequestId.current;

    setIsAsking(true);
    setAskError(null);
    setAskAnswer(null);
    setAnswerError(null);
    setIsAnswering(false);

    try {
      const result = await apiPost<SearchResponse>("/api/search", {
        query: trimmedQuery,
      });

      if (requestId !== askRequestId.current) return;

      setAskResult({ ...result, query: trimmedQuery });
    } catch (error) {
      if (requestId !== askRequestId.current) return;

      setAskResult(null);
      setAskError(handleApiError(error, "Could not search your library"));
    } finally {
      if (requestId === askRequestId.current) {
        setIsAsking(false);
      }
    }
  }

  // Opt-in: the only search step that spends generation quota.
  async function handleAnswer() {
    if (!askResult || strongMatches.length === 0) return;

    const requestId = askRequestId.current;

    setIsAnswering(true);
    setAnswerError(null);

    try {
      const { answer } = await apiPost<{ answer: string }>("/api/search/answer", {
        query: askResult.query,
        // Same order as the numbered list, so [1], [2] in the answer line up.
        itemIds: strongMatches.map((match) => match.id),
      });

      if (requestId !== askRequestId.current) return;
      setAskAnswer(answer);
    } catch (error) {
      if (requestId !== askRequestId.current) return;
      setAnswerError(handleApiError(error, "Could not write an answer"));
    } finally {
      if (requestId === askRequestId.current) {
        setIsAnswering(false);
      }
    }
  }

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
        onNewItem={openNewItem}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSignOut={() => void handleSignOut()}
      />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted">
              {getGreeting()}
              {user ? `, ${user.name.split(" ")[0]}` : ""}
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
          query={askQuery}
          onQueryChange={(value) => {
            setAskQuery(value);
            if (!value.trim()) resetAsk();
          }}
          onSubmit={(event) => void handleAsk(event)}
          isAsking={isAsking}
        >
          {/* Announced to screen readers as results, answers and errors arrive. */}
          <div aria-live="polite" aria-busy={isAsking || isAnswering}>
            {askError ? (
              <p className="mt-4 text-sm font-medium text-red-700">{askError}</p>
            ) : null}

            {askResult ? (
              <div className="mt-5">
                {askResult.notice ? (
                  <p className="mb-3 rounded-xl border border-border px-3 py-2 text-sm text-muted">{askResult.notice}</p>
                ) : null}

                {strongMatches.length === 0 ? (
                  <p className="leading-7 text-muted">
                    {weakMatches.length > 0
                      ? "No clear match in your library."
                      : "Nothing in your library looks related to that yet."}
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-muted">
                        {strongMatches.length}{" "}
                        {strongMatches.length === 1 ? "match" : "matches"}
                        {askResult.mode === "keyword" ? " by keyword" : ""}
                      </p>
                      {askResult.canAnswer && !askAnswer ? (
                        <button
                          type="button"
                          onClick={() => void handleAnswer()}
                          disabled={isAnswering}
                          className="inline-flex items-center gap-2 rounded-xl border border-foreground px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background disabled:opacity-50"
                        >
                          <SparkleIcon className="size-4" />
                          {isAnswering ? "Writing answer..." : "Summarize with AI"}
                        </button>
                      ) : null}
                    </div>

                    {answerError ? (
                      <p className="mt-3 text-sm font-medium text-red-700">{answerError}</p>
                    ) : null}
                    {askAnswer ? (
                      <p className="mt-4 rounded-xl border-l-2 border-foreground pl-4 leading-7">{askAnswer}</p>
                    ) : null}

                    <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                      {strongMatches.map((match, index) => (
                        <AskMatch key={match.id} match={match} citation={index + 1} />
                      ))}
                    </ol>
                  </>
                )}

                {/* Weaker signals stay folded: a vague query shouldn't present
                    noise as an answer, but nothing possibly relevant is lost. */}
                {weakMatches.length > 0 ? (
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer text-muted hover:text-foreground">
                      Show {weakMatches.length} weaker {weakMatches.length === 1 ? "match" : "matches"}
                    </summary>
                    <ul className="mt-3 grid gap-3 opacity-80 sm:grid-cols-2">
                      {weakMatches.map((match) => (
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
          open={isComposerOpen}
          onClose={closeComposer}
          labelledBy="capture-composer-title"
          closedBy="closerequest"
        >
            <h2 id="capture-composer-title" className="font-display text-3xl">
              {editingItem ? "Edit item" : "Save something new"}
            </h2>
            <form
              key={editingItem?.id ?? "new"}
              onSubmit={(event) => void handleSubmit(event)}
              className="mt-6 grid gap-5 lg:grid-cols-2"
            >
              <label className="grid gap-2 text-sm font-medium">
                Title
                <input
                  name="title"
                  required
                  data-autofocus
                  defaultValue={editingItem?.title}
                  className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                  placeholder="What do you want to remember?"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Type
                <select
                  name="type"
                  value={composerType}
                  onChange={(event) =>
                    setComposerType(event.target.value as CaptureType)
                  }
                  className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                >
                  <option value="note">Note</option>
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium lg:col-span-2">
                Link (optional)
                <input
                  name="source"
                  type="url"
                  defaultValue={editingItem?.source}
                  className="min-h-12 rounded-xl border border-border px-4 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                  placeholder="https://..."
                />
              </label>
              {composerType === "image" && (
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
                        {imageFile?.fileName ??
                          (editingItem?.imageMimeType
                            ? "Current image on file"
                            : "No file chosen")}
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="image"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                  {isProcessingImage ? (
                    <p role="status" className="text-sm text-muted lg:col-span-2">
                      Optimizing image...
                    </p>
                  ) : null}
                  {imageError ? (
                    <p role="alert" className="text-sm text-red-600 lg:col-span-2">
                      {imageError}
                    </p>
                  ) : null}
                  {imageFile ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageFile.dataUrl}
                      alt="Preview of the selected image"
                      className="max-h-48 w-auto border border-border object-contain lg:col-span-2"
                    />
                  ) : editingItem?.imageMimeType ? (
                    <div className="lg:col-span-2">
                      <p className="text-xs text-muted">
                        Current image — choose a new file to replace it
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={itemImageUrl(editingItem)}
                        alt={`Current image for ${editingItem.title}`}
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
                    !(composerType === "image" && (imageFile || editingItem?.imageMimeType))
                  }
                  rows={4}
                  defaultValue={editingItem?.description}
                  className="resize-y rounded-xl border border-border px-4 py-3 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
                  placeholder={
                    composerType === "image" && geminiKey
                      ? "Why do you want to keep this? (leave blank to let AI describe the image)"
                      : "Why do you want to keep this?"
                  }
                />
              </label>

              {saveError ? (
                <p role="alert" className="text-sm text-red-600 lg:col-span-2">
                  {saveError}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving || isProcessingImage}
                  className="bg-foreground px-6 py-3 text-background disabled:opacity-60 rounded-xl"
                >
                  {isSaving ? "Saving..." : editingItem ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={closeComposer}
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
                      onEdit={handleEdit}
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
                    onClick={openNewItem}
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
