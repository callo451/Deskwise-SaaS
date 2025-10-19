'use client'

import { useState, useEffect } from 'react'
import { TimeEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Play, Pause, Clock, Edit2, Trash2, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TimeTrackerProps {
  ticketId: string
}

export function TimeTracker({ ticketId }: TimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer form state
  const [timerDescription, setTimerDescription] = useState('')
  const [timerIsBillable, setTimerIsBillable] = useState(false)

  // Manual entry form state
  const [manualDialogOpen, setManualDialogOpen] = useState(false)
  const [manualDescription, setManualDescription] = useState('')
  const [manualHours, setManualHours] = useState(0)
  const [manualMinutes, setManualMinutes] = useState(0)
  const [manualIsBillable, setManualIsBillable] = useState(false)

  useEffect(() => {
    fetchTimeEntries()
  }, [ticketId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (activeTimer && activeTimer.isRunning) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeTimer])

  const fetchTimeEntries = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/time`)
      const data = await response.json()

      if (data.success) {
        setEntries(data.data)
        const running = data.data.find((e: TimeEntry) => e.isRunning)
        setActiveTimer(running || null)

        if (running) {
          const elapsed = Math.floor((Date.now() - new Date(running.startTime).getTime()) / 1000)
          setElapsedTime(elapsed)
        }
      }
    } catch (error) {
      console.error('Error fetching time entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTimer = async () => {
    if (!timerDescription.trim()) {
      alert('Please enter a description')
      return
    }

    try {
      const response = await fetch(`/api/tickets/${ticketId}/time/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: timerDescription,
          isBillable: timerIsBillable,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setActiveTimer(data.data)
        setElapsedTime(0)
        fetchTimeEntries()
        setTimerDescription('')
        setTimerIsBillable(false)
      } else {
        alert(data.error || 'Failed to start timer')
      }
    } catch (error) {
      console.error('Error starting timer:', error)
      alert('Failed to start timer')
    }
  }

  const stopTimer = async () => {
    if (!activeTimer) return

    try {
      const response = await fetch(`/api/tickets/${ticketId}/time/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: activeTimer._id.toString() }),
      })

      const data = await response.json()

      if (data.success) {
        setActiveTimer(null)
        setElapsedTime(0)
        fetchTimeEntries()
      } else {
        alert(data.error || 'Failed to stop timer')
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
      alert('Failed to stop timer')
    }
  }

  const logManualTime = async () => {
    if (!manualDescription.trim()) {
      alert('Please enter a description')
      return
    }

    const totalMinutes = manualHours * 60 + manualMinutes

    if (totalMinutes <= 0) {
      alert('Please enter a valid duration')
      return
    }

    try {
      const response = await fetch(`/api/tickets/${ticketId}/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: manualDescription,
          duration: totalMinutes,
          isBillable: manualIsBillable,
        }),
      })

      const data = await response.json()

      if (data.success) {
        fetchTimeEntries()
        setManualDialogOpen(false)
        setManualDescription('')
        setManualHours(0)
        setManualMinutes(0)
        setManualIsBillable(false)
      } else {
        alert(data.error || 'Failed to log time')
      }
    } catch (error) {
      console.error('Error logging time:', error)
      alert('Failed to log time')
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return

    try {
      const response = await fetch(`/api/tickets/${ticketId}/time/${entryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchTimeEntries()
      } else {
        alert(data.error || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry')
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins}m`
    }
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const calculateTotalTime = () => {
    const completed = entries.filter(e => e.duration).reduce((sum, e) => sum + (e.duration || 0), 0)
    return completed
  }

  const calculateBillableTime = () => {
    return entries
      .filter(e => e.duration && e.isBillable)
      .reduce((sum, e) => sum + (e.duration || 0), 0)
  }

  if (loading) {
    return <div>Loading time entries...</div>
  }

  const totalMinutes = calculateTotalTime()
  const billableMinutes = calculateBillableTime()

  return (
    <div className="space-y-6">
      {/* Timer Widget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracker
          </CardTitle>
          <CardDescription>Track time spent on this ticket</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTimer ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Timer Running
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {formatDuration(elapsedTime)}
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  {activeTimer.description}
                </p>
                {activeTimer.isBillable && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                    Billable
                  </span>
                )}
                <Button
                  onClick={stopTimer}
                  className="w-full mt-4"
                  variant="destructive"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Timer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="timer-description">Description</Label>
                <Input
                  id="timer-description"
                  placeholder="What are you working on?"
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') startTimer()
                  }}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timer-billable"
                  checked={timerIsBillable}
                  onCheckedChange={(checked) => setTimerIsBillable(checked === true)}
                />
                <Label htmlFor="timer-billable" className="cursor-pointer">
                  Billable
                </Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={startTimer} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
                <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Time
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Time Manually</DialogTitle>
                      <DialogDescription>
                        Add a time entry without using a timer
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="manual-description">Description</Label>
                        <Input
                          id="manual-description"
                          placeholder="What did you work on?"
                          value={manualDescription}
                          onChange={(e) => setManualDescription(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="manual-hours">Hours</Label>
                          <Input
                            id="manual-hours"
                            type="number"
                            min="0"
                            value={manualHours}
                            onChange={(e) => setManualHours(parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="manual-minutes">Minutes</Label>
                          <Input
                            id="manual-minutes"
                            type="number"
                            min="0"
                            max="59"
                            value={manualMinutes}
                            onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="manual-billable"
                          checked={manualIsBillable}
                          onCheckedChange={(checked) => setManualIsBillable(checked === true)}
                        />
                        <Label htmlFor="manual-billable" className="cursor-pointer">
                          Billable
                        </Label>
                      </div>
                      <Button onClick={logManualTime} className="w-full">
                        Log Time
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Time Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold">{formatMinutes(totalMinutes)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billable</p>
              <p className="text-2xl font-bold text-green-600">{formatMinutes(billableMinutes)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Non-Billable</p>
              <p className="text-2xl font-bold text-gray-600">{formatMinutes(totalMinutes - billableMinutes)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No time entries yet. Start a timer or log time manually.
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div
                  key={entry._id.toString()}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{entry.description}</p>
                      {entry.isBillable && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                          Billable
                        </span>
                      )}
                      {entry.isRunning && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded flex items-center gap-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          Running
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-x-3">
                      <span>{entry.userName}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(entry.startTime), { addSuffix: true })}</span>
                      {entry.duration && (
                        <>
                          <span>•</span>
                          <span className="font-medium">{formatMinutes(entry.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!entry.isRunning && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEntry(entry._id.toString())}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
