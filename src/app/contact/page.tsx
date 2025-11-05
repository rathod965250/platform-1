import { Metadata } from "next"
import { Header } from "@/components/ui/header-3"
import { Footer } from "@/components/landing/Footer"
import { ContactFormSection } from "@/components/landing/ContactFormSection"
import { 
  Mail, 
  Clock,
  MessageSquare,
  Send
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Contact Us - CrackAtom | Get in Touch",
  description: "Get in touch with CrackAtom. We're here to help you with any questions about our platform, features, or support. Reach out via email, phone, or contact form.",
  openGraph: {
    title: "Contact Us - CrackAtom | Get in Touch",
    description: "Get in touch with CrackAtom. We're here to help you with any questions about our platform.",
    type: "website",
    url: "https://crackatom.com/contact",
  },
}

export default function ContactPage() {
  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      description: "Send us an email anytime",
      value: "hello@crackatom.com",
      href: "mailto:hello@crackatom.com",
      color: "text-primary",
    },
    {
      icon: Clock,
      title: "Business Hours",
      description: "We're available",
      value: "Mon - Fri: 9 AM - 6 PM IST",
      href: null,
      color: "text-primary",
    },
  ]

  const supportOptions = [
    {
      icon: MessageSquare,
      title: "General Inquiries",
      description: "Questions about our platform, features, or services",
    },
    {
      icon: MessageSquare,
      title: "Technical Support",
      description: "Need help with your account or technical issues",
    },
    {
      icon: MessageSquare,
      title: "Partnership Opportunities",
      description: "Interested in partnering with us? Let's talk",
    },
    {
      icon: MessageSquare,
      title: "Feedback & Suggestions",
      description: "We'd love to hear your thoughts and ideas",
    },
  ]

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5 md:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              Get in <span className="text-primary">Touch</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Have a question or need help? We're here to assist you. Reach out to us through any of the channels below, and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-8 sm:py-10 md:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-5">
                <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="text-sm sm:text-base md:text-base font-medium text-primary">
                  Send us a Message
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Let's Start a Conversation
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </div>
          </div>
        </div>
      </section>
      <ContactFormSection />

      {/* Contact Info Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <Card 
                  key={index} 
                  className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                >
                  <CardHeader className="space-y-3 sm:space-y-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 ${info.color}`} />
                    </div>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                      {info.title}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base md:text-base text-muted-foreground">
                      {info.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {info.href ? (
                      <a
                        href={info.href}
                        className="text-sm sm:text-base md:text-lg font-medium text-primary hover:underline break-words"
                      >
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-sm sm:text-base md:text-lg font-medium text-foreground break-words">
                        {info.value}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Support Options Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">
            <div className="text-center space-y-3 sm:space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                How Can We Help?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
                Choose the option that best fits your needs
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {supportOptions.map((option, index) => {
                const Icon = option.icon
                return (
                  <Card 
                    key={index} 
                    className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <CardHeader className="space-y-3 sm:space-y-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                        {option.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                        {option.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-background to-accent/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Have a Quick Question?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
              Check out our FAQ section for answers to commonly asked questions about our platform, features, and services.
            </p>
            <a
              href="/#faq"
              className="inline-flex items-center justify-center gap-2 sm:gap-2.5 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg sm:rounded-xl font-medium text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg transition-all duration-200 min-h-[44px] sm:min-h-[48px] md:h-12"
            >
              View FAQ
              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

