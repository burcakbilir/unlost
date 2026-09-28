type PreviewTone = "mint" | "lilac" | "peach";

type PreviewItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  meta: string;
  tone: PreviewTone;
  symbol: string;
};

type PreviewCardProps = {
  item: PreviewItem;
};

const toneClasses: Record<PreviewTone, string> = {
  mint: "bg-mint",
  lilac: "bg-lilac",
  peach: "bg-peach",
};

const previewItems: PreviewItem[] = [
  {
    id: "art-of-noticing",
    type: "To read",
    title: "The art of noticing",
    description:
      "Learn to notice the small details around you for better ideas.",
    meta: "medium.com · 2 days ago",
    tone: "mint",
    symbol: "↗",
  },
  {
    id: "quiet-workspaces",
    type: "Idea",
    title: "Quiet workspaces",
    description:
      "A filter for noise, outlets and internet quality could work for cafes.",
    meta: "Quick note · 4 days ago",
    tone: "lilac",
    symbol: "✦",
  },
  {
    id: "warm-interfaces",
    type: "Inspiration",
    title: "Warm minimal interfaces",
    description: "Interface references that feel simple without going sterile.",
    meta: "Screenshot · 1 week ago",
    tone: "peach",
    symbol: "◌",
  },
];

function PreviewCard({ item }: PreviewCardProps) {
  return (
    <article className="flex h-full flex-col bg-white/70 p-4">
      <p className="text-xs uppercase tracking-widest">{item.type}</p>
      <div
        aria-hidden="true"
        className={`mt-3 flex aspect-video items-start justify-end p-4 ${toneClasses[item.tone]}`}
      >
        <span className="font-display text-4xl">{item.symbol}</span>
      </div>
      <h3 className="mt-4 font-display text-xl">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{item.description}</p>
      <p className="mt-auto pt-4 text-xs text-muted">{item.meta}</p>
    </article>
  );
}

export function ProductPreview() {
  return (
    <section
      id="product-preview"
      aria-labelledby="product-preview-title"
      className="scroll-mt-24"
    >
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <div className="flex min-h-96 overflow-hidden border border-border bg-surface shadow-2xl">
          <aside
            aria-label="Example app menu"
            className="flex w-12 shrink-0 flex-col items-center bg-sidebar py-4 text-white sm:w-16 sm:py-5"
          >
            <span className="font-display text-2xl italic">u.</span>
            <span
              aria-hidden="true"
              className="mt-10 flex size-11 items-center justify-center bg-accent text-xl text-foreground"
            >
              +
            </span>
            <div className="mt-auto flex size-8 items-center justify-center rounded-full bg-primary text-xs">
              JD
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-4 sm:p-8">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest">Good morning, John</p>
                <h2
                  id="product-preview-title"
                  className="mt-2 font-display text-2xl sm:text-3xl"
                >
                  What do you want to remember today?
                </h2>
              </div>
              <div
                aria-hidden="true"
                className="flex shrink-0 items-center gap-2 border border-border bg-white/40 px-3 py-2 text-sm text-muted"
              >
                <span>⌕</span>
                <span className="hidden sm:inline">Search</span>
              </div>
            </header>

            <ul
              aria-label="Example item filters"
              className="mt-8 flex gap-6 overflow-x-auto border-b border-border text-sm text-muted"
            >
              <li className="shrink-0 border-b-2 border-foreground pb-3 text-foreground">All 24</li>
              <li className="shrink-0 pb-3">Links 8</li>
              <li className="shrink-0 pb-3">Notes 11</li>
              <li className="shrink-0 pb-3">Images 5</li>
            </ul>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {previewItems.map((item) => (
                <PreviewCard key={item.id} item={item} />
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-4 bg-sidebar p-4 text-white sm:flex-row sm:items-center">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary"
              >
                ✦
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest text-white/60">Unlost reminder</p>
                <p className="mt-1 font-display text-lg">You saved this 3 weeks ago</p>
                <p className="mt-1 text-sm text-white/60">Micro-interaction examples for your portfolio</p>
              </div>
              <span className="shrink-0 bg-accent px-4 py-3 text-sm text-foreground">Rediscover →</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
