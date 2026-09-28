import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section id="get-started" aria-labelledby="get-started-title" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32">
        <p className="text-xs uppercase tracking-widest">Save it today, find it later</p>
        <h2 id="get-started-title" className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-none tracking-tight sm:text-6xl lg:text-7xl">
          Stop losing track of the things on your mind.
        </h2>
        <Link
          href="/dashboard"
          className="mt-10 inline-block bg-accent px-7 py-4 font-medium transition-transform hover:-translate-y-0.5"
        >
          Start for free <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
