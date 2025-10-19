'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InboundEmailAccount, User, EmailAssignmentRule } from '@/lib/types'
import { toast } from 'sonner'
import { Eye, EyeOff, Plus, Trash2, Mail, Server, Settings } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface InboundEmailAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: InboundEmailAccount | null
  onSuccess: () => void
}

export function InboundEmailAccountModal({
  open,
  onOpenChange,
  account,
  onSuccess,
}: InboundEmailAccountModalProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    imap: {
      host: '',
      port: 993,
      secure: true,
      username: '',
      password: '',
    },
    isActive: true,
    pollingInterval: 60,
    deleteAfterProcessing: false,
    processedFolder: 'Processed',
    defaultAssignee: '',
    autoAssignmentEnabled: false,
    assignmentRules: [] as EmailAssignmentRule[],
  })

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        email: account.email,
        imap: {
          host: account.imap.host,
          port: account.imap.port,
          secure: account.imap.secure,
          username: account.imap.username,
          password: '***********', // Masked
        },
        isActive: account.isActive,
        pollingInterval: account.pollingInterval,
        deleteAfterProcessing: account.deleteAfterProcessing,
        processedFolder: account.processedFolder,
        defaultAssignee: account.defaultAssignee || '',
        autoAssignmentEnabled: account.autoAssignmentEnabled,
        assignmentRules: account.assignmentRules || [],
      })
    } else {
      // Reset for new account
      setFormData({
        name: '',
        email: '',
        imap: {
          host: '',
          port: 993,
          secure: true,
          username: '',
          password: '',
        },
        isActive: true,
        pollingInterval: 60,
        deleteAfterProcessing: false,
        processedFolder: 'Processed',
        defaultAssignee: '',
        autoAssignmentEnabled: false,
        assignmentRules: [],
      })
      setShowPassword(false)
    }
  }, [account, open])

  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()

      if (data.success) {
        setUsers(data.data.filter((u: User) => u.role === 'admin' || u.role === 'technician'))
      }
    } catch (error) {
      console.error('Load users error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!formData.imap.host || !formData.imap.username || !formData.imap.password) {
      toast.error('Please fill in all IMAP configuration fields')
      return
    }

    try {
      setLoading(true)

      const url = account
        ? `/api/inbound-email/accounts/${account._id}`
        : '/api/inbound-email/accounts'

      const method = account ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(account ? 'Email account updated' : 'Email account created')
        onSuccess()
      } else {
        toast.error(data.error || 'Failed to save email account')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save email account')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRule = () => {
    setFormData({
      ...formData,
      assignmentRules: [
        ...formData.assignmentRules,
        {
          condition: 'subject_contains',
          value: '',
          assignTo: '',
        },
      ],
    })
  }

  const handleRemoveRule = (index: number) => {
    setFormData({
      ...formData,
      assignmentRules: formData.assignmentRules.filter((_, i) => i !== index),
    })
  }

  const handleRuleChange = (
    index: number,
    field: keyof EmailAssignmentRule,
    value: string
  ) => {
    const newRules = [...formData.assignmentRules]
    newRules[index] = { ...newRules[index], [field]: value }
    setFormData({ ...formData, assignmentRules: newRules })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account ? 'Edit' : 'Add'} Email Account</DialogTitle>
          <DialogDescription>
            Configure an IMAP email account to receive emails and automatically create tickets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <Mail className="h-4 w-4 mr-2" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="imap">
                <Server className="h-4 w-4 mr-2" />
                IMAP
              </TabsTrigger>
              <TabsTrigger value="rules">
                <Settings className="h-4 w-4 mr-2" />
                Rules
              </TabsTrigger>
            </TabsList>

            {/* Basic Settings Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Support Mailbox"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="support@company.com"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <div className="text-sm text-gray-600">
                    Enable email polling for this account
                  </div>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="pollingInterval">Polling Interval (seconds)</Label>
                <Input
                  id="pollingInterval"
                  type="number"
                  min={30}
                  max={600}
                  value={formData.pollingInterval}
                  onChange={(e) =>
                    setFormData({ ...formData, pollingInterval: parseInt(e.target.value) })
                  }
                />
                <p className="text-sm text-gray-600 mt-1">
                  How often to check for new emails (30-600 seconds)
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Delete After Processing</Label>
                  <div className="text-sm text-gray-600">
                    Delete emails from mailbox after processing
                  </div>
                </div>
                <Switch
                  checked={formData.deleteAfterProcessing}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, deleteAfterProcessing: checked })
                  }
                />
              </div>

              {!formData.deleteAfterProcessing && (
                <div>
                  <Label htmlFor="processedFolder">Processed Folder (Optional)</Label>
                  <Input
                    id="processedFolder"
                    value={formData.processedFolder}
                    onChange={(e) =>
                      setFormData({ ...formData, processedFolder: e.target.value })
                    }
                    placeholder="Processed"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Move processed emails to this folder (leave empty to mark as read)
                  </p>
                </div>
              )}
            </TabsContent>

            {/* IMAP Settings Tab */}
            <TabsContent value="imap" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="imapHost">IMAP Host *</Label>
                <Input
                  id="imapHost"
                  value={formData.imap.host}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imap: { ...formData.imap, host: e.target.value },
                    })
                  }
                  placeholder="imap.gmail.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="imapPort">Port *</Label>
                <Input
                  id="imapPort"
                  type="number"
                  value={formData.imap.port}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imap: { ...formData.imap, port: parseInt(e.target.value) },
                    })
                  }
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use SSL/TLS</Label>
                  <div className="text-sm text-gray-600">Port 993 (SSL) recommended</div>
                </div>
                <Switch
                  checked={formData.imap.secure}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      imap: { ...formData.imap, secure: checked },
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="imapUsername">Username *</Label>
                <Input
                  id="imapUsername"
                  value={formData.imap.username}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      imap: { ...formData.imap, username: e.target.value },
                    })
                  }
                  placeholder="your-email@gmail.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="imapPassword">Password *</Label>
                <div className="relative">
                  <Input
                    id="imapPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.imap.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        imap: { ...formData.imap, password: e.target.value },
                      })
                    }
                    placeholder="••••••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  For Gmail, use an App Password (not your regular password)
                </p>
              </div>

              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-sm">
                  <div className="font-medium mb-2">Common IMAP Settings:</div>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Gmail: imap.gmail.com:993 (SSL)</li>
                    <li>• Outlook: outlook.office365.com:993 (SSL)</li>
                    <li>• Yahoo: imap.mail.yahoo.com:993 (SSL)</li>
                  </ul>
                </div>
              </Card>
            </TabsContent>

            {/* Auto-Assignment Rules Tab */}
            <TabsContent value="rules" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="defaultAssignee">Default Assignee (Optional)</Label>
                <Select
                  value={formData.defaultAssignee}
                  onValueChange={(value) =>
                    setFormData({ ...formData, defaultAssignee: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default assignee</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user._id.toString()} value={user._id.toString()}>
                        {user.firstName} {user.lastName} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Auto-Assignment</Label>
                  <div className="text-sm text-gray-600">
                    Automatically assign tickets based on email content
                  </div>
                </div>
                <Switch
                  checked={formData.autoAssignmentEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoAssignmentEnabled: checked })
                  }
                />
              </div>

              {formData.autoAssignmentEnabled && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Assignment Rules</Label>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddRule}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>

                  {formData.assignmentRules.length === 0 ? (
                    <div className="text-center py-6 text-gray-600">
                      No assignment rules. Add a rule to automatically assign tickets.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.assignmentRules.map((rule, index) => (
                        <Card key={index} className="p-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Condition</Label>
                              <Select
                                value={rule.condition}
                                onValueChange={(value) =>
                                  handleRuleChange(
                                    index,
                                    'condition',
                                    value as EmailAssignmentRule['condition']
                                  )
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="subject_contains">Subject Contains</SelectItem>
                                  <SelectItem value="from_domain">From Domain</SelectItem>
                                  <SelectItem value="body_contains">Body Contains</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Value</Label>
                              <Input
                                className="h-9"
                                value={rule.value}
                                onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                                placeholder="urgent"
                              />
                            </div>

                            <div>
                              <Label className="text-xs">Assign To</Label>
                              <div className="flex gap-2">
                                <Select
                                  value={rule.assignTo}
                                  onValueChange={(value) =>
                                    handleRuleChange(index, 'assignTo', value)
                                  }
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select user" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {users.map((user) => (
                                      <SelectItem
                                        key={user._id.toString()}
                                        value={user._id.toString()}
                                      >
                                        {user.firstName} {user.lastName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRule(index)}
                                  className="h-9 px-2"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : account ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
