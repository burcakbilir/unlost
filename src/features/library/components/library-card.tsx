"use client";

import type { ComponentProps, ReactNode } from "react";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { itemImageUrl } from "@/features/library/image-url";
import type { CaptureType, LibraryItem } from "@/features/library/types";
import { ExternalIcon, ImageIcon, LinkIcon, NoteIcon } from "@/features/library/components/icons";

type IconComponent = (props: ComponentProps<"svg">) => ReactNode;

export const typeLabels: Record<CaptureType, string> = {
  link: "Link",
  note: "Note",
  image: "Image",
};

export const typeIcons: Record<CaptureType, IconComponent> = {
  link: LinkIcon,
  note: NoteIcon,
  image: ImageIcon,
};

// "https://www.example.com/a/b" -> "example.com": the part people recognize.
export function displayHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

type LibraryCardProps = {
  item: LibraryItem;
  // Without handlers the card renders read-only (the landing page preview).
  onEdit?: (item: LibraryItem) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  // Replaces the stored image, for preview cards that have no saved image.
  imageSrc?: string;
};

export function LibraryCard({ item, onEdit, onDelete, isDeleting = false, imageSrc }: LibraryCardProps) {
  const TypeIcon = typeIcons[item.type];
  const image = imageSrc ?? (item.imageMimeType ? itemImageUrl(item) : null);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-background p-4 transition-colors hover:border-foreground/40">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="mb-4 aspect-[4/3] w-full rounded-xl bg-surface object-cover"
        />
      ) : null}

      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <TypeIcon className="size-3.5" />
          {typeLabels[item.type]}
        </span>
        <span>{formatRelativeTime(item.updatedAt)}</span>
      </div>

      <h3 className="mt-3 font-display text-lg leading-snug">{item.title}</h3>
      {item.description ? (
        <p className="mt-1.5 line-clamp-4 text-sm leading-6 text-muted">{item.description}</p>
      ) : null}

      {item.source ? (
        <a
          href={item.source}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex max-w-full items-center gap-1.5 self-start text-xs font-medium underline-offset-4 hover:underline"
        >
          <ExternalIcon className="size-3.5 shrink-0" />
          <span className="truncate">{displayHost(item.source)}</span>
        </a>
      ) : null}

      {item.tags.length > 0 ? (
        <ul aria-label="Tags" className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <li key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      {onEdit || onDelete ? (
        <div className="mt-auto flex gap-1 pt-4 text-sm">
          {onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="-ml-2 rounded-lg px-2 py-1.5 font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              Edit<span className="sr-only"> {item.title}</span>
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
              className="rounded-lg px-2 py-1.5 font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {isDeleting ? "Deleting..." : "Delete"}
              <span className="sr-only"> {item.title}</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
