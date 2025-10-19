'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { WorkflowCategory, TriggerType } from '@/lib/types'

export default function NewWorkflowPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom' as WorkflowCategory,
    triggerType: 'manual' as TriggerType,
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create workflow with minimal data
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || '',
          category: formData.category,
          trigger: {
            type: formData.triggerType,
            config: {},
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Workflow created successfully',
        })
        // Redirect to builder
        router.push(`/workflows/${data.data._id}`)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create workflow',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast({
        title: 'Error',
        description: 'Failed to create workflow',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workflows">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Workflow</h1>
          <p className="text-muted-foreground">Create a new workflow automation</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Workflow Information</CardTitle>
                <CardDescription>
                  Provide basic information about your workflow
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Auto-Assign Critical Tickets"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Give your workflow a descriptive name
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this workflow does..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Explain the purpose and behavior of this workflow
              </p>
            </div>

            {/* Category and Trigger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value as WorkflowCategory)}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="service-request">Service Request</SelectItem>
                    <SelectItem value="change">Change</SelectItem>
                    <SelectItem value="problem">Problem</SelectItem>
                    <SelectItem value="ticket">Ticket</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Categorize your workflow
                </p>
              </div>

              {/* Trigger Type */}
              <div className="space-y-2">
                <Label htmlFor="triggerType">
                  Trigger Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => handleChange('triggerType', value as TriggerType)}
                >
                  <SelectTrigger id="triggerType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="event">Event-based</SelectItem>
                    <SelectItem value="schedule">Scheduled</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How should this workflow be triggered?
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-4">
              <div className="flex gap-3">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    What happens next?
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    After creating your workflow, you'll be taken to the visual builder where you can:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1 mt-2">
                    <li>Drag and drop workflow nodes</li>
                    <li>Configure triggers and actions</li>
                    <li>Set up conditional logic</li>
                    <li>Test your workflow before activation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create & Open Builder'}
              </Button>
              <Link href="/workflows">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
