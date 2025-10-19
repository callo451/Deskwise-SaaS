'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface NotificationRule {
  _id?: string
  name: string
  eventType: string
  module: string
  templateId: string
  isActive: boolean
  conditions?: RuleCondition[]
  recipients: RuleRecipient
  priority?: number
  createdAt?: string
  updatedAt?: string
}

export interface RuleCondition {
  field: string
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'in'
  value: string | string[]
  logicalOperator?: 'AND' | 'OR'
}

export interface RuleRecipient {
  requester?: boolean
  assignee?: boolean
  watchers?: boolean
  customEmails?: string[]
  roles?: string[]
}

export interface CreateRuleInput {
  name: string
  eventType: string
  module: string
  templateId: string
  isActive?: boolean
  conditions?: RuleCondition[]
  recipients: RuleRecipient
}

export function useNotificationRules() {
  const [rules, setRules] = useState<NotificationRule[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/rules')
      const data = await response.json()

      if (data.success) {
        setRules(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch notification rules',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching notification rules:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch notification rules',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const createRule = useCallback(
    async (rule: CreateRuleInput) => {
      setLoading(true)
      try {
        const response = await fetch('/api/email/rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rule),
        })

        const data = await response.json()

        if (data.success) {
          setRules((prev) => [data.data, ...prev])
          toast({
            title: 'Success',
            description: 'Notification rule created successfully',
          })
          return { success: true, data: data.data }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to create rule',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error creating rule:', error)
        toast({
          title: 'Error',
          description: 'Failed to create rule',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const updateRule = useCallback(
    async (id: string, updates: Partial<NotificationRule>) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/email/rules/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        const data = await response.json()

        if (data.success) {
          setRules((prev) => prev.map((r) => (r._id === id ? data.data : r)))
          toast({
            title: 'Success',
            description: 'Notification rule updated successfully',
          })
          return { success: true, data: data.data }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to update rule',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error updating rule:', error)
        toast({
          title: 'Error',
          description: 'Failed to update rule',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const deleteRule = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/email/rules/${id}`, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (data.success) {
          setRules((prev) => prev.filter((r) => r._id !== id))
          toast({
            title: 'Success',
            description: 'Notification rule deleted successfully',
          })
          return { success: true }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to delete rule',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error deleting rule:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete rule',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const toggleRuleStatus = useCallback(
    async (id: string, isActive: boolean) => {
      return updateRule(id, { isActive })
    },
    [updateRule]
  )

  const testRule = useCallback(
    async (ruleId: string, testData?: Record<string, any>) => {
      try {
        const response = await fetch(`/api/email/rules/${ruleId}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testData }),
        })

        const data = await response.json()

        if (data.success) {
          return { success: true, data: data.data }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error testing rule:', error)
        return { success: false, error: 'Network error' }
      }
    },
    []
  )

  return {
    rules,
    loading,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    testRule,
  }
}
