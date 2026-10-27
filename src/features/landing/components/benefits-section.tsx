type Benefit = {
  id: string;
  title: string;
  description: string;
};

const benefits: Benefit[] = [
  {
    id: "one-place",
    title: "One place for every format",
    description: "Links, notes and screenshots live together instead of across five apps and a camera roll.",
  },
  {
    id: "no-folders",
    title: "No folders to maintain",
    description: "Tags are added for you. Search understands meaning, so you never need the exact title.",
  },
  {
    id: "honest-answers",
    title: "Answers you can check",
    description: "Every answer cites the items it came from, and says so plainly when nothing matches.",
  },
  {
    id: "yours",
    title: "Your data, your key",
    description: "AI runs on your own free Gemini key. Delete your account and everything goes with it.",
  },
];

export function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-title" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <h2 id="benefits-title" className="max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
          Built to be found again, not filed away.
        </h2>
        <dl className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <div key={benefit.id} className="pt-5">
              <dt className="font-display text-xl">{benefit.title}</dt>
              <dd className="mt-2 max-w-md leading-7 text-muted">{benefit.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
