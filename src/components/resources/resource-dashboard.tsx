'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Plus,
  Filter,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamMember {
  userId: string
  userName: string
  utilizationRate: number
  allocatedHours: number
  availableHours: number
  status: 'overallocated' | 'optimal' | 'underutilized'
  currentAllocations: number
}

interface ResourceAllocation {
  _id: string
  userId: string
  userName: string
  projectId: string
  projectName: string
  taskName?: string
  allocatedHours: number
  startDate: Date
  endDate: Date
  allocationPercentage: number
  role?: string
  status: string
}

interface TeamWorkload {
  totalMembers: number
  activeAllocations: number
  averageUtilization: number
  overallocatedMembers: number
  underutilizedMembers: number
  members: TeamMember[]
}

interface ResourceDashboardProps {
  orgId?: string
  onAllocationCreate?: () => void
}

export function ResourceDashboard({ orgId, onAllocationCreate }: ResourceDashboardProps) {
  const [workload, setWorkload] = useState<TeamWorkload | null>(null)
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterUser, setFilterUser] = useState<string>('all')

  useEffect(() => {
    loadWorkloadData()
    loadAllocations()
  }, [selectedWeek])

  const loadWorkloadData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        weekStart: selectedWeek.toISOString()
      })
      const response = await fetch(`/api/resources/team-workload?${params}`)
      const data = await response.json()

      if (data.success) {
        setWorkload(data.data)
      }
    } catch (error) {
      console.error('Failed to load workload data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllocations = async () => {
    try {
      const response = await fetch('/api/resources/allocations')
      const data = await response.json()

      if (data.success) {
        setAllocations(data.data.map((a: any) => ({
          ...a,
          startDate: new Date(a.startDate),
          endDate: new Date(a.endDate)
        })))
      }
    } catch (error) {
      console.error('Failed to load allocations:', error)
    }
  }

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'overallocated':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'optimal':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'underutilized':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  const getStatusIcon = (status: TeamMember['status']) => {
    switch (status) {
      case 'overallocated':
        return <AlertTriangle className="h-4 w-4" />
      case 'optimal':
        return <CheckCircle2 className="h-4 w-4" />
      case 'underutilized':
        return <TrendingDown className="h-4 w-4" />
    }
  }

  const getUtilizationColor = (rate: number) => {
    if (rate > 100) return 'text-red-600'
    if (rate >= 70) return 'text-green-600'
    return 'text-yellow-600'
  }

  const handlePrevWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(newDate.getDate() - 7)
    setSelectedWeek(newDate)
  }

  const handleNextWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(newDate.getDate() + 7)
    setSelectedWeek(newDate)
  }

  const handleThisWeek = () => {
    setSelectedWeek(new Date())
  }

  const getWeekRange = () => {
    const start = new Date(selectedWeek)
    const end = new Date(selectedWeek)
    end.setDate(end.getDate() + 6)
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  // Filter allocations
  const filteredAllocations = allocations.filter(allocation => {
    if (filterStatus !== 'all' && allocation.status !== filterStatus) return false
    if (filterUser !== 'all' && allocation.userId !== filterUser) return false
    return true
  })

  const uniqueUsers = Array.from(new Set(allocations.map(a => a.userName)))

  if (isLoading || !workload) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Loading resource dashboard...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resource Management</h2>
          <p className="text-sm text-muted-foreground">
            Team workload and capacity planning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={onAllocationCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Allocation
          </Button>
        </div>
      </div>

      {/* Week Selector */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevWeek}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={handleThisWeek}>
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextWeek}>
              Next
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{getWeekRange()}</span>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workload.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {workload.activeAllocations} active allocations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', getUtilizationColor(workload.averageUtilization))}>
              {workload.averageUtilization.toFixed(0)}%
            </div>
            <Progress value={workload.averageUtilization} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overallocated</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {workload.overallocatedMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              {((workload.overallocatedMembers / workload.totalMembers) * 100).toFixed(0)}% of team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Underutilized</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {workload.underutilizedMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              {((workload.underutilizedMembers / workload.totalMembers) * 100).toFixed(0)}% of team
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Capacity */}
      <Card>
        <CardHeader>
          <CardTitle>Team Capacity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workload.members.map((member) => (
              <div key={member.userId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.userName}</span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getStatusColor(member.status))}
                        >
                          {getStatusIcon(member.status)}
                          <span className="ml-1 capitalize">{member.status}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {member.currentAllocations} allocations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-lg font-bold', getUtilizationColor(member.utilizationRate))}>
                      {member.utilizationRate.toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.allocatedHours}h / {member.availableHours}h
                    </p>
                  </div>
                </div>
                <Progress
                  value={Math.min(member.utilizationRate, 100)}
                  className={cn(
                    'h-2',
                    member.utilizationRate > 100 && '[&>div]:bg-red-500',
                    member.utilizationRate >= 70 && member.utilizationRate <= 100 && '[&>div]:bg-green-500',
                    member.utilizationRate < 70 && '[&>div]:bg-yellow-500'
                  )}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Allocations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Allocations</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-[140px] h-9">
                  <Users className="h-3 w-3 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user || 'unknown'}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAllocations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No allocations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAllocations.map((allocation) => (
                <Card key={allocation._id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{allocation.userName}</span>
                        <Badge variant="outline" className="text-xs">
                          {allocation.role || 'Team Member'}
                        </Badge>
                        <Badge
                          variant={
                            allocation.status === 'active' ? 'default' :
                            allocation.status === 'completed' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {allocation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mb-2">
                        {allocation.projectName}
                        {allocation.taskName && ` - ${allocation.taskName}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {allocation.startDate.toLocaleDateString()} - {allocation.endDate.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {allocation.allocatedHours}h ({allocation.allocationPercentage}%)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capacity Planning Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900">Capacity Planning Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Optimal utilization is between 70-100% for maximum efficiency</li>
                <li>Over-allocation (&gt;100%) indicates potential burnout risk</li>
                <li>Under-utilization (&lt;70%) suggests available capacity for new work</li>
                <li>Review allocations weekly to maintain team balance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
