'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface ScheduleItem {
  _id: string
  title: string
  type: string
  status: string
  assignedTo: string
  startTime: string
  endTime: string
  location?: string
}

export default function SchedulingPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    fetchSchedule()
  }, [selectedDate])

  const fetchSchedule = async () => {
    try {
      const startDate = new Date(selectedDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(selectedDate)
      endDate.setHours(23, 59, 59, 999)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const response = await fetch(`/api/schedule/by-date?${params}`)
      const data = await response.json()

      if (data.success) {
        setItems(data.data)
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      onsite: 'default',
      remote: 'secondary',
      meeting: 'warning',
      maintenance: 'destructive',
    }
    return <Badge variant={variants[type]}>{type}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      scheduled: 'secondary',
      in_progress: 'default',
      completed: 'success',
      cancelled: 'destructive',
    }
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduling</h1>
          <p className="text-muted-foreground">Manage technician appointments and calendar</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" />New Appointment</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>{items.length} appointments scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : items.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No appointments scheduled for today</p>
            ) : (
              items.map((item) => (
                <div key={item._id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      {getTypeBadge(item.type)}
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{formatDateTime(item.startTime)} - {new Date(item.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    {item.location && <p className="text-sm text-muted-foreground">📍 {item.location}</p>}
                  </div>
                  <p className="text-sm text-muted-foreground">Assigned to: User {item.assignedTo}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
