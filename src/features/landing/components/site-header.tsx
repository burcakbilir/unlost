import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:py-5">
        <a href="#top" aria-label="Unlost home" className="text-xl font-semibold tracking-tight">
          unlost<span className="text-primary">.</span>
        </a>
        <nav aria-label="Main navigation" className="flex items-center gap-3 text-sm sm:gap-6">
          <a href="#how-it-works" className="hidden transition-colors hover:text-primary sm:block">
            How it works
          </a>
          <a href="#product-preview" className="hidden transition-colors hover:text-primary md:block">
            Explore the product
          </a>
          <Link
            href="/dashboard"
            className="bg-foreground px-4 py-3 text-white transition-transform hover:-translate-y-0.5 sm:px-5"
          >
            Start for free
          </Link>
        </nav>
      </div>
    </header>
  );
}
