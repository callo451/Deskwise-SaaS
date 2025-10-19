'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface EmailTemplate {
  _id?: string
  name: string
  eventType: string
  subject: string
  htmlBody: string
  isActive: boolean
  isSystem?: boolean
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export interface CreateTemplateInput {
  name: string
  eventType: string
  subject: string
  htmlBody: string
  isActive?: boolean
}

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/email/templates')
      const data = await response.json()

      if (data.success) {
        setTemplates(data.data)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch email templates',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching email templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch email templates',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const getTemplate = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/email/templates/${id}`)
        const data = await response.json()

        if (data.success) {
          return { success: true, data: data.data }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to fetch template',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error fetching template:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch template',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const createTemplate = useCallback(
    async (template: CreateTemplateInput) => {
      setLoading(true)
      try {
        const response = await fetch('/api/email/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(template),
        })

        const data = await response.json()

        if (data.success) {
          setTemplates((prev) => [data.data, ...prev])
          toast({
            title: 'Success',
            description: 'Email template created successfully',
          })
          return { success: true, data: data.data }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to create template',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error creating template:', error)
        toast({
          title: 'Error',
          description: 'Failed to create template',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const updateTemplate = useCallback(
    async (id: string, updates: Partial<EmailTemplate>) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/email/templates/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        const data = await response.json()

        if (data.success) {
          setTemplates((prev) => prev.map((t) => (t._id === id ? data.data : t)))
          toast({
            title: 'Success',
            description: 'Email template updated successfully',
          })
          return { success: true, data: data.data }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to update template',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error updating template:', error)
        toast({
          title: 'Error',
          description: 'Failed to update template',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const deleteTemplate = useCallback(
    async (id: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/email/templates/${id}`, {
          method: 'DELETE',
        })

        const data = await response.json()

        if (data.success) {
          setTemplates((prev) => prev.filter((t) => t._id !== id))
          toast({
            title: 'Success',
            description: 'Email template deleted successfully',
          })
          return { success: true }
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to delete template',
            variant: 'destructive',
          })
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error deleting template:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete template',
          variant: 'destructive',
        })
        return { success: false, error: 'Network error' }
      } finally {
        setLoading(false)
      }
    },
    [toast]
  )

  const duplicateTemplate = useCallback(
    async (id: string) => {
      const template = templates.find((t) => t._id === id)
      if (!template) return { success: false, error: 'Template not found' }

      const newTemplate: CreateTemplateInput = {
        name: `${template.name} (Copy)`,
        eventType: template.eventType,
        subject: template.subject,
        htmlBody: template.htmlBody,
        isActive: false,
      }

      return createTemplate(newTemplate)
    },
    [templates, createTemplate]
  )

  const previewTemplate = useCallback(
    async (id: string, sampleData?: Record<string, any>) => {
      try {
        const response = await fetch(`/api/email/templates/${id}/preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sampleData }),
        })

        const data = await response.json()

        if (data.success) {
          return { success: true, data: data.data }
        } else {
          return { success: false, error: data.error }
        }
      } catch (error) {
        console.error('Error previewing template:', error)
        return { success: false, error: 'Network error' }
      }
    },
    []
  )

  return {
    templates,
    loading,
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    previewTemplate,
  }
}
