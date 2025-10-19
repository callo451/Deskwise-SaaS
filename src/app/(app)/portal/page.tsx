'use client'

import { useState, useEffect } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Category {
  _id: string
  name: string
  description: string
  icon: string
  color: string
  serviceCount: number
}

interface Service {
  _id: string
  name: string
  shortDescription: string
  description: string
  category: string
  icon: string
  estimatedTime?: string
  requiresApproval?: boolean
  isActive: boolean
}

interface PortalSettings {
  enabled: boolean
  welcomeMessage: string
  showKnowledgeBase: boolean
  showIncidentStatus: boolean
  customAnnouncement?: {
    enabled: boolean
    message: string
    type: 'info' | 'warning' | 'success'
  }
}

export default function SelfServicePortalPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<PortalSettings | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterServices()
  }, [selectedCategory, searchQuery, services])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesRes, servicesRes] = await Promise.all([
        fetch('/api/service-catalog/categories'),
        fetch('/api/service-catalog?isActive=true'),
      ])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData)
        setFilteredServices(servicesData)
      }

      // Use default settings (settings are now per-page in Portal Builder)
      setSettings({
        enabled: true,
        welcomeMessage: 'Welcome to IT Service Portal',
        showKnowledgeBase: true,
        showIncidentStatus: true,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterServices = () => {
    let filtered = services

    if (selectedCategory) {
      filtered = filtered.filter((s) => s.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.shortDescription?.toLowerCase().includes(query)
      )
    }

    setFilteredServices(filtered)
  }

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName]
    return Icon || LucideIcons.Wrench
  }

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertCircle
      case 'success':
        return CheckCircle
      default:
        return Info
    }
  }

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-900'
      case 'success':
        return 'border-green-200 bg-green-50 text-green-900'
      default:
        return 'border-blue-200 bg-blue-50 text-blue-900'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (settings && !settings.enabled) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Portal Unavailable
              </h3>
              <p className="text-sm text-muted-foreground">
                The self-service portal is currently disabled. Please contact
                your IT administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          {settings?.welcomeMessage || 'Welcome to IT Service Portal'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse our service catalog and submit requests for IT support and services
        </p>
      </div>

      {/* Custom Announcement */}
      {settings?.customAnnouncement?.enabled &&
        settings.customAnnouncement.message && (
          <Alert
            className={getAnnouncementColor(settings.customAnnouncement.type)}
          >
            <div className="flex items-start gap-3">
              {(() => {
                const Icon = getAnnouncementIcon(
                  settings.customAnnouncement.type
                )
                return <Icon className="h-5 w-5 mt-0.5" />
              })()}
              <AlertDescription>
                {settings.customAnnouncement.message}
              </AlertDescription>
            </div>
          </Alert>
        )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {!searchQuery && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Service Categories</h2>
            {selectedCategory && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                View All
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = getIcon(category.icon)
              return (
                <Card
                  key={category._id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-lg hover:scale-105',
                    selectedCategory === category.name &&
                      'ring-2 ring-primary shadow-lg'
                  )}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: `${category.color}15`,
                          color: category.color,
                        }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{category.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {category.description}
                        </p>
                        <Badge variant="secondary">
                          {category.serviceCount}{' '}
                          {category.serviceCount === 1 ? 'service' : 'services'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Services List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {selectedCategory
              ? `${selectedCategory} Services`
              : searchQuery
              ? 'Search Results'
              : 'All Services'}
          </h2>
          {filteredServices.length > 0 && (
            <p className="text-muted-foreground">
              {filteredServices.length}{' '}
              {filteredServices.length === 1 ? 'service' : 'services'}
            </p>
          )}
        </div>

        {filteredServices.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No services found</p>
                <p className="text-sm mt-2">
                  Try adjusting your search or browse all categories
                </p>
                {(selectedCategory || searchQuery) && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSelectedCategory(null)
                      setSearchQuery('')
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const Icon = getIcon(service.icon || 'Wrench')
              return (
                <Card
                  key={service._id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary">{service.category}</Badge>
                    </div>
                    <CardTitle className="mt-4">{service.name}</CardTitle>
                    <CardDescription>
                      {service.shortDescription || service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {service.estimatedTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.estimatedTime}</span>
                      </div>
                    )}

                    {service.requiresApproval && (
                      <Badge variant="outline" className="w-fit">
                        Requires Approval
                      </Badge>
                    )}

                    <Link href={`/portal/request/${service._id}`}>
                      <Button className="w-full">
                        Request Service
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/portal/my-requests">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <LucideIcons.TicketIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">My Requests</h3>
                  <p className="text-sm text-muted-foreground">
                    View your submitted tickets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {settings?.showKnowledgeBase && (
          <Link href="/knowledge-base">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-100">
                    <LucideIcons.BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Knowledge Base</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse help articles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {settings?.showIncidentStatus && (
          <Link href="/incidents">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-100">
                    <LucideIcons.AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">System Status</h3>
                    <p className="text-sm text-muted-foreground">
                      View active incidents
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  )
}
