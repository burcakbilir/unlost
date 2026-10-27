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
    <section
      aria-labelledby="ask-library-title"
      className="rounded-2xl border border-border p-5 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background"
        >
          <SparkleIcon className="size-[18px]" />
        </span>
        <div>
          <h2 id="ask-library-title" className="font-display text-lg leading-tight">
            Ask your library
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            Describe what you remember. Unlost finds it, even without the exact words.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Ask a question about what you saved</span>
          <input
            type="search"
            name="question"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="e.g. that red dress I saw for the wedding"
            className="min-h-11 w-full rounded-xl border border-border px-4 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10"
          />
        </label>
        <button
          type="submit"
          disabled={isAsking || !query.trim()}
          className="min-h-11 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-30"
        >
          {isAsking ? "Searching..." : "Ask"}
        </button>
      </form>
      {children}
    </section>
  );
}
