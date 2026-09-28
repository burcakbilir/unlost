type Benefits = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

const benefits: Benefits[] = [
  {
    id: "everything",
    eyebrow: "Everything in one place",
    title: "Different formats, one memory.",
    description:
      "Keep links, notes and screenshots in a single library instead of losing them across apps.",
  },
  {
    id: "context",
    eyebrow: "Keep the context",
    title: "Remember why you saved it too.",
    description:
      "Short notes and tags tell your future self why an item mattered in the first place.",
  },
  {
    id: "resurface",
    eyebrow: "Rediscover it",
    title: "A living space, not an archive.",
    description:
      "Old saves shouldn't just pile up quietly — they should resurface at the right time.",
  },
];

export function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-title" className="bg-sidebar text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-xs uppercase tracking-widest text-white/60">
          Why Unlost?
        </p>
        <h2
          id="benefits-title"
          className="mt-6 max-w-3xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl"
        >
          Make what you saved useful again.
        </h2>
        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit.id} className="border-t border-white/20 pt-6">
              <p className="text-xs uppercase tracking-widest text-accent">
                {benefit.eyebrow}
              </p>
              <h3 className="mt-6 font-display text-2xl">{benefit.title}</h3>
              <p className="mt-3 leading-7 text-white/60">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
