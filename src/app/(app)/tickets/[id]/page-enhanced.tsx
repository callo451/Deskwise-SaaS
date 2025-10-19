'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Clock,
  User,
  Tag,
  Paperclip,
  Edit3,
  Trash2,
  Copy,
  Printer,
  Share2,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Timer,
  Star,
  MessageSquare,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { InlineEdit } from '@/components/tickets/inline-edit'
import { EnhancedCommentSection } from '@/components/tickets/enhanced-comment-section'
import { ActivityTimeline, TimelineEvent } from '@/components/tickets/activity-timeline'
import { QuickStatusButtons } from '@/components/tickets/quick-status-buttons'
import { KeyboardShortcutsHelp } from '@/components/tickets/keyboard-shortcuts-help'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { AttachmentList } from '@/components/tickets/attachment-list'
import { FileUpload } from '@/components/tickets/file-upload'
import { TicketAttachment, TicketStatus, TicketPriority } from '@/lib/types'

interface Ticket {
  _id: string
  ticketNumber: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  assignedTo?: string
  assignedToName?: string
  requesterId?: string
  requesterName?: string
  linkedAssets?: string[]
  attachments?: TicketAttachment[]
  tags?: string[]
  createdAt: string
  updatedAt: string
  totalTimeSpent?: number
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: string
    resolutionDeadline: string
    breached: boolean
  }
  csatRating?: {
    rating: number
    feedback?: string
    submittedAt: string
  }
}

interface Comment {
  _id: string
  content: string
  createdBy: string
  createdByName?: string
  createdAt: string
  isInternal: boolean
}

export default function EnhancedTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (params.id) {
      fetchTicket()
      fetchComments()
    }
  }, [params.id])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${params.id}`)
      const data = await response.json()
      if (data.success) {
        setTicket(data.data)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tickets/${params.id}/comments`)
      const data = await response.json()
      if (data.success) {
        setComments(data.data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      const response = await fetch(`/api/tickets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await response.json()
      if (data.success) {
        setTicket(data.data)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAssignToMe = async () => {
    try {
      const response = await fetch(`/api/tickets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: session?.user?.userId }),
      })
      const data = await response.json()
      if (data.success) {
        setTicket(data.data)
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
    }
  }

  const handleTitleSave = async (newTitle: string) => {
    await fetch(`/api/tickets/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    })
    if (ticket) setTicket({ ...ticket, title: newTitle })
  }

  const handleDescriptionSave = async (newDescription: string) => {
    await fetch(`/api/tickets/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: newDescription }),
    })
    if (ticket) setTicket({ ...ticket, description: newDescription })
  }

  const handleAddComment = async (content: string, isInternal: boolean) => {
    const response = await fetch(`/api/tickets/${params.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, isInternal }),
    })
    const data = await response.json()
    if (data.success) {
      setComments([...comments, data.data])
    }
  }

  const handleAttachmentChange = () => {
    fetchTicket()
    setShowFileUpload(false)
  }

  // Generate timeline events from ticket data
  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!ticket) return []

    const events: TimelineEvent[] = []

    // Add ticket creation event
    events.push({
      id: 'created',
      type: 'status_change',
      title: 'Ticket Created',
      description: ticket.description,
      timestamp: new Date(ticket.createdAt),
      user: ticket.requesterName || 'Unknown',
      metadata: {
        newValue: ticket.status,
      },
    })

    // Add comment events
    comments.forEach((comment) => {
      events.push({
        id: comment._id,
        type: comment.isInternal ? 'internal_note' : 'comment',
        title: comment.isInternal ? 'Added internal note' : 'Added comment',
        description: comment.content,
        timestamp: new Date(comment.createdAt),
        user: comment.createdByName || comment.createdBy,
        isInternal: comment.isInternal,
      })
    })

    // Add attachment events
    if (ticket.attachments && ticket.attachments.length > 0) {
      ticket.attachments.forEach((attachment) => {
        events.push({
          id: attachment.id,
          type: 'attachment',
          title: 'Attached file',
          timestamp: new Date(attachment.uploadedAt),
          user: attachment.uploadedBy,
          metadata: {
            fileName: attachment.originalFilename,
          },
        })
      })
    }

    // Add CSAT rating event
    if (ticket.csatRating) {
      events.push({
        id: 'csat',
        type: 'csat_rating',
        title: 'Customer satisfaction rating received',
        timestamp: new Date(ticket.csatRating.submittedAt),
        user: ticket.requesterName || 'Customer',
        metadata: {
          rating: ticket.csatRating.rating,
        },
      })
    }

    // Sort by timestamp (newest first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [ticket, comments])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => {
    if (!ticket) return []

    return [
      {
        key: 'e',
        description: 'Edit ticket',
        action: () => {
          // Focus on title inline edit
          const titleElement = document.querySelector('[data-inline-edit="title"]')
          if (titleElement) (titleElement as HTMLElement).click()
        },
        category: 'Actions',
      },
      {
        key: 'c',
        description: 'Add comment',
        action: () => {
          const commentTextarea = document.querySelector('textarea[placeholder*="comment"]')
          if (commentTextarea) (commentTextarea as HTMLTextAreaElement).focus()
        },
        category: 'Actions',
      },
      {
        key: 's',
        ctrl: true,
        description: 'Save changes',
        action: () => {
          // Trigger save on active inline edit
          const saveButton = document.querySelector('button:focus')
          if (saveButton) (saveButton as HTMLButtonElement).click()
        },
        category: 'Actions',
      },
      {
        key: 'Escape',
        description: 'Go back to ticket list',
        action: () => router.push('/tickets'),
        category: 'Navigation',
      },
    ]
  }, [ticket, router])

  useKeyboardShortcuts({ shortcuts })

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      new: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      open: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      pending: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
      resolved: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    return <Badge className={config[status]?.className}>{status.toUpperCase()}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; icon?: any }> = {
      low: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      medium: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      high: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: AlertCircle },
      critical: { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle },
    }
    const cfg = config[priority]
    const Icon = cfg?.icon
    return (
      <Badge className={cfg?.className}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getSLAIndicator = () => {
    if (!ticket?.sla) return null

    if (ticket.sla.breached) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-900 dark:text-red-100">SLA Breached</p>
            <p className="text-xs text-red-700 dark:text-red-300">
              Resolution deadline was {formatRelativeTime(ticket.sla.resolutionDeadline)}
            </p>
          </div>
        </div>
      )
    }

    const deadline = new Date(ticket.sla.resolutionDeadline)
    const now = new Date()
    const hoursLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))

    if (hoursLeft < 2) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">SLA At Risk</p>
            <p className="text-xs text-orange-700 dark:text-orange-300">
              Due {formatRelativeTime(ticket.sla.resolutionDeadline)}
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-5 h-5 text-green-500" />
        <div>
          <p className="text-sm font-medium text-green-900 dark:text-green-100">SLA On Track</p>
          <p className="text-xs text-green-700 dark:text-green-300">
            Due {formatRelativeTime(ticket.sla.resolutionDeadline)}
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
        <p className="text-muted-foreground mb-4">The ticket you're looking for doesn't exist.</p>
        <Link href="/tickets">
          <Button>Back to Tickets</Button>
        </Link>
      </div>
    )
  }

  const isAssignedToMe = ticket.assignedTo === session?.user?.userId

  return (
    <div className="space-y-6 pb-12">
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={shortcuts} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Link href="/tickets">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{ticket.ticketNumber}</h1>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <div data-inline-edit="title">
              <InlineEdit
                value={ticket.title}
                onSave={handleTitleSave}
                placeholder="Ticket title"
                displayClassName="text-lg text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon">
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Status Actions */}
      <Card>
        <CardContent className="pt-6">
          <QuickStatusButtons
            currentStatus={ticket.status}
            onStatusChange={handleStatusChange}
            onAssignToMe={handleAssignToMe}
            isAssignedToMe={isAssignedToMe}
          />
        </CardContent>
      </Card>

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">
                Activity
                <Badge variant="secondary" className="ml-2">
                  {timelineEvents.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
              <TabsTrigger value="time">Time & Billing</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <InlineEdit
                    value={ticket.description}
                    onSave={handleDescriptionSave}
                    multiline
                    placeholder="Add a description..."
                    displayClassName="whitespace-pre-wrap"
                  />
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Paperclip className="w-5 h-5" />
                        Attachments
                      </CardTitle>
                      <CardDescription>
                        {ticket.attachments?.length || 0} file{ticket.attachments?.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowFileUpload(!showFileUpload)}>
                      {showFileUpload ? 'Cancel' : 'Upload Files'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {showFileUpload && (
                    <FileUpload ticketId={ticket._id} onUploadComplete={handleAttachmentChange} />
                  )}
                  <AttachmentList
                    ticketId={ticket._id}
                    attachments={ticket.attachments || []}
                    onAttachmentDeleted={handleAttachmentChange}
                  />
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments
                  </CardTitle>
                  <CardDescription>
                    {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnhancedCommentSection
                    ticketId={ticket._id}
                    comments={comments}
                    onAddComment={handleAddComment}
                    cannedResponseVariables={{
                      ticketNumber: ticket.ticketNumber,
                      ticketTitle: ticket.title,
                      ticketCategory: ticket.category,
                      technicianName: session?.user?.name,
                      requesterName: ticket.requesterName,
                    }}
                    currentUserId={session?.user?.userId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>Complete history of changes and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityTimeline events={timelineEvents} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Related Tab */}
            <TabsContent value="related" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Related Items</CardTitle>
                  <CardDescription>Linked assets, tickets, and projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No related items yet
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Time & Billing Tab */}
            <TabsContent value="time" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5" />
                    Time Tracking
                  </CardTitle>
                  <CardDescription>
                    Total time spent: {ticket.totalTimeSpent || 0} minutes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No time entries yet
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar (30%) - Sticky */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* SLA Indicator */}
          {ticket.sla && <div>{getSLAIndicator()}</div>}

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-muted-foreground block mb-1">Category</span>
                    <span className="font-medium">{ticket.category}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-muted-foreground block mb-1">Assigned To</span>
                    <span className="font-medium">
                      {ticket.assignedToName || <span className="text-muted-foreground italic">Unassigned</span>}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-muted-foreground block mb-1">Requester</span>
                    <span className="font-medium">{ticket.requesterName || 'Unknown'}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-muted-foreground block mb-1">Created</span>
                    <span className="font-medium">{formatRelativeTime(ticket.createdAt)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="text-muted-foreground block mb-1">Updated</span>
                    <span className="font-medium">{formatRelativeTime(ticket.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CSAT Rating */}
          {ticket.csatRating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Customer Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < ticket.csatRating!.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm font-medium ml-2">{ticket.csatRating.rating}/5</span>
                </div>
                {ticket.csatRating.feedback && (
                  <p className="text-sm text-muted-foreground mt-2">{ticket.csatRating.feedback}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
