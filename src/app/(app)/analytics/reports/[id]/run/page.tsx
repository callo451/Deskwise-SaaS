'use client'

import { use, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Play,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Table as TableIcon,
  BarChart3,
  PieChart,
  LineChart,
  Gauge,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useExport } from '@/hooks/use-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ReportRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [report, setReport] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [executedAt, setExecutedAt] = useState<Date | null>(null)
  const { exportData, exporting } = useExport()

  useEffect(() => {
    loadReportAndRun()
  }, [id])

  const loadReportAndRun = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/reports/${id}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      setReport(data.data)

      // Auto-run the report after loading
      setLoading(false)
      await runReport()
    } catch (error) {
      console.error('Load report error:', error)
      toast.error('Failed to load report')
      setLoading(false)
    }
  }

  const loadReport = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/reports/${id}`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      setReport(data.data)
    } catch (error) {
      console.error('Load report error:', error)
      toast.error('Failed to load report')
    } finally {
      setLoading(false)
    }
  }

  const runReport = async () => {
    try {
      setRunning(true)
      const response = await fetch(`/api/analytics/reports/${id}/run`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error)

      setResults(data.data.results)
      setExecutedAt(new Date(data.data.executedAt))
      toast.success(`Report executed successfully. ${data.data.count} records found.`)
    } catch (error) {
      console.error('Run report error:', error)
      toast.error('Failed to run report')
    } finally {
      setRunning(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await exportData(format, results, {
        filename: report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        title: report.name,
      })
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const getChartIcon = (chartType: string) => {
    const icons: Record<string, any> = {
      table: TableIcon,
      bar: BarChart3,
      line: LineChart,
      pie: PieChart,
      gauge: Gauge,
    }
    return icons[chartType] || TableIcon
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report not found</h3>
            <p className="text-muted-foreground text-center mb-4">
              The report you're looking for doesn't exist or has been deleted.
            </p>
            <Link href="/analytics/reports/library">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const ChartIcon = getChartIcon(report.chartType)

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{report.name}</h1>
              <Badge variant="secondary">{report.category}</Badge>
            </div>
            {report.description && (
              <p className="text-muted-foreground mt-1">{report.description}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runReport}
            disabled={running || exporting}
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                {results.length > 0 ? 'Refresh' : 'Run Report'}
              </>
            )}
          </Button>

          {results.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" disabled={exporting}>
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('csv')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TableIcon className="w-4 h-4" />
                Data Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {report.dataSources.map((ds: string) => (
                  <Badge key={ds} variant="outline">
                    {ds.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ChartIcon className="w-4 h-4" />
                Visualization
              </div>
              <Badge variant="secondary">{report.chartType}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                Filters Applied
              </div>
              <Badge variant="secondary">{report.filters.length} filter(s)</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Selected Fields ({report.fields.length})</div>
            <div className="flex flex-wrap gap-2">
              {report.fields.map((field: string) => (
                <Badge key={field} variant="outline" className="font-mono text-xs">
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          {report.lastRun && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Last run: {formatDateTime(report.lastRun)}
                {report.runCount && ` (${report.runCount} times)`}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {results.length} record(s) found
                  {executedAt && ` • Executed at ${formatDateTime(executedAt)}`}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={runReport}
                disabled={running}
              >
                <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.fields.map((field: string) => {
                      const [_, fieldName] = field.split('.')
                      return (
                        <TableHead key={field} className="font-semibold">
                          {fieldName}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.slice(0, 100).map((row, index) => (
                    <TableRow key={index}>
                      {report.fields.map((field: string) => {
                        const [_, fieldName] = field.split('.')
                        const value = row[fieldName]
                        return (
                          <TableCell key={field}>
                            {value !== null && value !== undefined
                              ? typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)
                              : '-'}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {results.length > 100 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing first 100 of {results.length} records. Export to see all results.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {running ? 'Running Report...' : executedAt ? 'No Results Found' : 'No Results Yet'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {running
                ? 'Executing your report. This may take a moment...'
                : executedAt
                  ? 'No records match your filters. Try adjusting your filter criteria or expanding the date range.'
                  : 'The report will execute automatically. If you see this message, try running it manually.'}
            </p>
            {!running && (
              <Button onClick={runReport} disabled={running}>
                <Play className="w-4 h-4 mr-2" />
                {executedAt ? 'Run Again' : 'Run Report'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
