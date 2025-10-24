'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Search,
  Filter,
  MoreVertical,
  Play,
  Edit,
  Copy,
  Trash2,
  Calendar,
  Download,
  Plus,
  ArrowLeft,
  Clock,
} from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'

export default function ReportsLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const { data: response, loading, refetch } = useAnalytics('/api/analytics/reports')

  // Handle API response structure { success: true, data: [...] }
  const reports = response?.data || []

  const filteredReports = reports.filter((report: any) => {
    const matchesSearch =
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      filterCategory === 'all' || report.category === filterCategory

    return matchesSearch && matchesCategory
  })

  const categories = [
    { value: 'all', label: 'All Reports' },
    { value: 'service_desk', label: 'Service Desk' },
    { value: 'incidents', label: 'Incidents' },
    { value: 'changes', label: 'Change Management' },
    { value: 'problems', label: 'Problem Management' },
    { value: 'assets', label: 'Assets & Inventory' },
    { value: 'projects', label: 'Projects' },
    { value: 'knowledge', label: 'Knowledge Base' },
    { value: 'billing', label: 'Billing & Finance' },
    { value: 'users', label: 'Users & Teams' },
    { value: 'custom', label: 'Custom Reports' },
  ]

  const handleRunReport = async (reportId: string) => {
    // Navigate to report execution page
    window.location.href = `/analytics/reports/${reportId}/run`
  }

  const handleEditReport = (reportId: string) => {
    window.location.href = `/analytics/reports/builder?id=${reportId}`
  }

  const handleDuplicateReport = async (reportId: string) => {
    // API call to duplicate report
    await fetch(`/api/analytics/reports/${reportId}/duplicate`, {
      method: 'POST',
    })
    refetch()
  }

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      await fetch(`/api/analytics/reports/${reportId}`, {
        method: 'DELETE',
      })
      refetch()
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/analytics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports Library</h1>
            <p className="text-muted-foreground mt-1">
              Saved reports and custom analytics
            </p>
          </div>
        </div>

        <Link href="/analytics/reports/builder">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Report
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              {categories.find((c) => c.value === filterCategory)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.value}
                onClick={() => setFilterCategory(category.value)}
              >
                {category.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredReports && filteredReports.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report: any) => (
            <Card key={report._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {report.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {report.description || 'No description'}
                    </CardDescription>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRunReport(report._id)}>
                        <Play className="w-4 h-4 mr-2" />
                        Run Report
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditReport(report._id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateReport(report._id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteReport(report._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Category Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{report.category}</Badge>
                  {report.scheduled && (
                    <Badge variant="outline">
                      <Calendar className="w-3 h-3 mr-1" />
                      Scheduled
                    </Badge>
                  )}
                </div>

                {/* Metadata */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Last run: {report.lastRun ? formatDateTime(report.lastRun) : 'Never'}
                  </div>
                  {report.createdBy && (
                    <div className="flex items-center gap-2">
                      Created by {report.createdBy.name}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRunReport(report._id)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditReport(report._id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {searchQuery || filterCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first custom report'}
            </p>
            <Link href="/analytics/reports/builder">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Report
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
