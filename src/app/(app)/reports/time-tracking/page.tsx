'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Clock, Download, TrendingUp, Users, DollarSign, BarChart } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TimeEntry {
  _id: string
  ticketId: string
  userId: string
  userName: string
  description: string
  startTime: string
  endTime?: string
  duration?: number
  isBillable: boolean
  isRunning: boolean
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
}

export default function TimeTrackingReportsPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [billableFilter, setBillableFilter] = useState<string>('all')

  useEffect(() => {
    fetchUsers()
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedUser, startDate, endDate, billableFilter])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (selectedUser !== 'all') params.append('userId', selectedUser)
      if (startDate) params.append('startDate', new Date(startDate).toISOString())
      if (endDate) params.append('endDate', new Date(endDate).toISOString())
      if (billableFilter !== 'all') params.append('isBillable', billableFilter)

      // Fetch entries
      const entriesResponse = await fetch(`/api/time-tracking/entries?${params.toString()}`)
      const entriesData = await entriesResponse.json()

      // Fetch stats
      const statsParams = new URLSearchParams()
      if (selectedUser !== 'all') statsParams.append('userId', selectedUser)
      if (startDate) statsParams.append('startDate', new Date(startDate).toISOString())
      if (endDate) statsParams.append('endDate', new Date(endDate).toISOString())

      const statsResponse = await fetch(`/api/time-tracking/stats?${statsParams.toString()}`)
      const statsData = await statsResponse.json()

      if (entriesData.success) {
        setEntries(entriesData.data)
      }
      if (statsData.success) {
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) {
      return `${mins}m`
    }
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Ticket ID', 'Description', 'Duration', 'Billable']
    const rows = entries.map(entry => [
      new Date(entry.startTime).toLocaleDateString(),
      entry.userName,
      entry.ticketId,
      entry.description,
      formatMinutes(entry.duration || 0),
      entry.isBillable ? 'Yes' : 'No'
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `time-tracking-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSelectedUser('all')
    setStartDate('')
    setEndDate('')
    setBillableFilter('all')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading time tracking data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Time Tracking Reports
          </h1>
          <p className="text-muted-foreground">
            Track time spent on tickets and analyze productivity
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={entries.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter time entries by user, date range, and billability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Billable</Label>
              <Select value={billableFilter} onValueChange={setBillableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Billable Only</SelectItem>
                  <SelectItem value="false">Non-Billable Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedUser !== 'all' || startDate || endDate || billableFilter !== 'all') && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMinutes(stats.totalTime)}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.ticketCount} {stats.ticketCount === 1 ? 'ticket' : 'tickets'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Billable Time</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMinutes(stats.billableTime)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTime > 0 ? Math.round((stats.billableTime / stats.totalTime) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Non-Billable</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{formatMinutes(stats.nonBillableTime)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalTime > 0 ? Math.round((stats.nonBillableTime / stats.totalTime) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg per Ticket</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMinutes(Math.round(stats.averagePerTicket))}</div>
              <p className="text-xs text-muted-foreground">
                Average time spent
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Time by User */}
      {stats && stats.byUser && stats.byUser.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Time by User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byUser.map((user: any) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{user.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.ticketCount} {user.ticketCount === 1 ? 'ticket' : 'tickets'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatMinutes(user.totalTime)}</p>
                    <p className="text-sm text-green-600">{formatMinutes(user.billableTime)} billable</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time by Category */}
      {stats && stats.byCategory && stats.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Time by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byCategory.map((category: any) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{category.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {category.ticketCount} {category.ticketCount === 1 ? 'ticket' : 'tickets'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatMinutes(category.totalTime)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No time entries found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or start tracking time on tickets
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">User</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-right p-4 font-medium">Duration</th>
                    <th className="text-center p-4 font-medium">Billable</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry._id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        {new Date(entry.startTime).toLocaleDateString()}
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.startTime).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="p-4">{entry.userName}</td>
                      <td className="p-4">
                        <p className="font-medium">{entry.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Ticket: {entry.ticketId}
                        </p>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatMinutes(entry.duration || 0)}
                      </td>
                      <td className="p-4 text-center">
                        {entry.isBillable ? (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded">
                            Billable
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded">
                            Non-Billable
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
