'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Database,
  Filter,
  Eye,
  Save,
  ArrowLeft,
  Plus,
  X,
  Calendar,
  BarChart3,
  Table as TableIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ReportBuilderPage() {
  const router = useRouter()
  const [reportName, setReportName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [dataSources, setDataSources] = useState<string[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [filters, setFilters] = useState<any[]>([])
  const [chartType, setChartType] = useState('table')
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [schedule, setSchedule] = useState<any>(null)

  const availableDataSources = [
    { value: 'tickets', label: 'Tickets', icon: '🎫' },
    { value: 'incidents', label: 'Incidents', icon: '🚨' },
    { value: 'assets', label: 'Assets', icon: '💻' },
    { value: 'projects', label: 'Projects', icon: '📁' },
    { value: 'users', label: 'Users', icon: '👤' },
  ]

  const dataSourceFields: Record<string, string[]> = {
    tickets: ['ID', 'Title', 'Status', 'Priority', 'Category', 'Assignee', 'Created Date', 'Resolved Date'],
    incidents: ['ID', 'Title', 'Severity', 'Impact', 'Status', 'Created Date', 'Resolved Date'],
    assets: ['ID', 'Name', 'Type', 'Status', 'Location', 'Value', 'Warranty Expiry'],
    projects: ['ID', 'Name', 'Status', 'Budget', 'Progress', 'Start Date', 'Due Date'],
    users: ['ID', 'Name', 'Email', 'Role', 'Department', 'Created Date'],
  }

  const handleDataSourceToggle = (source: string) => {
    setDataSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    )
  }

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    )
  }

  const handleAddFilter = () => {
    setFilters([
      ...filters,
      { field: '', operator: 'equals', value: '' },
    ])
  }

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const handleSaveReport = async () => {
    if (!reportName) {
      toast.error('Please enter a report name')
      return
    }

    if (dataSources.length === 0) {
      toast.error('Please select at least one data source')
      return
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field')
      return
    }

    try {
      const response = await fetch('/api/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          description,
          category,
          dataSources,
          fields: selectedFields,
          filters,
          chartType,
          schedule,
        }),
      })

      if (!response.ok) throw new Error('Failed to save report')

      toast.success('Report saved successfully')
      router.push('/analytics/reports/library')
    } catch (error) {
      toast.error('Failed to save report')
    }
  }

  const availableFields = dataSources.flatMap((source) =>
    dataSourceFields[source]?.map((field) => `${source}.${field}`) || []
  )

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/analytics/reports/library">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Report Builder</h1>
            <p className="text-muted-foreground mt-1">
              Create custom reports with visual query builder
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button size="sm" onClick={() => setShowSaveDialog(true)}>
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Panel: Data Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Sources
            </CardTitle>
            <CardDescription>Select data sources to include</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableDataSources.map((source) => (
              <div key={source.value} className="flex items-center space-x-2">
                <Checkbox
                  id={source.value}
                  checked={dataSources.includes(source.value)}
                  onCheckedChange={() => handleDataSourceToggle(source.value)}
                />
                <label
                  htmlFor={source.value}
                  className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <span>{source.icon}</span>
                  {source.label}
                </label>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label>Available Fields</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                {availableFields.length > 0 ? (
                  availableFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={selectedFields.includes(field)}
                        onCheckedChange={() => handleFieldToggle(field)}
                      />
                      <label
                        htmlFor={field}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {field}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Select a data source to see available fields
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Middle Panel: Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>Add conditions to filter results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filters.map((filter, index) => (
              <div key={index} className="space-y-2 p-3 border rounded-md">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Filter {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleRemoveFilter(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                <Select
                  value={filter.field}
                  onValueChange={(value) => {
                    const newFilters = [...filters]
                    newFilters[index].field = value
                    setFilters(newFilters)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filter.operator}
                  onValueChange={(value) => {
                    const newFilters = [...filters]
                    newFilters[index].operator = value
                    setFilters(newFilters)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="notEquals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greaterThan">Greater Than</SelectItem>
                    <SelectItem value="lessThan">Less Than</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Value"
                  value={filter.value}
                  onChange={(e) => {
                    const newFilters = [...filters]
                    newFilters[index].value = e.target.value
                    setFilters(newFilters)
                  }}
                />
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddFilter}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Filter
            </Button>
          </CardContent>
        </Card>

        {/* Right Panel: Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Visualization
            </CardTitle>
            <CardDescription>Choose how to display results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4" />
                      Table
                    </div>
                  </SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="gauge">Gauge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Selected Fields</Label>
              <div className="flex flex-wrap gap-2">
                {selectedFields.length > 0 ? (
                  selectedFields.map((field) => (
                    <Badge key={field} variant="secondary">
                      {field}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No fields selected
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Active Filters</Label>
              <div className="text-sm text-muted-foreground">
                {filters.length} filter(s) applied
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Report</DialogTitle>
            <DialogDescription>
              Give your report a name and configure scheduling options
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name *</Label>
              <Input
                id="name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="My Custom Report"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this report shows..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="tickets">Tickets</SelectItem>
                  <SelectItem value="incidents">Incidents</SelectItem>
                  <SelectItem value="assets">Assets</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveReport}>
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
