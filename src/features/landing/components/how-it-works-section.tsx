type HowItWorksStep = {
  id: string;
  number: string;
  title: string;
  description: string;
};

// A real sequence, so the steps are numbered.
const steps: HowItWorksStep[] = [
  {
    id: "save",
    number: "1",
    title: "Save it",
    description: "Paste a link, jot a note or drop a screenshot. It takes a few seconds.",
  },
  {
    id: "forget",
    number: "2",
    title: "Forget about it",
    description: "Unlost tags it and reads your screenshots, so you don't have to file anything.",
  },
  {
    id: "find",
    number: "3",
    title: "Describe it later",
    description: "Ask in your own words. Unlost finds the item and shows where the answer came from.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 id="how-it-works-title" className="max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
          Saving is easy. Remembering where shouldn&rsquo;t be your job.
        </h2>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step) => (
            <li key={step.id}>
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-full border border-foreground text-sm font-medium"
              >
                {step.number}
              </span>
              <h3 className="mt-5 font-display text-xl">{step.title}</h3>
              <p className="mt-2 leading-7 text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
