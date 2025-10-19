'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'

interface Service {
  _id: string
  name: string
  description: string
  category: string
  icon: string
  estimatedTime?: string
  requiresApproval?: boolean
  customFields?: Array<{
    name: string
    label: string
    type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'file'
    required: boolean
    placeholder?: string
    options?: string[]
    helperText?: string
  }>
}

export default function ServiceRequestPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { toast } = useToast()
  const serviceId = params.serviceId as string
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<Record<string, any>>({
    title: '',
    description: '',
    priority: 'medium',
  })

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/service-catalog/${serviceId}`)
      if (response.ok) {
        const data = await response.json()
        setService(data)
        // Pre-fill title with service name
        setFormData((prev) => ({ ...prev, title: data.name }))
      } else {
        toast({
          title: 'Error',
          description: 'Service not found',
          variant: 'destructive',
        })
        router.push('/portal')
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      toast({
        title: 'Error',
        description: 'Failed to load service',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const ticketData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        category: service?.category || 'General',
        metadata: {
          serviceId: service?._id,
          serviceName: service?.name,
          customFields: service?.customFields?.map((field) => ({
            name: field.name,
            label: field.label,
            value: formData[field.name] || '',
          })),
        },
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      })

      const result = await response.json()

      if (result.success) {
        // Update service popularity
        await fetch(`/api/service-catalog/${service?._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...service,
            popularity: (service?.popularity || 0) + 1,
          }),
        })

        toast({
          title: 'Success',
          description: service?.requiresApproval
            ? 'Your request has been submitted and is pending approval'
            : 'Your request has been submitted successfully',
        })

        router.push(`/tickets/${result.data._id}`)
      } else {
        throw new Error(result.error || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName]
    return Icon || LucideIcons.Wrench
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Service Not Found</h3>
              <Link href="/portal">
                <Button className="mt-4">Back to Portal</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const Icon = getIcon(service.icon)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/portal">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request Service</h1>
          <p className="text-muted-foreground">
            Fill out the form to submit your request
          </p>
        </div>
      </div>

      {/* Service Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold">{service.name}</h2>
                  <Badge variant="secondary" className="mt-2">
                    {service.category}
                  </Badge>
                </div>
                {service.estimatedTime && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{service.estimatedTime}</span>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground">{service.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Notice */}
      {service.requiresApproval && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-900">
            This service requires approval. Your request will be reviewed by an
            administrator before processing.
          </AlertDescription>
        </Alert>
      )}

      {/* Request Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Provide information about your service request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Request Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Brief description of your request"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={6}
                placeholder="Provide detailed information about your request..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.priority === 'low' &&
                  'Minor issues with workarounds available'}
                {formData.priority === 'medium' &&
                  'Moderate issues affecting productivity'}
                {formData.priority === 'high' &&
                  'Major issues requiring urgent attention'}
                {formData.priority === 'critical' &&
                  'System down or critical functionality broken'}
              </p>
            </div>

            {/* Custom Fields */}
            {service.customFields && service.customFields.length > 0 && (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Additional Information
                  </h3>
                </div>

                {service.customFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>

                    {field.type === 'text' && (
                      <Input
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.name}
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                        rows={4}
                      />
                    )}

                    {field.type === 'select' && (
                      <Select
                        value={formData[field.name] || ''}
                        onValueChange={(value) =>
                          setFormData({ ...formData, [field.name]: value })
                        }
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue
                            placeholder={field.placeholder || 'Select option'}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === 'number' && (
                      <Input
                        id={field.name}
                        type="number"
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === 'date' && (
                      <Input
                        id={field.name}
                        type="date"
                        value={formData[field.name] || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [field.name]: e.target.value,
                          })
                        }
                        required={field.required}
                      />
                    )}

                    {field.helperText && (
                      <p className="text-xs text-muted-foreground">
                        {field.helperText}
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                What happens next?
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Your request will be assigned a unique ticket number</li>
                {service.requiresApproval && (
                  <li>An administrator will review and approve your request</li>
                )}
                <li>Our team will assign it to a technician</li>
                <li>You'll receive updates via email</li>
                <li>Track progress in "My Requests"</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
              <Link href="/portal">
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
