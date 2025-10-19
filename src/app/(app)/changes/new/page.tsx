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

export default function NewChangeRequestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    risk: 'medium',
    impact: 'medium',
    category: 'Infrastructure',
    plannedStartDate: '',
    plannedEndDate: '',
    backoutPlan: '',
    testPlan: '',
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          affectedAssets: [],
          relatedTickets: [],
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/dashboard/changes/${data.data._id}`)
      } else {
        alert(data.error || 'Failed to create change request')
      }
    } catch (error) {
      console.error('Error creating change request:', error)
      alert('Failed to create change request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/changes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Change Request</h1>
          <p className="text-muted-foreground">
            Submit a new IT change for approval
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Change Request Details</CardTitle>
            <CardDescription>
              Provide comprehensive information about the proposed change
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief description of the change"
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
                placeholder="Detailed description of what will change and why..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                rows={6}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk">
                  Risk Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.risk}
                  onValueChange={(value) => handleChange('risk', value)}
                >
                  <SelectTrigger id="risk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.risk === 'low' && 'Minimal risk, well-tested change'}
                  {formData.risk === 'medium' && 'Some risk, requires testing'}
                  {formData.risk === 'high' && 'Significant risk, extensive testing required'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">
                  Impact Level <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value) => handleChange('impact', value)}
                >
                  <SelectTrigger id="impact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.impact === 'low' && 'Few users affected'}
                  {formData.impact === 'medium' && 'Multiple users affected'}
                  {formData.impact === 'high' && 'Organization-wide impact'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Network">Network</SelectItem>
                    <SelectItem value="Database">Database</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plannedStartDate">
                  Planned Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plannedStartDate"
                  type="datetime-local"
                  value={formData.plannedStartDate}
                  onChange={(e) => handleChange('plannedStartDate', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedEndDate">
                  Planned End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plannedEndDate"
                  type="datetime-local"
                  value={formData.plannedEndDate}
                  onChange={(e) => handleChange('plannedEndDate', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testPlan">
                Test Plan
              </Label>
              <textarea
                id="testPlan"
                placeholder="How will this change be tested before implementation?"
                value={formData.testPlan}
                onChange={(e) => handleChange('testPlan', e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backoutPlan">
                Backout Plan
              </Label>
              <textarea
                id="backoutPlan"
                placeholder="How will this change be reversed if it fails?"
                value={formData.backoutPlan}
                onChange={(e) => handleChange('backoutPlan', e.target.value)}
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Approval Process</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Change request will be created with "Draft" status</li>
                <li>Submit for approval when ready (status: "Pending Approval")</li>
                <li>Administrator will review and approve/reject</li>
                <li>Approved changes can be scheduled for implementation</li>
              </ol>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Change Request'}
              </Button>
              <Link href="/changes">
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
