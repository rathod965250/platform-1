'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Zap, Linkedin, Twitter, Instagram, Youtube, Mail, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const footerLinks = {
    pages: [
      { name: 'Home', href: '/' },
      { name: 'About', href: '/about' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Case Study', href: '/case-study' },
      { name: 'Licenses', href: '/licenses' },
    ],
  }

  const socialLinks = [
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/crackatom', external: true },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/crackatom', external: true },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/crackatom', external: true },
    { name: 'YouTube', icon: Youtube, href: 'https://youtube.com/@crackatom', external: true },
  ]

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    
    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    // TODO: Implement newsletter signup API
    setIsSubmitted(true)
    toast.success('Thank you for subscribing! Check your email for confirmation.')
    e.currentTarget.reset()
    
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  return (
    <footer className="bg-background-secondary border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <Zap className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
              <span className="text-xl font-bold text-foreground">
                CrackAtom
              </span>
            </Link>
            <p className="text-sm text-foreground/70 leading-relaxed">
              Master aptitude tests with AI-powered learning. Practice, improve, and excel in your placement exams.
            </p>
          </div>

          {/* Pages Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Pages</h3>
            <ul className="space-y-3">
              {footerLinks.pages.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@crackatom.com"
                  className="text-sm text-foreground/70 hover:text-primary transition-colors flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  hello@crackatom.com
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Newsletter</h3>
            <p className="text-sm text-foreground/70 mb-4">
              Sign up for our newsletter to get updates and tips.
            </p>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-border pt-8 mb-8">
          <div className="max-w-md">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Sign up for our newsletter
            </h3>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input
                type="email"
                name="email"
                placeholder="Your email"
                className="flex-1 bg-background"
                required
              />
              <Button type="submit" className="bg-foreground hover:bg-foreground/90 text-background">
                Subscribe
              </Button>
            </form>
            {isSubmitted && (
              <p className="mt-2 text-sm text-success">
                Your subscription is confirmed. Thank you!
              </p>
            )}
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon
              const LinkComponent = social.external ? 'a' : Link
              const linkProps = social.external
                ? { href: social.href, target: '_blank', rel: 'noopener noreferrer' }
                : { href: social.href }
              
              return (
                <LinkComponent
                  key={social.name}
                  {...linkProps}
                  className="text-foreground/60 hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  <Icon className="h-5 w-5" />
                  {social.external && <ExternalLink className="h-3 w-3 ml-1 inline" />}
                </LinkComponent>
              )
            })}
          </div>
          <div className="text-sm text-foreground/60 text-center sm:text-left">
            <p>
              © {currentYear} CrackAtom. All rights reserved.
            </p>
            <p className="mt-1 text-xs">
              Designed by CrackAtom Team | Powered by Next.js
            </p>
            <p className="mt-1">
              <a
                href="https://crackatom.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                crackatom.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

