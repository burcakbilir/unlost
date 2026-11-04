"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-10">
      <Link href="/" aria-label="Unlost home" className="font-display text-xl">
        unlost.
      </Link>
      <h1 className="font-display text-3xl">Something went wrong.</h1>
      <p className="text-sm text-muted">
        This page couldn&apos;t load. It may be a temporary problem.
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-85"
        >
          Try again
        </button>
        <Link href="/" className="font-semibold underline underline-offset-4">
          Back to home
        </Link>
      </div>
    </main>
  );
}