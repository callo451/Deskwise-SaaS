'use client'

import { useState, useEffect } from 'react'
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
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react'
import { formatDateTime, formatRelativeTime } from '@/lib/utils'

interface Incident {
  _id: string
  incidentNumber: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  affectedServices: string[]
  isPublic: boolean
  startedAt: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

interface IncidentUpdate {
  _id: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  message: string
  createdBy: string
  createdAt: string
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [updates, setUpdates] = useState<IncidentUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [newUpdate, setNewUpdate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'investigating' | 'identified' | 'monitoring' | 'resolved'>('investigating')

  useEffect(() => {
    if (params.id) {
      fetchIncident()
      fetchUpdates()
    }
  }, [params.id])

  const fetchIncident = async () => {
    try {
      const response = await fetch(`/api/incidents/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setIncident(data.data)
        setSelectedStatus(data.data.status)
      }
    } catch (error) {
      console.error('Error fetching incident:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpdates = async () => {
    try {
      const response = await fetch(`/api/incidents/${params.id}/updates`)
      const data = await response.json()

      if (data.success) {
        setUpdates(data.data)
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUpdate.trim()) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/incidents/${params.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          message: newUpdate,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUpdates([...updates, data.data])
        setNewUpdate('')
        fetchIncident() // Refresh incident to update status
      }
    } catch (error) {
      console.error('Error adding update:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      minor: 'secondary',
      major: 'warning',
      critical: 'destructive',
    }
    return <Badge variant={variants[severity]}>{severity}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      investigating: 'default',
      identified: 'warning',
      monitoring: 'default',
      resolved: 'success',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading incident...</p>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Incident Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The incident you're looking for doesn't exist.
        </p>
        <Link href="/incidents">
          <Button>Back to Incidents</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/incidents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {incident.incidentNumber}
            </h1>
            {getStatusBadge(incident.status)}
            {getSeverityBadge(incident.severity)}
            {incident.isPublic && (
              <Badge variant="outline">Public</Badge>
            )}
          </div>
          <p className="text-muted-foreground">{incident.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{incident.description}</p>
            </CardContent>
          </Card>

          {/* Status Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Status Updates</CardTitle>
              <CardDescription>
                {updates.length} {updates.length === 1 ? 'update' : 'updates'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Updates List */}
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update._id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(update.status)}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(update.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {update.message}
                      </p>
                    </div>
                  </div>
                ))}

                {updates.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No updates yet. Add the first update below.
                  </p>
                )}
              </div>

              {/* Add Update Form */}
              <form onSubmit={handleAddUpdate} className="space-y-3 pt-4 border-t">
                <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <textarea
                  placeholder="Add status update..."
                  value={newUpdate}
                  onChange={(e) => setNewUpdate(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button type="submit" disabled={submitting || !newUpdate.trim()}>
                  {submitting ? 'Adding...' : 'Add Update'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Affected Services</p>
                {incident.affectedServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {incident.affectedServices.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">None specified</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Started:</span>
                <span className="font-medium">{formatRelativeTime(incident.startedAt)}</span>
              </div>

              {incident.resolvedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Resolved:</span>
                  <span className="font-medium">{formatRelativeTime(incident.resolvedAt)}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{formatRelativeTime(incident.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
