'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import {
  Play,
  Square,
  Plus,
  Trash2,
  Loader2,
  Clock,
  DollarSign,
  Timer,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { UnifiedTicketTimeEntry, ActiveTimer } from '@/lib/types'

interface TimeTrackingTabProps {
  ticketId: string
  currentUserId?: string
}

export function TimeTrackingTab({ ticketId, currentUserId }: TimeTrackingTabProps) {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<UnifiedTicketTimeEntry[]>([])
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Timer form
  const [timerDescription, setTimerDescription] = useState('')
  const [timerBillable, setTimerBillable] = useState(true)

  // Manual entry form
  const [manualHours, setManualHours] = useState('')
  const [manualMinutes, setManualMinutes] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualBillable, setManualBillable] = useState(true)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchTimeEntries()
    checkActiveTimer()
  }, [ticketId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (activeTimer) {
      interval = setInterval(() => {
        const now = new Date().getTime()
        const start = new Date(activeTimer.startTime).getTime()
        const elapsed = Math.floor((now - start) / 1000) // seconds
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTimer])

  const fetchTimeEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/unified-tickets/${ticketId}/time`)
      const data = await response.json()

      if (data.success) {
        setEntries(data.entries || [])
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to load time entries',
        })
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load time entries',
      })
    } finally {
      setLoading(false)
    }
  }

  const checkActiveTimer = async () => {
    try {
      const response = await fetch(`/api/unified-tickets/${ticketId}/time/active`)
      const data = await response.json()

      if (data.success && data.activeTimer) {
        setActiveTimer(data.activeTimer)
        setTimerDescription(data.activeTimer.description || '')
      }
    } catch (error) {
      console.error('Error checking active timer:', error)
    }
  }

  const handleStartTimer = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/unified-tickets/${ticketId}/time/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: timerDescription,
          isBillable: timerBillable,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setActiveTimer(data.timer)
        toast({
          title: 'Timer started',
          description: 'Time tracking has begun',
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to start timer',
        })
      }
    } catch (error) {
      console.error('Error starting timer:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start timer',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleStopTimer = async () => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/unified-tickets/${ticketId}/time/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.success) {
        setActiveTimer(null)
        setElapsedTime(0)
        setTimerDescription('')
        toast({
          title: 'Timer stopped',
          description: `Time logged: ${data.entry.hours}h ${data.entry.minutes}m`,
        })
        fetchTimeEntries()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to stop timer',
        })
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to stop timer',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleManualEntry = async () => {
    const hours = parseInt(manualHours) || 0
    const minutes = parseInt(manualMinutes) || 0

    if (hours === 0 && minutes === 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid time',
        description: 'Please enter a valid time duration',
      })
      return
    }

    if (!manualDescription.trim()) {
      toast({
        variant: 'destructive',
        title: 'Description required',
        description: 'Please enter a description for this time entry',
      })
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/unified-tickets/${ticketId}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours,
          minutes,
          description: manualDescription,
          isBillable: manualBillable,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setManualHours('')
        setManualMinutes('')
        setManualDescription('')
        toast({
          title: 'Time entry added',
          description: `${hours}h ${minutes}m logged successfully`,
        })
        fetchTimeEntries()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to add time entry',
        })
      }
    } catch (error) {
      console.error('Error adding time entry:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add time entry',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/unified-tickets/${ticketId}/time`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entryToDelete }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Entry deleted',
          description: 'Time entry has been removed',
        })
        fetchTimeEntries()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to delete entry',
        })
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete entry',
      })
    } finally {
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const calculateStats = () => {
    const total = entries.reduce((acc, entry) => acc + entry.hours * 60 + entry.minutes, 0)
    const billable = entries
      .filter((e) => e.isBillable)
      .reduce((acc, entry) => acc + entry.hours * 60 + entry.minutes, 0)
    const nonBillable = total - billable

    return {
      totalHours: Math.floor(total / 60),
      totalMinutes: total % 60,
      billableHours: Math.floor(billable / 60),
      billableMinutes: billable % 60,
      nonBillableHours: Math.floor(nonBillable / 60),
      nonBillableMinutes: nonBillable % 60,
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-2xl font-bold">
                  {stats.totalHours}h {stats.totalMinutes}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-3">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Billable</p>
                <p className="text-2xl font-bold">
                  {stats.billableHours}h {stats.billableMinutes}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/10 p-3">
                <Timer className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Non-Billable</p>
                <p className="text-2xl font-bold">
                  {stats.nonBillableHours}h {stats.nonBillableMinutes}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timer Section */}
      <Card
        className={cn(
          'transition-all',
          activeTimer && 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30'
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Timer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTimer ? (
            <>
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg px-8 py-6 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-muted-foreground">Recording</span>
                  </div>
                  <p className="text-5xl font-mono font-bold tabular-nums">
                    {formatTime(elapsedTime)}
                  </p>
                </div>
                {timerDescription && (
                  <p className="mt-4 text-sm text-muted-foreground">{timerDescription}</p>
                )}
              </div>
              <div className="flex justify-center">
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleStopTimer}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Square className="h-5 w-5 mr-2" />
                  )}
                  Stop Timer
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timer-description">Description (Optional)</Label>
                  <Textarea
                    id="timer-description"
                    placeholder="What are you working on?"
                    value={timerDescription}
                    onChange={(e) => setTimerDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="timer-billable" className="cursor-pointer">
                    Billable Time
                  </Label>
                  <Switch
                    id="timer-billable"
                    checked={timerBillable}
                    onCheckedChange={setTimerBillable}
                  />
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleStartTimer}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Play className="h-5 w-5 mr-2" />
                )}
                Start Timer
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Manual Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manual-hours">Hours</Label>
              <Input
                id="manual-hours"
                type="number"
                min="0"
                placeholder="0"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-minutes">Minutes</Label>
              <Input
                id="manual-minutes"
                type="number"
                min="0"
                max="59"
                placeholder="0"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-description">Description</Label>
            <Textarea
              id="manual-description"
              placeholder="Describe the work performed..."
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="manual-billable" className="cursor-pointer">
              Billable Time
            </Label>
            <Switch
              id="manual-billable"
              checked={manualBillable}
              onCheckedChange={setManualBillable}
            />
          </div>

          <Button className="w-full" onClick={handleManualEntry} disabled={actionLoading}>
            {actionLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            Add Time Entry
          </Button>
        </CardContent>
      </Card>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No time entries yet</p>
              <p className="text-sm mt-1">Start the timer or add a manual entry to begin tracking time</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                <div className="col-span-2">User</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Date</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Table Rows */}
              {entries.map((entry, index) => (
                <div
                  key={entry._id.toString()}
                  className={cn(
                    'grid grid-cols-12 gap-4 py-3 items-center text-sm hover:bg-muted/50 rounded-lg px-2',
                    index % 2 === 0 && 'bg-muted/20'
                  )}
                >
                  <div className="col-span-2 font-medium">{entry.userName}</div>
                  <div className="col-span-4 text-muted-foreground">
                    {entry.description || '-'}
                  </div>
                  <div className="col-span-2 font-mono font-medium">
                    {entry.hours}h {entry.minutes}m
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant={entry.isBillable ? 'default' : 'secondary'}
                      className={cn(
                        entry.isBillable
                          ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
                          : ''
                      )}
                    >
                      {entry.isBillable ? 'Billable' : 'Non-Billable'}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(entry.createdAt), {
                      addSuffix: false,
                    })}
                  </div>
                  <div className="col-span-1">
                    {(currentUserId === entry.userId || session?.user?.role === 'admin') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEntryToDelete(entry._id.toString())
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Time Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
