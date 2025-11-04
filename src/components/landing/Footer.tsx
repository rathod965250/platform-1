'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { 
  Zap, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone,
  MapPin,
  BookOpen,
  BarChart3,
  Trophy,
  FileText,
  Shield,
  HelpCircle,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const footerLinks = {
    product: [
      { name: 'Practice Mode', href: '/practice', icon: BookOpen },
      { name: 'Mock Tests', href: '/test', icon: FileText },
      { name: 'Analytics', href: '/dashboard', icon: BarChart3 },
      { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Success Stories', href: '/testimonials' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Contact', href: '/contact' },
    ],
    resources: [
      { name: 'Help Center', href: '/help', icon: HelpCircle },
      { name: 'FAQ', href: '/#faq' },
      { name: 'Blog', href: '/blog' },
      { name: 'Case Studies', href: '/case-study' },
    ],
    legal: [
      { name: 'Terms of Service', href: '/terms', icon: FileText },
      { name: 'Privacy Policy', href: '/privacy', icon: Shield },
      { name: 'Refund Policy', href: '/refund' },
      { name: 'Licenses', href: '/licenses' },
    ],
  }

  const socialLinks = [
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/crackatom', color: 'hover:text-[#0077b5]' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/crackatom', color: 'hover:text-[#1DA1F2]' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/crackatom', color: 'hover:text-[#E4405F]' },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@crackatom', color: 'hover:text-[#FF0000]' },
  ]

  const contactInfo = [
    { icon: Mail, text: 'hello@crackatom.com', href: 'mailto:hello@crackatom.com' },
    { icon: Phone, text: '+91 98765 43210', href: 'tel:+919876543210' },
    { icon: MapPin, text: 'Mumbai, India', href: null },
  ]

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsSubmitted(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      if (data.alreadySubscribed) {
        toast.info('You are already subscribed to our newsletter!')
      } else if (data.reactivated) {
        toast.success('Welcome back! Your subscription has been reactivated.')
      } else {
    toast.success('Thank you for subscribing! Check your email for confirmation.')
      }

    setEmail('')
    } catch (error) {
      console.error('Newsletter subscription error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe. Please try again later.')
    } finally {
    setTimeout(() => setIsSubmitted(false), 3000)
    }
  }

  return (
    <footer className="bg-background border-t border-border w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-12 py-8 sm:py-12 lg:py-16">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <Link href="/" className="flex items-center gap-2 group inline-flex">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                CrackAtom
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
              Master aptitude tests with AI-powered adaptive learning. Practice, improve, and excel in your placement exams with comprehensive mock tests and detailed analytics.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 sm:space-y-2.5 pt-2 sm:pt-3">
              {contactInfo.map((contact, index) => {
                const Icon = contact.icon
                if (contact.href) {
                  return (
                    <a
                      key={index}
                      href={contact.href}
                      className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors group break-words"
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <span className="break-all">{contact.text}</span>
                    </a>
                  )
                }
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    <span>{contact.text}</span>
                  </div>
                )
              })}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted-foreground ${social.color} transition-all p-1.5 sm:p-2 rounded-lg hover:bg-accent/50`}
                    aria-label={social.name}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product Links */}
          <div className="mt-6 sm:mt-0">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4 tracking-tight">
              Product
            </h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {footerLinks.product.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Company Links */}
          <div className="mt-6 sm:mt-0">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4 tracking-tight">
              Company
            </h3>
            <ul className="space-y-2.5 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Newsletter */}
          <div className="space-y-6 sm:space-y-6 mt-6 sm:mt-0 lg:col-span-1">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-3 sm:mb-4 tracking-tight">
                Resources
              </h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {footerLinks.resources.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                      >
                        {Icon && (
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                        )}
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Newsletter */}
            <div className="bg-card/50 border border-border rounded-lg p-3 sm:p-4 transition-all hover:bg-card/70 hover:shadow-sm w-full">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-2.5 tracking-tight">
                Newsletter
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 leading-relaxed">
                Get tips, updates, and success stories delivered to your inbox.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2.5 sm:space-y-3">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitted}
                    className="flex-1 w-full sm:w-auto bg-transparent border-border/60 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-xs sm:text-sm h-9 sm:h-10"
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitted}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto sm:shrink-0 px-4 sm:px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-9 sm:h-10 text-xs sm:text-sm rounded-md"
                  >
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                {isSubmitted && (
                  <p className="text-[10px] sm:text-xs text-primary animate-in fade-in duration-300 flex items-center gap-1.5">
                    <span className="inline-block w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-pulse"></span>
                    Processing subscription...
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Copyright */}
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left order-2 sm:order-1">
              <p>
                © {currentYear} CrackAtom. All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 order-1 sm:order-2">
              {footerLinks.legal.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 sm:gap-1.5 group"
                  >
                    {Icon && (
                      <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                    <span className="whitespace-nowrap">{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
