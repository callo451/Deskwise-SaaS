'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, Save, AlertCircle } from 'lucide-react'
import { useWorkflowStore, WorkflowNode } from '@/lib/stores/workflow-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// Base schema for all nodes
const baseNodeSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
})

// Specific schemas for different node types
const triggerSchema = baseNodeSchema.extend({
  type: z.enum(['event', 'schedule', 'manual', 'webhook']),
  module: z.string().optional(),
  event: z.string().optional(),
})

const conditionSchema = baseNodeSchema.extend({
  logicOperator: z.enum(['AND', 'OR']),
})

const actionSchema = baseNodeSchema.extend({
  action: z.enum(['create', 'update', 'delete']),
  module: z.string(),
})

const notificationSchema = baseNodeSchema.extend({
  channels: z.array(z.enum(['email', 'sms', 'webhook', 'slack'])).optional(),
  recipientType: z.enum(['user', 'group', 'custom']).optional(),
  recipients: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
})

const assignmentSchema = baseNodeSchema.extend({
  assignmentType: z.enum(['user', 'group', 'roundRobin', 'loadBalanced']),
  assignTo: z.string().optional(),
  group: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
})

const slaSchema = baseNodeSchema.extend({
  responseTime: z.string().optional(),
  resolutionTime: z.string().optional(),
  businessHours: z.boolean().optional(),
  escalationEnabled: z.boolean().optional(),
  escalationTarget: z.string().optional(),
})

const approvalSchema = baseNodeSchema.extend({
  approvalType: z.enum(['single', 'sequential', 'parallel']),
  approvers: z.string().optional(),
  autoApproveAfter: z.string().optional(),
  requireComment: z.boolean().optional(),
})

const transformSchema = baseNodeSchema.extend({
  operations: z.array(z.string()).optional(),
  transformType: z.enum(['map', 'filter', 'aggregate', 'custom']).optional(),
  fieldMappings: z.string().optional(),
})

const delaySchema = baseNodeSchema.extend({
  delayType: z.enum(['fixed', 'dynamic', 'untilDate']),
  duration: z.string().optional(),
  unit: z.enum(['seconds', 'minutes', 'hours', 'days']).optional(),
  targetDate: z.string().optional(),
})

const loopSchema = baseNodeSchema.extend({
  loopType: z.enum(['forEach', 'while', 'count']),
  iterations: z.string().optional(),
  collection: z.string().optional(),
  condition: z.string().optional(),
})

const mergeSchema = baseNodeSchema.extend({
  strategy: z.enum(['waitAll', 'waitAny', 'waitFirst']),
  timeout: z.string().optional(),
})

const endSchema = baseNodeSchema.extend({
  endType: z.enum(['success', 'failure', 'cancel']),
  returnValue: z.string().optional(),
})

export function PropertiesPanel() {
  const { selectedNode, updateNode, selectNode } = useWorkflowStore()

  // Determine schema based on node type
  const getSchema = (nodeType?: string) => {
    switch (nodeType) {
      case 'trigger':
        return triggerSchema
      case 'condition':
        return conditionSchema
      case 'action':
        return actionSchema
      case 'notification':
        return notificationSchema
      case 'assignment':
        return assignmentSchema
      case 'sla':
        return slaSchema
      case 'approval':
        return approvalSchema
      case 'transform':
        return transformSchema
      case 'delay':
        return delaySchema
      case 'loop':
        return loopSchema
      case 'merge':
        return mergeSchema
      case 'end':
        return endSchema
      default:
        return baseNodeSchema
    }
  }

  const schema = getSchema(selectedNode?.type)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: selectedNode?.data || {},
  })

  // Reset form when selected node changes
  React.useEffect(() => {
    if (selectedNode) {
      reset({
        label: selectedNode.data.label,
        description: selectedNode.data.description,
        ...selectedNode.data.config,
      })
    }
  }, [selectedNode, reset])

  // Handle form submission
  const onSubmit = (data: any) => {
    if (!selectedNode) return

    const { label, description, ...config } = data

    updateNode(selectedNode.id, {
      label,
      description,
      config,
    })
  }

  // Handle close
  const handleClose = () => {
    selectNode(null)
  }

  // Empty state
  if (!selectedNode) {
    return (
      <div className="h-full bg-gray-50 dark:bg-[#141927] border-l border-gray-200 dark:border-white/10 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-white dark:bg-[#1e2536] border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4 shadow-sm">
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Node Selected</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Select a node from the canvas to view and edit its properties
        </p>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-[#141927] border-l border-gray-200 dark:border-white/10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{selectedNode.type} Node</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Form */}
      <ScrollArea className="flex-1">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="label" className="text-gray-900 dark:text-white">
                Label
              </Label>
              <Input
                id="label"
                {...register('label')}
                className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                placeholder="Node label"
              />
              {errors.label && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.label.message as string}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-900 dark:text-white">
                Description
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white resize-none"
                placeholder="Optional description"
                rows={2}
              />
            </div>
          </div>

          <Separator className="bg-gray-200 dark:bg-white/10" />

          {/* Node-specific configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Configuration</h3>

            {/* Trigger Node */}
            {selectedNode.type === 'trigger' && (
              <TriggerConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Condition Node */}
            {selectedNode.type === 'condition' && (
              <ConditionConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Action Node */}
            {selectedNode.type === 'action' && (
              <ActionConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Notification Node */}
            {selectedNode.type === 'notification' && (
              <NotificationConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Assignment Node */}
            {selectedNode.type === 'assignment' && (
              <AssignmentConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* SLA Node */}
            {selectedNode.type === 'sla' && (
              <SLAConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Approval Node */}
            {selectedNode.type === 'approval' && (
              <ApprovalConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Transform Node */}
            {selectedNode.type === 'transform' && (
              <TransformConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Delay Node */}
            {selectedNode.type === 'delay' && (
              <DelayConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Loop Node */}
            {selectedNode.type === 'loop' && (
              <LoopConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* Merge Node */}
            {selectedNode.type === 'merge' && (
              <MergeConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}

            {/* End Node */}
            {selectedNode.type === 'end' && (
              <EndConfig register={register} errors={errors} setValue={setValue} watch={watch} />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Apply
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  )
}

// Trigger configuration component
function TriggerConfig({ register, errors, setValue, watch }: any) {
  const triggerType = watch('type')

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="type" className="text-gray-900 dark:text-white">
          Trigger Type
        </Label>
        <Select
          value={triggerType}
          onValueChange={(value) => setValue('type', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="event">Event-based</SelectItem>
            <SelectItem value="schedule">Schedule-based</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {triggerType === 'event' && (
        <>
          <div>
            <Label htmlFor="module" className="text-gray-900 dark:text-white">
              Module
            </Label>
            <Select
              value={watch('module')}
              onValueChange={(value) => setValue('module', value)}
            >
              <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tickets">Tickets</SelectItem>
                <SelectItem value="incidents">Incidents</SelectItem>
                <SelectItem value="changes">Changes</SelectItem>
                <SelectItem value="assets">Assets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="event" className="text-gray-900 dark:text-white">
              Event
            </Label>
            <Select
              value={watch('event')}
              onValueChange={(value) => setValue('event', value)}
            >
              <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="status_changed">Status Changed</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  )
}

// Condition configuration component
function ConditionConfig({ register, errors, setValue, watch }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="logicOperator" className="text-gray-900 dark:text-white">
          Logic Operator
        </Label>
        <Select
          value={watch('logicOperator')}
          onValueChange={(value) => setValue('logicOperator', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select operator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND (All must be true)</SelectItem>
            <SelectItem value="OR">OR (Any must be true)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Action configuration component
function ActionConfig({ register, errors, setValue, watch }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="action" className="text-gray-900 dark:text-white">
          Action Type
        </Label>
        <Select
          value={watch('action')}
          onValueChange={(value) => setValue('action', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="module" className="text-gray-900 dark:text-white">
          Module
        </Label>
        <Select
          value={watch('module')}
          onValueChange={(value) => setValue('module', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tickets">Tickets</SelectItem>
            <SelectItem value="incidents">Incidents</SelectItem>
            <SelectItem value="changes">Changes</SelectItem>
            <SelectItem value="assets">Assets</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Notification configuration component
function NotificationConfig({ register, errors, setValue, watch }: any) {
  const channels = watch('channels') || []

  const toggleChannel = (channel: string) => {
    const newChannels = channels.includes(channel)
      ? channels.filter((c: string) => c !== channel)
      : [...channels, channel]
    setValue('channels', newChannels)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-gray-900 dark:text-white mb-2 block">Notification Channels</Label>
        <div className="grid grid-cols-2 gap-2">
          {['email', 'sms', 'webhook', 'slack'].map((channel) => (
            <div
              key={channel}
              onClick={() => toggleChannel(channel)}
              className={cn(
                'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                channels.includes(channel)
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500'
                  : 'bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10'
              )}
            >
              <Checkbox checked={channels.includes(channel)} />
              <span className="text-sm text-gray-900 dark:text-white capitalize">{channel}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="recipientType" className="text-gray-900 dark:text-white">Recipient Type</Label>
        <Select
          value={watch('recipientType')}
          onValueChange={(value) => setValue('recipientType', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select recipient type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Specific User</SelectItem>
            <SelectItem value="group">User Group</SelectItem>
            <SelectItem value="custom">Custom Email</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="recipients" className="text-gray-900 dark:text-white">Recipients</Label>
        <Input
          id="recipients"
          {...register('recipients')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="user@example.com, user2@example.com"
        />
      </div>

      <div>
        <Label htmlFor="subject" className="text-gray-900 dark:text-white">Subject</Label>
        <Input
          id="subject"
          {...register('subject')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="Notification subject"
        />
      </div>

      <div>
        <Label htmlFor="message" className="text-gray-900 dark:text-white">Message</Label>
        <Textarea
          id="message"
          {...register('message')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="Notification message"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="priority" className="text-gray-900 dark:text-white">Priority</Label>
        <Select
          value={watch('priority')}
          onValueChange={(value) => setValue('priority', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// Assignment configuration component
function AssignmentConfig({ register, errors, setValue, watch }: any) {
  const assignmentType = watch('assignmentType')

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="assignmentType" className="text-gray-900 dark:text-white">Assignment Type</Label>
        <Select
          value={assignmentType}
          onValueChange={(value) => setValue('assignmentType', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select assignment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Specific User</SelectItem>
            <SelectItem value="group">User Group</SelectItem>
            <SelectItem value="roundRobin">Round Robin</SelectItem>
            <SelectItem value="loadBalanced">Load Balanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {assignmentType === 'user' && (
        <div>
          <Label htmlFor="assignTo" className="text-gray-900 dark:text-white">Assign To</Label>
          <Input
            id="assignTo"
            {...register('assignTo')}
            className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            placeholder="User email or ID"
          />
        </div>
      )}

      {(assignmentType === 'group' || assignmentType === 'roundRobin' || assignmentType === 'loadBalanced') && (
        <div>
          <Label htmlFor="group" className="text-gray-900 dark:text-white">Group</Label>
          <Select
            value={watch('group')}
            onValueChange={(value) => setValue('group', value)}
          >
            <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="support">Support Team</SelectItem>
              <SelectItem value="engineering">Engineering Team</SelectItem>
              <SelectItem value="sales">Sales Team</SelectItem>
              <SelectItem value="management">Management</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="priority" className="text-gray-900 dark:text-white">Priority</Label>
        <Select
          value={watch('priority')}
          onValueChange={(value) => setValue('priority', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// SLA configuration component
function SLAConfig({ register, errors, setValue, watch }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="responseTime" className="text-gray-900 dark:text-white">Response Time</Label>
        <Input
          id="responseTime"
          {...register('responseTime')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="e.g., 4 hours"
        />
      </div>

      <div>
        <Label htmlFor="resolutionTime" className="text-gray-900 dark:text-white">Resolution Time</Label>
        <Input
          id="resolutionTime"
          {...register('resolutionTime')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="e.g., 24 hours"
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="businessHours"
          checked={watch('businessHours')}
          onCheckedChange={(checked) => setValue('businessHours', checked)}
        />
        <Label htmlFor="businessHours" className="text-gray-900 dark:text-white cursor-pointer">
          Count business hours only
        </Label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="escalationEnabled"
          checked={watch('escalationEnabled')}
          onCheckedChange={(checked) => setValue('escalationEnabled', checked)}
        />
        <Label htmlFor="escalationEnabled" className="text-gray-900 dark:text-white cursor-pointer">
          Enable escalation
        </Label>
      </div>

      {watch('escalationEnabled') && (
        <div>
          <Label htmlFor="escalationTarget" className="text-gray-900 dark:text-white">Escalation Target</Label>
          <Input
            id="escalationTarget"
            {...register('escalationTarget')}
            className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            placeholder="User or group to escalate to"
          />
        </div>
      )}
    </div>
  )
}

// Approval configuration component
function ApprovalConfig({ register, errors, setValue, watch }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="approvalType" className="text-gray-900 dark:text-white">Approval Type</Label>
        <Select
          value={watch('approvalType')}
          onValueChange={(value) => setValue('approvalType', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select approval type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Approver</SelectItem>
            <SelectItem value="sequential">Sequential Approval</SelectItem>
            <SelectItem value="parallel">Parallel Approval (All must approve)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="approvers" className="text-gray-900 dark:text-white">Approvers</Label>
        <Textarea
          id="approvers"
          {...register('approvers')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="Enter approver emails, one per line"
          rows={3}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">One email per line</p>
      </div>

      <div>
        <Label htmlFor="autoApproveAfter" className="text-gray-900 dark:text-white">Auto-approve After</Label>
        <Input
          id="autoApproveAfter"
          {...register('autoApproveAfter')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="e.g., 48 hours"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave blank to require manual approval</p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="requireComment"
          checked={watch('requireComment')}
          onCheckedChange={(checked) => setValue('requireComment', checked)}
        />
        <Label htmlFor="requireComment" className="text-gray-900 dark:text-white cursor-pointer">
          Require comment on approval/rejection
        </Label>
      </div>
    </div>
  )
}

// Transform configuration component
function TransformConfig({ register, errors, setValue, watch }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="transformType" className="text-gray-900 dark:text-white">Transform Type</Label>
        <Select
          value={watch('transformType')}
          onValueChange={(value) => setValue('transformType', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select transform type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="map">Map Fields</SelectItem>
            <SelectItem value="filter">Filter Data</SelectItem>
            <SelectItem value="aggregate">Aggregate Data</SelectItem>
            <SelectItem value="custom">Custom Script</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="fieldMappings" className="text-gray-900 dark:text-white">Field Mappings</Label>
        <Textarea
          id="fieldMappings"
          {...register('fieldMappings')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono text-sm"
          placeholder='{"sourceField": "targetField", "priority": "urgency"}'
          rows={5}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JSON format</p>
      </div>
    </div>
  )
}

// Delay configuration component
function DelayConfig({ register, errors, setValue, watch }: any) {
  const delayType = watch('delayType')

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="delayType" className="text-gray-900 dark:text-white">Delay Type</Label>
        <Select
          value={delayType}
          onValueChange={(value) => setValue('delayType', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select delay type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Duration</SelectItem>
            <SelectItem value="dynamic">Dynamic (from field)</SelectItem>
            <SelectItem value="untilDate">Until Specific Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {delayType === 'fixed' && (
        <>
          <div>
            <Label htmlFor="duration" className="text-gray-900 dark:text-white">Duration</Label>
            <Input
              id="duration"
              {...register('duration')}
              type="number"
              className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
              placeholder="Enter number"
            />
          </div>

          <div>
            <Label htmlFor="unit" className="text-gray-900 dark:text-white">Unit</Label>
            <Select
              value={watch('unit')}
              onValueChange={(value) => setValue('unit', value)}
            >
              <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seconds">Seconds</SelectItem>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {delayType === 'dynamic' && (
        <div>
          <Label htmlFor="duration" className="text-gray-900 dark:text-white">Field Name</Label>
          <Input
            id="duration"
            {...register('duration')}
            className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            placeholder="e.g., ticket.responseTime"
          />
        </div>
      )}

      {delayType === 'untilDate' && (
        <div>
          <Label htmlFor="targetDate" className="text-gray-900 dark:text-white">Target Date</Label>
          <Input
            id="targetDate"
            {...register('targetDate')}
            type="datetime-local"
            className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          />
        </div>
      )}
    </div>
  )
}

// Loop configuration component
function LoopConfig({ register, errors, setValue, watch }: any) {
  const loopType = watch('loopType')

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="loopType" className="text-gray-900 dark:text-white">Loop Type</Label>
        <Select
          value={loopType}
          onValueChange={(value) => setValue('loopType', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select loop type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="forEach">For Each (iterate over collection)</SelectItem>
            <SelectItem value="while">While (condition-based)</SelectItem>
            <SelectItem value="count">Fixed Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loopType === 'forEach' && (
        <div>
          <Label htmlFor="collection" className="text-gray-900 dark:text-white">Collection</Label>
          <Input
            id="collection"
            {...register('collection')}
            className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            placeholder="e.g., ticket.attachments"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Field containing array/collection</p>
        </div>
      )}

      {loopType === 'while' && (
        <div>
          <Label htmlFor="condition" className="text-gray-900 dark:text-white">Condition</Label>
          <Textarea
            id="condition"
            {...register('condition')}
            className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono text-sm"
            placeholder="e.g., status != 'resolved'"
            rows={2}
          />
        </div>
      )}

      {loopType === 'count' && (
        <div>
          <Label htmlFor="iterations" className="text-gray-900 dark:text-white">Number of Iterations</Label>
          <Input
            id="iterations"
            {...register('iterations')}
            type="number"
            className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            placeholder="Enter number"
          />
        </div>
      )}
    </div>
  )
}

// Merge configuration component
function MergeConfig({ register, errors, setValue, watch }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="strategy" className="text-gray-900 dark:text-white">Merge Strategy</Label>
        <Select
          value={watch('strategy')}
          onValueChange={(value) => setValue('strategy', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="waitAll">Wait for All Branches</SelectItem>
            <SelectItem value="waitAny">Wait for Any Branch</SelectItem>
            <SelectItem value="waitFirst">Use First to Complete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="timeout" className="text-gray-900 dark:text-white">Timeout (optional)</Label>
        <Input
          id="timeout"
          {...register('timeout')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          placeholder="e.g., 5 minutes"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave blank for no timeout</p>
      </div>
    </div>
  )
}

// End configuration component
function EndConfig({ register, errors, setValue, watch }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="endType" className="text-gray-900 dark:text-white">End Type</Label>
        <Select
          value={watch('endType')}
          onValueChange={(value) => setValue('endType', value)}
        >
          <SelectTrigger className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
            <SelectValue placeholder="Select end type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failure">Failure</SelectItem>
            <SelectItem value="cancel">Cancel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="returnValue" className="text-gray-900 dark:text-white">Return Value (optional)</Label>
        <Textarea
          id="returnValue"
          {...register('returnValue')}
          className="mt-1.5 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono text-sm"
          placeholder='{"status": "completed", "result": "..."}'
          rows={3}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">JSON format (optional)</p>
      </div>
    </div>
  )
}

// Missing import
function Settings({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
