'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Save, X } from 'lucide-react'
import { PortalPage } from '@/lib/types'

interface PageSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: PortalPage | null
  onSave: (settings: NonNullable<PortalPage['pageSettings']>) => Promise<void>
}

export function PageSettingsDialog({ open, onOpenChange, page, onSave }: PageSettingsDialogProps) {
  const [settings, setSettings] = useState<NonNullable<PortalPage['pageSettings']>>({
    enabled: true,
    welcomeMessage: '',
    showKnowledgeBase: true,
    showIncidentStatus: true,
    allowGuestSubmissions: false,
    guestSubmissionEmail: '',
    autoAssignment: false,
    defaultAssignee: '',
    notificationSettings: {
      emailOnSubmission: true,
      emailOnStatusChange: true,
      emailOnComment: false,
    },
    customAnnouncement: {
      enabled: false,
      message: '',
      type: 'info',
    },
  })

  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Initialize settings from page data
  useEffect(() => {
    if (page?.pageSettings) {
      setSettings({
        enabled: page.pageSettings.enabled ?? true,
        welcomeMessage: page.pageSettings.welcomeMessage ?? '',
        showKnowledgeBase: page.pageSettings.showKnowledgeBase ?? true,
        showIncidentStatus: page.pageSettings.showIncidentStatus ?? true,
        allowGuestSubmissions: page.pageSettings.allowGuestSubmissions ?? false,
        guestSubmissionEmail: page.pageSettings.guestSubmissionEmail ?? '',
        autoAssignment: page.pageSettings.autoAssignment ?? false,
        defaultAssignee: page.pageSettings.defaultAssignee ?? '',
        notificationSettings: page.pageSettings.notificationSettings ?? {
          emailOnSubmission: true,
          emailOnStatusChange: true,
          emailOnComment: false,
        },
        customAnnouncement: page.pageSettings.customAnnouncement ?? {
          enabled: false,
          message: '',
          type: 'info',
        },
      })
    }
  }, [page])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveMessage(null)
      await onSave(settings)
      setSaveMessage({ type: 'success', text: 'Settings saved successfully' })
      setTimeout(() => {
        setSaveMessage(null)
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error('Failed to save settings:', error)
      setSaveMessage({ type: 'error', text: 'Failed to save settings' })
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Page Settings</DialogTitle>
          <DialogDescription>
            Configure settings for this portal page. These settings control visibility, notifications, and behavior.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Portal Page</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle this page on/off without deleting it
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  placeholder="Enter a welcome message for users visiting this portal page..."
                  value={settings.welcomeMessage}
                  onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                  rows={3}
                />
                <p className="text-sm text-muted-foreground">
                  This message will be displayed at the top of the portal page
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Knowledge Base</Label>
                  <p className="text-sm text-muted-foreground">
                    Display knowledge base articles on this page
                  </p>
                </div>
                <Switch
                  checked={settings.showKnowledgeBase}
                  onCheckedChange={(checked) => setSettings({ ...settings, showKnowledgeBase: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Incident Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Display active incidents and their status
                  </p>
                </div>
                <Switch
                  checked={settings.showIncidentStatus}
                  onCheckedChange={(checked) => setSettings({ ...settings, showIncidentStatus: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Ticket Management Tab */}
          <TabsContent value="tickets" className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Guest Submissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow unauthenticated users to submit tickets
                  </p>
                </div>
                <Switch
                  checked={settings.allowGuestSubmissions}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowGuestSubmissions: checked })}
                />
              </div>

              {settings.allowGuestSubmissions && (
                <div className="space-y-2">
                  <Label htmlFor="guestEmail">Guest Submission Email</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    placeholder="support@company.com"
                    value={settings.guestSubmissionEmail}
                    onChange={(e) => setSettings({ ...settings, guestSubmissionEmail: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address where guest submissions will be sent
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Assignment</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign tickets to a default technician
                  </p>
                </div>
                <Switch
                  checked={settings.autoAssignment}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoAssignment: checked })}
                />
              </div>

              {settings.autoAssignment && (
                <div className="space-y-2">
                  <Label htmlFor="defaultAssignee">Default Assignee</Label>
                  <Input
                    id="defaultAssignee"
                    placeholder="User ID or email"
                    value={settings.defaultAssignee}
                    onChange={(e) => setSettings({ ...settings, defaultAssignee: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground">
                    User ID of the default assignee for auto-assignment
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="flex-1 overflow-y-auto space-y-6 py-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure email notifications for actions on this portal page
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email on Submission</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when a new ticket is submitted
                  </p>
                </div>
                <Switch
                  checked={settings.notificationSettings?.emailOnSubmission ?? true}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationSettings: {
                        ...settings.notificationSettings!,
                        emailOnSubmission: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email on Status Change</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when ticket status changes
                  </p>
                </div>
                <Switch
                  checked={settings.notificationSettings?.emailOnStatusChange ?? true}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationSettings: {
                        ...settings.notificationSettings!,
                        emailOnStatusChange: checked,
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email on Comment</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email when someone comments on a ticket
                  </p>
                </div>
                <Switch
                  checked={settings.notificationSettings?.emailOnComment ?? false}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notificationSettings: {
                        ...settings.notificationSettings!,
                        emailOnComment: checked,
                      },
                    })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Announcement</Label>
                  <p className="text-sm text-muted-foreground">
                    Show a custom announcement banner on this page
                  </p>
                </div>
                <Switch
                  checked={settings.customAnnouncement?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      customAnnouncement: {
                        ...settings.customAnnouncement!,
                        enabled: checked,
                      },
                    })
                  }
                />
              </div>

              {settings.customAnnouncement?.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="announcementType">Announcement Type</Label>
                    <Select
                      value={settings.customAnnouncement.type}
                      onValueChange={(value: 'info' | 'warning' | 'success') =>
                        setSettings({
                          ...settings,
                          customAnnouncement: {
                            ...settings.customAnnouncement!,
                            type: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcementMessage">Announcement Message</Label>
                    <Textarea
                      id="announcementMessage"
                      placeholder="Enter your announcement message..."
                      value={settings.customAnnouncement.message}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          customAnnouncement: {
                            ...settings.customAnnouncement!,
                            message: e.target.value,
                          },
                        })
                      }
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      This message will be displayed as a banner at the top of the page
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <Alert className={
                      settings.customAnnouncement.type === 'info'
                        ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100'
                        : settings.customAnnouncement.type === 'warning'
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-100'
                        : 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100'
                    }>
                      <AlertDescription>
                        {settings.customAnnouncement.message || 'Your announcement will appear here'}
                      </AlertDescription>
                    </Alert>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Message */}
        {saveMessage && (
          <div className={`px-4 py-2 rounded text-sm ${
            saveMessage.type === 'success'
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}>
            {saveMessage.text}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
