'use client'

import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Flame
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModernPriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical'
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ModernPriorityBadge({
  priority,
  className,
  showIcon = true,
  size = 'md'
}: ModernPriorityBadgeProps) {
  const config = {
    low: {
      label: 'Low',
      icon: ArrowDown,
      className: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20 hover:bg-slate-500/20',
    },
    medium: {
      label: 'Medium',
      icon: ArrowUp,
      className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
    },
    high: {
      label: 'High',
      icon: AlertTriangle,
      className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
    },
    critical: {
      label: 'Critical',
      icon: Flame,
      className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20',
    },
  }

  const priorityConfig = config[priority]
  const Icon = priorityConfig.icon

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
        priorityConfig.className,
        sizeClasses[size],
        priority === 'critical' && 'animate-pulse',
        className
      )}
    >
      {showIcon && <Icon className={cn('mr-1.5', iconSizes[size])} />}
      {priorityConfig.label}
    </Badge>
  )
}
