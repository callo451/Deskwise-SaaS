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
  Loader2,
  FileText,
  FileSpreadsheet,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useExport } from '@/hooks/use-export'

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
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [schedule, setSchedule] = useState<any>(null)
  const { exportData, exporting } = useExport()

  const availableDataSources = [
    { value: 'unified_tickets', label: 'Service Desk Tickets', icon: '🎫', description: 'Unified ticketing system (incidents, requests, changes, problems)' },
    { value: 'incidents', label: 'Incidents', icon: '🚨', description: 'IT incidents and service disruptions' },
    { value: 'changes', label: 'Change Requests', icon: '🔄', description: 'Change management and approvals' },
    { value: 'problems', label: 'Problem Records', icon: '🔍', description: 'Root cause analysis and problem management' },
    { value: 'assets', label: 'Assets & Inventory', icon: '💻', description: 'Hardware and software asset tracking' },
    { value: 'projects', label: 'Projects', icon: '📁', description: 'Project management and tracking' },
    { value: 'knowledge', label: 'Knowledge Base', icon: '📚', description: 'Knowledge articles and documentation' },
    { value: 'users', label: 'Users & Teams', icon: '👤', description: 'User accounts and team members' },
    { value: 'clients', label: 'Clients & Organizations', icon: '🏢', description: 'Client companies and contacts' },
    { value: 'billing', label: 'Billing & Invoices', icon: '💰', description: 'Financial transactions and invoices' },
    { value: 'quotes', label: 'Quotes & Estimates', icon: '📄', description: 'Service quotes and proposals' },
  ]

  const dataSourceFields: Record<string, { field: string; label: string; type: 'string' | 'number' | 'date' | 'boolean' }[]> = {
    unified_tickets: [
      { field: 'ticketNumber', label: 'Ticket Number', type: 'string' },
      { field: 'title', label: 'Title', type: 'string' },
      { field: 'ticketType', label: 'Type', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'priority', label: 'Priority', type: 'string' },
      { field: 'category', label: 'Category', type: 'string' },
      { field: 'subcategory', label: 'Subcategory', type: 'string' },
      { field: 'assignedTo', label: 'Assigned To', type: 'string' },
      { field: 'assignedTeam', label: 'Assigned Team', type: 'string' },
      { field: 'requesterId', label: 'Requester', type: 'string' },
      { field: 'clientId', label: 'Client', type: 'string' },
      { field: 'createdAt', label: 'Created Date', type: 'date' },
      { field: 'updatedAt', label: 'Last Updated', type: 'date' },
      { field: 'resolvedAt', label: 'Resolved Date', type: 'date' },
      { field: 'closedAt', label: 'Closed Date', type: 'date' },
      { field: 'slaStatus', label: 'SLA Status', type: 'string' },
      { field: 'timeToResolve', label: 'Time to Resolve (hours)', type: 'number' },
    ],
    incidents: [
      { field: 'incidentNumber', label: 'Incident Number', type: 'string' },
      { field: 'title', label: 'Title', type: 'string' },
      { field: 'severity', label: 'Severity', type: 'string' },
      { field: 'impact', label: 'Business Impact', type: 'string' },
      { field: 'urgency', label: 'Urgency', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'category', label: 'Category', type: 'string' },
      { field: 'assignedTo', label: 'Assigned To', type: 'string' },
      { field: 'reportedBy', label: 'Reported By', type: 'string' },
      { field: 'affectedUsers', label: 'Affected Users', type: 'number' },
      { field: 'createdAt', label: 'Reported Date', type: 'date' },
      { field: 'resolvedAt', label: 'Resolved Date', type: 'date' },
      { field: 'mttr', label: 'Mean Time to Resolve (hours)', type: 'number' },
    ],
    changes: [
      { field: 'changeNumber', label: 'Change Number', type: 'string' },
      { field: 'title', label: 'Title', type: 'string' },
      { field: 'changeType', label: 'Change Type', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'priority', label: 'Priority', type: 'string' },
      { field: 'risk', label: 'Risk Level', type: 'string' },
      { field: 'requestedBy', label: 'Requested By', type: 'string' },
      { field: 'approver', label: 'Approver', type: 'string' },
      { field: 'implementer', label: 'Implementer', type: 'string' },
      { field: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
      { field: 'implementedDate', label: 'Implemented Date', type: 'date' },
      { field: 'isApproved', label: 'Approved', type: 'boolean' },
    ],
    problems: [
      { field: 'problemNumber', label: 'Problem Number', type: 'string' },
      { field: 'title', label: 'Title', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'priority', label: 'Priority', type: 'string' },
      { field: 'category', label: 'Category', type: 'string' },
      { field: 'rootCause', label: 'Root Cause', type: 'string' },
      { field: 'assignedTo', label: 'Assigned To', type: 'string' },
      { field: 'relatedIncidents', label: 'Related Incidents', type: 'number' },
      { field: 'createdAt', label: 'Created Date', type: 'date' },
      { field: 'resolvedAt', label: 'Resolved Date', type: 'date' },
    ],
    assets: [
      { field: 'assetTag', label: 'Asset Tag', type: 'string' },
      { field: 'name', label: 'Asset Name', type: 'string' },
      { field: 'type', label: 'Asset Type', type: 'string' },
      { field: 'category', label: 'Category', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'manufacturer', label: 'Manufacturer', type: 'string' },
      { field: 'model', label: 'Model', type: 'string' },
      { field: 'serialNumber', label: 'Serial Number', type: 'string' },
      { field: 'location', label: 'Location', type: 'string' },
      { field: 'assignedTo', label: 'Assigned To', type: 'string' },
      { field: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { field: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
      { field: 'purchaseCost', label: 'Purchase Cost', type: 'number' },
      { field: 'currentValue', label: 'Current Value', type: 'number' },
    ],
    projects: [
      { field: 'projectNumber', label: 'Project Number', type: 'string' },
      { field: 'name', label: 'Project Name', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'health', label: 'Health Status', type: 'string' },
      { field: 'projectManager', label: 'Project Manager', type: 'string' },
      { field: 'clientId', label: 'Client', type: 'string' },
      { field: 'budget', label: 'Budget', type: 'number' },
      { field: 'actualCost', label: 'Actual Cost', type: 'number' },
      { field: 'progress', label: 'Progress %', type: 'number' },
      { field: 'startDate', label: 'Start Date', type: 'date' },
      { field: 'endDate', label: 'End Date', type: 'date' },
      { field: 'completedDate', label: 'Completed Date', type: 'date' },
    ],
    knowledge: [
      { field: 'articleId', label: 'Article ID', type: 'string' },
      { field: 'title', label: 'Title', type: 'string' },
      { field: 'category', label: 'Category', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'visibility', label: 'Visibility', type: 'string' },
      { field: 'author', label: 'Author', type: 'string' },
      { field: 'views', label: 'Views', type: 'number' },
      { field: 'helpfulVotes', label: 'Helpful Votes', type: 'number' },
      { field: 'createdAt', label: 'Created Date', type: 'date' },
      { field: 'updatedAt', label: 'Last Updated', type: 'date' },
      { field: 'publishedAt', label: 'Published Date', type: 'date' },
    ],
    users: [
      { field: 'userId', label: 'User ID', type: 'string' },
      { field: 'name', label: 'Full Name', type: 'string' },
      { field: 'email', label: 'Email Address', type: 'string' },
      { field: 'role', label: 'Role', type: 'string' },
      { field: 'department', label: 'Department', type: 'string' },
      { field: 'title', label: 'Job Title', type: 'string' },
      { field: 'isActive', label: 'Active', type: 'boolean' },
      { field: 'createdAt', label: 'Created Date', type: 'date' },
      { field: 'lastLogin', label: 'Last Login', type: 'date' },
    ],
    clients: [
      { field: 'clientId', label: 'Client ID', type: 'string' },
      { field: 'name', label: 'Client Name', type: 'string' },
      { field: 'industry', label: 'Industry', type: 'string' },
      { field: 'contactName', label: 'Primary Contact', type: 'string' },
      { field: 'email', label: 'Email', type: 'string' },
      { field: 'phone', label: 'Phone', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'contractValue', label: 'Contract Value', type: 'number' },
      { field: 'createdAt', label: 'Onboarded Date', type: 'date' },
    ],
    billing: [
      { field: 'invoiceNumber', label: 'Invoice Number', type: 'string' },
      { field: 'clientId', label: 'Client', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'amount', label: 'Amount', type: 'number' },
      { field: 'paid', label: 'Amount Paid', type: 'number' },
      { field: 'outstanding', label: 'Outstanding Balance', type: 'number' },
      { field: 'issueDate', label: 'Issue Date', type: 'date' },
      { field: 'dueDate', label: 'Due Date', type: 'date' },
      { field: 'paidDate', label: 'Paid Date', type: 'date' },
    ],
    quotes: [
      { field: 'quoteNumber', label: 'Quote Number', type: 'string' },
      { field: 'clientId', label: 'Client', type: 'string' },
      { field: 'status', label: 'Status', type: 'string' },
      { field: 'total', label: 'Total Amount', type: 'number' },
      { field: 'validUntil', label: 'Valid Until', type: 'date' },
      { field: 'createdAt', label: 'Created Date', type: 'date' },
      { field: 'acceptedAt', label: 'Accepted Date', type: 'date' },
    ],
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

  const handlePreview = async () => {
    if (dataSources.length === 0) {
      toast.error('Please select at least one data source')
      return
    }

    if (selectedFields.length === 0) {
      toast.error('Please select at least one field')
      return
    }

    try {
      setPreviewLoading(true)
      setShowPreviewDialog(true)

      // Create a temporary report to run
      const tempReport = {
        dataSources,
        fields: selectedFields,
        filters,
      }

      // For preview, we'll just generate sample data based on the configuration
      // In a real implementation, this would call a preview API endpoint
      const sampleData = Array.from({ length: 10 }, (_, i) => {
        const row: any = {}
        selectedFields.forEach(field => {
          const [_, fieldName] = field.split('.')
          row[fieldName] = `Sample ${fieldName} ${i + 1}`
        })
        return row
      })

      setPreviewData(sampleData)
    } catch (error) {
      console.error('Preview error:', error)
      toast.error('Failed to generate preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleExportPreview = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await exportData(format, previewData, {
        filename: reportName || 'report_preview',
        title: reportName || 'Report Preview',
      })
    } catch (error) {
      console.error('Export error:', error)
    }
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
    dataSourceFields[source]?.map((fieldDef) => ({
      value: `${source}.${fieldDef.field}`,
      label: `${availableDataSources.find(ds => ds.value === source)?.label} - ${fieldDef.label}`,
      type: fieldDef.type,
    })) || []
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
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={dataSources.length === 0 || selectedFields.length === 0}
          >
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
              <div key={source.value} className="space-y-1">
                <div className="flex items-center space-x-2">
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
                <p className="text-xs text-muted-foreground ml-6">{source.description}</p>
              </div>
            ))}

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label>Available Fields</Label>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-3">
                {availableFields.length > 0 ? (
                  availableFields.map((field) => (
                    <div key={field.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.value}
                        checked={selectedFields.includes(field.value)}
                        onCheckedChange={() => handleFieldToggle(field.value)}
                      />
                      <label
                        htmlFor={field.value}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {field.label}
                      </label>
                      <Badge variant="outline" className="text-xs">{field.type}</Badge>
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
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
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
                    <SelectItem value="equals">Equals (=)</SelectItem>
                    <SelectItem value="notEquals">Not Equals (≠)</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="notContains">Does Not Contain</SelectItem>
                    <SelectItem value="startsWith">Starts With</SelectItem>
                    <SelectItem value="endsWith">Ends With</SelectItem>
                    <SelectItem value="greaterThan">Greater Than (&gt;)</SelectItem>
                    <SelectItem value="greaterThanOrEqual">Greater Than or Equal (≥)</SelectItem>
                    <SelectItem value="lessThan">Less Than (&lt;)</SelectItem>
                    <SelectItem value="lessThanOrEqual">Less Than or Equal (≤)</SelectItem>
                    <SelectItem value="between">Between</SelectItem>
                    <SelectItem value="isEmpty">Is Empty</SelectItem>
                    <SelectItem value="isNotEmpty">Is Not Empty</SelectItem>
                    <SelectItem value="isTrue">Is True</SelectItem>
                    <SelectItem value="isFalse">Is False</SelectItem>
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
              <Label>Selected Fields ({selectedFields.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedFields.length > 0 ? (
                  selectedFields.map((fieldValue) => {
                    const field = availableFields.find(f => f.value === fieldValue)
                    return (
                      <Badge key={fieldValue} variant="secondary">
                        {field?.label || fieldValue}
                      </Badge>
                    )
                  })
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
                  <SelectItem value="custom">Custom Reports</SelectItem>
                  <SelectItem value="service_desk">Service Desk</SelectItem>
                  <SelectItem value="incidents">Incidents</SelectItem>
                  <SelectItem value="changes">Change Management</SelectItem>
                  <SelectItem value="problems">Problem Management</SelectItem>
                  <SelectItem value="assets">Assets & Inventory</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="knowledge">Knowledge Base</SelectItem>
                  <SelectItem value="billing">Billing & Finance</SelectItem>
                  <SelectItem value="users">Users & Teams</SelectItem>
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

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Report Preview</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPreview('pdf')}
                  disabled={exporting || previewLoading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPreview('excel')}
                  disabled={exporting || previewLoading}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPreview('csv')}
                  disabled={exporting || previewLoading}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : previewData.length > 0 ? (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Showing {previewData.length} sample record(s)
              </div>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedFields.map((field) => {
                        const fieldObj = availableFields.find(f => f.value === field)
                        return (
                          <TableHead key={field} className="font-semibold">
                            {fieldObj?.label || field}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        {selectedFields.map((field) => {
                          const [_, fieldName] = field.split('.')
                          const value = row[fieldName]
                          return (
                            <TableCell key={field}>
                              {value !== null && value !== undefined ? String(value) : '-'}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                This is sample data. Save and run the report to see actual results.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No preview data available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
