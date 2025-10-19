'use client'

import { useState, useEffect } from 'react'
import type { BlockProps, UserRole, ServiceCatalogueItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FormBlockProps {
  props: BlockProps
  user?: {
    id: string
    email: string
    role: UserRole
    permissions: string[]
  }
  orgId: string
}

export function FormBlock({ props, user, orgId }: FormBlockProps) {
  const { form, integration, style } = props
  const [serviceData, setServiceData] = useState<ServiceCatalogueItem | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch service catalog item data if serviceCatalogId is provided
  useEffect(() => {
    if (integration?.serviceCatalogId && integration.serviceCatalogId !== '__none__') {
      setLoading(true)
      fetch(`/api/service-catalog/${integration.serviceCatalogId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => setServiceData(data))
        .catch(err => console.error('Failed to load service:', err))
        .finally(() => setLoading(false))
    }
  }, [integration?.serviceCatalogId])

  if (!integration?.serviceCatalogId || integration.serviceCatalogId === '__none__') {
    return (
      <div className="border-2 border-dashed border-gray-300 p-4 rounded">
        <p className="text-sm text-gray-600">
          Form block requires a service catalog item to be selected in the Inspector.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('portal-form', style?.className)}>
      {loading && (
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        </div>
      )}

      {!loading && serviceData && (
        <>
          <h3 className="text-xl font-semibold mb-2">
            {form?.title || serviceData.name}
          </h3>
          <p className="text-muted-foreground mb-4">
            {form?.description || serviceData.description}
          </p>
        </>
      )}

      {!loading && !serviceData && (
        <>
          {form?.title && <h3 className="text-xl font-semibold mb-2">{form.title}</h3>}
          {form?.description && <p className="text-muted-foreground mb-4">{form.description}</p>}
        </>
      )}

      {/* Form rendering would integrate with service catalog form builder */}
      <div className="border rounded-lg p-6">
        <p className="text-sm text-muted-foreground mb-4">
          {serviceData
            ? `Dynamic form for: ${serviceData.name}`
            : 'Service request form will be loaded from the selected service catalog item'}
        </p>
        <Button disabled={loading}>
          {form?.submitButtonText || 'Submit Request'}
        </Button>
      </div>
    </div>
  )
}
