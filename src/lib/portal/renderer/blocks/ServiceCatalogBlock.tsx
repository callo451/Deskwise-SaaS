'use client'

import { useState, useEffect } from 'react'
import type { BlockProps, UserRole, ServiceCatalogueItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ServiceCatalogBlockProps {
  props: BlockProps
  user?: {
    id: string
    email: string
    role: UserRole
    permissions: string[]
  }
  orgId: string
}

export function ServiceCatalogBlock({ props, user, orgId }: ServiceCatalogBlockProps) {
  const { list, integration, display, style } = props
  const [services, setServices] = useState<ServiceCatalogueItem[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch service catalog items from API
  useEffect(() => {
    const endpoint = integration?.apiEndpoint || '/api/service-catalog'
    setLoading(true)
    fetch(endpoint)
      .then(res => res.ok ? res.json() : [])
      .then(data => setServices(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Failed to load services:', err)
        setServices([])
      })
      .finally(() => setLoading(false))
  }, [integration?.apiEndpoint])

  const columns = display?.columns || 3
  const gridCols = columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'

  return (
    <div className={cn('portal-service-catalog', style?.className)}>
      <h3 className="text-xl font-semibold mb-4">Service Catalog</h3>

      {loading ? (
        <div className={`grid gap-4 ${gridCols}`}>
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No services available.</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${gridCols}`}>
          {services.map((service) => (
            <Card key={service._id.toString()}>
              <CardHeader>
                <CardTitle>{service.name}</CardTitle>
                <CardDescription>
                  {service.shortDescription || service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/portal/request/${service._id}`}>
                  <Button className="w-full">Request Service</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
