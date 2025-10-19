'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Ticket,
  AlertTriangle,
  Settings,
  HelpCircle,
  GitBranch,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { TicketType } from '@/lib/types'

const TICKET_TYPES = [
  {
    value: 'ticket' as const,
    label: 'Ticket',
    description: 'General support ticket or request',
    icon: Ticket,
    color: 'text-blue-600',
  },
  {
    value: 'incident' as const,
    label: 'Incident',
    description: 'Unplanned service interruption or quality reduction',
    icon: AlertTriangle,
    color: 'text-red-600',
  },
  {
    value: 'service_request' as const,
    label: 'Service Request',
    description: 'Request for service from catalog',
    icon: HelpCircle,
    color: 'text-green-600',
  },
  {
    value: 'change' as const,
    label: 'Change',
    description: 'Planned modification to IT infrastructure',
    icon: Settings,
    color: 'text-orange-600',
  },
  {
    value: 'problem' as const,
    label: 'Problem',
    description: 'Root cause analysis for recurring incidents',
    icon: GitBranch,
    color: 'text-purple-600',
  },
]

export default function NewUnifiedTicketPage() {
  const router = useRouter()
  const [ticketType, setTicketType] = useState<TicketType>('ticket')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
  })

  const handleTypeChange = (type: TicketType) => {
    setTicketType(type)
    // Reset form data with type-specific defaults
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      // Type-specific defaults
      ...(type === 'incident' && {
        severity: 'minor',
        impact: 'low',
        urgency: 'low',
        affectedServices: [],
        isPublic: false,
      }),
      ...(type === 'change' && {
        risk: 'low',
        impact: 'low',
        plannedStartDate: '',
        plannedEndDate: '',
        backoutPlan: '',
        testPlan: '',
        implementationPlan: '',
      }),
      ...(type === 'service_request' && {
        serviceId: '',
        formData: {},
      }),
      ...(type === 'problem' && {
        impact: 'low',
        urgency: 'low',
        affectedServices: [],
        isPublic: false,
        relatedIncidents: [],
      }),
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Build request payload based on ticket type
      const payload: any = {
        type: ticketType,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: formData.category,
        tags: formData.tags || [],
      }

      // Add type-specific fields
      if (ticketType === 'ticket') {
        payload.requesterId = 'current-user' // This would come from session
        payload.clientId = formData.clientId
        payload.assignedTo = formData.assignedTo
        payload.linkedAssets = formData.linkedAssets || []
      }

      if (ticketType === 'incident') {
        payload.severity = formData.severity
        payload.impact = formData.impact
        payload.urgency = formData.urgency
        payload.affectedServices = formData.affectedServices || []
        payload.isPublic = formData.isPublic || false
        payload.assignedTo = formData.assignedTo
      }

      if (ticketType === 'service_request') {
        payload.requesterId = 'current-user'
        payload.clientId = formData.clientId
        payload.serviceId = formData.serviceId
        payload.formData = formData.formData || {}
      }

      if (ticketType === 'change') {
        payload.risk = formData.risk
        payload.impact = formData.impact
        payload.requestedBy = 'current-user'
        payload.plannedStartDate = new Date(formData.plannedStartDate).toISOString()
        payload.plannedEndDate = new Date(formData.plannedEndDate).toISOString()
        payload.backoutPlan = formData.backoutPlan
        payload.testPlan = formData.testPlan
        payload.implementationPlan = formData.implementationPlan
        payload.affectedAssets = formData.affectedAssets || []
      }

      if (ticketType === 'problem') {
        payload.reportedBy = 'current-user'
        payload.impact = formData.impact
        payload.urgency = formData.urgency
        payload.affectedServices = formData.affectedServices || []
        payload.isPublic = formData.isPublic || false
        payload.relatedIncidents = formData.relatedIncidents || []
      }

      const response = await fetch('/api/unified-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create ticket')
      }

      // Redirect to the new ticket
      router.push(`/unified-tickets/${data.ticket._id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderTypeSpecificFields = () => {
    switch (ticketType) {
      case 'incident':
        return (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">Severity *</Label>
                <Select value={formData.severity} onValueChange={(v) => handleInputChange('severity', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact *</Label>
                <Select value={formData.impact} onValueChange={(v) => handleInputChange('impact', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <Select value={formData.urgency} onValueChange={(v) => handleInputChange('urgency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Priority will be calculated: {formData.impact} × {formData.urgency}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affectedServices">Affected Services *</Label>
              <Input
                id="affectedServices"
                placeholder="e.g., Email, Database, Web Application (comma-separated)"
                value={formData.affectedServices?.join(', ') || ''}
                onChange={(e) =>
                  handleInputChange(
                    'affectedServices',
                    e.target.value.split(',').map((s) => s.trim())
                  )
                }
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
              />
              <Label htmlFor="isPublic" className="text-sm font-normal cursor-pointer">
                Make this incident public (visible on status page)
              </Label>
            </div>
          </>
        )

      case 'change':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk">Risk Level *</Label>
                <Select value={formData.risk} onValueChange={(v) => handleInputChange('risk', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Standard change</SelectItem>
                    <SelectItem value="medium">Medium - Normal change</SelectItem>
                    <SelectItem value="high">High - Emergency CAB required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact *</Label>
                <Select value={formData.impact} onValueChange={(v) => handleInputChange('impact', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Single service</SelectItem>
                    <SelectItem value="medium">Medium - Multiple services</SelectItem>
                    <SelectItem value="high">High - Critical infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.risk === 'medium' || formData.risk === 'high') && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This change requires CAB (Change Advisory Board) approval before implementation.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plannedStartDate">Planned Start Date *</Label>
                <Input
                  id="plannedStartDate"
                  type="datetime-local"
                  value={formData.plannedStartDate}
                  onChange={(e) => handleInputChange('plannedStartDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedEndDate">Planned End Date *</Label>
                <Input
                  id="plannedEndDate"
                  type="datetime-local"
                  value={formData.plannedEndDate}
                  onChange={(e) => handleInputChange('plannedEndDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backoutPlan">Backout Plan *</Label>
              <Textarea
                id="backoutPlan"
                placeholder="Describe how to rollback this change if it fails..."
                value={formData.backoutPlan}
                onChange={(e) => handleInputChange('backoutPlan', e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">Required for all changes</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testPlan">Test Plan (Optional)</Label>
              <Textarea
                id="testPlan"
                placeholder="Describe how to test this change..."
                value={formData.testPlan}
                onChange={(e) => handleInputChange('testPlan', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="implementationPlan">Implementation Plan (Optional)</Label>
              <Textarea
                id="implementationPlan"
                placeholder="Step-by-step implementation instructions..."
                value={formData.implementationPlan}
                onChange={(e) => handleInputChange('implementationPlan', e.target.value)}
                rows={4}
              />
            </div>
          </>
        )

      case 'service_request':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="serviceId">Service Catalog Item (Optional)</Label>
              <Select value={formData.serviceId} onValueChange={(v) => handleInputChange('serviceId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hardware_request">Hardware Request</SelectItem>
                  <SelectItem value="software_request">Software Request</SelectItem>
                  <SelectItem value="access_request">Access Request</SelectItem>
                  <SelectItem value="account_creation">Account Creation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Service requests may require manager approval depending on your organization's policy.
              </AlertDescription>
            </Alert>
          </>
        )

      case 'problem':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact">Impact *</Label>
                <Select value={formData.impact} onValueChange={(v) => handleInputChange('impact', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <Select value={formData.urgency} onValueChange={(v) => handleInputChange('urgency', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="affectedServices">Affected Services (Optional)</Label>
              <Input
                id="affectedServices"
                placeholder="Services impacted by this problem (comma-separated)"
                value={formData.affectedServices?.join(', ') || ''}
                onChange={(e) =>
                  handleInputChange(
                    'affectedServices',
                    e.target.value.split(',').map((s) => s.trim())
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relatedIncidents">Related Incident IDs (Optional)</Label>
              <Input
                id="relatedIncidents"
                placeholder="e.g., INC-000123, INC-000456 (comma-separated)"
                value={formData.relatedIncidents?.join(', ') || ''}
                onChange={(e) =>
                  handleInputChange(
                    'relatedIncidents',
                    e.target.value.split(',').map((s) => s.trim())
                  )
                }
              />
              <p className="text-xs text-gray-500">Link related incidents for pattern analysis</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
              />
              <Label htmlFor="isPublic" className="text-sm font-normal cursor-pointer">
                Make this problem public (visible in Known Error Database)
              </Label>
            </div>
          </>
        )

      case 'ticket':
      default:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To (Optional)</Label>
              <Input
                id="assignedTo"
                placeholder="User ID or email"
                value={formData.assignedTo || ''}
                onChange={(e) => handleInputChange('assignedTo', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client (Optional)</Label>
              <Input
                id="clientId"
                placeholder="Client ID"
                value={formData.clientId || ''}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
          <p className="text-gray-500 mt-1">Choose a ticket type and fill in the details</p>
        </div>
      </div>

      {/* Type Selection */}
      <Card className="p-6">
        <Label className="text-base font-semibold mb-4 block">Ticket Type *</Label>
        <RadioGroup value={ticketType} onValueChange={(v) => handleTypeChange(v as TicketType)}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TICKET_TYPES.map((type) => {
              const Icon = type.icon
              return (
                <div key={type.value} className="relative">
                  <RadioGroupItem
                    value={type.value}
                    id={type.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={type.value}
                    className={`flex flex-col items-start p-4 border-2 rounded-lg cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-gray-300 ${
                      ticketType === type.value ? 'border-primary bg-primary/5' : 'border-gray-200'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${type.color}`} />
                    <span className="font-semibold text-gray-900">{type.label}</span>
                    <span className="text-sm text-gray-500 mt-1">{type.description}</span>
                  </Label>
                </div>
              )
            })}
          </div>
        </RadioGroup>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief summary of the issue or request"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {ticketType !== 'incident' && ticketType !== 'problem' && (
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(v) => handleInputChange('priority', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                placeholder="e.g., Hardware, Software, Network"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Type-Specific Fields */}
          {renderTypeSpecificFields()}

          {/* Submit */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create {TICKET_TYPES.find((t) => t.value === ticketType)?.label}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
