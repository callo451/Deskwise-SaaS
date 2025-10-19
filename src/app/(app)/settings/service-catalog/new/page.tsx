'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Save,
  Eye,
  PlusCircle,
  Trash2,
  Settings,
  FormInput,
  Package,
  ListTree,
  Workflow,
  FileText,
  Layers,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SettingsHeader } from '@/components/settings/settings-header'
import { IconPicker } from '@/components/service-catalog/icon-picker'
import type { FormField, FormSection } from '@/lib/types'

export default function NewServicePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  // Basic Information
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [category, setCategory] = useState('')
  const [icon, setIcon] = useState('Wrench')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Request Settings
  const [requestCategory, setRequestCategory] = useState<string>('service-request')
  const [requestType, setRequestType] = useState('')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [requiresApproval, setRequiresApproval] = useState(false)

  // SLA Configuration
  const [slaResponseTime, setSlaResponseTime] = useState<string>('')
  const [slaResolutionTime, setSlaResolutionTime] = useState<string>('')

  // Form Builder
  const [fields, setFields] = useState<FormField[]>([])
  const [sections, setSections] = useState<FormSection[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  // Categories and Templates
  const [categories, setCategories] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  useEffect(() => {
    fetchCategories()
    fetchTemplates()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/service-catalog/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        if (data.length > 0) {
          setCategory(data[0].name)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/service-catalog/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleAddField = (type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: type as any,
      label: `New ${type} Field`,
      description: '',
      placeholder: '',
      required: false,
      order: fields.length,
      validations: [],
    }
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f))
  }

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }

  const handleSave = async () => {
    if (!name || !category) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/service-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          shortDescription,
          category,
          icon,
          tags,
          type: 'fixed',
          estimatedTime,
          requiresApproval,
          slaResponseTime: slaResponseTime ? parseInt(slaResponseTime) : undefined,
          slaResolutionTime: slaResolutionTime ? parseInt(slaResolutionTime) : undefined,
          itilCategory: requestCategory,
          requestType,
          templateId: selectedTemplate || undefined,
        }),
      })

      if (response.ok) {
        const service = await response.json()

        // Update form schema if fields were added
        if (fields.length > 0 || sections.length > 0) {
          await fetch(`/api/service-catalog/${service._id}/form-schema`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields,
              sections,
              changelog: 'Initial form creation',
            }),
          })
        }

        toast({
          title: 'Success',
          description: 'Service created successfully',
        })
        router.push('/settings/service-catalog')
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create service',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create service',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedField = fields.find(f => f.id === selectedFieldId)

  const fieldTypes = [
    { value: 'text', label: 'Short Text', icon: FormInput },
    { value: 'textarea', label: 'Long Text', icon: FileText },
    { value: 'number', label: 'Number', icon: FormInput },
    { value: 'email', label: 'Email', icon: FormInput },
    { value: 'phone', label: 'Phone', icon: FormInput },
    { value: 'date', label: 'Date', icon: FormInput },
    { value: 'select', label: 'Dropdown', icon: ListTree },
    { value: 'checkbox', label: 'Checkboxes', icon: FormInput },
    { value: 'radio', label: 'Radio Buttons', icon: FormInput },
    { value: 'boolean', label: 'Yes/No', icon: FormInput },
    { value: 'priority', label: 'Priority (ITIL)', icon: Settings },
    { value: 'impact', label: 'Impact (ITIL)', icon: Settings },
    { value: 'urgency', label: 'Urgency (ITIL)', icon: Settings },
    { value: 'user-select', label: 'User Picker', icon: FormInput },
    { value: 'asset-select', label: 'Asset Picker', icon: Package },
  ]

  return (
    <div className="space-y-6 pb-16">
      <SettingsHeader
        title="Create Service"
        description="Build a custom service request form with the comprehensive form builder"
        breadcrumbs={[
          { label: 'Settings', href: '/settings' },
          { label: 'Service Catalog', href: '/settings/service-catalog' },
        ]}
        icon={<Package className="h-6 w-6 text-purple-600" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/settings/service-catalog')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Creating...' : 'Create Service'}
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="itil">Request Settings</TabsTrigger>
          <TabsTrigger value="form-builder">Form Builder</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the service details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Password Reset Request"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <IconPicker
                    value={icon}
                    onChange={setIcon}
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief description for catalog card"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Full Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Detailed description of the service"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add tag and press Enter"
                    />
                    <Button type="button" onClick={handleAddTag}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itil" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Request Settings</CardTitle>
              <CardDescription>Configure how this service request integrates with your workflow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requestCategory">Request Category</Label>
                  <Select value={requestCategory} onValueChange={setRequestCategory}>
                    <SelectTrigger id="requestCategory">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service-request">Service Request</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="problem">Problem</SelectItem>
                      <SelectItem value="change">Change Request</SelectItem>
                      <SelectItem value="general">General Ticket</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Submissions will create items in the corresponding module
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestType">Request Type</Label>
                  <Input
                    id="requestType"
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    placeholder="e.g., Access Request, Password Reset"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedTime">Estimated Time</Label>
                  <Input
                    id="estimatedTime"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="e.g., 2-4 hours, 1-2 days"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Approval Required</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={requiresApproval}
                      onCheckedChange={setRequiresApproval}
                    />
                    <span className="text-sm text-muted-foreground">
                      {requiresApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slaResponse">SLA Response Time (hours)</Label>
                  <Input
                    id="slaResponse"
                    type="number"
                    value={slaResponseTime}
                    onChange={(e) => setSlaResponseTime(e.target.value)}
                    placeholder="e.g., 4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slaResolution">SLA Resolution Time (hours)</Label>
                  <Input
                    id="slaResolution"
                    type="number"
                    value={slaResolutionTime}
                    onChange={(e) => setSlaResolutionTime(e.target.value)}
                    placeholder="e.g., 24"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form-builder" className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Field Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fieldTypes.map((fieldType) => (
                    <Button
                      key={fieldType.value}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleAddField(fieldType.value)}
                    >
                      <fieldType.icon className="h-4 w-4 mr-2" />
                      {fieldType.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Form Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {fields.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FormInput className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No fields added yet. Select a field type from the left.</p>
                    </div>
                  ) : (
                    fields.map((field) => (
                      <div
                        key={field.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedFieldId === field.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedFieldId(field.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{field.label}</p>
                            <p className="text-sm text-muted-foreground">{field.type}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteField(field.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Field Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedField ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={selectedField.label}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, { label: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={selectedField.description || ''}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, { description: e.target.value })
                          }
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={selectedField.placeholder || ''}
                          onChange={(e) =>
                            handleUpdateField(selectedField.id, { placeholder: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={selectedField.required}
                          onCheckedChange={(checked) =>
                            handleUpdateField(selectedField.id, { required: checked })
                          }
                        />
                        <Label>Required Field</Label>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Select a field to edit its properties
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>Preview how the form will appear to end users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-6 bg-muted/30">
                <h3 className="text-xl font-semibold mb-2">{name || 'Service Name'}</h3>
                <p className="text-muted-foreground mb-4">
                  {shortDescription || description || 'Service description will appear here'}
                </p>
                <Separator className="my-4" />
                <div className="space-y-4">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label>
                        {field.label}
                        {field.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {field.description && (
                        <p className="text-sm text-muted-foreground">{field.description}</p>
                      )}
                      <div className="bg-background border rounded-md p-2 text-muted-foreground">
                        {field.placeholder || `${field.type} field`}
                      </div>
                    </div>
                  ))}
                  {fields.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No form fields defined. Add fields in the Form Builder tab.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
