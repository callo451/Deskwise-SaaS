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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { SettingsHeader } from '@/components/settings/settings-header'
import { EmptyState } from '@/components/settings/empty-state'
import { useEmailTemplates } from '@/hooks/use-email-templates'
import {
  useNotificationRules,
  NotificationRule,
  CreateRuleInput,
  RuleCondition,
} from '@/hooks/use-notification-rules'
import {
  Bell,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  TestTube,
  Filter,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const MODULES = [
  { value: 'tickets', label: 'Tickets' },
  { value: 'incidents', label: 'Incidents' },
  { value: 'changes', label: 'Change Requests' },
  { value: 'projects', label: 'Projects' },
  { value: 'assets', label: 'Assets' },
  { value: 'knowledgeBase', label: 'Knowledge Base' },
]

const EVENT_TYPES: Record<string, Array<{ value: string; label: string }>> = {
  tickets: [
    { value: 'created', label: 'Created' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'updated', label: 'Updated' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'commented', label: 'Commented' },
  ],
  incidents: [
    { value: 'created', label: 'Created' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'resolved', label: 'Resolved' },
  ],
  changes: [
    { value: 'created', label: 'Created' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'implemented', label: 'Implemented' },
  ],
  projects: [
    { value: 'created', label: 'Created' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'completed', label: 'Completed' },
  ],
  assets: [
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'assigned', label: 'Assigned' },
  ],
  knowledgeBase: [
    { value: 'created', label: 'Article Created' },
    { value: 'updated', label: 'Article Updated' },
  ],
}

const CONDITION_FIELDS: Record<string, Array<{ value: string; label: string }>> = {
  tickets: [
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'category', label: 'Category' },
    { value: 'assignee', label: 'Assignee' },
  ],
  incidents: [
    { value: 'severity', label: 'Severity' },
    { value: 'status', label: 'Status' },
  ],
  changes: [
    { value: 'risk', label: 'Risk Level' },
    { value: 'status', label: 'Status' },
  ],
}

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'in', label: 'In List' },
]

export default function NotificationRulesPage() {
  const { data: session } = useSession()
  const { rules, loading, fetchRules, createRule, updateRule, deleteRule, toggleRuleStatus } =
    useNotificationRules()
  const { templates, fetchTemplates } = useEmailTemplates()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null)
  const [ruleToDelete, setRuleToDelete] = useState<NotificationRule | null>(null)

  const [formData, setFormData] = useState<CreateRuleInput>({
    name: '',
    eventType: '',
    module: '',
    templateId: '',
    isActive: true,
    conditions: [],
    recipients: {
      requester: false,
      assignee: false,
      watchers: false,
      customEmails: [],
      roles: [],
    },
  })

  const [newCondition, setNewCondition] = useState<RuleCondition>({
    field: '',
    operator: 'equals',
    value: '',
  })

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchRules()
      fetchTemplates()
    }
  }, [isAdmin, fetchRules, fetchTemplates])

  const handleCreate = async () => {
    const result = await createRule(formData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      resetForm()
    }
  }

  const handleUpdate = async () => {
    if (!selectedRule?._id) return
    const result = await updateRule(selectedRule._id, formData)
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedRule(null)
      resetForm()
    }
  }

  const handleDelete = async () => {
    if (!ruleToDelete?._id) return
    const result = await deleteRule(ruleToDelete._id)
    if (result.success) {
      setRuleToDelete(null)
    }
  }

  const handleToggleStatus = async (rule: NotificationRule) => {
    if (!rule._id) return
    await toggleRuleStatus(rule._id, !rule.isActive)
  }

  const openEditDialog = (rule: NotificationRule) => {
    setSelectedRule(rule)
    setFormData({
      name: rule.name,
      eventType: rule.eventType,
      module: rule.module,
      templateId: rule.templateId,
      isActive: rule.isActive,
      conditions: rule.conditions || [],
      recipients: rule.recipients,
    })
    setIsEditDialogOpen(true)
  }

  const addCondition = () => {
    if (!newCondition.field || !newCondition.value) return
    setFormData({
      ...formData,
      conditions: [...(formData.conditions || []), newCondition],
    })
    setNewCondition({ field: '', operator: 'equals', value: '' })
  }

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions?.filter((_, i) => i !== index),
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      eventType: '',
      module: '',
      templateId: '',
      isActive: true,
      conditions: [],
      recipients: {
        requester: false,
        assignee: false,
        watchers: false,
        customEmails: [],
        roles: [],
      },
    })
  }

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.module.toLowerCase().includes(search.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="Notification Rules"
          description="Manage automated email notification rules"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Bell className="h-6 w-6 text-blue-600" />}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access notification rules.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    inactive: rules.filter((r) => !r.isActive).length,
    templates: templates.filter((t) => t.isActive).length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Notification Rules"
        description="Configure automated email notifications based on events and conditions"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Bell className="h-6 w-6 text-blue-600" />}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Rule
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-blue-700">Total Rules</CardDescription>
            <CardTitle className="text-3xl text-blue-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Rules</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inactive Rules</CardDescription>
            <CardTitle className="text-3xl">{stats.inactive}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Available Templates</CardDescription>
            <CardTitle className="text-3xl">{stats.templates}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Rules</CardTitle>
          <CardDescription>
            Define when and to whom email notifications should be sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredRules.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={search ? 'No rules found' : 'No rules created'}
              description={
                search
                  ? 'Try adjusting your search terms'
                  : 'Create your first notification rule to automate emails'
              }
              action={
                !search
                  ? {
                      label: 'Create Rule',
                      onClick: () => setIsCreateDialogOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule._id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MODULES.find((m) => m.value === rule.module)?.label || rule.module}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{rule.eventType}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {templates.find((t) => t._id === rule.templateId)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {rule.recipients.requester && <Badge variant="outline">Requester</Badge>}
                        {rule.recipients.assignee && <Badge variant="outline">Assignee</Badge>}
                        {rule.recipients.watchers && <Badge variant="outline">Watchers</Badge>}
                        {rule.recipients.customEmails && rule.recipients.customEmails.length > 0 && (
                          <Badge variant="outline">+{rule.recipients.customEmails.length}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggleStatus(rule)}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(rule)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Rule
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRuleToDelete(rule)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Notification Rule</DialogTitle>
            <DialogDescription>
              Define when automated email notifications should be sent
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Notify on High Priority Tickets"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="module">Module</Label>
                <Select
                  value={formData.module}
                  onValueChange={(value) =>
                    setFormData({ ...formData, module: value, eventType: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((module) => (
                      <SelectItem key={module.value} value={module.value}>
                        {module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                  disabled={!formData.module}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.module &&
                      EVENT_TYPES[formData.module]?.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Conditions (Optional)</Label>
              <Card className="p-4">
                <div className="space-y-4">
                  {formData.conditions && formData.conditions.length > 0 && (
                    <div className="space-y-2">
                      {formData.conditions.map((condition, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            <strong>{condition.field}</strong> {condition.operator}{' '}
                            <strong>{condition.value}</strong>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCondition(index)}
                            className="ml-auto"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-2 md:grid-cols-4">
                    <Select
                      value={newCondition.field}
                      onValueChange={(value) => setNewCondition({ ...newCondition, field: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.module &&
                          CONDITION_FIELDS[formData.module]?.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={newCondition.operator}
                      onValueChange={(value: any) =>
                        setNewCondition({ ...newCondition, operator: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={newCondition.value}
                      onChange={(e) =>
                        setNewCondition({ ...newCondition, value: e.target.value })
                      }
                    />

                    <Button variant="outline" onClick={addCondition} disabled={!newCondition.field}>
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template">Email Template</Label>
              <Select
                value={formData.templateId}
                onValueChange={(value) => setFormData({ ...formData, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter((t) => t.isActive)
                    .map((template) => (
                      <SelectItem key={template._id} value={template._id!}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recipients</Label>
              <Card className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requester"
                    checked={formData.recipients.requester}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        recipients: { ...formData.recipients, requester: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="requester" className="font-normal">
                    Requester (person who created the item)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assignee"
                    checked={formData.recipients.assignee}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        recipients: { ...formData.recipients, assignee: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="assignee" className="font-normal">
                    Assignee (person assigned to the item)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="watchers"
                    checked={formData.recipients.watchers}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        recipients: { ...formData.recipients, watchers: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="watchers" className="font-normal">
                    Watchers (people following the item)
                  </Label>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Active Rule</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this rule to send notifications
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.module || !formData.eventType || !formData.templateId}
            >
              Create Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Rule Dialog - Similar to Create */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Notification Rule</DialogTitle>
            <DialogDescription>Modify the notification rule configuration</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="editName">Rule Name</Label>
              <Input
                id="editName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Module</Label>
                <Select value={formData.module} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((module) => (
                      <SelectItem key={module.value} value={module.value}>
                        {module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={formData.eventType} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTemplate">Email Template</Label>
              <Select
                value={formData.templateId}
                onValueChange={(value) => setFormData({ ...formData, templateId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter((t) => t.isActive)
                    .map((template) => (
                      <SelectItem key={template._id} value={template._id!}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recipients</Label>
              <Card className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editRequester"
                    checked={formData.recipients.requester}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        recipients: { ...formData.recipients, requester: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="editRequester" className="font-normal">
                    Requester
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editAssignee"
                    checked={formData.recipients.assignee}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        recipients: { ...formData.recipients, assignee: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="editAssignee" className="font-normal">
                    Assignee
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editWatchers"
                    checked={formData.recipients.watchers}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        recipients: { ...formData.recipients, watchers: checked as boolean },
                      })
                    }
                  />
                  <Label htmlFor="editWatchers" className="font-normal">
                    Watchers
                  </Label>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Active Rule</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this rule to send notifications
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!ruleToDelete} onOpenChange={() => setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{ruleToDelete?.name}"? Email notifications for this
              rule will stop immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
