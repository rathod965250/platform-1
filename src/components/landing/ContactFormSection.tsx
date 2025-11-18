'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Send, Mail, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { parseMultipleReplies, hasMultipleReplies } from '@/lib/contact-messages/utils'

export function ContactFormSection() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [userMessage, setUserMessage] = useState<any | null>(null)
  const [loadingReply, setLoadingReply] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  useEffect(() => {
    // Check for saved email in localStorage and fetch reply
    const savedEmail = localStorage.getItem('contactFormEmail')
    if (savedEmail) {
      checkForReply(savedEmail)
    }
  }, [])

  const checkForReply = async (email?: string) => {
    const emailToCheck = email || formData.email
    if (!emailToCheck || !emailToCheck.includes('@')) return

    setLoadingReply(true)
    const supabase = createClient()
    
    // Fetch user's most recent message with reply
    const { data: messages } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('email', emailToCheck.trim().toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)

    if (messages && messages.length > 0 && messages[0].reply) {
      setUserMessage(messages[0])
    } else {
      setUserMessage(null)
    }

    setLoadingReply(false)
  }

  useEffect(() => {
    // Debounce email check for replies
    if (!formData.email || !formData.email.includes('@')) {
      setUserMessage(null)
      return
    }

    const timeoutId = setTimeout(() => {
      const emailToCheck = formData.email
      if (!emailToCheck || !emailToCheck.includes('@')) return
      
      setLoadingReply(true)
      const supabase = createClient()
      
      supabase
        .from('contact_messages')
        .select('*')
        .eq('email', emailToCheck.trim().toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data: messages }: { data: any }) => {
          if (messages && messages.length > 0 && messages[0].reply) {
            setUserMessage(messages[0])
          } else {
            setUserMessage(null)
          }
          setLoadingReply(false)
        })
        .catch(() => {
          setLoadingReply(false)
        })
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [formData.email])

  const checkReplyAfterSubmission = async (email: string) => {
    // Check for reply after form submission
    const supabase = createClient()
    
    const { data: messages } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)

    if (messages && messages.length > 0 && messages[0].reply) {
      setUserMessage(messages[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit message')
      }

      setIsSubmitted(true)
      toast.success('Thank you! Your message has been received. We will respond within 1-2 business days.')

      // Save email to localStorage for future reply checking
      localStorage.setItem('contactFormEmail', formData.email)

      // Check for existing reply after submission
      await checkReplyAfterSubmission(formData.email)

      // Reset form after 3 seconds (but keep email for reply checking)
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({ name: '', email: formData.email, message: '' })
        // Keep userMessage if there's a reply
      }, 3000)
    } catch (error) {
      console.error('Contact form submission error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit message. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-border shadow-xl bg-card hover:shadow-2xl transition-all duration-300">
            <CardHeader className="space-y-3 sm:space-y-4 pb-4 sm:pb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    Get in Touch
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6">
              {/* Show admin replies if available */}
              {userMessage && userMessage.reply && (
                <div className="mb-6 space-y-4 sm:space-y-5">
                  {parseMultipleReplies(userMessage.reply).map((parsedReply, index) => (
                    <div key={index} className="rounded-lg border-2 border-green-200 bg-green-50 p-4 sm:p-5 md:p-6 dark:border-green-800 dark:bg-green-900/20">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shrink-0">
                          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                              {hasMultipleReplies(userMessage.reply) 
                                ? `Reply ${index + 1} from CrackAtom Team`
                                : 'Reply from CrackAtom Team'}
                            </h4>
                            {parsedReply.timestamp && (
                              <span className="text-xs text-muted-foreground">
                                {parsedReply.timestamp}
                              </span>
                            )}
                          </div>
                          <p className="text-sm sm:text-base md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {parsedReply.text}
                          </p>
                          {parsedReply.isFirst && userMessage.replied_at && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              First reply on {new Date(userMessage.replied_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isSubmitted ? (
                <div className="text-center py-8 sm:py-10 md:py-12">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                    <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                    Thank you for your message!
                  </h3>
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                    We've received your submission and will respond within 1-2 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-6">
                  <div className="space-y-2 sm:space-y-2.5">
                    <Label htmlFor="name" className="text-sm sm:text-base md:text-base font-medium text-foreground">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-background text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11 border-border focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-2.5">
                    <Label htmlFor="email" className="text-sm sm:text-base md:text-base font-medium text-foreground">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-background text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[44px] md:h-11 border-border focus:border-primary transition-colors"
                    />
                  </div>

                  <div className="space-y-2 sm:space-y-2.5">
                    <Label htmlFor="message" className="text-sm sm:text-base md:text-base font-medium text-foreground">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us how we can help you..."
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="bg-background resize-none text-sm sm:text-base md:text-base border-border focus:border-primary transition-colors min-h-[120px] sm:min-h-[140px] md:min-h-[160px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base md:text-base min-h-[44px] sm:min-h-[48px] md:h-12 mt-6 sm:mt-8"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="mt-6 sm:mt-8 md:mt-10 text-center">
            <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-accent/50 border border-border">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
              <a 
                href="mailto:hello@crackatom.com" 
                className="text-sm sm:text-base md:text-base font-medium text-primary hover:underline transition-colors"
              >
                hello@crackatom.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

