import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Brain, Calculator, BarChart3, Lightbulb, Trophy, TrendingUp, Users } from "lucide-react";
import { CategoriesTest } from "@/components/shared/CategoriesTest";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Prepare for placement aptitude tests with AI-powered adaptive practice, mock tests, and company-specific questions from top companies like TCS, Infosys, Wipro, Accenture, Cognizant.",
  openGraph: {
    title: "Aptitude Preparation Platform | Practice Tests & Mock Exams",
    description: "Prepare for placement aptitude tests with AI-powered adaptive practice, mock tests, and company-specific questions.",
    type: "website",
  },
};

export default function Home() {
  // Structured data (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Aptitude Preparation Platform",
    "description": "Online platform for aptitude test preparation with practice questions, mock tests, and company-specific questions",
    "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`,
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
    "name": "Aptitude Preparation Platform",
    "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "logo": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`,
    "description": "Online platform for aptitude test preparation",
  };

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Aptitude Preparation Platform",
    "url": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/search?q={search_term_string}`,
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

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Aptitude Preparation Platform
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Prepare for placement aptitude tests with practice questions, mock tests, and company-specific questions
        </p>
        <nav aria-label="Primary navigation">
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="/practice">Start Practice</a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <a href="/test">Take Test</a>
            </Button>
          </div>
        </nav>
      </header>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12" aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <article className="p-6 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Calculator className="w-12 h-12 mx-auto mb-4 text-blue-600" aria-hidden="true" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">500+</h3>
            <p className="text-gray-600 dark:text-gray-400">Questions Available</p>
          </article>
          <article className="p-6 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Users className="w-12 h-12 mx-auto mb-4 text-green-600" aria-hidden="true" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">1000+</h3>
            <p className="text-gray-600 dark:text-gray-400">Active Users</p>
          </article>
          <article className="p-6 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-600" aria-hidden="true" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">5+</h3>
            <p className="text-gray-600 dark:text-gray-400">Companies Covered</p>
          </article>
          <article className="p-6 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-600" aria-hidden="true" />
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">85%</h3>
            <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
          </article>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <Brain className="w-10 h-10 mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-2">Practice Mode</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Practice questions with immediate feedback and detailed explanations
            </p>
          </Card>
          <Card className="p-6">
            <Calculator className="w-10 h-10 mb-4 text-green-600" />
            <h3 className="text-xl font-semibold mb-2">Mock Tests</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Take full-length mock tests with timer and real exam experience
            </p>
          </Card>
          <Card className="p-6">
            <BookOpen className="w-10 h-10 mb-4 text-purple-600" />
            <h3 className="text-xl font-semibold mb-2">Company-Specific Questions</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Practice questions from TCS, Infosys, Wipro, Accenture, and more
            </p>
          </Card>
          <Card className="p-6">
            <BarChart3 className="w-10 h-10 mb-4 text-orange-600" />
            <h3 className="text-xl font-semibold mb-2">AI Analytics</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Get personalized insights and recommendations based on your performance
            </p>
          </Card>
          <Card className="p-6">
            <Trophy className="w-10 h-10 mb-4 text-yellow-600" />
            <h3 className="text-xl font-semibold mb-2">Leaderboards</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Compete with others and track your rank on global leaderboards
            </p>
          </Card>
          <Card className="p-6">
            <Lightbulb className="w-10 h-10 mb-4 text-red-600" />
            <h3 className="text-xl font-semibold mb-2">Smart Preparation</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Identify weak areas and get targeted practice recommendations
            </p>
          </Card>
        </div>
      </section>

      {/* Database Integration Test */}
      <section className="container mx-auto px-4 py-12" aria-labelledby="integration-heading">
        <h2 id="integration-heading" className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Database Integration Status
        </h2>
        <CategoriesTest />
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-12 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>© 2025 Aptitude Preparation Platform. All rights reserved.</p>
          <p className="mt-2 text-sm">Platform is under development. More features coming soon!</p>
        </div>
      </footer>
    </div>
    </>
  );
}
