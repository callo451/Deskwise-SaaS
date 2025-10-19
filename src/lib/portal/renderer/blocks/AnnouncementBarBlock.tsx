'use client'

import { useState } from 'react'
import type { BlockProps } from '@/lib/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

interface AnnouncementBarBlockProps {
  props: BlockProps
}

export function AnnouncementBarBlock({ props }: AnnouncementBarBlockProps) {
  const { announcement, style } = props
  const [dismissed, setDismissed] = useState(false)

  if (!announcement?.message || dismissed) return null

  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle,
    error: AlertCircle
  }

  const Icon = icons[announcement.type || 'info']

  return (
    <Alert className={cn('portal-announcement', style?.className)}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{announcement.message}</span>
        {announcement.dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="ml-4 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </AlertDescription>
    </Alert>
  )
}
