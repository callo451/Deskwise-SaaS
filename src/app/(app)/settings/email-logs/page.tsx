'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsHeader } from '@/components/settings/settings-header'
import { EmptyState } from '@/components/settings/empty-state'
import {
  Mail,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  RefreshCw,
  Filter,
  Calendar,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface EmailLog {
  _id: string
  to: string
  from: string
  subject: string
  template?: string
  status: 'sent' | 'failed' | 'bounced' | 'complained'
  errorMessage?: string
  retryCount: number
  sentAt?: string
  event?: string
  htmlBody?: string
  messageId?: string
}

export default function EmailLogsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchLogs()
    }
  }, [isAdmin, page, statusFilter, search])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', page.toString())
      params.set('limit', '50')

      const response = await fetch(`/api/email/logs?${params}`)
      const data = await response.json()

      if (data.success) {
        setLogs(data.data)
        setTotalPages(data.pagination?.totalPages || 1)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch email logs',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching email logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch email logs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async (logId: string) => {
    try {
      const response = await fetch(`/api/email/logs/${logId}/resend`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Email resent successfully',
        })
        fetchLogs()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to resend email',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend email',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const response = await fetch(`/api/email/logs/export?${params}`)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `email-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Email logs exported successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export logs',
        variant: 'destructive',
      })
    }
  }

  const openPreview = (log: EmailLog) => {
    setSelectedLog(log)
    setIsPreviewOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      case 'bounced':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Bounced
          </Badge>
        )
      case 'complained':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Spam
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="Email Logs"
          description="View email delivery history and logs"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Mail className="h-6 w-6 text-gray-600" />}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access email logs.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === 'sent').length,
    failed: logs.filter((l) => l.status === 'failed' || l.status === 'bounced').length,
    retries: logs.filter((l) => l.retryCount > 0).length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Email Logs"
        description="Monitor email delivery status and troubleshoot issues"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Mail className="h-6 w-6 text-gray-600" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-700">Total Emails</CardDescription>
            <CardTitle className="text-3xl text-gray-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Successfully Sent</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Failed/Bounced</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Retried</CardDescription>
            <CardTitle className="text-3xl">{stats.retries}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Delivery Logs</CardTitle>
          <CardDescription>
            Complete history of all emails sent from the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by recipient email or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="complained">Spam Complaint</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={Mail}
              title={search || statusFilter !== 'all' ? 'No logs found' : 'No email logs yet'}
              description={
                search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Email logs will appear here once emails are sent'
              }
            />
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Template/Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="font-mono text-sm">
                          {log.sentAt
                            ? new Date(log.sentAt).toLocaleString()
                            : 'Pending'}
                        </TableCell>
                        <TableCell className="font-medium">{log.to}</TableCell>
                        <TableCell className="max-w-md truncate">{log.subject}</TableCell>
                        <TableCell>
                          {log.template ? (
                            <Badge variant="outline">{log.template}</Badge>
                          ) : log.event ? (
                            <Badge variant="secondary">{log.event}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Manual</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          {log.retryCount > 0 ? (
                            <Badge variant="outline">{log.retryCount}x</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPreview(log)}
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
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this email delivery
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <div className="p-2 bg-muted rounded font-mono text-sm">{selectedLog.to}</div>
                </div>
                <div className="space-y-2">
                  <Label>From</Label>
                  <div className="p-2 bg-muted rounded font-mono text-sm">{selectedLog.from}</div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Sent At</Label>
                  <div className="p-2 bg-muted rounded text-sm">
                    {selectedLog.sentAt
                      ? new Date(selectedLog.sentAt).toLocaleString()
                      : 'Not sent'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="p-2 bg-muted rounded">{selectedLog.subject}</div>
              </div>

              {selectedLog.template && (
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Badge variant="outline">{selectedLog.template}</Badge>
                </div>
              )}

              {selectedLog.messageId && (
                <div className="space-y-2">
                  <Label>Message ID</Label>
                  <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                    {selectedLog.messageId}
                  </div>
                </div>
              )}

              {selectedLog.errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{selectedLog.errorMessage}</AlertDescription>
                </Alert>
              )}

              {selectedLog.retryCount > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This email was retried {selectedLog.retryCount} time(s)
                  </AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="preview" className="w-full">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="html">HTML Source</TabsTrigger>
                </TabsList>
                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-6 bg-white max-h-96 overflow-y-auto">
                    {selectedLog.htmlBody ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedLog.htmlBody }} />
                    ) : (
                      <div className="text-center text-muted-foreground py-12">
                        No HTML body available
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="html" className="mt-4">
                  <div className="rounded-lg border bg-gray-950 max-h-96 overflow-auto">
                    <pre className="p-4">
                      <code className="text-sm text-gray-100">
                        {selectedLog.htmlBody || '<!-- No HTML body available -->'}
                      </code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>

              {selectedLog.status === 'failed' && (
                <div className="flex justify-end">
                  <Button onClick={() => selectedLog._id && handleResend(selectedLog._id)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resend Email
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
