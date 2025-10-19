'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { WorkflowCanvas } from '@/components/workflows/WorkflowCanvas'
import { BasicWorkflowBuilder } from '@/components/workflows/BasicWorkflowBuilder'
import { StepDefinition, WorkflowDefinition, WorkflowValidationError } from '@/lib/types'

export default function NewWorkflowPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<WorkflowValidationError[]>([])
  const [builderMode, setBuilderMode] = useState<'basic' | 'advanced'>('basic')
  
  const [workflow, setWorkflow] = useState({
    name: '',
    description: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as const,
    isTemplate: false,
    steps: [] as StepDefinition[],
    triggers: [],
    settings: {
      maxExecutionTime: 300, // 5 minutes
      retryPolicy: {
        enabled: false,
        maxRetries: 3,
        backoffStrategy: 'exponential' as const,
        backoffMultiplier: 2
      },
      errorHandling: {
        onStepFailure: 'stop' as const,
        notifyOnFailure: true,
        notificationEmails: []
      },
      concurrency: {
        enabled: false,
        maxConcurrentRuns: 1
      }
    }
  })

  const [tagInput, setTagInput] = useState('')

  const handleSave = async (steps?: StepDefinition[]) => {
    if (!user) return
    
    setSaving(true)
    setValidationErrors([])
    
    try {
      const workflowData = {
        ...workflow,
        steps: steps || workflow.steps,
        version: 1
      }

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/workflows/${result.workflow.id}`)
      } else {
        const error = await response.json()
        if (error.validationErrors) {
          setValidationErrors(error.validationErrors)
        } else {
          console.error('Save failed:', error)
        }
      }
    } catch (error) {
      console.error('Failed to save workflow:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (steps: StepDefinition[]) => {
    setTesting(true)
    
    try {
      // For now, just validate the workflow
      const tempWorkflow: WorkflowDefinition = {
        ...workflow,
        steps,
        id: 'temp',
        orgId: 'temp',
        createdBy: user?.id || 'temp',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        metadata: {
          complexity: 'simple',
          usageCount: 0,
          successRate: 0
        }
      }
      
      // TODO: Implement proper test run functionality
      console.log('Testing workflow with steps:', steps)
      setValidationErrors([])
      
    } catch (error) {
      console.error('Failed to test workflow:', error)
    } finally {
      setTesting(false)
    }
  }

  const updateWorkflowField = (field: string, value: any) => {
    setWorkflow(prev => ({ ...prev, [field]: value }))
  }

  type Settings = WorkflowDefinition['settings']
  type UpdatableSettingsKey = 'retryPolicy' | 'errorHandling' | 'concurrency'

  const updateSettings = <
    K extends UpdatableSettingsKey,
    F extends keyof Settings[K]
  >(category: K, field: F, value: Settings[K][F]) => {
    setWorkflow(prev => {
      const current = prev.settings[category] as unknown as Record<string, any>
      const updated = Object.assign({}, current, { [field as string]: value }) as unknown as Settings[K]
      return {
        ...prev,
        settings: {
          ...prev.settings,
          [category]: updated,
        },
      }
    })
  }

  const addTag = () => {
    if (tagInput.trim() && !workflow.tags.includes(tagInput.trim())) {
      updateWorkflowField('tags', [...workflow.tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateWorkflowField('tags', workflow.tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/workflows">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workflows
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Workflow</h1>
          <p className="text-muted-foreground">
            Design and configure your automated workflow
          </p>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-red-700">
                  • {error.message}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="builder" className="w-full">
        <TabsList>
          <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Define the basic properties of your workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workflow Name *</Label>
                  <Input
                    id="name"
                    value={workflow.name}
                    onChange={(e) => updateWorkflowField('name', e.target.value)}
                    placeholder="Auto-assign critical tickets"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={workflow.category}
                    onValueChange={(value) => updateWorkflowField('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ticketing">Ticketing</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Alerts">Alerts</SelectItem>
                      <SelectItem value="Reporting">Reporting</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={workflow.description}
                  onChange={(e) => updateWorkflowField('description', e.target.value)}
                  placeholder="Describe what this workflow does and when it should run"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {workflow.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer"
                      onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add tags (press Enter)"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Workflow Design</CardTitle>
                <CardDescription>
                  {builderMode === 'basic' ? 'Guided rule builder for non-technical users' : 'Drag and drop steps to build your workflow'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={builderMode === 'basic' ? 'default' : 'outline'} onClick={() => setBuilderMode('basic')}>Basic</Button>
                <Button size="sm" variant={builderMode === 'advanced' ? 'default' : 'outline'} onClick={() => setBuilderMode('advanced')}>Advanced</Button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-theme(spacing.20))]">
              {builderMode === 'basic' ? (
                <div className="h-full relative">
                  <BasicWorkflowBuilder
                    initialSteps={workflow.steps}
                    onChange={(steps) => updateWorkflowField('steps', steps)}
                    onSave={(steps) => handleSave(steps)}
                    onTest={(steps) => handleTest(steps)}
                  />
                </div>
              ) : (
                <WorkflowCanvas
                  initialSteps={workflow.steps}
                  onSave={handleSave}
                  onTest={handleTest}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution Settings</CardTitle>
              <CardDescription>
                Configure how the workflow should execute
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-execution">Max Execution Time (seconds)</Label>
                <Input
                  id="max-execution"
                  type="number"
                  min="10"
                  max="3600"
                  value={workflow.settings.maxExecutionTime}
                  onChange={(e) => updateWorkflowField('settings', {
                    ...workflow.settings,
                    maxExecutionTime: parseInt(e.target.value) || 300
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>On Step Failure</Label>
                <Select
                  value={workflow.settings.errorHandling.onStepFailure}
                  onValueChange={(value) =>
                    updateSettings(
                      'errorHandling',
                      'onStepFailure',
                      value as 'stop' | 'continue' | 'retry'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stop">Stop workflow</SelectItem>
                    <SelectItem value="continue">Continue to next step</SelectItem>
                    <SelectItem value="retry">Retry step</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Retry Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="retry-enabled"
                  checked={workflow.settings.retryPolicy.enabled}
                  onChange={(e) => updateSettings('retryPolicy', 'enabled', e.target.checked)}
                />
                <Label htmlFor="retry-enabled">Enable automatic retry</Label>
              </div>

              {workflow.settings.retryPolicy.enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="max-retries">Max Retries</Label>
                    <Input
                      id="max-retries"
                      type="number"
                      min="1"
                      max="10"
                      value={workflow.settings.retryPolicy.maxRetries}
                      onChange={(e) => updateSettings('retryPolicy', 'maxRetries', parseInt(e.target.value) || 3)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Backoff Strategy</Label>
                    <Select
                      value={workflow.settings.retryPolicy.backoffStrategy}
                      onValueChange={(value) =>
                        updateSettings(
                          'retryPolicy',
                          'backoffStrategy',
                          value as 'fixed' | 'linear' | 'exponential'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed delay</SelectItem>
                        <SelectItem value="linear">Linear backoff</SelectItem>
                        <SelectItem value="exponential">Exponential backoff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Concurrency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="concurrency-enabled"
                  checked={workflow.settings.concurrency.enabled}
                  onChange={(e) => updateSettings('concurrency', 'enabled', e.target.checked)}
                />
                <Label htmlFor="concurrency-enabled">Allow concurrent runs</Label>
              </div>

              {workflow.settings.concurrency.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="max-concurrent">Max Concurrent Runs</Label>
                  <Input
                    id="max-concurrent"
                    type="number"
                    min="1"
                    max="100"
                    value={workflow.settings.concurrency.maxConcurrentRuns}
                    onChange={(e) => updateSettings('concurrency', 'maxConcurrentRuns', parseInt(e.target.value) || 1)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => handleTest(workflow.steps)}
          disabled={testing || workflow.steps.length === 0}
        >
          <Eye className="h-4 w-4 mr-2" />
          {testing ? 'Testing...' : 'Test Workflow'}
        </Button>
        <Button
          onClick={() => handleSave()}
          disabled={saving || !workflow.name.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Workflow'}
        </Button>
      </div>
    </div>
  )
}