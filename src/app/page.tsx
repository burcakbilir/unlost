import { BenefitsSection } from "@/features/landing/components/benefits-section";
import { FinalCtaSection } from "@/features/landing/components/final-cta-section";
import { HeroSection } from "@/features/landing/components/hero-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { ProductPreview } from "@/features/landing/components/product-preview";
import { SiteFooter } from "@/features/landing/components/site-footer";
import { SiteHeader } from "@/features/landing/components/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background text-foreground">
        <HeroSection />
        <ProductPreview />
        <HowItWorksSection />
        <BenefitsSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </>
  );
}
