"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LibraryFilter } from "@/features/library/types";
import {
  ImageIcon,
  LibraryIcon,
  LinkIcon,
  NoteIcon,
  PlusIcon,
  SettingsIcon,
  SignOutIcon,
} from "@/features/library/components/icons";

type FilterOption = {
  label: string;
  value: LibraryFilter;
  Icon: (props: ComponentProps<"svg">) => ReactNode;
};

export const filterOptions: FilterOption[] = [
  { label: "All items", value: "all", Icon: LibraryIcon },
  { label: "Links", value: "link", Icon: LinkIcon },
  { label: "Notes", value: "note", Icon: NoteIcon },
  { label: "Images", value: "image", Icon: ImageIcon },
];

export function filterLabel(filter: LibraryFilter): string {
  return filterOptions.find((option) => option.value === filter)?.label ?? "All items";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type DashboardSidebarProps = {
  user: { name: string; email: string } | null;
  activeFilter: LibraryFilter;
  counts: Record<LibraryFilter, number>;
  onFilterChange: (filter: LibraryFilter) => void;
  onNewItem: () => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  // Inside the landing page preview: fill the frame instead of the viewport.
  embedded?: boolean;
};

// The one solid black surface in the app. Holds navigation and the type
// filters with their counts; on phones it becomes a slim top bar and the
// filters move into the page (see FilterChips).
export function DashboardSidebar({
  user,
  activeFilter,
  counts,
  onFilterChange,
  onNewItem,
  onOpenSettings,
  onSignOut,
  embedded = false,
}: DashboardSidebarProps) {
  return (
    <aside
      aria-label="Unlost menu"
      className={`${embedded ? "md:h-full" : "sticky top-0 md:h-screen"} z-10 flex items-center gap-2 bg-foreground px-4 py-3 text-background md:w-60 md:shrink-0 md:flex-col md:items-stretch md:gap-0 md:px-3 md:py-5`}
    >
      <Link href="/" aria-label="Unlost home" className="mr-auto px-2 font-display text-xl md:mr-0">
        unlost.
      </Link>

      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onNewItem}
        className="flex items-center justify-center gap-2 rounded-xl bg-background px-3 py-2.5 text-sm font-medium text-foreground transition-opacity hover:opacity-90 md:mt-7"
      >
        <PlusIcon className="size-[18px]" />
        <span className="sr-only md:not-sr-only">New item</span>
      </button>

      <nav aria-label="Filter by type" className="hidden md:mt-7 md:block">
        <p className="px-3 text-xs font-medium text-background/50">Library</p>
        <ul className="mt-2 grid gap-0.5">
          {filterOptions.map(({ label, value, Icon }) => {
            const isActive = activeFilter === value;
            return (
              <li key={value}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onFilterChange(value)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? "bg-background/15 font-medium text-background" : "text-background/70 hover:bg-background/10 hover:text-background"}`}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-left">{label}</span>
                  <span className="text-xs tabular-nums text-background/50">{counts[value]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOpenSettings}
        className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-background/70 transition-colors hover:bg-background/10 hover:text-background md:mt-auto md:px-3 md:py-2"
      >
        <SettingsIcon className="size-4" />
        <span className="sr-only md:not-sr-only">Settings</span>
      </button>

      <div className="flex items-center gap-3 md:mt-2 md:border-t md:border-background/15 md:px-1 md:pt-4">
        <span
          aria-hidden="true"
          className="hidden size-8 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground md:flex"
        >
          {user ? getInitials(user.name) : ""}
        </span>
        <div className="hidden min-w-0 flex-1 md:block">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-background/50">{user?.email}</p>
        </div>
        <button
          type="button"
          title="Sign out"
          onClick={onSignOut}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-background/70 transition-colors hover:bg-background/10 hover:text-background"
        >
          <SignOutIcon className="size-4" />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    </aside>
  );
}

type FilterChipsProps = {
  activeFilter: LibraryFilter;
  counts: Record<LibraryFilter, number>;
  onFilterChange: (filter: LibraryFilter) => void;
};

// Phones: the sidebar's filters as a scrollable row of chips.
export function FilterChips({ activeFilter, counts, onFilterChange }: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Filter by type"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:hidden"
    >
      {filterOptions.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          aria-pressed={activeFilter === value}
          onClick={() => onFilterChange(value)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${activeFilter === value ? "bg-foreground text-background" : "border border-border text-muted"}`}
        >
          {label} <span className="tabular-nums opacity-60">{counts[value]}</span>
        </button>
      ))}
    </div>
  );
}
