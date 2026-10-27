import Link from "next/link";

export function SiteHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <a href="#top" aria-label="Unlost home" className="font-display text-xl">
          unlost.
        </a>
        <nav aria-label="Main navigation" className="flex items-center gap-2 text-sm sm:gap-6">
          <a href="#how-it-works" className="hidden text-muted transition-colors hover:text-foreground sm:block">
            How it works
          </a>
          <a href="#product-preview" className="hidden text-muted transition-colors hover:text-foreground md:block">
            Product
          </a>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-85"
            >
              Open library
            </Link>
          ) : (
            <>
              <Link href="/login" className="px-2 text-muted transition-colors hover:text-foreground">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-85"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
