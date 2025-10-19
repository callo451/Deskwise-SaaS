'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SettingsHeader } from '@/components/settings/settings-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from '@/components/ui/dialog'
import {
  Mail,
  CheckCircle2,
  MessageSquarePlus,
  AlertCircle,
  Clock,
  User,
  TicketIcon as Ticket,
  FileText,
  Search,
  RefreshCw,
  Inbox,
  ExternalLink,
} from 'lucide-react'
import { ProcessedEmail, InboundEmailAccount } from '@/lib/types'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

export default function InboundEmailLogsPage() {
  const { data: session } = useSession()
  const [emails, setEmails] = useState<ProcessedEmail[]>([])
  const [accounts, setAccounts] = useState<InboundEmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<ProcessedEmail | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Filters
  const [accountFilter, setAccountFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [accountFilter, actionFilter])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load accounts
      const accountsResponse = await fetch('/api/inbound-email/accounts')
      const accountsData = await accountsResponse.json()
      if (accountsData.success) {
        setAccounts(accountsData.data)
      }

      // Load processed emails
      const params = new URLSearchParams()
      if (accountFilter !== 'all') params.append('accountId', accountFilter)
      if (actionFilter !== 'all') params.append('action', actionFilter)

      const emailsResponse = await fetch(`/api/inbound-email/processed?${params}`)
      const emailsData = await emailsResponse.json()

      if (emailsData.success) {
        setEmails(emailsData.data)
      } else {
        toast.error('Failed to load email logs')
      }
    } catch (error) {
      console.error('Load error:', error)
      toast.error('Failed to load email logs')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (email: ProcessedEmail) => {
    setSelectedEmail(email)
    setDetailsOpen(true)
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleString()
  }

  const getActionBadge = (action: ProcessedEmail['action']) => {
    switch (action) {
      case 'ticket_created':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ticket Created
          </Badge>
        )
      case 'comment_added':
        return (
          <Badge className="bg-blue-600">
            <MessageSquarePlus className="h-3 w-3 mr-1" />
            Comment Added
          </Badge>
        )
      case 'ignored':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Ignored
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
    }
  }

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a._id.toString() === accountId)
    return account?.name || 'Unknown Account'
  }

  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      email.subject.toLowerCase().includes(query) ||
      email.from.toLowerCase().includes(query) ||
      email.bodyText?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        icon={FileText}
        title="Inbound Email Logs"
        description="View all processed inbound emails and their actions"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search emails by subject, sender, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account._id.toString()} value={account._id.toString()}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="ticket_created">Ticket Created</SelectItem>
            <SelectItem value="comment_added">Comment Added</SelectItem>
            <SelectItem value="ignored">Ignored</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Email List */}
      {filteredEmails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No emails found</h3>
            <p className="text-gray-600 text-center">
              {searchQuery
                ? 'No emails match your search criteria'
                : 'No emails have been processed yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredEmails.map((email) => (
            <Card
              key={email._id.toString()}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(email)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getActionBadge(email.action)}
                      <Badge variant="outline">{getAccountName(email.accountId)}</Badge>
                      {email.ticketId && (
                        <Link
                          href={`/tickets/${email.ticketId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Ticket className="h-3 w-3" />
                          View Ticket
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>

                    <div className="font-medium mb-1 truncate">{email.subject}</div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {email.from}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(email.processedAt)}
                      </div>
                      {email.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {email.attachments.length} attachment(s)
                        </div>
                      )}
                    </div>

                    {email.errorMessage && (
                      <div className="mt-2 text-sm text-red-600 flex items-start gap-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{email.errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    {email.processingTime}ms
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Email Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              {selectedEmail?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              {/* Action & Status */}
              <div className="flex items-center gap-2">
                {getActionBadge(selectedEmail.action)}
                <Badge variant="outline">{getAccountName(selectedEmail.accountId)}</Badge>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">From</div>
                  <div className="font-medium">{selectedEmail.from}</div>
                </div>

                <div>
                  <div className="text-gray-600 mb-1">To</div>
                  <div className="font-medium">{selectedEmail.to.join(', ')}</div>
                </div>

                <div>
                  <div className="text-gray-600 mb-1">Received</div>
                  <div className="font-medium">{formatDate(selectedEmail.receivedAt)}</div>
                </div>

                <div>
                  <div className="text-gray-600 mb-1">Processed</div>
                  <div className="font-medium">{formatDate(selectedEmail.processedAt)}</div>
                </div>

                <div>
                  <div className="text-gray-600 mb-1">Processing Time</div>
                  <div className="font-medium">{selectedEmail.processingTime}ms</div>
                </div>

                <div>
                  <div className="text-gray-600 mb-1">Message ID</div>
                  <div className="font-mono text-xs truncate" title={selectedEmail.messageId}>
                    {selectedEmail.messageId}
                  </div>
                </div>
              </div>

              {/* Ticket Link */}
              {selectedEmail.ticketId && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium mb-1">Associated Ticket</div>
                  <Link
                    href={`/tickets/${selectedEmail.ticketId}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  >
                    <Ticket className="h-4 w-4" />
                    View Ticket
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Error Message */}
              {selectedEmail.errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm font-medium mb-1 text-red-900">Error</div>
                  <div className="text-sm text-red-700">{selectedEmail.errorMessage}</div>
                </div>
              )}

              {/* Email Body */}
              <div>
                <div className="text-sm font-medium mb-2">Email Content</div>
                <div className="p-4 bg-gray-50 rounded-lg border">
                  {selectedEmail.bodyHtml ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">
                      {selectedEmail.bodyText || '(No body)'}
                    </pre>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {selectedEmail.attachments.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Attachments</div>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-600" />
                          <div>
                            <div className="text-sm font-medium">{attachment.filename}</div>
                            <div className="text-xs text-gray-600">
                              {attachment.contentType} • {(attachment.size / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
