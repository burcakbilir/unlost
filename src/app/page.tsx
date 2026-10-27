import { getRequestUser } from "@/lib/auth";
import { BenefitsSection } from "@/features/landing/components/benefits-section";
import { FinalCtaSection } from "@/features/landing/components/final-cta-section";
import { HeroSection } from "@/features/landing/components/hero-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { ProductPreview } from "@/features/landing/components/product-preview";
import { SiteFooter } from "@/features/landing/components/site-footer";
import { SiteHeader } from "@/features/landing/components/site-header";

export default async function Home() {
  // Checked on the server from the session cookie, so the browser never has to
  // ask /api/auth/me (which answers signed-out visitors with a 401).
  const isAuthenticated = Boolean(await getRequestUser());

  return (
    <>
      <SiteHeader isAuthenticated={isAuthenticated} />
      <main className="min-h-screen bg-background text-foreground">
        <HeroSection isAuthenticated={isAuthenticated} />
        <ProductPreview />
        <HowItWorksSection />
        <BenefitsSection />
        <FinalCtaSection isAuthenticated={isAuthenticated} />
      </main>
      <SiteFooter />
    </>
  );
}
