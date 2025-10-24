'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Check,
  X,
  Loader2,
  MessageSquare,
  AlertCircle,
  Activity,
  Paperclip,
  FileText,
  Clock as ClockIcon,
  ArrowLeft,
  User,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Calendar,
  Tag as TagIcon,
} from 'lucide-react'
import Link from 'next/link'
import { TicketHeader } from '@/components/unified-tickets/ticket-header'
import { ServiceCatalogCard } from '@/components/unified-tickets/service-catalog-card'
import { TicketDetailsCard } from '@/components/unified-tickets/ticket-details-card'
import { TypeSpecificSections } from '@/components/unified-tickets/type-specific-sections'
import { ActivityTimeline } from '@/components/unified-tickets/activity-timeline'
import { EnhancedCommentSection } from '@/components/unified-tickets/enhanced-comment-section'
import { Comment } from '@/components/unified-tickets/comment-item'
import { AttachmentsTab } from '@/components/unified-tickets/attachments-tab'
import { TimeTrackingTab } from '@/components/unified-tickets/time-tracking-tab'
import { buildActivityTimeline, buildCannedResponseVariables } from '@/lib/utils/activity-timeline-builder'
import { AIInsightsPanel } from '@/components/tickets/ai-insights-panel'
import { ModernSLACard } from '@/components/tickets/modern-sla-card'
import { CollapsibleCard } from '@/components/ui/collapsible-card'
import {
  UnifiedTicket,
  ServiceRequestMetadata,
  UnifiedTicketUpdate,
  UnifiedTicketStatus,
} from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export default function UnifiedTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [ticket, setTicket] = useState<UnifiedTicket | null>(null)
  const [updates, setUpdates] = useState<UnifiedTicketUpdate[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<Array<{ _id: string; name: string; email: string }>>([])
  const [loading, setLoading] = useState(true)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [isScrolled, setIsScrolled] = useState(false)

  // Action states
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateType, setUpdateType] = useState('general')

  useEffect(() => {
    fetchTicket()
    fetchUpdates()
    fetchComments()
    fetchUsers()
  }, [id])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/unified-tickets/${id}`)
      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
      } else {
        setError(data.error || 'Failed to load ticket')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpdates = async () => {
    try {
      const response = await fetch(`/api/unified-tickets/${id}/updates`)
      const data = await response.json()

      if (data.success) {
        setUpdates(data.updates || [])
      }
    } catch (err) {
      console.error('Error fetching updates:', err)
    }
  }

  const fetchComments = async () => {
    try {
      setCommentsLoading(true)
      const response = await fetch(`/api/unified-tickets/${id}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setCommentsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()

      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }

  const handleTitleSave = async (title: string) => {
    await fetch(`/api/unified-tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (ticket) setTicket({ ...ticket, title })
  }

  const handleDescriptionSave = async (description: string) => {
    await fetch(`/api/unified-tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    if (ticket) setTicket({ ...ticket, description })
  }

  const handleStatusChange = async (status: UnifiedTicketStatus) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/unified-tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setError('')
      } else {
        setError(data.error || 'Failed to update status')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePriorityChange = async (priority: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/unified-tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      })

      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setError('')
      } else {
        setError(data.error || 'Failed to update priority')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssigneeChange = async (userId: string) => {
    const assignedTo = userId === 'unassigned' ? undefined : userId
    await fetch(`/api/unified-tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo }),
    })
    fetchTicket() // Refresh to get updated assignee name
  }

  const handleAssignToMe = async () => {
    if (session?.user?.userId) {
      await handleAssigneeChange(session.user.userId)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/unified-tickets/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approvalNotes }),
      })

      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setApprovalNotes('')
        setError('')
      } else {
        setError(data.error || 'Failed to approve')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Rejection reason is required')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/unified-tickets/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setRejectionReason('')
        setError('')
      } else {
        setError(data.error || 'Failed to reject')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddUpdate = async () => {
    if (!updateMessage.trim()) {
      setError('Update message is required')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/unified-tickets/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: updateMessage,
          updateType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUpdateMessage('')
        setUpdateType('general')
        setError('')
        fetchUpdates()
      } else {
        setError(data.error || 'Failed to add update')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddComment = async (content: string, isInternal: boolean) => {
    const response = await fetch(`/api/unified-tickets/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, isInternal }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to add comment')
    }

    fetchComments()
  }

  const handleEditComment = async (commentId: string, newContent: string) => {
    const response = await fetch(`/api/unified-tickets/${id}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to edit comment')
    }

    fetchComments()
  }

  const handleDeleteComment = async (commentId: string) => {
    const response = await fetch(`/api/unified-tickets/${id}/comments/${commentId}`, {
      method: 'DELETE',
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete comment')
    }

    fetchComments()
  }

  const renderApprovalActions = () => {
    if (!ticket || !['change', 'service_request'].includes(ticket.ticketType)) return null
    if (ticket.status !== 'pending_approval') return null

    return (
      <Card className="border-2 border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Approval Required
          </CardTitle>
          <CardDescription>This {ticket.ticketType === 'change' ? 'change request' : 'service request'} requires your approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
            <Textarea
              id="approvalNotes"
              placeholder="Add notes about the approval decision..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700">
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectionReason) {
                  handleReject()
                }
              }}
              disabled={actionLoading || !rejectionReason}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason *</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Required if rejecting..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderUpdatesSection = () => {
    if (!ticket || !['incident', 'problem'].includes(ticket.ticketType)) return null

    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Updates & Progress
          </CardTitle>
          <CardDescription>Track incident progress and problem resolution</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Update Form */}
          <div className="space-y-4 p-4 rounded-lg border-2 border-dashed bg-accent/50">
            <div className="space-y-2">
              <Label htmlFor="updateMessage">New Update</Label>
              <Textarea
                id="updateMessage"
                placeholder="Add a status update..."
                value={updateMessage}
                onChange={(e) => setUpdateMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Select value={updateType} onValueChange={setUpdateType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Update</SelectItem>
                  <SelectItem value="status">Status Change</SelectItem>
                  {ticket.ticketType === 'problem' && (
                    <>
                      <SelectItem value="root_cause">Root Cause</SelectItem>
                      <SelectItem value="workaround">Workaround</SelectItem>
                      <SelectItem value="solution">Solution</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              <Button onClick={handleAddUpdate} disabled={actionLoading || !updateMessage.trim()}>
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Post Update
              </Button>
            </div>
          </div>

          <Separator />

          {/* Updates List */}
          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No updates yet</p>
                <p className="text-xs text-muted-foreground mt-1">Post the first update to track progress</p>
              </div>
            ) : (
              updates.map((update) => (
                <div key={update._id.toString()} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                        {update.createdByName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{update.createdByName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {update.updateType.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed pl-10">
                    {update.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <Alert variant="destructive" className="border-2">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-base">{error || 'Ticket not found'}</AlertDescription>
          </Alert>
          <Button className="w-full mt-4" onClick={() => router.push('/unified-tickets')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
      </div>
    )
  }

  const activityTimeline = buildActivityTimeline({
    ticket,
    comments,
    includeCreation: true,
    includeUpdates: true,
  })
  const cannedResponseVars = buildCannedResponseVariables(ticket, session)

  return (
    <div className="min-h-screen">
      {/* Sticky Header */}
      <div className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
        isScrolled && "shadow-md"
      )}>
        <div className="container max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <TicketHeader
            ticket={ticket}
            onTitleSave={handleTitleSave}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onAssignToMe={handleAssignToMe}
            currentUserId={session?.user?.userId}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Modern Tabbed Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg border-2 p-1 mb-6 shadow-sm">
            <TabsList className="w-full justify-start bg-transparent gap-2">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
              >
                <FileText className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
              >
                <Activity className="h-4 w-4" />
                Activity
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activityTimeline.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                Comments
                <Badge variant="secondary" className="ml-1 text-xs">
                  {comments.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
              >
                <Paperclip className="h-4 w-4" />
                Attachments
                <Badge variant="secondary" className="ml-1 text-xs">
                  {ticket.attachments?.length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="time"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
              >
                <ClockIcon className="h-4 w-4" />
                Time
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column: Main Content (60%) */}
              <div className="lg:col-span-3 space-y-6">
                {/* Service Catalog Card (if applicable) */}
                {ticket.ticketType === 'service_request' && (
                  <ServiceCatalogCard metadata={ticket.metadata as ServiceRequestMetadata} />
                )}

                {/* SLA Tracking Card - Use Modern Version */}
                {ticket.sla && (
                  <ModernSLACard
                    sla={ticket.sla}
                    createdAt={ticket.createdAt}
                  />
                )}

                <TicketDetailsCard
                  ticket={ticket}
                  onDescriptionSave={handleDescriptionSave}
                  onAssigneeChange={handleAssigneeChange}
                  users={users}
                />

                {/* Approval Actions */}
                {renderApprovalActions()}

                {/* Updates */}
                {renderUpdatesSection()}
              </div>

              {/* Right Sidebar (40%) - Sticky */}
              <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 lg:self-start">
                {/* AI Insights Panel */}
                <AIInsightsPanel
                  ticketId={ticket._id.toString()}
                  ticketTitle={ticket.title}
                  ticketDescription={ticket.description}
                  ticketCategory={ticket.ticketType}
                />

                {/* Type-Specific Sections */}
                <TypeSpecificSections ticket={ticket} />
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-0">
            <CollapsibleCard
              title={
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Activity Timeline
                </CardTitle>
              }
              description="Complete history of changes and updates"
              defaultExpanded={true}
            >
              <ActivityTimeline events={activityTimeline} />
            </CollapsibleCard>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-0">
            <CollapsibleCard
              title={
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments & Discussion
                </CardTitle>
              }
              description="Collaborate with your team and stakeholders"
              defaultExpanded={true}
            >
              <EnhancedCommentSection
                ticketId={ticket._id.toString()}
                comments={comments}
                onAddComment={handleAddComment}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
                cannedResponseVariables={cannedResponseVars}
                currentUserId={session?.user?.userId}
              />
            </CollapsibleCard>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-0">
            <CollapsibleCard
              title={
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5" />
                  Attachments & Files
                </CardTitle>
              }
              description="Upload and manage ticket attachments"
              defaultExpanded={true}
            >
              <AttachmentsTab ticketId={ticket._id.toString()} />
            </CollapsibleCard>
          </TabsContent>

          {/* Time Tab */}
          <TabsContent value="time" className="mt-0">
            <CollapsibleCard
              title={
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Time Tracking & Billing
                </CardTitle>
              }
              description="Track time spent and billable hours"
              defaultExpanded={true}
            >
              <TimeTrackingTab
                ticketId={ticket._id.toString()}
                currentUserId={session?.user?.userId}
              />
            </CollapsibleCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
