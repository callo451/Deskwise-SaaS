'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, Pencil, Trash2, Loader2, Package, Database, TrendingUp, Edit, FormInput } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SettingsHeader } from '@/components/settings/settings-header'
import { EmptyState } from '@/components/settings/empty-state'

interface ServiceCatalogItem {
  _id: string
  name: string
  description: string
  shortDescription?: string
  category: string
  icon?: string
  estimatedTime?: string
  requiresApproval?: boolean
  isActive: boolean
  popularity: number
  currentVersion: number
  itilCategory: string
}

interface Category {
  _id: string
  name: string
  icon: string
  color: string
  serviceCount: number
}

export default function ServiceCatalogSettingsPage() {
  const router = useRouter()
  const [services, setServices] = useState<ServiceCatalogItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchServices()
    fetchCategories()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/service-catalog')
      if (response.ok) {
        const data = await response.json()
        setServices(data)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch services',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/service-catalog/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const seedCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/service-catalog/categories/seed', {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Default categories have been created',
        })
        await fetchCategories()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to seed categories',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to seed categories',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/service-catalog/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Service deleted successfully',
        })
        fetchServices()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      })
    }
  }

  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    popular: services.filter(s => s.popularity > 10).length,
    categories: categories.length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Service Catalog"
        description="Manage service offerings and request forms with comprehensive form builder"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Package className="h-6 w-6 text-purple-600" />}
        actions={
          <Button
            onClick={() => router.push('/settings/service-catalog/new')}
            disabled={categories.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Service
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-purple-700">Total Services</CardDescription>
            <CardTitle className="text-3xl text-purple-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Services</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-3xl">{stats.categories}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardDescription>Popular Items</CardDescription>
              <CardTitle className="text-3xl">{stats.popular}</CardTitle>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      {categories.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">No categories found</h3>
                <p className="text-sm text-muted-foreground">
                  Create default categories to get started
                </p>
              </div>
              <Button onClick={seedCategories} disabled={loading}>
                <Database className="h-4 w-4 mr-2" />
                Create Default Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Service Items</CardTitle>
          <CardDescription>
            Configure services with custom request forms using the comprehensive form builder
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : services.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No services configured"
              description="Create your first service with a custom request form"
              action={
                categories.length > 0
                  ? {
                      label: 'Create Service',
                      onClick: () => router.push('/settings/service-catalog/new'),
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Form Version</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FormInput className="w-4 h-4 text-purple-600" />
                        {service.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        {service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.itilCategory}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        v{service.currentVersion}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {service.requiresApproval ? (
                        <Badge variant="outline">Required</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {service.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>{service.popularity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/settings/service-catalog/${service._id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
