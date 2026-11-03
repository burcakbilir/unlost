import { itemImageUrl } from "@/features/library/image-url";
import type { SearchMatch } from "@/features/library/types";
import { displayHost } from "@/features/library/components/library-card";

// One search result in the Ask panel. `citation` is its [n] in an AI answer;
// weaker matches have none because they're never sent to the model.
export function AskMatch({ match, citation }: { match: SearchMatch; citation?: number }) {
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
