import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    template: "%s | Aptitude Preparation Platform",
    default: "Aptitude Preparation Platform | Practice Tests & Mock Exams for Placements",
  },
  description: "Prepare for placement aptitude tests with AI-powered adaptive practice, mock tests, and company-specific questions from top companies like TCS, Infosys, Wipro, Accenture, Cognizant. Real exam-like experience with detailed analytics.",
  keywords: [
    "aptitude test",
    "placement preparation",
    "mock test",
    "adaptive practice",
    "TCS aptitude",
    "Infosys aptitude",
    "Wipro aptitude",
    "Accenture aptitude",
    "Cognizant aptitude",
    "quantitative aptitude",
    "logical reasoning",
    "verbal ability",
    "data interpretation",
    "aptitude questions",
    "placement test",
    "campus recruitment",
  ],
  authors: [{ name: "Aptitude Preparation Platform" }],
  creator: "Aptitude Preparation Platform",
  publisher: "Aptitude Preparation Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Aptitude Preparation Platform | Practice Tests & Mock Exams",
    description: "Prepare for placement aptitude tests with AI-powered adaptive practice, mock tests, and company-specific questions. Real exam-like experience with detailed analytics.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: "Aptitude Preparation Platform",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Aptitude Preparation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aptitude Preparation Platform | Practice Tests & Mock Exams",
    description: "Prepare for placement aptitude tests with AI-powered adaptive practice, mock tests, and company-specific questions.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} font-sans antialiased`}
      >
        <ErrorBoundary>
          {children}
          <Toaster />
        </ErrorBoundary>
      </body>
    </html>
  );
}
