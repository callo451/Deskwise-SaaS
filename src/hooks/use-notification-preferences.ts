'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface NotificationPreferences {
  _id?: string
  userId: string
  emailEnabled: boolean
  digestMode: 'realtime' | 'daily' | 'weekly'
  digestTime?: string
  quietHours?: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  modules: {
    tickets?: ModulePreferences
    incidents?: ModulePreferences
    changes?: ModulePreferences
    projects?: ModulePreferences
    assets?: ModulePreferences
    knowledgeBase?: ModulePreferences
  }
}

export interface ModulePreferences {
  assigned: boolean
  mentioned: boolean
  statusChange: boolean
  comments: boolean
  created?: boolean
  updated?: boolean
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchPreferences = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/preferences')
      const data = await response.json()

      if (data.success) {
        setPreferences(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch notification preferences',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch notification preferences',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      setLoading(true)
      try {
        const response = await fetch('/api/email/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        const data = await response.json()

        if (data.success) {
          setPreferences(data.data)
          toast({
            title: 'Success',
            description: 'Notification preferences saved successfully',
          })
          return { success: true, data: data.data }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to update preferences',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error updating preferences:', error)
        toast({
          title: 'Error',
          description: 'Failed to update preferences',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const updateModulePreferences = useCallback(
    async (module: string, modulePrefs: ModulePreferences) => {
      if (!preferences) return { success: false, error: 'No preferences loaded' }

      return updatePreferences({
        modules: {
          ...preferences.modules,
          [module]: modulePrefs,
        },
      })
    },
    [preferences, updatePreferences]
  )

  return {
    preferences,
    loading,
    fetchPreferences,
    updatePreferences,
    updateModulePreferences,
  }
}
