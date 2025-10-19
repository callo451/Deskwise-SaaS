'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface ChangeRequest {
  _id: string
  changeNumber: string
  title: string
  description: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'implementing' | 'completed' | 'cancelled'
  risk: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  category: string
  plannedStartDate: string
  plannedEndDate: string
  createdAt: string
  updatedAt: string
}

export default function ChangesPage() {
  const { data: session } = useSession()
  const [changes, setChanges] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')

  useEffect(() => {
    fetchChanges()
  }, [statusFilter, riskFilter])

  const fetchChanges = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (riskFilter !== 'all') params.set('risk', riskFilter)
      if (search) params.set('search', search)

      const response = await fetch(`/api/change-requests?${params}`)
      const data = await response.json()

      if (data.success) {
        setChanges(data.data)
      }
    } catch (error) {
      console.error('Error fetching changes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchChanges()
  }

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'warning',
      high: 'destructive',
    }
    return <Badge variant={variants[risk]}>{risk} risk</Badge>
  }

  const getImpactBadge = (impact: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'warning',
      high: 'destructive',
    }
    return <Badge variant={variants[impact]}>{impact} impact</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      pending_approval: 'warning',
      approved: 'success',
      rejected: 'destructive',
      scheduled: 'default',
      implementing: 'default',
      completed: 'success',
      cancelled: 'secondary',
    }
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      scheduled: 'Scheduled',
      implementing: 'Implementing',
      completed: 'Completed',
      cancelled: 'Cancelled',
    }
    return <Badge variant={variants[status]}>{labels[status]}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Change Management</h1>
          <p className="text-muted-foreground">
            Manage IT changes and approval workflows
          </p>
        </div>
        <Link href="/changes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Change Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search changes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="implementing">Implementing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Changes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Change Requests</CardTitle>
          <CardDescription>
            {changes.length} {changes.length === 1 ? 'change' : 'changes'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Change #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Planned Start</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : changes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <div className="py-8">
                      <p className="text-muted-foreground mb-4">
                        No change requests found
                      </p>
                      <Link href="/changes/new">
                        <Button variant="outline">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Change Request
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                changes.map((change) => (
                  <TableRow key={change._id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/changes/${change._id}`} className="hover:underline">
                        {change.changeNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/changes/${change._id}`}>
                        {change.title}
                      </Link>
                    </TableCell>
                    <TableCell>{getStatusBadge(change.status)}</TableCell>
                    <TableCell>{getRiskBadge(change.risk)}</TableCell>
                    <TableCell>{getImpactBadge(change.impact)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(change.plannedStartDate)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
