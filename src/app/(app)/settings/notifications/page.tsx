'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { SettingsHeader } from '@/components/settings/settings-header'
import { useNotificationPreferences, ModulePreferences } from '@/hooks/use-notification-preferences'
import { Bell, Loader2, Save, Clock, BellOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return { value: `${hour}:00`, label: `${hour}:00` }
})

export default function NotificationPreferencesPage() {
  const { data: session } = useSession()
  const { preferences, loading, fetchPreferences, updatePreferences } = useNotificationPreferences()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    emailEnabled: true,
    digestMode: 'realtime' as 'realtime' | 'daily' | 'weekly',
    digestTime: '09:00',
    quietHours: {
      enabled: false,
      startTime: '18:00',
      endTime: '08:00',
    },
    modules: {
      tickets: {
        assigned: true,
        mentioned: true,
        statusChange: true,
        comments: true,
      },
      incidents: {
        assigned: true,
        mentioned: true,
        statusChange: true,
        comments: true,
        created: false,
      },
      changes: {
        assigned: true,
        statusChange: true,
        comments: true,
        created: false,
      },
      projects: {
        assigned: true,
        mentioned: true,
        statusChange: false,
        comments: true,
      },
      assets: {
        assigned: true,
        updated: false,
      },
      knowledgeBase: {
        mentioned: true,
        comments: true,
      },
    },
  })

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  useEffect(() => {
    if (preferences) {
      setFormData({
        emailEnabled: preferences.emailEnabled,
        digestMode: preferences.digestMode,
        digestTime: preferences.digestTime || '09:00',
        quietHours: preferences.quietHours || formData.quietHours,
        modules: {
          ...formData.modules,
          ...preferences.modules,
        },
      })
    }
  }, [preferences])

  const handleSave = async () => {
    await updatePreferences(formData)
  }

  const updateModulePreference = (module: string, key: string, value: boolean) => {
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [module]: {
          ...(formData.modules as any)[module],
          [key]: value,
        },
      },
    })
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Notification Preferences"
        description="Customize your email notification settings"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Bell className="h-6 w-6 text-green-600" />}
      />

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Global Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Global Email Settings</CardTitle>
              <CardDescription>
                Control how and when you receive email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for updates and changes
                  </p>
                </div>
                <Switch
                  checked={formData.emailEnabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailEnabled: checked })}
                />
              </div>

              {formData.emailEnabled && (
                <>
                  <Separator />

                  <div className="space-y-4">
                    <Label>Delivery Mode</Label>
                    <RadioGroup
                      value={formData.digestMode}
                      onValueChange={(value: any) => setFormData({ ...formData, digestMode: value })}
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="realtime" id="realtime" />
                        <Label htmlFor="realtime" className="flex-1 font-normal cursor-pointer">
                          <div>
                            <div className="font-medium">Real-time Notifications</div>
                            <div className="text-sm text-muted-foreground">
                              Receive emails immediately when events occur
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="daily" id="daily" />
                        <Label htmlFor="daily" className="flex-1 font-normal cursor-pointer">
                          <div>
                            <div className="font-medium">Daily Digest</div>
                            <div className="text-sm text-muted-foreground">
                              Receive a summary email once per day
                            </div>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg">
                        <RadioGroupItem value="weekly" id="weekly" />
                        <Label htmlFor="weekly" className="flex-1 font-normal cursor-pointer">
                          <div>
                            <div className="font-medium">Weekly Digest</div>
                            <div className="text-sm text-muted-foreground">
                              Receive a summary email once per week
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {(formData.digestMode === 'daily' || formData.digestMode === 'weekly') && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="digestTime">Delivery Time</Label>
                        <Select
                          value={formData.digestTime}
                          onValueChange={(value) => setFormData({ ...formData, digestTime: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Quiet Hours
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Pause notifications during specific times
                        </p>
                      </div>
                      <Switch
                        checked={formData.quietHours.enabled}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            quietHours: { ...formData.quietHours, enabled: checked },
                          })
                        }
                      />
                    </div>

                    {formData.quietHours.enabled && (
                      <div className="grid gap-4 md:grid-cols-2 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Start Time</Label>
                          <Select
                            value={formData.quietHours.startTime}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                quietHours: { ...formData.quietHours, startTime: value },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endTime">End Time</Label>
                          <Select
                            value={formData.quietHours.endTime}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                quietHours: { ...formData.quietHours, endTime: value },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_OPTIONS.map((time) => (
                                <SelectItem key={time.value} value={time.value}>
                                  {time.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Module-Specific Settings */}
          {formData.emailEnabled && (
            <>
              {/* Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Notifications</CardTitle>
                  <CardDescription>
                    Choose which ticket events trigger email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tickets-assigned"
                      checked={formData.modules.tickets.assigned}
                      onCheckedChange={(checked) =>
                        updateModulePreference('tickets', 'assigned', checked)
                      }
                    />
                    <Label htmlFor="tickets-assigned" className="font-normal">
                      When a ticket is assigned to me
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tickets-mentioned"
                      checked={formData.modules.tickets.mentioned}
                      onCheckedChange={(checked) =>
                        updateModulePreference('tickets', 'mentioned', checked)
                      }
                    />
                    <Label htmlFor="tickets-mentioned" className="font-normal">
                      When I'm mentioned in a ticket comment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tickets-status"
                      checked={formData.modules.tickets.statusChange}
                      onCheckedChange={(checked) =>
                        updateModulePreference('tickets', 'statusChange', checked)
                      }
                    />
                    <Label htmlFor="tickets-status" className="font-normal">
                      When status changes on my tickets
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="tickets-comments"
                      checked={formData.modules.tickets.comments}
                      onCheckedChange={(checked) =>
                        updateModulePreference('tickets', 'comments', checked)
                      }
                    />
                    <Label htmlFor="tickets-comments" className="font-normal">
                      When someone comments on my tickets
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Incidents */}
              <Card>
                <CardHeader>
                  <CardTitle>Incident Notifications</CardTitle>
                  <CardDescription>
                    Manage email alerts for incident management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="incidents-assigned"
                      checked={formData.modules.incidents.assigned}
                      onCheckedChange={(checked) =>
                        updateModulePreference('incidents', 'assigned', checked)
                      }
                    />
                    <Label htmlFor="incidents-assigned" className="font-normal">
                      When an incident is assigned to me
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="incidents-status"
                      checked={formData.modules.incidents.statusChange}
                      onCheckedChange={(checked) =>
                        updateModulePreference('incidents', 'statusChange', checked)
                      }
                    />
                    <Label htmlFor="incidents-status" className="font-normal">
                      When incident status changes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="incidents-created"
                      checked={formData.modules.incidents.created || false}
                      onCheckedChange={(checked) =>
                        updateModulePreference('incidents', 'created', checked)
                      }
                    />
                    <Label htmlFor="incidents-created" className="font-normal">
                      When a new incident is created
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Projects */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Notifications</CardTitle>
                  <CardDescription>
                    Stay updated on project and task activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="projects-assigned"
                      checked={formData.modules.projects.assigned}
                      onCheckedChange={(checked) =>
                        updateModulePreference('projects', 'assigned', checked)
                      }
                    />
                    <Label htmlFor="projects-assigned" className="font-normal">
                      When assigned to a project or task
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="projects-mentioned"
                      checked={formData.modules.projects.mentioned}
                      onCheckedChange={(checked) =>
                        updateModulePreference('projects', 'mentioned', checked)
                      }
                    />
                    <Label htmlFor="projects-mentioned" className="font-normal">
                      When mentioned in project comments
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="projects-comments"
                      checked={formData.modules.projects.comments}
                      onCheckedChange={(checked) =>
                        updateModulePreference('projects', 'comments', checked)
                      }
                    />
                    <Label htmlFor="projects-comments" className="font-normal">
                      When someone comments on my projects
                    </Label>
                  </div>
                </CardContent>
              </Card>

              {/* Assets */}
              <Card>
                <CardHeader>
                  <CardTitle>Asset Notifications</CardTitle>
                  <CardDescription>
                    Alerts for asset management activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="assets-assigned"
                      checked={formData.modules.assets.assigned}
                      onCheckedChange={(checked) =>
                        updateModulePreference('assets', 'assigned', checked)
                      }
                    />
                    <Label htmlFor="assets-assigned" className="font-normal">
                      When an asset is assigned to me
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="assets-updated"
                      checked={formData.modules.assets.updated || false}
                      onCheckedChange={(checked) =>
                        updateModulePreference('assets', 'updated', checked)
                      }
                    />
                    <Label htmlFor="assets-updated" className="font-normal">
                      When my assets are updated
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
