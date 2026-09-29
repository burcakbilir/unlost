"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type {
  CaptureType,
  LibraryFilter,
  LibraryItem,
  SearchMatch,
} from "@/features/library/types";

type LibraryCardProps = {
  item: LibraryItem;
  onEdit: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

type FilterOption = {
  label: string;
  value: LibraryFilter;
};

const filterOptions: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Links", value: "link" },
  { label: "Notes", value: "note" },
  { label: "Images", value: "image" },
];

const typeLabels: Record<CaptureType, string> = {
  link: "Link",
  note: "Note",
  image: "Image",
};

const typeStyles: Record<CaptureType, string> = {
  link: "bg-mint",
  note: "bg-lilac",
  image: "bg-peach",
};

const typeIcon: Record<CaptureType, string> = {
  link: "↗",
  note: "✦",
  image: "◌",
};

function isCaptureType(value: string): value is CaptureType {
  return value === "link" || value === "note" || value === "image";
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

// Below this, matches have consistently been unrelated noise in testing
// (e.g. an unrelated note scoring ~0.56-0.60 against a dress query) while
// genuinely relevant matches have scored 0.65+. The LLM's own citations in
// the answer aren't fully reliable on short/vague queries, so a match is
// shown if EITHER signal says it's relevant.
const RELEVANT_SIMILARITY_THRESHOLD = 0.62;

function LibraryCard({ item, onEdit, onDelete, isDeleting }: LibraryCardProps) {
  return (
    <article className="flex flex-col border border-border bg-white/70 p-5 transition-transform hover:-translate-y-1">
      {item.imageMimeType ? (
        <div className="-mx-5 -mt-5 mb-4 flex max-h-72 items-center justify-center bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/library-items/${item.id}/image`}
            alt=""
            className="max-h-72 w-full object-contain"
          />
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <span
          className={`px-2 py-1 text-xs uppercase tracking-widest ${typeStyles[item.type]}`}
        >
          {typeLabels[item.type]}
        </span>
        {!item.imageMimeType && (
          <span aria-hidden="true" className="font-display text-lg text-muted">
            {typeIcon[item.type]}
          </span>
        )}
      </div>
      <h3 className="mt-3 font-display text-2xl">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
      {item.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="bg-surface px-2 py-1 text-xs text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-muted">
        {item.source ? (
          <a
            href={item.source}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate underline hover:text-foreground"
          >
            {item.source}
          </a>
        ) : (
          <span className="truncate" />
        )}
        <span className="shrink-0">{formatRelativeTime(item.updatedAt)}</span>
      </div>
      <div className="mt-3 flex gap-4 border-t border-border pt-3 text-xs">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="font-medium text-muted hover:text-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
          className="font-medium text-muted hover:text-red-600 disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}

type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  const [imageFile, setImageFile] = useState<{
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [askQuery, setAskQuery] = useState("");
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askMatches, setAskMatches] = useState<SearchMatch[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const askRequestId = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [meResponse, itemsResponse] = await Promise.all([
          apiGet<{ user: CurrentUser }>("/api/auth/me"),
          apiGet<{ items: LibraryItem[] }>("/api/library-items"),
        ]);

        if (isMounted) {
          setUser(meResponse.user);
          setItems(itemsResponse.items);
        }
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error ? error.message : "Could not load your library",
          );
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
  }, []);

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

  const citedMatches = useMemo(() => {
    if (!askAnswer) return [];

    const citedIndexes = new Set(
      Array.from(askAnswer.matchAll(/\[(\d+)\]/g), (match) => Number(match[1])),
    );

    return askMatches
      .map((match, index) => ({ match, citation: index + 1 }))
      .filter(
        ({ match, citation }) =>
          citedIndexes.has(citation) ||
          match.similarity >= RELEVANT_SIMILARITY_THRESHOLD,
      );
  }, [askAnswer, askMatches]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError(null);

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Image must be PNG, JPEG, or WebP");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("Image must be smaller than 3MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      setImageFile({ dataUrl, base64, mimeType: file.type });
    };
    reader.onerror = () => {
      setImageError("Could not read this file");
    };
    reader.readAsDataURL(file);
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
    const hasImage = Boolean(imageFile) || Boolean(editingItem?.imageMimeType);

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
      setSaveError(
        error instanceof Error ? error.message : "Could not save this item",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(item: LibraryItem) {
    setEditingItem(item);
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
      window.alert(
        error instanceof Error ? error.message : "Could not delete this item",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = askQuery.trim();
    if (!trimmedQuery) return;

    const requestId = ++askRequestId.current;

    setIsAsking(true);
    setAskError(null);

    try {
      const result = await apiPost<{ answer: string; matches: SearchMatch[] }>(
        "/api/search",
        { query: trimmedQuery },
      );

      if (requestId !== askRequestId.current) return;

      setAskAnswer(result.answer);
      setAskMatches(result.matches);
    } catch (error) {
      if (requestId !== askRequestId.current) return;

      setAskAnswer(null);
      setAskMatches([]);
      setAskError(
        error instanceof Error ? error.message : "Could not search your library",
      );
    } finally {
      if (requestId === askRequestId.current) {
        setIsAsking(false);
      }
    }
  }

  async function handleSignOut() {
    await apiPost("/api/auth/logout", {});
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            aria-label="Unlost home"
            className="text-xl font-semibold tracking-tight"
          >
            unlost<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">
              {user?.name ?? ""}
            </span>
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs text-white">
              {user ? getInitials(user.name) : ""}
            </span>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="text-sm font-medium text-muted hover:text-foreground"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">
              Personal library
            </p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">
              What you saved
            </h1>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              Collect what catches your attention, find it again when you need it.
            </p>
          </div>
          <button
            type="button"
            aria-expanded={isComposerOpen}
            aria-controls="capture-composer"
            onClick={() => {
              setEditingItem(null);
              setImageFile(null);
              setImageError(null);
              setIsComposerOpen((isOpen) => !isOpen);
            }}
            className="self-start bg-accent px-6 py-4 font-medium transition-transform hover:-translate-y-0.5 lg:self-auto"
          >
            {isComposerOpen ? "Close form" : "+ New item"}
          </button>
        </div>

        <section
          aria-labelledby="ask-library-title"
          className="mt-8 border border-border bg-background p-5 sm:p-8"
        >
          <h2 id="ask-library-title" className="font-display text-2xl">
            Ask your library
          </h2>
          <form
            onSubmit={(event) => void handleAsk(event)}
            className="mt-4 flex flex-col gap-3 sm:flex-row"
          >
            <label className="flex-1">
              <span className="sr-only">Ask a question about what you saved</span>
              <input
                type="search"
                value={askQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setAskQuery(value);
                  if (!value.trim()) {
                    setAskAnswer(null);
                    setAskMatches([]);
                    setAskError(null);
                  }
                }}
                placeholder="What did I save about..."
                className="min-h-12 w-full border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <button
              type="submit"
              disabled={isAsking || !askQuery.trim()}
              className="bg-foreground px-6 py-3 text-white disabled:opacity-60"
            >
              {isAsking ? "Thinking..." : "Ask"}
            </button>
          </form>

          {askError ? (
            <p className="mt-4 text-sm text-red-600">{askError}</p>
          ) : null}

          {askAnswer ? (
            <div className="mt-5">
              <p className="leading-7">{askAnswer}</p>
              {citedMatches.length > 0 && (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {citedMatches.map(({ match, citation }) => (
                    <li
                      key={match.id}
                      className="border border-border bg-white/60 p-3 text-sm"
                    >
                      <p className="text-xs text-muted">[{citation}]</p>
                      {match.imageMimeType && (
                        <div className="mt-1 flex max-h-56 items-center justify-center border border-border bg-surface">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/library-items/${match.id}/image`}
                            alt=""
                            className="max-h-56 w-full object-contain"
                          />
                        </div>
                      )}
                      <p className="mt-1 font-medium">{match.title}</p>
                      {match.description && (
                        <p className="mt-1 text-muted">{match.description}</p>
                      )}
                      {match.source && (
                        <a
                          href={match.source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block truncate text-xs text-muted underline hover:text-foreground"
                        >
                          {match.source}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </section>

        {isComposerOpen && (
          <section
            id="capture-composer"
            aria-labelledby="capture-composer-title"
            className="mt-8 border border-border bg-background p-5 sm:p-8"
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
                  defaultValue={editingItem?.title}
                  className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="What do you want to remember?"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Type
                <select
                  name="type"
                  className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue={editingItem?.type ?? "note"}
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
                  className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://..."
                />
              </label>
              <label className="grid gap-2 text-sm font-medium lg:col-span-2">
                Image (optional)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="min-h-12 border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>
              {imageError ? (
                <p className="text-sm text-red-600 lg:col-span-2">{imageError}</p>
              ) : null}
              {imageFile ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageFile.dataUrl}
                  alt="Selected preview"
                  className="max-h-48 w-auto border border-border object-contain lg:col-span-2"
                />
              ) : editingItem?.imageMimeType ? (
                <div className="lg:col-span-2">
                  <p className="text-xs text-muted">
                    Current image — choose a new file to replace it
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/library-items/${editingItem.id}/image`}
                    alt="Current"
                    className="mt-1 max-h-48 w-auto border border-border object-contain"
                  />
                </div>
              ) : null}
              <label className="grid gap-2 text-sm font-medium lg:col-span-2">
                Description
                <textarea
                  name="description"
                  required={!imageFile && !editingItem?.imageMimeType}
                  rows={4}
                  defaultValue={editingItem?.description}
                  className="resize-y border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Why do you want to keep this? (leave blank to let AI describe the image)"
                />
              </label>

              {saveError ? (
                <p className="text-sm text-red-600 lg:col-span-2">{saveError}</p>
              ) : null}

              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-foreground px-6 py-3 text-white disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : editingItem ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(false);
                    setEditingItem(null);
                    setImageFile(null);
                    setImageError(null);
                  }}
                  className="border border-border px-6 py-3"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section aria-labelledby="library-results-title" className="mt-10">
          <h2 id="library-results-title" className="sr-only">
            Results
          </h2>
          <div className="flex flex-col gap-5 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
            <div
              role="group"
              className="flex gap-5 overflow-x-auto"
              aria-label="Filter by type"
            >
              {filterOptions.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={activeFilter === filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`shrink-0 pb-2 text-sm transition-colors ${activeFilter === filter.value ? "border-b-2 border-foreground text-foreground" : "text-muted hover:text-foreground"}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label className="relative block md:w-80">
              <span className="sr-only">Search your library</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your library"
                className="min-h-12 w-full border border-border bg-background px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          {isLoading ? (
            <p className="mt-5 text-sm text-muted">Loading your library...</p>
          ) : loadError ? (
            <div className="mt-5 border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
              {loadError}
            </div>
          ) : (
            <>
              <p aria-live="polite" className="mt-5 text-sm text-muted">
                {visibleItems.length} items
              </p>

              {visibleItems.length > 0 ? (
                <div className="mt-5 columns-1 gap-5 sm:columns-2 xl:columns-3">
                  {visibleItems.map((item) => (
                    <div key={item.id} className="mb-5 break-inside-avoid">
                      <LibraryCard
                        item={item}
                        onEdit={handleEdit}
                        onDelete={(id) => void handleDelete(id)}
                        isDeleting={deletingId === item.id}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 border border-dashed border-border bg-background px-6 py-16 text-center">
                  <h3 className="font-display text-2xl">No matching items.</h3>
                  <p className="mt-2 text-muted">
                    Try a different search term or filter.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
