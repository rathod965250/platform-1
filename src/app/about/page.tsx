import { Metadata } from "next"
import { Header } from "@/components/ui/header-3"
import { Footer } from "@/components/landing/Footer"
import { 
  Target, 
  Users, 
  Award, 
  TrendingUp, 
  Brain, 
  Zap,
  BookOpen,
  BarChart3,
  Trophy
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "About Us - CrackAtom | Master Aptitude Tests with AI-Powered Learning",
  description: "Learn about CrackAtom's mission to help students master aptitude tests through AI-powered adaptive learning, comprehensive practice, and detailed analytics.",
  openGraph: {
    title: "About Us - CrackAtom | Master Aptitude Tests with AI-Powered Learning",
    description: "Learn about CrackAtom's mission to help students master aptitude tests through AI-powered adaptive learning.",
    type: "website",
    url: "https://crackatom.com/about",
  },
}

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To empower every student with the tools and confidence needed to excel in placement aptitude tests through AI-powered adaptive learning.",
    },
    {
      icon: Brain,
      title: "Innovation First",
      description: "We leverage cutting-edge AI technology to personalize learning experiences and adapt to each student's unique learning pace and style.",
    },
    {
      icon: Users,
      title: "Student Success",
      description: "Every feature we build is designed with one goal in mind: helping students achieve their placement goals and build successful careers.",
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from the quality of our content to the precision of our AI algorithms.",
    },
  ]

  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive Practice",
      description: "Access thousands of questions across all aptitude test categories with detailed explanations.",
    },
    {
      icon: Brain,
      title: "AI-Adaptive Learning",
      description: "Our AI learns your strengths and weaknesses, adjusting difficulty in real-time for optimal learning.",
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Track your performance with comprehensive analytics and insights to identify areas for improvement.",
    },
    {
      icon: Trophy,
      title: "Competitive Edge",
      description: "Compete with peers on leaderboards and benchmark your progress against top performers.",
    },
  ]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5 md:space-y-6">
            <div className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-5">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-sm sm:text-base md:text-base font-medium text-primary">
                About CrackAtom
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              Empowering Students to{" "}
              <span className="text-primary">Master Aptitude Tests</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              We're on a mission to democratize aptitude test preparation through AI-powered adaptive learning, comprehensive practice, and detailed analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
            <div className="text-center space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Our Story
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                CrackAtom was born from a simple observation: students preparing for placement tests were struggling with traditional, one-size-fits-all study methods. We recognized that every student learns differently and needs personalized guidance to excel.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                Today, we're proud to be helping thousands of students across India prepare for their placement exams with confidence. Our AI-powered platform adapts to each student's learning style, providing real-time feedback and personalized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
            <div className="text-center space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Our Values
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <Card key={index} className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="space-y-3 sm:space-y-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                        {value.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                        {value.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
            <div className="text-center space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                What We Offer
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Comprehensive tools to help you succeed
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="space-y-3 sm:space-y-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Ready to Start Your Journey?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Join thousands of students who are already mastering aptitude tests with CrackAtom. Get started today and take the first step toward your dream placement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-4">
              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg sm:rounded-xl font-medium text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg transition-all duration-200 min-h-[44px] sm:min-h-[48px] md:h-12"
              >
                Get Started Free
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-background border-2 border-border hover:border-primary/50 text-foreground rounded-lg sm:rounded-xl font-medium text-sm sm:text-base md:text-lg transition-all duration-200 min-h-[44px] sm:min-h-[48px] md:h-12"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

