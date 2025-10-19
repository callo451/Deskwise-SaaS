'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send, Clock, User, Tag, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface ServiceRequest {
  _id: string
  requestNumber: string
  title: string
  description: string
  status: 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  requestedByName?: string
  assignedToName?: string
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedByName?: string
  approvedAt?: string
  rejectionReason?: string
  formData?: Record<string, any>
  createdAt: string
  updatedAt: string
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: string
    resolutionDeadline: string
    breached: boolean
  }
}

interface Comment {
  _id: string
  content: string
  createdBy: string
  createdAt: string
  isInternal: boolean
}

export default function ServiceRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [request, setRequest] = useState<ServiceRequest | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  const canApprove = session?.user?.role === 'admin' || session?.user?.role === 'technician'

  useEffect(() => {
    if (params.id) {
      fetchRequest()
      fetchComments()
    }
  }, [params.id])

  const fetchRequest = async () => {
    try {
      const response = await fetch(`/api/service-requests/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setRequest(data.data)
      }
    } catch (error) {
      console.error('Error fetching service request:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/service-requests/${params.id}/comments`)
      const data = await response.json()

      if (data.success) {
        setComments(data.data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/service-requests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setRequest(data.data)
        toast({
          title: 'Success',
          description: 'Status updated successfully',
        })
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    }
  }

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/service-requests/${params.id}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setRequest(data.data)
        toast({
          title: 'Success',
          description: 'Service request approved',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to approve request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error approving request:', error)
      toast({
        title: 'Error',
        description: 'Failed to approve request',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/service-requests/${params.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      })

      const data = await response.json()

      if (data.success) {
        setRequest(data.data)
        setShowRejectDialog(false)
        setRejectionReason('')
        toast({
          title: 'Success',
          description: 'Service request rejected',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to reject request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive',
      })
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)

    try {
      const response = await fetch(`/api/service-requests/${params.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      const data = await response.json()

      if (data.success) {
        setComments([...comments, data.data])
        setNewComment('')
        toast({
          title: 'Success',
          description: 'Comment added',
        })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; className: string }> = {
      submitted: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      pending_approval: { variant: 'default', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
      approved: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      rejected: { variant: 'default', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      in_progress: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      completed: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      cancelled: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    const cfg = config[status] || config.submitted
    return <Badge variant={cfg.variant} className={cfg.className}>{status.replace('_', ' ').toUpperCase()}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: any; className: string; icon: any }> = {
      low: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: null },
      medium: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: null },
      high: { variant: 'default', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: AlertCircle },
      critical: { variant: 'destructive', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle },
    }
    const cfg = config[priority] || config.medium
    return (
      <Badge variant={cfg.variant} className={cfg.className}>
        {cfg.icon && <cfg.icon className="w-3 h-3 mr-1" />}
        {priority.toUpperCase()}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading service request...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Service Request Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The service request you're looking for doesn't exist.
        </p>
        <Link href="/service-requests">
          <Button>Back to Service Requests</Button>
        </Link>
      </div>
    )
  }

  const showApprovalButtons =
    canApprove &&
    request.status === 'pending_approval' &&
    (!request.approvalStatus || request.approvalStatus === 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/service-requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {request.requestNumber}
            </h1>
            {getStatusBadge(request.status)}
            {getPriorityBadge(request.priority)}
          </div>
          <p className="text-muted-foreground">{request.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approval Actions */}
          {showApprovalButtons && (
            <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-900/10">
              <CardHeader>
                <CardTitle className="text-lg">Approval Required</CardTitle>
                <CardDescription>
                  This service request is pending approval
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Request
                </Button>
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rejection Dialog */}
          {showRejectDialog && (
            <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="text-lg">Reject Service Request</CardTitle>
                <CardDescription>
                  Please provide a reason for rejection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  rows={4}
                />
                <div className="flex gap-3">
                  <Button onClick={handleReject} variant="destructive">
                    Confirm Rejection
                  </Button>
                  <Button onClick={() => setShowRejectDialog(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Status */}
          {request.approvalStatus === 'approved' && (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-900/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-400">
                      Request Approved
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-500">
                      Approved by {request.approvedByName} on {request.approvedAt && formatDateTime(request.approvedAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {request.approvalStatus === 'rejected' && (
            <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-600 mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-900 dark:text-red-400">
                      Request Rejected
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-500 mb-2">
                      Rejected by {request.approvedByName} on {request.approvedAt && formatDateTime(request.approvedAt)}
                    </p>
                    {request.rejectionReason && (
                      <div className="mt-2 p-3 bg-white dark:bg-gray-900 rounded-md">
                        <p className="text-sm font-medium mb-1">Reason:</p>
                        <p className="text-sm text-muted-foreground">{request.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description}</p>
            </CardContent>
          </Card>

          {/* Form Data */}
          {request.formData && Object.keys(request.formData).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
                <CardDescription>
                  Information submitted with this request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(request.formData).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b last:border-0">
                      <div className="font-medium text-sm capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Activity & Comments</CardTitle>
              <CardDescription>
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                      {comment.createdBy[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          User {comment.createdBy}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  {submittingComment ? 'Sending...' : 'Add Comment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={request.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <span className="font-medium">{request.category}</span>
              </div>

              {request.requestedByName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Requested by:</span>
                  <span className="font-medium">{request.requestedByName}</span>
                </div>
              )}

              {request.assignedToName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Assigned to:</span>
                  <span className="font-medium">{request.assignedToName}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{formatRelativeTime(request.createdAt)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Updated:</span>
                <span className="font-medium">{formatRelativeTime(request.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* SLA Information */}
          {request.sla && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SLA Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Response Time:</span>
                  <p className="font-medium">{request.sla.responseTime} minutes</p>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Resolution Time:</span>
                  <p className="font-medium">{request.sla.resolutionTime} minutes</p>
                </div>
                {request.sla.breached && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      SLA Breached
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
