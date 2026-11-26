"use client";

import type { FormEvent, ReactNode } from "react";
import { SparkleIcon } from "@/features/library/components/icons";

type AskPanelProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isAsking: boolean;
  // Results, answers and errors, rendered under the form.
  children?: ReactNode;
};

export function AskPanel({ query, onQueryChange, onSubmit, isAsking, children }: AskPanelProps) {
  return (
    // Search leads the dashboard, so its heading is the page's h1. The Filter box
    // lives with the list instead (LibraryResults): keeping the two apart is what
    // tells them apart (.scratch/search-vs-filter).
    <section
      aria-labelledby="search-title"
      className="rounded-3xl bg-surface px-4 py-6 sm:px-10 sm:py-10"
    >
      <div className="sm:text-center">
        <span
          aria-hidden="true"
          className="mx-auto hidden size-11 items-center justify-center rounded-xl bg-foreground text-background sm:flex"
        >
          <SparkleIcon className="size-5" />
        </span>
        <h1 id="search-title" className="font-display text-2xl sm:mt-4 sm:text-3xl">
          What are you looking for?
        </h1>
        {/* Hidden on phones to keep the list in view; the placeholder carries the idea there. */}
        <p className="mt-1 hidden text-sm text-muted sm:block">
          Describe what you remember. Unlost finds it, even without the exact words.
        </p>
      </div>
      <form onSubmit={onSubmit} className="mx-auto mt-4 flex max-w-2xl flex-col gap-2 sm:mt-5 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Describe what you remember</span>
          <input
            type="search"
            name="question"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="e.g. that red dress I saw for the wedding"
            className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-base focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </label>
        <button
          type="submit"
          disabled={isAsking || !query.trim()}
          className="min-h-12 rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-30"
        >
          {isAsking ? "Searching..." : "Search"}
        </button>
      </form>
      {children}
    </section>
  );
}
