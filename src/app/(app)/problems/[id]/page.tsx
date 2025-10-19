'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lightbulb,
  Wrench,
  Link2,
  Save,
  Edit,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Problem {
  _id: string
  problemNumber: string
  title: string
  description: string
  status: 'open' | 'investigating' | 'known_error' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  impact: 'low' | 'medium' | 'high'
  urgency: 'low' | 'medium' | 'high'
  assignedTo?: string
  assignedToName?: string
  reportedBy: string
  reportedByName?: string
  rootCause?: string
  workaround?: string
  solution?: string
  relatedIncidents: string[]
  affectedServices: string[]
  clientIds: string[]
  isPublic: boolean
  startedAt: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
}

interface ProblemUpdate {
  _id: string
  updateType: 'status' | 'root_cause' | 'workaround' | 'solution' | 'general'
  status?: string
  message: string
  createdBy: string
  createdByName?: string
  createdAt: string
}

export default function ProblemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [updates, setUpdates] = useState<ProblemUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit states
  const [editMode, setEditMode] = useState(false)
  const [editStatus, setEditStatus] = useState('')
  const [editPriority, setEditPriority] = useState('')
  const [editRootCause, setEditRootCause] = useState('')
  const [editWorkaround, setEditWorkaround] = useState('')
  const [editSolution, setEditSolution] = useState('')

  useEffect(() => {
    if (params?.id) {
      fetchProblem()
      fetchUpdates()
    }
  }, [params?.id])

  const fetchProblem = async () => {
    try {
      const response = await fetch(`/api/problems/${params?.id}`)
      const data = await response.json()

      if (data.success) {
        setProblem(data.data)
        setEditStatus(data.data.status)
        setEditPriority(data.data.priority)
        setEditRootCause(data.data.rootCause || '')
        setEditWorkaround(data.data.workaround || '')
        setEditSolution(data.data.solution || '')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load problem',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching problem:', error)
      toast({
        title: 'Error',
        description: 'Failed to load problem',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchUpdates = async () => {
    try {
      const response = await fetch(`/api/problems/${params?.id}/updates`)
      const data = await response.json()

      if (data.success) {
        setUpdates(data.data)
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  const handleSave = async () => {
    if (!problem) return

    setSaving(true)
    try {
      const updates: any = {
        status: editStatus,
        priority: editPriority,
      }

      if (editRootCause !== problem.rootCause) {
        updates.rootCause = editRootCause
      }

      if (editWorkaround !== problem.workaround) {
        updates.workaround = editWorkaround
      }

      if (editSolution !== problem.solution) {
        updates.solution = editSolution
      }

      const response = await fetch(`/api/problems/${params?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Problem updated successfully',
        })
        setEditMode(false)
        fetchProblem()
        fetchUpdates()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update problem',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating problem:', error)
      toast({
        title: 'Error',
        description: 'Failed to update problem',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      open: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: AlertCircle },
      investigating: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: AlertTriangle },
      known_error: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: AlertTriangle },
      resolved: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle2 },
      closed: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: CheckCircle2 },
    }
    const cfg = config[status] || config.open
    return (
      <Badge className={cfg.className}>
        {cfg.icon && <cfg.icon className="w-3 h-3 mr-1" />}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; icon: any }> = {
      low: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: TrendingDown },
      medium: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: null },
      high: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: TrendingUp },
      critical: { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertTriangle },
    }
    const cfg = config[priority] || config.medium
    return (
      <Badge className={cfg.className}>
        {cfg.icon && <cfg.icon className="w-3 h-3 mr-1" />}
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getDuration = () => {
    if (!problem) return ''
    const start = new Date(problem.startedAt)
    const end = problem.resolvedAt ? new Date(problem.resolvedAt) : new Date()
    const durationMs = end.getTime() - start.getTime()

    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    }
    return `${hours}h`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading problem...</div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <div className="text-xl font-semibold mb-2">Problem not found</div>
        <Link href="/problems">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Problems
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/problems">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Problems
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{problem.problemNumber}</h1>
              {getStatusBadge(problem.status)}
              {getPriorityBadge(problem.priority)}
              {problem.isPublic && (
                <Badge variant="outline">Public</Badge>
              )}
            </div>
            <h2 className="text-xl text-muted-foreground">{problem.title}</h2>
          </div>

          <div className="flex gap-2">
            {!editMode ? (
              <Button onClick={() => setEditMode(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{problem.description}</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Root Cause Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Root Cause Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Textarea
                    value={editRootCause}
                    onChange={(e) => setEditRootCause(e.target.value)}
                    placeholder="Document the root cause of this problem..."
                    rows={4}
                  />
                ) : problem.rootCause ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{problem.rootCause}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No root cause documented yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Workaround */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Workaround
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Textarea
                    value={editWorkaround}
                    onChange={(e) => setEditWorkaround(e.target.value)}
                    placeholder="Document any temporary workarounds..."
                    rows={4}
                  />
                ) : problem.workaround ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{problem.workaround}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No workaround documented yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Textarea
                    value={editSolution}
                    onChange={(e) => setEditSolution(e.target.value)}
                    placeholder="Document the permanent solution..."
                    rows={4}
                  />
                ) : problem.solution ? (
                  <p className="text-muted-foreground whitespace-pre-wrap">{problem.solution}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No solution documented yet</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Related Incidents */}
          {problem.relatedIncidents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    Related Incidents ({problem.relatedIncidents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {problem.relatedIncidents.map((incidentId, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded border">
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        <Link href={`/incidents/${incidentId}`} className="text-primary hover:underline">
                          View Incident
                        </Link>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>{updates.length} updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {updates.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No updates yet</p>
                  ) : (
                    updates.map((update, index) => (
                      <div key={update._id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                          {index < updates.length - 1 && (
                            <div className="w-0.5 h-full bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{update.createdByName || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(update.createdAt)}
                            </span>
                            {update.updateType !== 'general' && (
                              <Badge variant="outline" className="text-xs">
                                {update.updateType.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{update.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="known_error">Known Error</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Priority</label>
                      <Select value={editPriority} onValueChange={setEditPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                      {getStatusBadge(problem.status)}
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Priority</div>
                      {getPriorityBadge(problem.priority)}
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Category</div>
                  <div className="text-sm">{problem.category}</div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Impact</div>
                  <div className="text-sm capitalize">{problem.impact}</div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Urgency</div>
                  <div className="text-sm capitalize">{problem.urgency}</div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Duration</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    {getDuration()}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Assigned To</div>
                  <div className="flex items-center gap-2 text-sm">
                    {problem.assignedToName ? (
                      <>
                        <User className="w-4 h-4" />
                        {problem.assignedToName}
                      </>
                    ) : (
                      <span className="italic text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Reported By</div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4" />
                    {problem.reportedByName || 'Unknown'}
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Created</div>
                  <div className="text-sm">{formatRelativeTime(problem.createdAt)}</div>
                </div>

                {problem.resolvedAt && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Resolved</div>
                      <div className="text-sm">{formatRelativeTime(problem.resolvedAt)}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Affected Services */}
          {problem.affectedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Affected Services</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {problem.affectedServices.map((service, index) => (
                      <div key={index} className="text-sm p-2 rounded bg-muted">
                        {service}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
