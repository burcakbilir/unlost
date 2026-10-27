"use client";

import { AskPanel } from "@/features/library/components/ask-panel";
import { DashboardSidebar } from "@/features/library/components/dashboard-sidebar";
import { LibraryCard } from "@/features/library/components/library-card";
import { SearchIcon } from "@/features/library/components/icons";
import type { LibraryItem } from "@/features/library/types";

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * DAY).toISOString();
}

// A small black-and-white "screenshot", so the image card shows an image
// without shipping a photo or loading anything from another site.
const sampleScreenshot = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f6f6f6"/><rect x="28" y="28" width="150" height="16" rx="8" fill="#000"/><rect x="28" y="58" width="230" height="10" rx="5" fill="#c9c9c9"/><rect x="28" y="76" width="190" height="10" rx="5" fill="#c9c9c9"/><rect x="28" y="112" width="160" height="160" rx="14" fill="#000"/><rect x="204" y="112" width="168" height="74" rx="14" fill="#fff" stroke="#000" stroke-width="3"/><rect x="204" y="198" width="168" height="74" rx="14" fill="#e3e3e3"/><circle cx="108" cy="192" r="34" fill="#fff"/></svg>`,
)}`;

const sampleItems: (LibraryItem & { imageSrc?: string })[] = [
  {
    id: "sample-cafe",
    type: "link",
    title: "Quiet café with fast wifi",
    description: "Plenty of outlets, calm in the afternoon. Good for deep work days.",
    source: "https://maps.google.com",
    tags: ["work", "cafe"],
    imageMimeType: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
  {
    id: "sample-dress",
    type: "note",
    title: "Red satin dress for the wedding",
    description: "Seen at the boutique on the corner. Size 38, check again on Friday.",
    source: "",
    tags: ["wedding", "shopping"],
    imageMimeType: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  },
  {
    id: "sample-dashboard",
    type: "image",
    title: "Clean dashboard layout",
    description: "",
    source: "",
    tags: ["design"],
    imageMimeType: "image/svg+xml",
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
    imageSrc: sampleScreenshot,
  },
];

const noop = () => {};

// Built from the dashboard's own components (sidebar, Ask panel, cards), so
// the landing page always shows the product as it really looks. It's inert:
// visible, but not focusable or clickable.
export function ProductPreview() {
  return (
    <section id="product-preview" aria-labelledby="product-preview-title" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 pb-28">
        <h2 id="product-preview-title" className="sr-only">
          A look at the Unlost library
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border shadow-[0_30px_80px_-30px_rgb(0_0_0/0.35)]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3" aria-hidden="true">
            <span className="size-2.5 rounded-full border border-border" />
            <span className="size-2.5 rounded-full border border-border" />
            <span className="size-2.5 rounded-full border border-border" />
            <span className="ml-3 text-xs text-muted">unlost.app/dashboard</span>
          </div>

          <div inert aria-hidden="true" className="relative h-[560px] overflow-hidden md:flex">
            <DashboardSidebar
              embedded
              user={{ name: "Ada Lovelace", email: "ada@example.com" }}
              activeFilter="all"
              counts={{ all: 24, link: 9, note: 10, image: 5 }}
              onFilterChange={noop}
              onNewItem={noop}
              onOpenSettings={noop}
              onSignOut={noop}
            />
            <div className="min-w-0 flex-1 px-6 py-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">Good morning, Ada</p>
                  <p className="mt-1 font-display text-3xl">All items</p>
                </div>
                <div className="hidden w-64 items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm text-muted sm:flex">
                  <SearchIcon className="size-4" />
                  Filter by keyword
                </div>
              </div>
              <div className="mt-5">
                <AskPanel
                  query="that red dress I saw for the wedding"
                  onQueryChange={noop}
                  onSubmit={noop}
                  isAsking={false}
                />
              </div>
              <p className="mt-6 text-sm text-muted">24 items</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sampleItems.map(({ imageSrc, ...item }) => (
                  <LibraryCard key={item.id} item={item} imageSrc={imageSrc} onEdit={noop} onDelete={noop} />
                ))}
              </div>
            </div>
            {/* Fade the cut-off bottom edge into the page. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
