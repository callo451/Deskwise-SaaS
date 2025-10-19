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
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

interface ChangeRequest {
  _id: string
  changeNumber: string
  title: string
  description: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'implementing' | 'completed' | 'cancelled'
  risk: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  category: string
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  backoutPlan?: string
  testPlan?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export default function ChangeRequestDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [change, setChange] = useState<ChangeRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchChangeRequest()
    }
  }, [params.id])

  const fetchChangeRequest = async () => {
    try {
      const response = await fetch(`/api/change-requests/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setChange(data.data)
      }
    } catch (error) {
      console.error('Error fetching change request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this change request?')) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/change-requests/${params.id}/approve`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setChange(data.data)
        alert('Change request approved successfully')
      } else {
        alert(data.error || 'Failed to approve change request')
      }
    } catch (error) {
      console.error('Error approving change request:', error)
      alert('Failed to approve change request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/change-requests/${params.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      })

      const data = await response.json()

      if (data.success) {
        setChange(data.data)
        setShowRejectDialog(false)
        setRejectionReason('')
        alert('Change request rejected')
      } else {
        alert(data.error || 'Failed to reject change request')
      }
    } catch (error) {
      console.error('Error rejecting change request:', error)
      alert('Failed to reject change request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/change-requests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (data.success) {
        setChange(data.data)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'warning',
      high: 'destructive',
    }
    return <Badge variant={variants[risk]}>{risk} risk</Badge>
  }

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'warning',
      high: 'destructive',
    }
    return <Badge variant={variants[impact]}>{impact} impact</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'destructive',
      scheduled: 'default',
      implementing: 'default',
      completed: 'success',
      cancelled: 'secondary',
    }
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      scheduled: 'Scheduled',
      implementing: 'Implementing',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading change request...</p>
      </div>
    )
  }

  if (!change) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Change Request Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The change request you're looking for doesn't exist.
        </p>
        <Link href="/changes">
          <Button>Back to Change Requests</Button>
        </Link>
      </div>
    )
  }

  const isAdmin = session?.user?.role === 'admin'
  const canApprove = isAdmin && change.status === 'pending_approval'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/changes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {change.changeNumber}
            </h1>
            {getStatusBadge(change.status)}
            {getRiskBadge(change.risk)}
            {getImpactBadge(change.impact)}
          </div>
          <p className="text-muted-foreground">{change.title}</p>
        </div>
        {canApprove && (
          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={submitting}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={submitting}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>Reject Change Request</CardTitle>
            <CardDescription>
              Please provide a reason for rejecting this change request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              placeholder="Rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{change.description}</p>
            </CardContent>
          </Card>

          {/* Test Plan */}
          {change.testPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Test Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{change.testPlan}</p>
              </CardContent>
            </Card>
          )}

          {/* Backout Plan */}
          {change.backoutPlan && (
            <Card>
              <CardHeader>
                <CardTitle>Backout Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{change.backoutPlan}</p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {change.rejectionReason && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{change.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Control */}
          {isAdmin && change.status !== 'pending_approval' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={change.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending_approval">Pending Approval</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="implementing">Implementing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Category</p>
                <p className="font-medium">{change.category}</p>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Planned Start</p>
                <p className="font-medium">{formatDateTime(change.plannedStartDate)}</p>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Planned End</p>
                <p className="font-medium">{formatDateTime(change.plannedEndDate)}</p>
              </div>

              {change.approvedBy && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-1">Approved By</p>
                  <p className="font-medium">User {change.approvedBy}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(change.approvedAt!)}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{formatRelativeTime(change.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
