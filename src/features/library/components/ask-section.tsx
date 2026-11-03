"use client";

import { SparkleIcon } from "@/features/library/components/icons";
import { AskPanel } from "@/features/library/components/ask-panel";
import { AskMatch } from "@/features/library/components/ask-match";
import type { useAsk } from "@/features/library/hooks/use-ask";

// The Ask panel with everything under it: errors, notices, the numbered strong
// matches, the optional AI answer and the folded weaker matches.
export function AskSection({ ask }: { ask: ReturnType<typeof useAsk> }) {
  return (
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
  );
}
