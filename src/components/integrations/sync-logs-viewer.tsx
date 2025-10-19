'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Search, Download, Eye, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import type { SyncLog, IntegrationPlatform, SyncEntityType, SyncStatus } from '@/lib/types/integrations'

interface LogFilters {
  platform?: IntegrationPlatform | 'all'
  entityType?: SyncEntityType | 'all'
  status?: SyncStatus | 'all'
  search?: string
}

export function SyncLogsViewer() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<SyncLog[]>([])
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const { toast } = useToast()

  // Filters
  const [filters, setFilters] = useState<LogFilters>({
    platform: 'all',
    entityType: 'all',
    status: 'all',
    search: '',
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const logsPerPage = 20

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, logs])

  const loadLogs = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/integrations/sync/logs')
      if (!response.ok) {
        throw new Error('Failed to load sync logs')
      }

      const data = await response.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Error loading logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sync logs.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...logs]

    if (filters.platform && filters.platform !== 'all') {
      filtered = filtered.filter((log) => log.platform === filters.platform)
    }

    if (filters.entityType && filters.entityType !== 'all') {
      filtered = filtered.filter((log) => log.entityType === filters.entityType)
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((log) => log.status === filters.status)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (log) =>
          log.entityId.toLowerCase().includes(searchLower) ||
          log.errorMessage?.toLowerCase().includes(searchLower) ||
          log.deskwiseId?.toLowerCase().includes(searchLower) ||
          log.platformId?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/integrations/sync/logs/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sync-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export Successful',
        description: 'Sync logs have been exported to CSV.',
      })
    } catch (error) {
      console.error('Error exporting logs:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export logs. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleViewDetails = (log: SyncLog) => {
    setSelectedLog(log)
    setShowDetails(true)
  }

  const getStatusBadge = (status: SyncStatus) => {
    switch (status) {
      case 'success':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Success
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        )
      case 'partial':
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-600 text-white">
            <AlertCircle className="h-3 w-3" />
            Partial
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
    }
  }

  const getPlatformName = (platform: IntegrationPlatform) => {
    const names = { xero: 'Xero', quickbooks: 'QuickBooks', myob: 'MYOB' }
    return names[platform]
  }

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const startIndex = (currentPage - 1) * logsPerPage
  const endIndex = startIndex + logsPerPage
  const currentLogs = filteredLogs.slice(startIndex, endIndex)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Sync Logs</CardTitle>
              <CardDescription className="mt-1">
                View detailed synchronization history and troubleshoot errors
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadLogs} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select
              value={filters.platform}
              onValueChange={(value) =>
                setFilters({ ...filters, platform: value as IntegrationPlatform | 'all' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="xero">Xero</SelectItem>
                <SelectItem value="quickbooks">QuickBooks</SelectItem>
                <SelectItem value="myob">MYOB</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.entityType}
              onValueChange={(value) =>
                setFilters({ ...filters, entityType: value as SyncEntityType | 'all' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
                <SelectItem value="quote">Quotes</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value as SyncStatus | 'all' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          {filteredLogs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {logs.length === 0
                  ? 'No sync logs found. Logs will appear here after your first sync.'
                  : 'No logs match your filters. Try adjusting your search criteria.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.startedAt), 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getPlatformName(log.platform)}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">{log.entityType}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-green-600 font-medium">{log.recordsSuccessful}</span>
                            {log.recordsFailed > 0 && (
                              <>
                                {' / '}
                                <span className="text-red-600 font-medium">{log.recordsFailed} failed</span>
                              </>
                            )}
                            {' of '}
                            {log.recordsProcessed}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.duration ? `${(log.duration / 1000).toFixed(2)}s` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(log)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredLogs.length)} of{' '}
                    {filteredLogs.length} logs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sync Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this synchronization event
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Platform</p>
                  <Badge variant="outline">{getPlatformName(selectedLog.platform)}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedLog.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Entity Type</p>
                  <p className="text-sm capitalize">{selectedLog.entityType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Initiated By</p>
                  <p className="text-sm capitalize">{selectedLog.initiatedBy}</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Timing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Started At</p>
                    <p className="text-sm">{format(new Date(selectedLog.startedAt), 'PPpp')}</p>
                  </div>
                  {selectedLog.completedAt && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Completed At</p>
                      <p className="text-sm">{format(new Date(selectedLog.completedAt), 'PPpp')}</p>
                    </div>
                  )}
                  {selectedLog.duration && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p className="text-sm">{(selectedLog.duration / 1000).toFixed(2)} seconds</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Records */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Records</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Processed</p>
                    <p className="text-2xl font-bold">{selectedLog.recordsProcessed}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{selectedLog.recordsSuccessful}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{selectedLog.recordsFailed}</p>
                  </div>
                </div>
              </div>

              {/* IDs */}
              {(selectedLog.deskwiseId || selectedLog.platformId) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Record IDs</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLog.deskwiseId && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Deskwise ID</p>
                        <p className="text-sm font-mono text-xs break-all">{selectedLog.deskwiseId}</p>
                      </div>
                    )}
                    {selectedLog.platformId && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Platform ID</p>
                        <p className="text-sm font-mono text-xs break-all">{selectedLog.platformId}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error Details */}
              {selectedLog.errorMessage && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Error Details</h4>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="mt-2">
                      <p className="font-medium">{selectedLog.errorMessage}</p>
                      {selectedLog.errorDetails && (
                        <p className="mt-2 text-sm opacity-90">{selectedLog.errorDetails}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                  {selectedLog.stackTrace && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">Stack Trace</summary>
                      <pre className="mt-2 overflow-x-auto rounded bg-muted p-3">
                        {selectedLog.stackTrace}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
