'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Package,
  Star,
  Clock,
  DollarSign,
} from 'lucide-react'
import { ServiceRequestMetadata } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ServiceCatalogCardProps {
  metadata: ServiceRequestMetadata
  className?: string
}

interface ServiceCatalogItem {
  _id: string
  name: string
  description: string
  category: string
  icon?: string
  defaultRate: number
  currency: string
  estimatedTime?: string
  tags: string[]
}

export function ServiceCatalogCard({ metadata, className }: ServiceCatalogCardProps) {
  const [service, setService] = useState<ServiceCatalogItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (metadata.serviceId) {
      fetchService()
    } else {
      setLoading(false)
    }
  }, [metadata.serviceId])

  const fetchService = async () => {
    try {
      const response = await fetch(`/api/service-catalog/${metadata.serviceId}`)
      const data = await response.json()
      if (data.success) {
        setService(data.data)
      }
    } catch (error) {
      console.error('Error fetching service:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render if no service catalog data
  if (!metadata.serviceId && !metadata.formData) {
    return null
  }

  if (loading) {
    return (
      <Card className={cn('border-2 shadow-lg', className)}>
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-b-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  const hasFormData = metadata.formData && Object.keys(metadata.formData).length > 0

  return (
    <Card className={cn('border-2 border-l-4 border-l-orange-500 shadow-lg', className)}>
      <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/50 border-b-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 mb-1 text-xl">
                Service Request
                <Badge variant="secondary" className="text-xs font-medium">
                  From Catalog
                </Badge>
              </CardTitle>
              <CardDescription className="text-base">
                {service ? (
                  <span className="font-semibold text-foreground">{service.name}</span>
                ) : (
                  'Service catalog item'
                )}
              </CardDescription>
            </div>
          </div>

          {metadata.serviceId && (
            <Link href={`/settings/service-catalog/${metadata.serviceId}`}>
              <Button variant="outline" size="sm" className="border-2 hover:bg-orange-500 hover:text-white transition-colors">
                <ExternalLink className="h-3 w-3 mr-1" />
                View Service
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        {/* Service Details */}
        {service && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-lg bg-muted/50">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Category</div>
              <div className="font-medium text-sm">{service.category}</div>
            </div>

            {service.estimatedTime && (
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Est. Time
                </div>
                <div className="font-medium text-sm">{service.estimatedTime}</div>
              </div>
            )}

            {service.defaultRate > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Rate
                </div>
                <div className="font-medium text-sm">
                  {service.currency} {service.defaultRate.toFixed(2)}
                </div>
              </div>
            )}

            {service.tags && service.tags.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {service.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {service.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{service.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Description */}
        {service?.description && (
          <>
            <Separator />
            <div>
              <div className="text-sm font-medium mb-2">Service Description</div>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          </>
        )}

        {/* Form Data */}
        {hasFormData && (
          <>
            <Separator />
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-sm font-medium mb-2 hover:text-primary transition-colors"
              >
                <span>Request Details ({Object.keys(metadata.formData!).length} fields)</span>
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {expanded && (
                <div className="space-y-2 mt-3">
                  {Object.entries(metadata.formData!).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-start gap-4 p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <dt className="text-sm font-medium text-muted-foreground capitalize min-w-[30%]">
                        {key.replace(/_/g, ' ')}:
                      </dt>
                      <dd className="text-sm text-foreground text-right break-words flex-1">
                        {typeof value === 'boolean' ? (
                          <Badge variant={value ? 'default' : 'secondary'}>
                            {value ? 'Yes' : 'No'}
                          </Badge>
                        ) : Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {value.map((item, idx) => (
                              <Badge key={idx} variant="outline">
                                {String(item)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          String(value)
                        )}
                      </dd>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Estimated Cost/Effort */}
        {(metadata.estimatedCost || metadata.estimatedEffort) && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              {metadata.estimatedCost && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Estimated Cost
                  </div>
                  <div className="font-semibold text-lg text-green-900 dark:text-green-100">
                    ${metadata.estimatedCost.toFixed(2)}
                  </div>
                </div>
              )}

              {metadata.estimatedEffort && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Estimated Effort
                  </div>
                  <div className="font-semibold text-lg text-blue-900 dark:text-blue-100">
                    {metadata.estimatedEffort}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
