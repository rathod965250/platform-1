'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Send, Mail } from 'lucide-react'

interface ContactFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ContactFormDialog({ open, onOpenChange, onSuccess }: ContactFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setIsSubmitted(false)
      // Try to get email from localStorage or user profile
      const savedEmail = localStorage.getItem('contactFormEmail')
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }))
      }
    }
  }, [open])

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

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Reset form after 3 seconds and close dialog
      setTimeout(() => {
        setIsSubmitted(false)
        setFormData({ name: '', email: formData.email, message: '' })
        onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            Get in Touch
          </DialogTitle>
          <DialogDescription className="text-base sm:text-lg text-muted-foreground mt-2">
            Fill out the form below and we'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4 sm:mb-6">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 sm:mb-3">
              Message Sent Successfully!
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-center max-w-md">
              Thank you for contacting us. We'll get back to you within 1-2 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base font-medium">
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
                className="min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="min-h-[44px] sm:min-h-[48px] text-sm sm:text-base"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm sm:text-base font-medium">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us how we can help you..."
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="text-sm sm:text-base min-h-[120px] resize-none"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

