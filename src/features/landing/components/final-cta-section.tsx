import Link from "next/link";

export function FinalCtaSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section id="get-started" aria-labelledby="get-started-title" className="scroll-mt-24 px-6 pb-24">
      <div className="mx-auto max-w-6xl rounded-3xl bg-foreground px-6 py-20 text-center text-background sm:py-24">
        <h2 id="get-started-title" className="mx-auto max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
          Stop losing the things you meant to keep.
        </h2>
        <Link
          href={isAuthenticated ? "/dashboard" : "/register"}
          className="mt-9 inline-block rounded-xl bg-background px-6 py-3 font-medium text-foreground transition-opacity hover:opacity-90"
        >
          {isAuthenticated ? "Open your library" : "Start saving"}
        </Link>
        {isAuthenticated ? null : (
          <p className="mt-4 text-sm text-background/60">
            Have an account?{" "}
            <Link href="/login" className="font-medium text-background underline underline-offset-4">
              Log in
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
