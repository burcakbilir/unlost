type HowItWorksStep = {
  id: string;
  number: string;
  title: string;
  description: string;
};

const steps: HowItWorksStep[] = [
  { id: "capture", number: "01", title: "Kaydet", description: "Bir linki, ekran görüntüsünü veya aklına gelen kısa bir notu ekle." },
  { id: "organize", number: "02", title: "Düzenle", description: "Kayıtlarını etiketler, türler ve hızlı aramayla yeniden bul." },
  { id: "rediscover", number: "03", title: "Yeniden keşfet", description: "Unlost, unuttuğun kayıtları doğru zamanda tekrar karşına çıkarsın." },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-24 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="text-xs uppercase tracking-widest">Nasıl çalışır?</p>
        <h2 id="how-it-works-title" className="mt-6 max-w-3xl font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
          Kaydetmek kolay. Hatırlamak zorunda değilsin.
        </h2>
        <ol className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.id} className="border-t border-border pt-6">
              <span className="text-sm text-primary">{step.number}</span>
              <h3 className="mt-6 font-display text-2xl">{step.title}</h3>
              <p className="mt-3 leading-7 text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
