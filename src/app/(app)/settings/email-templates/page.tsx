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
import { SettingsHeader } from '@/components/settings/settings-header'
import { EmptyState } from '@/components/settings/empty-state'
import { VariablePicker } from '@/components/email/variable-picker'
import { EmailPreview } from '@/components/email/email-preview'
import { TestEmailDialog } from '@/components/email/test-email-dialog'
import { TemplateEditor } from '@/components/email/template-editor'
import { useEmailTemplates, EmailTemplate, CreateTemplateInput } from '@/hooks/use-email-templates'
import {
  Mail,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  Send,
  FileText,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const EVENT_TYPES = [
  { value: 'ticket.created', label: 'Ticket Created', module: 'Tickets' },
  { value: 'ticket.assigned', label: 'Ticket Assigned', module: 'Tickets' },
  { value: 'ticket.updated', label: 'Ticket Updated', module: 'Tickets' },
  { value: 'ticket.resolved', label: 'Ticket Resolved', module: 'Tickets' },
  { value: 'ticket.closed', label: 'Ticket Closed', module: 'Tickets' },
  { value: 'ticket.commented', label: 'Ticket Commented', module: 'Tickets' },
  { value: 'incident.created', label: 'Incident Created', module: 'Incidents' },
  { value: 'incident.assigned', label: 'Incident Assigned', module: 'Incidents' },
  { value: 'incident.resolved', label: 'Incident Resolved', module: 'Incidents' },
  { value: 'change.created', label: 'Change Request Created', module: 'Changes' },
  { value: 'change.approved', label: 'Change Request Approved', module: 'Changes' },
  { value: 'change.rejected', label: 'Change Request Rejected', module: 'Changes' },
  { value: 'project.created', label: 'Project Created', module: 'Projects' },
  { value: 'project.assigned', label: 'Project Assigned', module: 'Projects' },
  { value: 'task.assigned', label: 'Task Assigned', module: 'Projects' },
  { value: 'user.welcome', label: 'User Welcome Email', module: 'System' },
  { value: 'user.password_reset', label: 'Password Reset', module: 'System' },
]

const SAMPLE_DATA = {
  'ticket.id': 'TKT-001',
  'ticket.title': 'Printer not working on 3rd floor',
  'ticket.description': 'The shared printer has stopped responding to print jobs.',
  'ticket.status': 'Open',
  'ticket.priority': 'High',
  'ticket.category': 'Hardware',
  'ticket.assignee': 'John Doe',
  'ticket.requester': 'Jane Smith',
  'ticket.createdAt': '2025-10-18 10:30 AM',
  'ticket.url': 'https://app.deskwise.com/tickets/TKT-001',
  'user.firstName': 'Jane',
  'user.lastName': 'Smith',
  'user.fullName': 'Jane Smith',
  'user.email': 'jane.smith@example.com',
  'user.title': 'Marketing Manager',
  'user.department': 'Marketing',
  'org.name': 'Acme Corporation',
  'org.domain': 'acme.com',
  'org.supportEmail': 'support@acme.com',
  'org.portalUrl': 'https://portal.acme.com',
  'system.date': '2025-10-18',
  'system.time': '2:30 PM',
  'system.year': '2025',
}

export default function EmailTemplatesPage() {
  const { data: session } = useSession()
  const { templates, loading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } =
    useEmailTemplates()
  const { toast } = useToast()

  const [search, setSearch] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null)

  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: '',
    eventType: '',
    subject: '',
    htmlBody: '',
    isActive: true,
  })

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchTemplates()
    }
  }, [isAdmin, fetchTemplates])

  const handleCreate = async () => {
    const result = await createTemplate(formData)
    if (result.success) {
      setIsCreateDialogOpen(false)
      resetForm()
    }
  }

  const handleUpdate = async () => {
    if (!selectedTemplate?._id) return
    const result = await updateTemplate(selectedTemplate._id, formData)
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedTemplate(null)
      resetForm()
    }
  }

  const handleDelete = async () => {
    if (!templateToDelete?._id) return
    const result = await deleteTemplate(templateToDelete._id)
    if (result.success) {
      setTemplateToDelete(null)
    }
  }

  const handleDuplicate = async (id: string) => {
    await duplicateTemplate(id)
  }

  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.name,
      eventType: template.eventType,
      subject: template.subject,
      htmlBody: template.htmlBody,
      isActive: template.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const openTestDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsTestDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      eventType: '',
      subject: '',
      htmlBody: '',
      isActive: true,
    })
  }

  const insertVariable = (variable: string) => {
    setFormData({ ...formData, subject: formData.subject + variable })
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.eventType.toLowerCase().includes(search.toLowerCase())
  )

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="Email Templates"
          description="Manage email notification templates"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Mail className="h-6 w-6 text-purple-600" />}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access email templates.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.isActive).length,
    system: templates.filter((t) => t.isSystem).length,
    custom: templates.filter((t) => !t.isSystem).length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Email Templates"
        description="Create and manage email notification templates with dynamic content"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Mail className="h-6 w-6 text-purple-600" />}
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-purple-700">Total Templates</CardDescription>
            <CardTitle className="text-3xl text-purple-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Templates</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Templates</CardDescription>
            <CardTitle className="text-3xl">{stats.system}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Custom Templates</CardDescription>
            <CardTitle className="text-3xl">{stats.custom}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Design email templates with HTML and template variables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={search ? 'No templates found' : 'No templates created'}
              description={
                search
                  ? 'Try adjusting your search terms'
                  : 'Create your first email template to get started'
              }
              action={
                !search
                  ? {
                      label: 'Create Template',
                      onClick: () => setIsCreateDialogOpen(true),
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template._id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {EVENT_TYPES.find((e) => e.value === template.eventType)?.label ||
                          template.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      {template.isSystem ? (
                        <Badge variant="secondary">System</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {template.updatedAt
                        ? new Date(template.updatedAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTestDialog(template)}>
                            <Send className="h-4 w-4 mr-2" />
                            Send Test
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template._id!)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {!template.isSystem && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setTemplateToDelete(template)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>
              Design a new email template with HTML and template variables
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ticket Created Notification"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.module}
                          </Badge>
                          {event.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject">Subject Line</Label>
                  <VariablePicker onInsert={insertVariable} />
                </div>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., New Ticket: {{ticket.title}}"
                />
              </div>

              <TemplateEditor
                value={formData.htmlBody}
                onChange={(value) => setFormData({ ...formData, htmlBody: value })}
              />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Active Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this template for sending emails
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <EmailPreview
                subject={formData.subject}
                htmlBody={formData.htmlBody}
                sampleData={SAMPLE_DATA}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.eventType}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Modify the email template design and content
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Template Name</Label>
                <Input
                  id="editName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEventType">Event Type</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData({ ...formData, eventType: value })}
                  disabled={selectedTemplate?.isSystem}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="editSubject">Subject Line</Label>
                  <VariablePicker onInsert={insertVariable} />
                </div>
                <Input
                  id="editSubject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <TemplateEditor
                value={formData.htmlBody}
                onChange={(value) => setFormData({ ...formData, htmlBody: value })}
              />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Active Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this template for sending emails
                  </p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <EmailPreview
                subject={formData.subject}
                htmlBody={formData.htmlBody}
                sampleData={SAMPLE_DATA}
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

      {/* Test Email Dialog */}
      <TestEmailDialog
        open={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        templateId={selectedTemplate?._id}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be
              undone and may affect notification rules using this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
