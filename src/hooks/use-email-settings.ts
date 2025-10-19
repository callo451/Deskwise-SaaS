'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface EmailSettings {
  _id?: string
  provider: 'ses' | 'smtp'
  ses?: {
    accessKeyId: string
    secretAccessKey: string
    region: string
    configurationSet?: string
  }
  smtp?: {
    host: string
    port: number
    username: string
    password: string
    secure: boolean
  }
  fromEmail: string
  fromName: string
  isConfigured: boolean
  lastTested?: string
  verifiedEmails?: string[]
  status?: 'connected' | 'not_configured' | 'error'
  errorMessage?: string
}

export function useEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/settings')
      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch email settings',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching email settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch email settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const saveSettings = useCallback(
    async (newSettings: Partial<EmailSettings>) => {
      setLoading(true)
      try {
        const response = await fetch('/api/email/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        })

        const data = await response.json()

        if (data.success) {
          setSettings(data.data)
          toast({
            title: 'Success',
            description: 'Email settings saved successfully',
          })
          return { success: true, data: data.data }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to save email settings',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error saving email settings:', error)
        toast({
          title: 'Error',
          description: 'Failed to save email settings',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const testConnection = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Email connection test successful',
        })
        // Update settings with test result
        if (settings) {
          setSettings({ ...settings, lastTested: new Date().toISOString(), status: 'connected' })
        }
        return { success: true, message: data.message }
      } else {
        toast({
          title: 'Connection Failed',
          description: data.error || 'Email connection test failed',
          variant: 'destructive',
        })
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: 'Error',
        description: 'Failed to test email connection',
        variant: 'destructive',
      })
      return { success: false, error: 'Network error' }
    } finally {
      setLoading(false)
    }
  }, [settings, toast])

  const verifyEmail = useCallback(
    async (email: string) => {
      setLoading(true)
      try {
        const response = await fetch('/api/email/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: 'Success',
            description: `Verification email sent to ${email}`,
          })
          return { success: true }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to send verification email',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error verifying email:', error)
        toast({
          title: 'Error',
          description: 'Failed to verify email',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  return {
    settings,
    loading,
    fetchSettings,
    saveSettings,
    testConnection,
    verifyEmail,
  }
}
