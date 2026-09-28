"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiGet, apiPost } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type {
  CaptureType,
  LibraryFilter,
  LibraryItem,
} from "@/features/library/types";

type LibraryCardProps = {
  item: LibraryItem;
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

function LibraryCard({ item }: LibraryCardProps) {
  return (
    <article className="flex min-h-72 flex-col border border-border bg-white/70 p-5 transition-transform hover:-translate-y-1">
      <div
        className={`flex aspect-video items-start justify-between p-4 ${typeStyles[item.type]}`}
      >
        <span className="text-xs uppercase tracking-widest">
          {typeLabels[item.type]}
        </span>
        <span aria-hidden="true" className="font-display text-3xl">
          {typeIcon[item.type]}
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-muted">
        <span className="truncate">{item.source}</span>
        <span className="shrink-0">{formatRelativeTime(item.updatedAt)}</span>
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const rawType = String(formData.get("type") ?? "note");
    const type: CaptureType = isCaptureType(rawType) ? rawType : "note";

    if (!title || !description) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const { item } = await apiPost<{ item: LibraryItem }>(
        "/api/library-items",
        { type, title, description },
      );

      setItems((currentItems) => [item, ...currentItems]);
      form.reset();
      setActiveFilter("all");
      setIsComposerOpen(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save this item",
      );
    } finally {
      setIsSaving(false);
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
            onClick={() => setIsComposerOpen((isOpen) => !isOpen)}
            className="self-start bg-accent px-6 py-4 font-medium transition-transform hover:-translate-y-0.5 lg:self-auto"
          >
            {isComposerOpen ? "Close form" : "+ New item"}
          </button>
        </div>

        {isComposerOpen && (
          <section
            id="capture-composer"
            aria-labelledby="capture-composer-title"
            className="mt-8 border border-border bg-background p-5 sm:p-8"
          >
            <h2 id="capture-composer-title" className="font-display text-3xl">
              Save something new
            </h2>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="mt-6 grid gap-5 lg:grid-cols-2"
            >
              <label className="grid gap-2 text-sm font-medium">
                Title
                <input
                  name="title"
                  required
                  className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="What do you want to remember?"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Type
                <select
                  name="type"
                  className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue="note"
                >
                  <option value="note">Note</option>
                  <option value="link">Link</option>
                  <option value="image">Image</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium lg:col-span-2">
                Description
                <textarea
                  name="description"
                  required
                  rows={4}
                  className="resize-y border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Why do you want to keep this?"
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
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(false)}
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
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleItems.map((item) => (
                    <LibraryCard key={item.id} item={item} />
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
