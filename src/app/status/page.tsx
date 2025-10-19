'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Incident {
  _id: string
  incidentNumber: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  affectedServices: string[]
  startedAt: string
  updatedAt: string
}

function StatusPageContent() {
  const searchParams = useSearchParams()
  const orgId = searchParams.get('org')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orgId) {
      fetchIncidents()
    }
  }, [orgId])

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`/api/incidents/public?orgId=${orgId}`)
      const data = await response.json()

      if (data.success) {
        setIncidents(data.data)
      }
    } catch (error) {
      console.error('Error fetching incidents:', error)
    } finally {
      setLoading(false)
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

  if (!orgId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Status Page</h1>
          <p className="text-muted-foreground">
            Please provide a valid organization ID to view the status page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
              D
            </div>
            <h1 className="text-2xl font-bold">Deskwise Status</h1>
          </div>
          <p className="text-muted-foreground">
            Current service status and incident information
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading status...</p>
          </div>
        ) : incidents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-2">All Systems Operational</h2>
              <p className="text-muted-foreground">
                There are no active incidents at this time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold">Active Incidents</h2>
            </div>

            {incidents.map((incident) => (
              <Card key={incident._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(incident.status)}
                        {getSeverityBadge(incident.severity)}
                      </div>
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatRelativeTime(incident.startedAt)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap mb-4">
                    {incident.description}
                  </p>
                  {incident.affectedServices.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Affected Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {incident.affectedServices.map((service) => (
                          <Badge key={service} variant="outline">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Last updated: {formatRelativeTime(new Date().toISOString())}</p>
          <p className="mt-2">Powered by Deskwise ITSM</p>
        </div>
      </div>
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <StatusPageContent />
    </Suspense>
  )
}
