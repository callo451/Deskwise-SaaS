'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface ServiceCatalogItem {
  _id: string
  name: string
  description: string
  category: string
  formFields?: Array<{
    id: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'email'
    required: boolean
    options?: string[]
    placeholder?: string
    defaultValue?: string
  }>
}

export default function ServiceRequestPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params?.serviceId as string

  const [service, setService] = useState<ServiceCatalogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    async function fetchService() {
      try {
        setLoading(true)
        const res = await fetch(`/api/service-catalog/${serviceId}`)
        if (!res.ok) {
          throw new Error('Service not found')
        }
        const data = await res.json()
        setService(data)

        // Initialize form data with default values
        const initialData: Record<string, any> = {}
        data.formFields?.forEach((field: any) => {
          initialData[field.id] = field.defaultValue || (field.type === 'checkbox' ? false : '')
        })
        setFormData(initialData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service')
      } finally {
        setLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: service?.name || 'Service Request',
          description: formData.description || JSON.stringify(formData),
          priority: 'medium',
          category: service?.category || 'General',
          serviceId,
          formData,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }

      // Redirect to success page or back to portal
      router.push('/portal?success=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: ServiceCatalogItem['formFields'][0]) => {
    if (!field) return null

    const value = formData[field.id]
    const onChange = (newValue: any) => {
      setFormData(prev => ({ ...prev, [field.id]: newValue }))
    }

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
            />
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={onChange} required={field.required}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={onChange}
              required={field.required}
            />
            <Label htmlFor={field.id} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading service...</span>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Service Not Found</CardTitle>
            <CardDescription>{error || 'The requested service could not be found.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Service Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{service.name}</CardTitle>
                {service.category && (
                  <div className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {service.category}
                  </div>
                )}
              </div>
            </div>
            {service.description && (
              <CardDescription className="mt-4">{service.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Request</CardTitle>
            <CardDescription>Fill out the form below to submit your service request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {service.formFields && service.formFields.length > 0 ? (
                service.formFields.map(renderField)
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="default-description">
                    Description
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Textarea
                    id="default-description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your request..."
                    required
                    rows={6}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
