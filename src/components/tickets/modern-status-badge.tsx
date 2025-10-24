'use client'

import { Badge } from '@/components/ui/badge'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  LockKeyhole,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModernStatusBadgeProps {
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ModernStatusBadge({
  status,
  className,
  showIcon = true,
  size = 'md'
}: ModernStatusBadgeProps) {
  const config = {
    new: {
      label: 'New',
      icon: Sparkles,
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
      dotColor: 'bg-blue-500',
    },
    open: {
      label: 'Open',
      icon: AlertCircle,
      className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
      dotColor: 'bg-orange-500',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20',
      dotColor: 'bg-yellow-500',
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCircle2,
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20',
      dotColor: 'bg-green-500',
    },
    closed: {
      label: 'Closed',
      icon: LockKeyhole,
      className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20',
      dotColor: 'bg-gray-500',
    },
  }

  const statusConfig = config[status]
  const Icon = statusConfig.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border transition-all duration-200',
        statusConfig.className,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse', statusConfig.dotColor)} />
      {showIcon && <Icon className={cn('mr-1.5', iconSizes[size])} />}
      {statusConfig.label}
    </Badge>
  )
}
