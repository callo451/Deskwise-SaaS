'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Play,
  Square,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActiveTimer {
  _id: string
  type: 'ticket' | 'project'
  ticketId?: string
  projectId?: string
  projectTaskId?: string
  startTime: Date
  description?: string
  elapsedMinutes: number
}

interface TimeEntry {
  _id: string
  type: 'ticket' | 'project'
  ticketId?: string
  ticketNumber?: string
  projectId?: string
  projectName?: string
  projectTaskId?: string
  projectTaskName?: string
  description: string
  hours: number
  minutes: number
  totalMinutes: number
  isBillable: boolean
  source: string
  createdAt: Date
}

interface TimeTrackingWidgetProps {
  type: 'ticket' | 'project'
  resourceId: string // ticket or project ID
  resourceName: string
  taskId?: string // optional project task ID
  taskName?: string
  onTimeLogged?: () => void
}

export function TimeTrackingWidget({
  type,
  resourceId,
  resourceName,
  taskId,
  taskName,
  onTimeLogged
}: TimeTrackingWidgetProps) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)

  // Manual entry form
  const [manualHours, setManualHours] = useState(0)
  const [manualMinutes, setManualMinutes] = useState(0)
  const [manualDescription, setManualDescription] = useState('')
  const [manualBillable, setManualBillable] = useState(true)

  // Timer form
  const [timerDescription, setTimerDescription] = useState('')

  useEffect(() => {
    loadActiveTimer()
    loadTimeEntries()

    // Poll for timer updates every 10 seconds
    const interval = setInterval(() => {
      if (activeTimer) {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 60000)
        setActiveTimer({ ...activeTimer, elapsedMinutes: elapsed })
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [type, resourceId])

  const loadActiveTimer = async () => {
    try {
      const response = await fetch('/api/time/timer')
      const data = await response.json()
      if (data.success && data.data) {
        // Check if the active timer matches our resource
        const timer = data.data
        if (
          (type === 'ticket' && timer.ticketId === resourceId) ||
          (type === 'project' && timer.projectId === resourceId && (!taskId || timer.projectTaskId === taskId))
        ) {
          setActiveTimer(timer)
        }
      }
    } catch (error) {
      console.error('Failed to load active timer:', error)
    }
  }

  const loadTimeEntries = async () => {
    try {
      const params = new URLSearchParams({
        type,
        [type === 'ticket' ? 'ticketId' : 'projectId']: resourceId,
        limit: '10'
      })
      if (taskId) {
        params.set('projectTaskId', taskId)
      }

      const response = await fetch(`/api/time/entries?${params}`)
      const data = await response.json()
      if (data.success) {
        setTimeEntries(data.data)
      }
    } catch (error) {
      console.error('Failed to load time entries:', error)
    }
  }

  const startTimer = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/time/timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          [type === 'ticket' ? 'ticketId' : 'projectId']: resourceId,
          ...(taskId && { projectTaskId: taskId }),
          description: timerDescription
        })
      })

      const data = await response.json()
      if (data.success) {
        setActiveTimer({ ...data.data, elapsedMinutes: 0 })
        setTimerDescription('')
      }
    } catch (error) {
      console.error('Failed to start timer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stopTimer = async (description: string, isBillable: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/time/timer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description || activeTimer?.description || 'Work on ' + resourceName,
          isBillable
        })
      })

      const data = await response.json()
      if (data.success) {
        setActiveTimer(null)
        loadTimeEntries()
        onTimeLogged?.()
      }
    } catch (error) {
      console.error('Failed to stop timer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const logManualTime = async () => {
    if (manualHours === 0 && manualMinutes === 0) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/time/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          [type === 'ticket' ? 'ticketId' : 'projectId']: resourceId,
          ...(taskId && { projectTaskId: taskId }),
          description: manualDescription || 'Work on ' + resourceName,
          hours: manualHours,
          minutes: manualMinutes,
          isBillable: manualBillable
        })
      })

      const data = await response.json()
      if (data.success) {
        setManualHours(0)
        setManualMinutes(0)
        setManualDescription('')
        setShowManualEntry(false)
        loadTimeEntries()
        onTimeLogged?.()
      }
    } catch (error) {
      console.error('Failed to log time:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Delete this time entry?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/time/entries/${entryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadTimeEntries()
        onTimeLogged?.()
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const totalMinutes = timeEntries.reduce((sum, entry) => sum + entry.totalMinutes, 0)

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Time Tracking</h3>
        </div>
        <Badge variant="outline">
          Total: {formatDuration(totalMinutes)}
        </Badge>
      </div>

      {/* Active Timer */}
      {activeTimer ? (
        <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-900">Timer Running</span>
              </div>
            </div>
            <span className="text-2xl font-mono font-bold text-blue-900">
              {formatDuration(activeTimer.elapsedMinutes)}
            </span>
          </div>

          {activeTimer.description && (
            <p className="text-sm text-blue-800">{activeTimer.description}</p>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => stopTimer(activeTimer.description || '', true)}
              disabled={isLoading}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop & Log
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await fetch('/api/time/timer', { method: 'DELETE' })
                setActiveTimer(null)
              }}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="What are you working on?"
            value={timerDescription}
            onChange={(e) => setTimerDescription(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            className="w-full"
            onClick={startTimer}
            disabled={isLoading}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Timer
          </Button>
        </div>
      )}

      {/* Manual Entry */}
      {showManualEntry ? (
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Log Time Manually</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowManualEntry(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Textarea
            placeholder="Description"
            value={manualDescription}
            onChange={(e) => setManualDescription(e.target.value)}
            rows={2}
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Hours</Label>
              <Input
                type="number"
                min="0"
                max="24"
                value={manualHours}
                onChange={(e) => setManualHours(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Minutes</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm">Billable</Label>
            <Switch
              checked={manualBillable}
              onCheckedChange={setManualBillable}
            />
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={logManualTime}
            disabled={isLoading || (manualHours === 0 && manualMinutes === 0)}
          >
            <Check className="h-4 w-4 mr-2" />
            Log Time
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => setShowManualEntry(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Time Manually
        </Button>
      )}

      {/* Time Entries */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-muted-foreground">Recent Entries</Label>
          <span className="text-xs text-muted-foreground">
            {timeEntries.length} entries
          </span>
        </div>

        <div className="space-y-1 max-h-[300px] overflow-y-auto">
          {timeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No time entries yet
            </div>
          ) : (
            timeEntries.map(entry => (
              <div
                key={entry._id}
                className="p-2 border rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-1">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                      {entry.isBillable && (
                        <Badge variant="outline" className="text-xs h-5">
                          Billable
                        </Badge>
                      )}
                      {entry.source === 'timer' && (
                        <Badge variant="outline" className="text-xs h-5">
                          Timer
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatDuration(entry.totalMinutes)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => deleteEntry(entry._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
