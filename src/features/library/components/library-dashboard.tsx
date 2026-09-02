"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { initialLibraryItems } from "@/features/library/data/library-items";
import type { CaptureType, LibraryFilter, LibraryItem } from "@/features/library/types";

const filterOptions: { label: string; value: LibraryFilter }[] = [
  { label: "Tümü", value: "all" },
  { label: "Linkler", value: "link" },
  { label: "Notlar", value: "note" },
  { label: "Görseller", value: "image" },
];

const typeLabels: Record<CaptureType, string> = {
  link: "Link",
  note: "Not",
  image: "Görsel",
};

const typeStyles: Record<CaptureType, string> = {
  link: "bg-mint",
  note: "bg-lilac",
  image: "bg-peach",
};

function isCaptureType(value: string): value is CaptureType {
  return value === "link" || value === "note" || value === "image";
}

function LibraryCard({ item }: { item: LibraryItem }) {
  return (
    <article className="group flex min-h-72 flex-col border border-border bg-white/70 p-5 transition-transform hover:-translate-y-1">
      <div className={`flex aspect-video items-start justify-between p-4 ${typeStyles[item.type]}`}>
        <span className="text-xs uppercase tracking-widest">{typeLabels[item.type]}</span>
        <span aria-hidden="true" className="font-display text-3xl">
          {item.type === "link" ? "↗" : item.type === "note" ? "✦" : "◌"}
        </span>
      </div>
      <h3 className="mt-5 font-display text-2xl">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-muted">
        <span className="truncate">{item.source}</span>
        <span className="shrink-0">{item.savedAt}</span>
      </div>
    </article>
  );
}

export function LibraryDashboard() {
  const [items, setItems] = useState<LibraryItem[]>(initialLibraryItems);
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr");

    return items.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.type === activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${item.title} ${item.description} ${item.source}`
          .toLocaleLowerCase("tr")
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, items, query]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const rawType = String(formData.get("type") ?? "note");
    const type: CaptureType = isCaptureType(rawType) ? rawType : "note";

    if (!title || !description) return;

    setItems((currentItems) => [
      {
        id: crypto.randomUUID(),
        type,
        title,
        description,
        source: type === "link" ? "Yeni link" : type === "image" ? "Yeni görsel" : "Kısa not",
        savedAt: "Şimdi",
      },
      ...currentItems,
    ]);
    form.reset();
    setActiveFilter("all");
    setIsComposerOpen(false);
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Unlost ana sayfa" className="text-xl font-semibold tracking-tight">
            unlost<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">John Doe</span>
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-xs text-white">JD</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Kişisel kütüphane</p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl">Kaydettiklerin</h1>
            <p className="mt-3 max-w-xl leading-7 text-muted">
              Aklına takılanları tek yerde topla, ihtiyacın olduğunda yeniden bul.
            </p>
          </div>
          <button
            type="button"
            aria-expanded={isComposerOpen}
            aria-controls="capture-composer"
            onClick={() => setIsComposerOpen((isOpen) => !isOpen)}
            className="self-start bg-accent px-6 py-4 font-medium transition-transform hover:-translate-y-0.5 lg:self-auto"
          >
            {isComposerOpen ? "Formu kapat" : "+ Yeni kayıt"}
          </button>
        </div>

        {isComposerOpen && (
          <section id="capture-composer" aria-labelledby="capture-composer-title" className="mt-8 border border-border bg-background p-5 sm:p-8">
            <h2 id="capture-composer-title" className="font-display text-3xl">Yeni bir şey kaydet</h2>
            <form onSubmit={handleSubmit} className="mt-6 grid gap-5 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Başlık
                <input name="title" required className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Neyi hatırlamak istiyorsun?" />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Tür
                <select name="type" className="min-h-12 border border-border bg-white px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" defaultValue="note">
                  <option value="note">Not</option>
                  <option value="link">Link</option>
                  <option value="image">Görsel</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium lg:col-span-2">
                Açıklama
                <textarea name="description" required rows={4} className="resize-y border border-border bg-white px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Bu kaydı neden saklamak istiyorsun?" />
              </label>
              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button type="submit" className="bg-foreground px-6 py-3 text-white">Kaydet</button>
                <button type="button" onClick={() => setIsComposerOpen(false)} className="border border-border px-6 py-3">Vazgeç</button>
              </div>
            </form>
          </section>
        )}

        <section aria-labelledby="library-results-title" className="mt-10">
          <h2 id="library-results-title" className="sr-only">Kayıt sonuçları</h2>
          <div className="flex flex-col gap-5 border-b border-border pb-5 md:flex-row md:items-center md:justify-between">
            <div role="group" className="flex gap-5 overflow-x-auto" aria-label="Kayıt filtreleri">
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
              <span className="sr-only">Kayıtlarda ara</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Kayıtlarda ara"
                className="min-h-12 w-full border border-border bg-background px-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>

          <p aria-live="polite" className="mt-5 text-sm text-muted">
            {visibleItems.length} kayıt gösteriliyor
          </p>

          {visibleItems.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <LibraryCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-5 border border-border bg-background px-6 py-16 text-center">
              <h3 className="font-display text-2xl">Eşleşen kayıt bulunamadı.</h3>
              <p className="mt-2 text-muted">Arama kelimesini veya aktif filtreyi değiştirmeyi dene.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
