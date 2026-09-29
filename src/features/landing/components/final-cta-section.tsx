"use client";

import Link from "next/link";
import { useIsAuthenticated } from "@/features/landing/hooks/use-is-authenticated";

export function FinalCtaSection() {
  const isAuthenticated = useIsAuthenticated();

  return (
    <section id="get-started" aria-labelledby="get-started-title" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
        <p className="text-xs uppercase tracking-widest">Save it today, find it later</p>
        <h2 id="get-started-title" className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
          Stop losing track of the things on your mind.
        </h2>
        <Link
          href={isAuthenticated ? "/dashboard" : "/register"}
          className="mt-10 inline-block bg-accent px-7 py-4 font-medium transition-transform hover:-translate-y-0.5"
        >
          {isAuthenticated ? "Go to dashboard" : "Start for free"}{" "}
          <span aria-hidden="true">→</span>
        </Link>

        {isAuthenticated ? null : (
          <p className="mt-4 text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Log in
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
