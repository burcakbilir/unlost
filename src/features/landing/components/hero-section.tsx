import Link from "next/link";

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section id="top" aria-labelledby="hero-title" className="scroll-mt-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-14 pt-20 text-center sm:pt-28">
        <p className="rounded-full border border-border px-3.5 py-1 text-sm text-muted">
          Invite-only beta
        </p>
        <h1
          id="hero-title"
          className="mt-7 font-display text-5xl leading-[1.02] sm:text-7xl"
        >
          Save anything.
          <br />
          Find it by <span className="pen-underline">describing it</span>.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
          Links, notes and screenshots in one quiet library. Weeks later, type
          what you remember, not where you put it.
        </p>
        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="rounded-xl bg-foreground px-6 py-3 font-medium text-background transition-opacity hover:opacity-85"
          >
            {isAuthenticated ? "Open your library" : "Start saving"}
          </Link>
          <a
            href="#how-it-works"
            className="rounded-xl border border-border px-6 py-3 font-medium transition-colors hover:border-foreground"
          >
            How it works
          </a>
        </div>
      </div>
    </section>
  );
}
