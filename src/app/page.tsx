import { Metadata } from "next";
import { Header } from "@/components/ui/header-3";
import { HeroSection } from "@/components/landing/HeroSection";
import { PartnerLogosSection } from "@/components/landing/PartnerLogosSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { PerformanceFeaturesSection } from "@/components/landing/PerformanceFeaturesSection";
import { IntegrationsSection } from "@/components/landing/IntegrationsSection";

import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";

import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "CrackAtom - Master Aptitude Tests with AI-Powered Learning",
  description: "Prepare for placement aptitude tests with AI-powered adaptive practice, mock tests, and realistic test simulations. CrackAtom helps you master aptitude tests with similar-type questions.",
  openGraph: {
    title: "CrackAtom | Master Aptitude Tests with AI-Powered Learning",
    description: "Prepare for placement aptitude tests with AI-powered adaptive practice, mock tests, and realistic test simulations.",
    type: "website",
    url: "https://crackatom.com",
  },
};

export default function Home() {
  // Structured data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "CrackAtom",
    "description": "Online platform for aptitude test preparation with practice questions, mock tests, and realistic test simulations",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://crackatom.com",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://crackatom.com"}/logo.png`,
    "sameAs": [],
    "educationalUse": "test preparation",
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "audienceType": "placement aspirants",
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
    },
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "CrackAtom",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://crackatom.com",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://crackatom.com"}/logo.png`,
    "description": "Online platform for aptitude test preparation with AI-powered learning",
  };

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "CrackAtom",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://crackatom.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || "https://crackatom.com"}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />

      <div className="min-h-screen bg-background">
        <Header />
        <HeroSection />
        <PartnerLogosSection />
        
        {/* Dashboard UI Placeholder - Add actual dashboard UI here */}
        <section className="pt-16 md:pt-24 pb-0 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Placeholder div for dashboard UI - Replace with actual dashboard content */}
              <div className="min-h-[400px] rounded-2xl border-2 border-dashed border-border bg-card/50 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium mb-2">Dashboard UI Section</p>
                  <p className="text-sm">Add your platform dashboard UI here</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <StepsSection />
        <PerformanceFeaturesSection />
        <IntegrationsSection />

        <TestimonialsSection />
        <FAQSection />

        <Footer />
      </div>
    </>
  );
}
