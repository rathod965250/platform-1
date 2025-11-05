'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare, Mail, Clock, CheckCircle2, Send, ArrowRight, User, Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseMultipleReplies, hasMultipleReplies } from '@/lib/contact-messages/utils'
import { ContactFormDialog } from './ContactFormDialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export function MessagesContent() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)

  useEffect(() => {
    fetchMessages()
    
    // Check for message ID in URL query params
    const urlParams = new URLSearchParams(window.location.search)
    const messageId = urlParams.get('message')
    if (messageId) {
      // Message will be selected after messages are loaded
    }
  }, [])

  // Select message from URL query param after messages are loaded
  useEffect(() => {
    if (messages.length > 0 && !selectedMessage) {
      const urlParams = new URLSearchParams(window.location.search)
      const messageId = urlParams.get('message')
      if (messageId) {
        const message = messages.find((m) => m.id === messageId)
        if (message) {
          setSelectedMessage(message)
          // Mark message as viewed when selected from notification
          markMessageAsViewed(messageId)
        }
      } else if (messages.length > 0) {
        // Select first message by default
        setSelectedMessage(messages[0])
      }
    } else if (messages.length > 0 && !selectedMessage) {
      // Select first message if none selected
      setSelectedMessage(messages[0])
    }
  }, [messages, selectedMessage])

  // Mark message as viewed when user views it
  useEffect(() => {
    if (selectedMessage?.id && selectedMessage?.reply) {
      markMessageAsViewed(selectedMessage.id)
    }
  }, [selectedMessage])

  const markMessageAsViewed = (messageId: string) => {
    try {
      const viewedMessages = JSON.parse(
        localStorage.getItem('viewed_replies') || '[]'
      ) as string[]
      
      if (!viewedMessages.includes(messageId)) {
        viewedMessages.push(messageId)
        localStorage.setItem('viewed_replies', JSON.stringify(viewedMessages))
        
        // Trigger a custom event to notify the header to refresh
        window.dispatchEvent(new CustomEvent('messageViewed', { detail: { messageId } }))
      }
    } catch (error) {
      console.error('Error marking message as viewed:', error)
    }
  }

  const fetchMessages = async () => {
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // First check for session (more reliable than getUser)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error fetching session:', sessionError)
        setLoading(false)
        return
      }
      
      if (!session?.user) {
        setLoading(false)
        return
      }
      
      const user = session.user

      // Get user profile to get email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setLoading(false)
        return
      }

      if (profile?.email) {
        setUserEmail(profile.email)
        
        // Fetch messages by email or user_id
        const { data: messagesByEmail, error: emailError } = await supabase
          .from('contact_messages')
          .select('*')
          .eq('email', profile.email.toLowerCase())
          .order('created_at', { ascending: false })

        if (emailError) {
          console.error('Error fetching messages by email:', emailError)
        }

        // Also fetch by user_id if available
        const { data: messagesByUserId, error: userIdError } = await supabase
          .from('contact_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (userIdError) {
          console.error('Error fetching messages by user_id:', userIdError)
        }

        // Combine and deduplicate messages
        const allMessages = [...(messagesByEmail || []), ...(messagesByUserId || [])]
        const uniqueMessages = Array.from(
          new Map(allMessages.map((msg) => [msg.id, msg])).values()
        )

        setMessages(uniqueMessages)
        
        // Select the most recent message if available
        if (uniqueMessages.length > 0) {
          setSelectedMessage(uniqueMessages[0])
        }
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string, hasReply: boolean) => {
    if (hasReply) {
      return <Badge className="bg-green-500">Replied</Badge>
    }
    const badges = {
      new: <Badge className="bg-yellow-500">New</Badge>,
      read: <Badge className="bg-blue-500">Read</Badge>,
      replied: <Badge className="bg-green-500">Replied</Badge>,
      archived: <Badge variant="outline">Archived</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  // Count unread replies (messages with replies that user hasn't viewed)
  const viewedMessages = JSON.parse(
    localStorage.getItem('viewed_replies') || '[]'
  ) as string[]
  const unreadCount = messages.filter(
    (m) => m.reply && !viewedMessages.includes(m.id)
  ).length
  const repliedCount = messages.filter((m) => m.reply).length

  const handleContactSuccess = () => {
    // Refresh messages after successful submission
    fetchMessages()
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section - Rearranged */}
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              My Messages
            </h1>
            <p className="mt-1 text-sm sm:text-base md:text-lg text-muted-foreground">
              View your contact form submissions and replies from the CrackAtom team
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {unreadCount > 0 && (
            <Badge className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base font-medium shadow-md">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              {unreadCount} {unreadCount === 1 ? 'new reply' : 'new replies'}
            </Badge>
          )}
          <div className="flex-1" />
          <Button
            onClick={() => setIsContactDialogOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px] px-4 sm:px-6"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Send Message
          </Button>
        </div>
      </div>

      {/* Contact Form Dialog */}
      <ContactFormDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        onSuccess={handleContactSuccess}
      />

      {/* Stats Cards */}
      {messages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Messages</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{messages.length}</p>
                </div>
                <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Replied</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{repliedCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{messages.length - repliedCount}</p>
                </div>
                <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 animate-spin text-primary mb-4" />
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Loading your messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <Card className="border-2 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
              <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2 sm:mb-3">
              No messages yet
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-center mb-6 sm:mb-8 max-w-md">
              You haven't sent any messages yet. Use the contact form to reach out to our team.
            </p>
            <Button
              onClick={() => setIsContactDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px] px-6 sm:px-8"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Send Your First Message
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Messages Thread - Accordion Format */}
          <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <AccordionItem
                key={message.id}
                value={message.id}
                className={cn(
                  "border-2 rounded-xl overflow-hidden transition-all duration-300",
                  selectedMessage?.id === message.id
                    ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-md'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <AccordionTrigger
                  className="px-4 sm:px-6 py-4 sm:py-5 hover:no-underline"
                  onClick={() => setSelectedMessage(message)}
                >
                  <div className="flex items-start justify-between gap-4 w-full text-left">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <CardTitle className="text-sm sm:text-base md:text-lg font-semibold truncate">
                            {message.name}
                          </CardTitle>
                          {getStatusBadge(message.status, !!message.reply)}
                        </div>
                        <CardDescription className="mt-1 text-xs sm:text-sm flex items-center gap-1.5 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{message.email}</span>
                        </CardDescription>
                        <p className="line-clamp-1 text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(message.created_at)}</span>
                          {message.reply && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Replied</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0 transition-transform duration-200" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 border-t border-border/50">
                    {/* Conversation Thread - Your Message */}
                    <Card className="border-2 border-border hover:shadow-md transition-all duration-300">
                      <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          </div>
                          <Label className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                            Your Message
                          </Label>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 sm:p-5 md:p-6">
                          <p className="text-sm sm:text-base md:text-lg text-foreground whitespace-pre-wrap leading-relaxed">
                            {message.message}
                          </p>
                          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-border/50 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Sent on {formatDate(message.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Admin Replies */}
                    {message.reply ? (
                      <div className="space-y-4 sm:space-y-6">
                        {parseMultipleReplies(message.reply).map((parsedReply, index) => (
                          <Card key={index} className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 shadow-lg">
                            <CardHeader className="pb-3 sm:pb-4">
                              <div className="flex items-center justify-between gap-2 sm:gap-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                  </div>
                                  <Label className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
                                    {hasMultipleReplies(message.reply) 
                                      ? `Reply ${index + 1} from CrackAtom Team`
                                      : 'Reply from CrackAtom Team'}
                                  </Label>
                                </div>
                                {parsedReply.timestamp && (
                                  <Badge variant="outline" className="text-xs sm:text-sm">
                                    {parsedReply.timestamp}
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-4 sm:p-5 md:p-6">
                                <p className="text-sm sm:text-base md:text-lg text-foreground whitespace-pre-wrap leading-relaxed">
                                  {parsedReply.text}
                                </p>
                                {parsedReply.isFirst && message.replied_at && (
                                  <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-border/50 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span>First reply on {formatDate(message.replied_at)}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10">
                        <CardContent className="p-4 sm:p-5 md:p-6">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center shrink-0">
                              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm sm:text-base md:text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-1.5 sm:mb-2">
                                Waiting for reply
                              </h4>
                              <p className="text-xs sm:text-sm md:text-base text-yellow-700 dark:text-yellow-300 leading-relaxed">
                                Your message has been received. Our team will respond within 1-2 business days.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Action Buttons */}
                    <Card className="border-2 border-border">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                          <Button
                            onClick={() => setIsContactDialogOpen(true)}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                          >
                            <Send className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Send New Message
                          </Button>
                          {message.reply && (
                            <Button
                              onClick={() => setIsContactDialogOpen(true)}
                              variant="outline"
                              className="flex-1 border-border hover:border-primary/50 text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                            >
                              <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Reply Again
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  )
}

