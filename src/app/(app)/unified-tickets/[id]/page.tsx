'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Ticket,
  AlertTriangle,
  Settings,
  HelpCircle,
  GitBranch,
  Check,
  X,
  Loader2,
  Clock,
  User,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  UnifiedTicket,
  IncidentMetadata,
  ChangeMetadata,
  ServiceRequestMetadata,
  ProblemMetadata,
  UnifiedTicketUpdate,
} from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'

export default function UnifiedTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [ticket, setTicket] = useState<UnifiedTicket | null>(null)
  const [updates, setUpdates] = useState<UnifiedTicketUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  // Action states
  const [newStatus, setNewStatus] = useState('')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')
  const [updateType, setUpdateType] = useState('general')

  useEffect(() => {
    fetchTicket()
    fetchUpdates()
  }, [id])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/unified-tickets/${id}`)
      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
        setNewStatus(data.ticket.status)
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
    if (!ticket || !['incident', 'problem'].includes(ticket.ticketType)) {
      return
    }

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

  const handleStatusChange = async () => {
    if (!ticket || newStatus === ticket.status) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/unified-tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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

  const getTypeIcon = () => {
    if (!ticket) return Ticket

    const icons = {
      ticket: Ticket,
      incident: AlertTriangle,
      service_request: HelpCircle,
      change: Settings,
      problem: GitBranch,
    }

    return icons[ticket.ticketType] || Ticket
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      open: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-orange-100 text-orange-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      implementing: 'bg-orange-100 text-orange-800',
    }

    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    }

    return colors[priority] || 'bg-gray-100 text-gray-800'
  }

  const renderIncidentDetails = () => {
    if (ticket?.ticketType !== 'incident') return null
    const metadata = ticket.metadata as IncidentMetadata

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Incident Details</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-sm text-gray-500">Severity</Label>
            <p className="font-medium capitalize">{metadata.severity}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Impact</Label>
            <p className="font-medium capitalize">{metadata.impact}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Urgency</Label>
            <p className="font-medium capitalize">{metadata.urgency}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm text-gray-500">Affected Services</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {metadata.affectedServices.map((service) => (
              <Badge key={service} variant="outline">
                {service}
              </Badge>
            ))}
          </div>
        </div>

        {metadata.isPublic && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This incident is visible on the public status page
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const renderChangeDetails = () => {
    if (ticket?.ticketType !== 'change') return null
    const metadata = ticket.metadata as ChangeMetadata

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Change Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-500">Risk Level</Label>
            <Badge className={metadata.risk === 'high' ? 'bg-red-100 text-red-800' : metadata.risk === 'medium' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
              {metadata.risk}
            </Badge>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Impact</Label>
            <Badge className={getPriorityBadgeColor(metadata.impact)}>
              {metadata.impact}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-500">Planned Start</Label>
            <p className="font-medium">
              {format(new Date(metadata.plannedStartDate), 'PPp')}
            </p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Planned End</Label>
            <p className="font-medium">
              {format(new Date(metadata.plannedEndDate), 'PPp')}
            </p>
          </div>
        </div>

        {metadata.actualStartDate && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">Actual Start</Label>
              <p className="font-medium">
                {format(new Date(metadata.actualStartDate), 'PPp')}
              </p>
            </div>
            {metadata.actualEndDate && (
              <div>
                <Label className="text-sm text-gray-500">Actual End</Label>
                <p className="font-medium">
                  {format(new Date(metadata.actualEndDate), 'PPp')}
                </p>
              </div>
            )}
          </div>
        )}

        <div>
          <Label className="text-sm text-gray-500">Backout Plan</Label>
          <Card className="p-4 mt-2 bg-gray-50">
            <p className="text-sm whitespace-pre-wrap">{metadata.backoutPlan}</p>
          </Card>
        </div>

        {metadata.testPlan && (
          <div>
            <Label className="text-sm text-gray-500">Test Plan</Label>
            <Card className="p-4 mt-2 bg-gray-50">
              <p className="text-sm whitespace-pre-wrap">{metadata.testPlan}</p>
            </Card>
          </div>
        )}

        {metadata.implementationPlan && (
          <div>
            <Label className="text-sm text-gray-500">Implementation Plan</Label>
            <Card className="p-4 mt-2 bg-gray-50">
              <p className="text-sm whitespace-pre-wrap">{metadata.implementationPlan}</p>
            </Card>
          </div>
        )}

        {metadata.approvalStatus && (
          <div>
            <Label className="text-sm text-gray-500">Approval Status</Label>
            <div className="flex items-center gap-2 mt-2">
              {metadata.approvalStatus === 'approved' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : metadata.approvalStatus === 'rejected' ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium capitalize">{metadata.approvalStatus}</span>
            </div>
            {metadata.approvedBy && (
              <p className="text-sm text-gray-500 mt-1">
                by {metadata.approvedByName || metadata.approvedBy} on{' '}
                {metadata.approvedAt && format(new Date(metadata.approvedAt), 'PPp')}
              </p>
            )}
            {metadata.rejectionReason && (
              <Alert className="mt-2" variant="destructive">
                <AlertDescription>{metadata.rejectionReason}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderServiceRequestDetails = () => {
    if (ticket?.ticketType !== 'service_request') return null
    const metadata = ticket.metadata as ServiceRequestMetadata

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Service Request Details</h3>

        {metadata.serviceId && (
          <div>
            <Label className="text-sm text-gray-500">Service</Label>
            <p className="font-medium">{metadata.serviceId}</p>
          </div>
        )}

        {metadata.formData && Object.keys(metadata.formData).length > 0 && (
          <div>
            <Label className="text-sm text-gray-500">Form Data</Label>
            <Card className="p-4 mt-2 bg-gray-50">
              <dl className="space-y-2">
                {Object.entries(metadata.formData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-600">{key}:</dt>
                    <dd className="text-sm text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        )}

        {metadata.approvalStatus && (
          <div>
            <Label className="text-sm text-gray-500">Approval Status</Label>
            <div className="flex items-center gap-2 mt-2">
              {metadata.approvalStatus === 'approved' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : metadata.approvalStatus === 'rejected' ? (
                <XCircle className="h-5 w-5 text-red-600" />
              ) : (
                <Clock className="h-5 w-5 text-yellow-600" />
              )}
              <span className="font-medium capitalize">{metadata.approvalStatus}</span>
            </div>
            {metadata.approvedBy && (
              <p className="text-sm text-gray-500 mt-1">
                by {metadata.approvedByName || metadata.approvedBy}
              </p>
            )}
            {metadata.rejectionReason && (
              <Alert className="mt-2" variant="destructive">
                <AlertDescription>{metadata.rejectionReason}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderProblemDetails = () => {
    if (ticket?.ticketType !== 'problem') return null
    const metadata = ticket.metadata as ProblemMetadata

    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Problem Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-500">Impact</Label>
            <p className="font-medium capitalize">{metadata.impact}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Urgency</Label>
            <p className="font-medium capitalize">{metadata.urgency}</p>
          </div>
        </div>

        {metadata.rootCause && (
          <div>
            <Label className="text-sm text-gray-500">Root Cause</Label>
            <Card className="p-4 mt-2 bg-yellow-50 border-yellow-200">
              <p className="text-sm whitespace-pre-wrap">{metadata.rootCause}</p>
            </Card>
          </div>
        )}

        {metadata.workaround && (
          <div>
            <Label className="text-sm text-gray-500">Workaround</Label>
            <Card className="p-4 mt-2 bg-blue-50 border-blue-200">
              <p className="text-sm whitespace-pre-wrap">{metadata.workaround}</p>
            </Card>
          </div>
        )}

        {metadata.solution && (
          <div>
            <Label className="text-sm text-gray-500">Solution</Label>
            <Card className="p-4 mt-2 bg-green-50 border-green-200">
              <p className="text-sm whitespace-pre-wrap">{metadata.solution}</p>
            </Card>
          </div>
        )}

        {metadata.relatedIncidents.length > 0 && (
          <div>
            <Label className="text-sm text-gray-500">Related Incidents</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {metadata.relatedIncidents.map((incidentId) => (
                <Badge key={incidentId} variant="outline">
                  {incidentId}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderApprovalActions = () => {
    if (!ticket || !['change', 'service_request'].includes(ticket.ticketType)) return null
    if (ticket.status !== 'pending_approval') return null

    return (
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Approval Required</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
            <Textarea
              id="approvalNotes"
              placeholder="Add notes about the approval decision..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApprove} disabled={actionLoading} className="flex-1">
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
            />
          </div>
        </div>
      </Card>
    )
  }

  const renderUpdatesSection = () => {
    if (!ticket || !['incident', 'problem'].includes(ticket.ticketType)) return null

    return (
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Updates</h3>

        {/* Add Update Form */}
        <div className="space-y-4 pb-4 border-b">
          <div className="space-y-2">
            <Label htmlFor="updateMessage">New Update</Label>
            <Textarea
              id="updateMessage"
              placeholder="Add a status update..."
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-4">
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

        {/* Updates List */}
        <div className="space-y-4">
          {updates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No updates yet</p>
          ) : (
            updates.map((update) => (
              <div key={update._id.toString()} className="border-l-4 border-gray-200 pl-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{update.createdByName}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {update.updateType.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                  {update.message}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Ticket not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const TypeIcon = getTypeIcon()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <TypeIcon className="h-6 w-6 text-gray-600" />
              <h1 className="text-3xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
              <Badge variant="outline" className={getStatusBadgeColor(ticket.status)}>
                {ticket.status.replace(/_/g, ' ')}
              </Badge>
              <Badge variant="outline" className={getPriorityBadgeColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
            </div>
            <p className="text-xl text-gray-700 mt-2">{ticket.title}</p>
          </div>
        </div>

        <Button variant="outline">Edit</Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </Card>

          {/* Type-Specific Details */}
          <Card className="p-6">
            {renderIncidentDetails()}
            {renderChangeDetails()}
            {renderServiceRequestDetails()}
            {renderProblemDetails()}
          </Card>

          {/* Approval Actions */}
          {renderApprovalActions()}

          {/* Updates */}
          {renderUpdatesSection()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Change */}
          <Card className="p-4">
            <Label className="text-sm font-medium mb-2 block">Change Status</Label>
            <div className="space-y-2">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Status options would be dynamic based on ticket type */}
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleStatusChange}
                disabled={actionLoading || newStatus === ticket.status}
                className="w-full"
              >
                Update Status
              </Button>
            </div>
          </Card>

          {/* Details */}
          <Card className="p-4 space-y-4">
            <div>
              <Label className="text-sm text-gray-500">Assigned To</Label>
              <p className="font-medium">{ticket.assignedToName || ticket.assignedTo || 'Unassigned'}</p>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Requester</Label>
              <p className="font-medium">{ticket.requesterName || ticket.requesterId}</p>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Category</Label>
              <p className="font-medium">{ticket.category}</p>
            </div>

            <div>
              <Label className="text-sm text-gray-500">Created</Label>
              <p className="text-sm">{format(new Date(ticket.createdAt), 'PPp')}</p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </p>
            </div>

            {ticket.resolvedAt && (
              <div>
                <Label className="text-sm text-gray-500">Resolved</Label>
                <p className="text-sm">{format(new Date(ticket.resolvedAt), 'PPp')}</p>
              </div>
            )}

            {ticket.closedAt && (
              <div>
                <Label className="text-sm text-gray-500">Closed</Label>
                <p className="text-sm">{format(new Date(ticket.closedAt), 'PPp')}</p>
              </div>
            )}
          </Card>

          {/* SLA */}
          {ticket.sla && (
            <Card className="p-4 space-y-3">
              <h4 className="font-semibold text-sm">SLA</h4>
              <div>
                <Label className="text-xs text-gray-500">Response Time</Label>
                <p className="text-sm font-medium">{ticket.sla.responseTime} minutes</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Resolution Time</Label>
                <p className="text-sm font-medium">{ticket.sla.resolutionTime} minutes</p>
              </div>
              {ticket.sla.breached && (
                <Badge variant="destructive" className="w-full justify-center">
                  SLA Breached
                </Badge>
              )}
            </Card>
          )}

          {/* Tags */}
          {ticket.tags && ticket.tags.length > 0 && (
            <Card className="p-4">
              <Label className="text-sm font-medium mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {ticket.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
