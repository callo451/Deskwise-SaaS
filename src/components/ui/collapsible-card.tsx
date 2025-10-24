'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleCardProps {
  title: string | React.ReactNode
  description?: string | React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function CollapsibleCard({
  title,
  description,
  icon,
  children,
  defaultExpanded = true,
  className,
  headerClassName,
  contentClassName,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <Card className={cn('border-2 shadow-lg transition-all', className)}>
      <CardHeader
        className={cn(
          'cursor-pointer hover:bg-accent/50 transition-colors border-b-2',
          headerClassName
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {icon && <div>{icon}</div>}
            <div className="flex-1">
              {typeof title === 'string' ? (
                <CardTitle className="text-xl">{title}</CardTitle>
              ) : (
                title
              )}
              {description && (
                typeof description === 'string' ? (
                  <CardDescription className="text-base mt-1">{description}</CardDescription>
                ) : (
                  description
                )
              )}
            </div>
          </div>
          <button
            className="shrink-0 p-1 hover:bg-accent rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className={cn('pt-6', contentClassName)}>
          {children}
        </CardContent>
      )}
    </Card>
  )
}
