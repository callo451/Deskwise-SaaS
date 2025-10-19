'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SettingsHeader } from '@/components/settings/settings-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Inbox,
  Plus,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  TicketIcon as Ticket,
  Settings,
  Trash2,
  Edit,
  TestTube,
  Power,
  PowerOff,
  RefreshCw
} from 'lucide-react'
import { InboundEmailAccount } from '@/lib/types'
import { InboundEmailAccountModal } from '@/components/inbound-email/inbound-email-account-modal'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function InboundEmailPage() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<InboundEmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<InboundEmailAccount | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<InboundEmailAccount | null>(null)
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null)
  const [pollingManually, setPollingManually] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inbound-email/accounts')
      const data = await response.json()

      if (data.success) {
        setAccounts(data.data)
      } else {
        toast.error('Failed to load email accounts')
      }
    } catch (error) {
      console.error('Load accounts error:', error)
      toast.error('Failed to load email accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAccount = () => {
    setEditingAccount(null)
    setModalOpen(true)
  }

  const handleEditAccount = (account: InboundEmailAccount) => {
    setEditingAccount(account)
    setModalOpen(true)
  }

  const handleDeleteAccount = (account: InboundEmailAccount) => {
    setAccountToDelete(account)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/inbound-email/accounts/${accountToDelete._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Email account deleted')
        loadAccounts()
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete account')
    } finally {
      setDeleteDialogOpen(false)
      setAccountToDelete(null)
    }
  }

  const handleTestConnection = async (accountId: string) => {
    try {
      setTestingAccountId(accountId)
      const response = await fetch(`/api/inbound-email/accounts/${accountId}/test`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'IMAP connection successful')
      } else {
        toast.error(data.message || 'IMAP connection failed')
      }

      // Reload to get updated test result
      loadAccounts()
    } catch (error) {
      console.error('Test connection error:', error)
      toast.error('Failed to test connection')
    } finally {
      setTestingAccountId(null)
    }
  }

  const handleToggleActive = async (account: InboundEmailAccount) => {
    try {
      const response = await fetch(`/api/inbound-email/accounts/${account._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !account.isActive,
        }),
      })

      if (response.ok) {
        toast.success(account.isActive ? 'Account disabled' : 'Account enabled')
        loadAccounts()
      } else {
        toast.error('Failed to update account')
      }
    } catch (error) {
      console.error('Toggle active error:', error)
      toast.error('Failed to update account')
    }
  }

  const handleManualPoll = async () => {
    try {
      setPollingManually(true)
      toast.info('Polling email accounts...')

      const response = await fetch('/api/inbound-email/poll', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Email polling completed')
        loadAccounts() // Reload to see updated stats
      } else {
        toast.error('Email polling failed')
      }
    } catch (error) {
      console.error('Manual poll error:', error)
      toast.error('Failed to poll emails')
    } finally {
      setPollingManually(false)
    }
  }

  const formatLastPolled = (date?: Date) => {
    if (!date) return 'Never'

    const now = new Date()
    const polledDate = new Date(date)
    const diffMs = now.getTime() - polledDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

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
        icon={Inbox}
        title="Inbound Email"
        description="Configure email accounts to automatically create tickets from customer emails"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.filter(a => a.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Emails Processed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.reduce((sum, a) => sum + (a.emailsProcessed || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tickets Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.reduce((sum, a) => sum + (a.ticketsCreated || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accounts.length > 0
                ? Math.round(
                    (accounts.reduce((sum, a) => sum + (a.ticketsCreated || 0), 0) /
                      Math.max(accounts.reduce((sum, a) => sum + (a.emailsProcessed || 0), 0), 1)) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Email Accounts</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualPoll}
            disabled={pollingManually || accounts.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${pollingManually ? 'animate-spin' : ''}`} />
            Poll Now
          </Button>
          <Button onClick={handleAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Add Email Account
          </Button>
        </div>
      </div>

      {/* Email Accounts List */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email accounts configured</h3>
            <p className="text-gray-600 text-center mb-4">
              Add an email account to start receiving emails and automatically creating tickets.
            </p>
            <Button onClick={handleAddAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Email Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {accounts.map((account) => (
            <Card key={account._id.toString()} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${account.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Mail className={`h-5 w-5 ${account.isActive ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {account.name}
                        {account.isActive ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <PowerOff className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {account.email}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTestConnection(account._id.toString())}
                      disabled={testingAccountId === account._id.toString()}
                    >
                      <TestTube className={`h-4 w-4 ${testingAccountId === account._id.toString() ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(account)}
                    >
                      {account.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditAccount(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAccount(account)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Last Polled</div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatLastPolled(account.lastPolledAt)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Emails Processed</div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{account.emailsProcessed || 0}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Tickets Created</div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{account.ticketsCreated || 0}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 mb-1">Polling Interval</div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{account.pollingInterval}s</span>
                    </div>
                  </div>
                </div>

                {account.lastError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-900">Last Error</div>
                      <div className="text-sm text-red-700">{account.lastError}</div>
                    </div>
                  </div>
                )}

                {account.autoAssignmentEnabled && account.assignmentRules.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Auto-Assignment Rules</div>
                    <div className="space-y-1">
                      {account.assignmentRules.map((rule, idx) => (
                        <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <Settings className="h-3 w-3" />
                          {rule.condition.replace('_', ' ')}: "{rule.value}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <InboundEmailAccountModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        account={editingAccount}
        onSuccess={() => {
          setModalOpen(false)
          setEditingAccount(null)
          loadAccounts()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{accountToDelete?.name}"? This action cannot be undone.
              Processed emails will be retained in the logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
