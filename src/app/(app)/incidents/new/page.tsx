'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default function NewIncidentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [affectedServices, setAffectedServices] = useState<string[]>([])
  const [serviceInput, setServiceInput] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'major',
    isPublic: false,
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddService = () => {
    if (serviceInput.trim() && !affectedServices.includes(serviceInput.trim())) {
      setAffectedServices([...affectedServices, serviceInput.trim()])
      setServiceInput('')
    }
  }

  const handleRemoveService = (service: string) => {
    setAffectedServices(affectedServices.filter(s => s !== service))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          affectedServices,
          clientIds: [], // Empty array means "All clients"
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/dashboard/incidents/${data.data._id}`)
      } else {
        alert(data.error || 'Failed to create incident')
      }
    } catch (error) {
      console.error('Error creating incident:', error)
      alert('Failed to create incident')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/incidents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Incident</h1>
          <p className="text-muted-foreground">
            Report a service disruption or outage
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
            <CardDescription>
              Provide information about the service disruption
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                placeholder="Detailed description of the incident and impact..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="severity">
                  Severity <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => handleChange('severity', value)}
                >
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor - Minimal impact</SelectItem>
                    <SelectItem value="major">Major - Significant impact</SelectItem>
                    <SelectItem value="critical">Critical - Service down</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="isPublic">
                  Visibility <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.isPublic ? 'public' : 'internal'}
                  onValueChange={(value) => handleChange('isPublic', value === 'public')}
                >
                  <SelectTrigger id="isPublic">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Only</SelectItem>
                    <SelectItem value="public">Public Status Page</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.isPublic ? 'Visible to customers on status page' : 'Only visible to internal team'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="services">
                Affected Services
              </Label>
              <div className="flex gap-2">
                <Input
                  id="services"
                  placeholder="Enter service name (e.g., Email, VPN, CRM)"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddService()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddService}>
                  Add
                </Button>
              </div>
              {affectedServices.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {affectedServices.map((service) => (
                    <div
                      key={service}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => handleRemoveService(service)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">What happens next?</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Incident will be assigned a unique number</li>
                <li>Status updates will be tracked in a timeline</li>
                <li>Team members will be notified</li>
                {formData.isPublic && <li>Customers will see this on the status page</li>}
              </ol>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Incident'}
              </Button>
              <Link href="/incidents">
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
