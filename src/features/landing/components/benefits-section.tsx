type Benefits = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

const benefits: Benefits[] = [
  {
    id: "everything",
    eyebrow: "Her şey bir arada",
    title: "Farklı formatlar, aynı hafıza.",
    description:
      "Link, not ve ekran görüntülerini uygulamalar arasında kaybetmeden tek bir kütüphanede tut.",
  },
  {
    id: "context",
    eyebrow: "Bağlamı koru",
    title: "Neden kaydettiğini de hatırla.",
    description:
      "Kısa notlar ve etiketlerle bir kaydın sana neden önemli geldiğini gelecekteki kendine anlat.",
  },
  {
    id: "resurface",
    eyebrow: "Yeniden karşılaş",
    title: "Arşiv değil, yaşayan bir alan.",
    description:
      "Eski kayıtların sessizce birikmesin; doğru zamanda yeniden görünür olsun.",
  },
];

export function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-title" className="bg-sidebar text-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-xs uppercase tracking-widest text-white/60">
          Neden Unlost?
        </p>
        <h2
          id="benefits-title"
          className="mt-6 max-w-3xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl"
        >
          Kaydettiğin şeyler, yeniden işe yarasın.
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
