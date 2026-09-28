import Link from "next/link";

export function HeroSection() {
  return (
    <section id="top" aria-labelledby="hero-title" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pt-20 lg:pb-20 lg:pt-24">
        <p className="flex items-center gap-3 text-xs uppercase tracking-widest">
          <span aria-hidden="true" className="size-2 rounded-full bg-primary" />
          Come back to what you saved
        </p>
        <h1
          id="hero-title"
          className="mt-8 max-w-4xl font-display text-5xl leading-none tracking-tighter sm:text-7xl md:text-8xl lg:text-9xl"
        >
          Never lose
          <br />
          <em className="font-normal text-primary">it again.</em>
        </h1>
        <div className="mt-10 max-w-lg lg:mt-12">
          <p className="text-lg leading-8 text-muted">
            Collect your links, screenshots and passing thoughts in one place. Unlost
            brings back what you&rsquo;d otherwise forget, right when you need it.
          </p>
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link
              href="/dashboard"
              className="bg-accent px-6 py-4 font-medium transition-transform hover:-translate-y-0.5"
            >
              Save your first item <span aria-hidden="true">→</span>
            </Link>
            <span className="text-xs text-muted">Free · No credit card required</span>
          </div>
        </div>
      </div>
    </section>
  );
}
