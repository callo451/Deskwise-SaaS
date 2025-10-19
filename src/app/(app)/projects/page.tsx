'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Project {
  _id: string
  projectNumber: string
  name: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  progress: number
  startDate: string
  endDate: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchProjects()
  }, [statusFilter])

  const fetchProjects = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/projects?${params}`)
      const data = await response.json()

      if (data.success) {
        setProjects(data.data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      planning: 'secondary',
      active: 'default',
      on_hold: 'warning',
      completed: 'success',
      cancelled: 'destructive',
    }
    return <Badge variant={variants[status]}>{status.replace('_', ' ')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage project tasks and milestones</p>
        </div>
        <Link href="/projects/new">
          <Button><Plus className="w-4 h-4 mr-2" />New Project</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
          <CardDescription>{projects.length} projects found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
              ) : projects.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><p className="text-muted-foreground mb-4">No projects found</p><Link href="/projects/new"><Button variant="outline"><Plus className="w-4 h-4 mr-2" />Create Your First Project</Button></Link></TableCell></TableRow>
              ) : (
                projects.map((project) => (
                  <TableRow key={project._id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium"><Link href={`/dashboard/projects/${project._id}`} className="hover:underline">{project.projectNumber}</Link></TableCell>
                    <TableCell><Link href={`/dashboard/projects/${project._id}`}>{project.name}</Link></TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="w-24 h-2 bg-secondary rounded-full"><div className="h-full bg-primary rounded-full" style={{width: `${project.progress}%`}} /></div><span className="text-sm text-muted-foreground">{project.progress}%</span></div></TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeTime(project.endDate)}</TableCell>
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
