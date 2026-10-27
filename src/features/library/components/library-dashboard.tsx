"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { apiDelete, apiGet, apiPatch, apiPost, isUnauthorizedError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { ALLOWED_IMAGE_TYPES, MAX_SOURCE_IMAGE_BYTES } from "@/features/library/constants";
import { compressImage } from "@/features/library/compress-image";
import { itemImageUrl } from "@/features/library/image-url";
import type {
  CaptureType,
  LibraryFilter,
  LibraryItem,
  SearchResponse,
} from "@/features/library/types";
import {
  SettingsPanel,
  type GeminiKeyStatus,
} from "@/features/settings/components/settings-panel";

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

function LibraryCard({ item, onEdit, onDelete, isDeleting }: LibraryCardProps) {
  return (
    <article className="flex h-full flex-col bg-white/70 p-4 transition-transform motion-safe:hover:-translate-y-1">
      <p className="text-xs uppercase tracking-widest text-muted">
        {typeLabels[item.type]}
      </p>
      <div
        className={`mt-3 flex aspect-video items-start justify-end overflow-hidden p-4 ${item.imageMimeType ? "bg-surface" : typeStyles[item.type]}`}
      >
        {item.imageMimeType ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={itemImageUrl(item)}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : (
          <span aria-hidden="true" className="font-display text-4xl">
            {typeIcon[item.type]}
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-xl">{item.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
        {item.description}
      </p>
      {item.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li key={tag} className="bg-surface px-2 py-1 text-xs text-muted">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-xs text-muted">
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
          Edit<span className="sr-only"> {item.title}</span>
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={isDeleting}
          className="font-medium text-muted hover:text-red-600 disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
          <span className="sr-only"> {item.title}</span>
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
    if (!askResult || askResult.matches.length === 0) return;

    const requestId = askRequestId.current;

    setIsAnswering(true);
    setAnswerError(null);

    try {
      const { answer } = await apiPost<{ answer: string }>("/api/search/answer", {
        query: askResult.query,
        itemIds: askResult.matches.map((match) => match.id),
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
    <div className="flex min-h-screen bg-surface text-foreground">
      <aside
        aria-label="Unlost menu"
        className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center bg-sidebar py-5 text-white sm:w-20"
      >
        <Link
          href="/"
          aria-label="Unlost home"
          className="font-display text-2xl italic"
        >
          u.
        </Link>
        <button
          type="button"
          aria-expanded={isComposerOpen}
          aria-controls="capture-composer"
          title="New item"
          onClick={() => {
            setEditingItem(null);
            setComposerType("note");
            setImageFile(null);
            setImageError(null);
            setIsComposerOpen((isOpen) => !isOpen);
          }}
          className="mt-10 flex size-11 items-center justify-center bg-accent text-xl text-foreground transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <span aria-hidden="true">{isComposerOpen ? "×" : "+"}</span>
          <span className="sr-only">{isComposerOpen ? "Close new item form" : "New item"}</span>
        </button>
        <button
          type="button"
          aria-expanded={isSettingsOpen}
          aria-controls="settings-panel"
          title="Settings"
          onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
          className="mt-4 flex size-11 items-center justify-center border border-white/20 text-white transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="sr-only">Settings</span>
        </button>
        <div className="mt-auto flex flex-col items-center gap-3">
          <span
            title={user?.name}
            className="flex size-9 items-center justify-center rounded-full bg-primary text-xs"
          >
            {user ? getInitials(user.name) : ""}
          </span>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={() => void handleSignOut()}
            className="flex size-9 items-center justify-center rounded-full bg-primary text-white transition-transform motion-safe:hover:-translate-y-0.5"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-3 text-xs uppercase tracking-widest text-primary">
              <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
              {getGreeting()}
              {user ? `, ${user.name.split(" ")[0]}` : ""}
            </p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">
              What do you want to remember today?
            </h1>
          </div>
          <label className="relative block shrink-0 sm:w-72">
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

        <section
          aria-labelledby="ask-library-title"
          className="mt-8 bg-sidebar p-5 text-white sm:p-8"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary"
            >
              ✦
            </span>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">
                Ask, don&rsquo;t scroll
              </p>
              <h2 id="ask-library-title" className="font-display text-2xl">
                Ask your library
              </h2>
            </div>
          </div>
          <form
            onSubmit={(event) => void handleAsk(event)}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <label className="flex-1">
              <span className="sr-only">Ask a question about what you saved</span>
              <input
                type="search"
                value={askQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setAskQuery(value);
                  if (!value.trim()) resetAsk();
                }}
                placeholder="What did I save about..."
                className="min-h-12 w-full border border-white/20 bg-white px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <button
              type="submit"
              disabled={isAsking || !askQuery.trim()}
              className="bg-accent px-6 py-3 font-medium text-foreground transition-transform motion-safe:hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isAsking ? "Searching..." : "Ask"}
            </button>
          </form>

          {/* Announced to screen readers as results, answers and errors arrive. */}
          <div aria-live="polite" aria-busy={isAsking || isAnswering}>
            {askError ? (
              <p className="mt-4 text-sm text-red-300">{askError}</p>
            ) : null}

            {askResult ? (
              <div className="mt-5">
                {askResult.notice ? (
                  <p className="mb-3 text-sm text-white/70">{askResult.notice}</p>
                ) : null}

                {askResult.matches.length === 0 ? (
                  <p className="leading-7">Nothing in your library looks related to that yet.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-white/70">
                        {askResult.matches.length}{" "}
                        {askResult.matches.length === 1 ? "match" : "matches"}
                        {askResult.mode === "keyword" ? " by keyword" : ""}
                      </p>
                      {askResult.canAnswer && !askAnswer ? (
                        <button
                          type="button"
                          onClick={() => void handleAnswer()}
                          disabled={isAnswering}
                          className="border border-white/30 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-60"
                        >
                          {isAnswering ? "Writing answer..." : "Summarize with AI"}
                        </button>
                      ) : null}
                    </div>

                    {answerError ? (
                      <p className="mt-3 text-sm text-red-300">{answerError}</p>
                    ) : null}
                    {askAnswer ? <p className="mt-4 leading-7">{askAnswer}</p> : null}

                    <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                      {askResult.matches.map((match, index) => (
                        <li
                          key={match.id}
                          className="border border-white/20 bg-white/95 p-3 text-sm text-foreground"
                        >
                          <p className="text-xs text-muted" aria-hidden="true">
                            [{index + 1}]
                          </p>
                          {match.imageMimeType && (
                            <div className="mt-1 flex max-h-56 items-center justify-center border border-border bg-surface">
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
                          {match.description && (
                            <p className="mt-1 line-clamp-4 text-muted">{match.description}</p>
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
                    </ol>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </section>

        {isSettingsOpen && (
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
        )}

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
                  value={composerType}
                  onChange={(event) =>
                    setComposerType(event.target.value as CaptureType)
                  }
                  className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
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
              {composerType === "image" && (
                <>
                  <div className="grid gap-2 text-sm font-medium lg:col-span-2">
                    <span>Image (optional)</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-border bg-white px-4 py-3 font-medium hover:bg-surface"
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
                  className="resize-y border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="bg-foreground px-6 py-3 text-white disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : editingItem ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsComposerOpen(false);
                    setEditingItem(null);
                    setComposerType("note");
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
          <div
            role="group"
            className="flex gap-6 overflow-x-auto border-b border-border pb-3 text-sm text-muted"
            aria-label="Filter by type"
          >
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={activeFilter === filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`shrink-0 pb-2 transition-colors ${activeFilter === filter.value ? "border-b-2 border-foreground text-foreground" : "hover:text-foreground"}`}
              >
                {filter.label} {filterCounts[filter.value]}
              </button>
            ))}
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
                <div className="mt-5 grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
        </div>
      </main>
    </div>
  );
}
