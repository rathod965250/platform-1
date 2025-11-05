'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Send, Mail, User, Clock, CheckCircle2 } from 'lucide-react'
import { parseMultipleReplies, hasMultipleReplies } from '@/lib/contact-messages/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ContactMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null)
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchMessages()
  }, [statusFilter])

  const fetchMessages = async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }

  const handleReply = async () => {
    if (!selectedMessage || !reply.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/contact/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          reply: reply.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reply')
      }

      toast.success('Reply sent successfully!')
      setReply('')
      fetchMessages()
      
      // Update selected message
      setSelectedMessage({
        ...selectedMessage,
        reply: reply.trim(),
        status: 'replied',
        replied_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error sending reply:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send reply')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      new: <Badge className="bg-red-500">New</Badge>,
      read: <Badge className="bg-yellow-500">Read</Badge>,
      replied: <Badge className="bg-green-500">Replied</Badge>,
      archived: <Badge variant="outline">Archived</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
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

  const unreadCount = messages.filter((m) => m.status === 'new').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Contact Messages
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and respond to contact form submissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="new">New ({messages.filter((m) => m.status === 'new').length})</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">No messages found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-4">
            {messages.map((message) => (
              <Card
                key={message.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedMessage?.id === message.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
                onClick={() => {
                  setSelectedMessage(message)
                  setReply(message.reply || '')
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base font-semibold">
                        {message.name}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm">
                        {message.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(message.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {message.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {formatDate(message.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Message Detail & Reply */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedMessage.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {selectedMessage.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(selectedMessage.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Original Message */}
                  <div>
                    <Label className="text-sm font-medium">Original Message</Label>
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        <Clock className="mr-1 inline h-3 w-3" />
                        Received: {formatDate(selectedMessage.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Admin Replies */}
                  {selectedMessage.reply && (
                    <div>
                      <Label className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        Your {hasMultipleReplies(selectedMessage.reply) ? 'Replies' : 'Reply'} ({parseMultipleReplies(selectedMessage.reply).length})
                      </Label>
                      <div className="mt-2 space-y-4 sm:space-y-5">
                        {parseMultipleReplies(selectedMessage.reply).map((parsedReply, index) => (
                          <div key={index} className="rounded-lg border-2 border-green-200 bg-green-50 p-4 sm:p-5 dark:border-green-800 dark:bg-green-900/20">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                                Reply {index + 1}
                              </span>
                              {parsedReply.timestamp && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {parsedReply.timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {parsedReply.text}
                            </p>
                            {parsedReply.isFirst && selectedMessage.replied_at && (
                              <p className="mt-3 text-xs sm:text-sm text-gray-500 flex items-center gap-1.5">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                First reply: {formatDate(selectedMessage.replied_at)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="pt-4 border-t border-border">
                    <Label htmlFor="reply" className="text-sm sm:text-base font-semibold flex items-center gap-2 mb-3">
                      <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      {selectedMessage.reply ? 'Send Another Reply' : `Reply to ${selectedMessage.name}`}
                    </Label>
                    <Textarea
                      id="reply"
                      placeholder={selectedMessage.reply ? "Add another reply to this conversation..." : "Type your reply here..."}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={8}
                      className="mt-2 text-sm sm:text-base min-h-[160px] sm:min-h-[180px]"
                    />
                    <Button
                      onClick={handleReply}
                      disabled={submitting || !reply.trim()}
                      className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          {selectedMessage.reply ? 'Send Additional Reply' : 'Send Reply'}
                        </>
                      )}
                    </Button>
                    {selectedMessage.reply && (
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground text-center">
                        This will be added as an additional reply to the existing conversation
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">Select a message to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

