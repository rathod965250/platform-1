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

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    // TODO: Implement newsletter signup API
    setIsSubmitted(true)
    toast.success('Thank you for subscribing! Check your email for confirmation.')
    setEmail('')
    
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 py-12 lg:py-16">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group inline-flex">
              <Zap className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-xl font-bold text-foreground tracking-tight">
                CrackAtom
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Master aptitude tests with AI-powered adaptive learning. Practice, improve, and excel in your placement exams with comprehensive mock tests and detailed analytics.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 pt-2">
              {contactInfo.map((contact, index) => {
                const Icon = contact.icon
                if (contact.href) {
                  return (
                    <a
                      key={index}
                      href={contact.href}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>{contact.text}</span>
                    </a>
                  )
                }
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{contact.text}</span>
                  </div>
                )
              })}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 pt-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-muted-foreground ${social.color} transition-all p-2 rounded-lg hover:bg-accent/50`}
                    aria-label={social.name}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 tracking-tight">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => {
                const Icon = link.icon
                return (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <Icon className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <span>{link.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4 tracking-tight">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources & Newsletter */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 tracking-tight">
                Resources
              </h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                      >
                        {Icon && (
                          <Icon className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                        )}
                        <span>{link.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 tracking-tight">
                Newsletter
              </h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Get tips, updates, and success stories delivered to your inbox.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitted}
                    className="bg-foreground hover:bg-foreground/90 text-background shrink-0 px-4"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                {isSubmitted && (
                  <p className="text-xs text-primary animate-in fade-in">
                    Subscription confirmed! Check your email.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground text-center md:text-left">
              <p>
                © {currentYear} CrackAtom. All rights reserved.
              </p>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {footerLinks.legal.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group"
                  >
                    {Icon && (
                      <Icon className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                    <span>{link.name}</span>
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
