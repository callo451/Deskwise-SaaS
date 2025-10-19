'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SLATimerProps {
  deadline: Date | string
  createdAt: Date | string
  className?: string
  showLabel?: boolean
}

export function SLATimer({
  deadline,
  createdAt,
  className,
  showLabel = true,
}: SLATimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [percentRemaining, setPercentRemaining] = useState<number>(100)

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date()
      const deadlineDate = new Date(deadline)
      const createdDate = new Date(createdAt)
      const remaining = deadlineDate.getTime() - now.getTime()
      const totalTime = deadlineDate.getTime() - createdDate.getTime()
      const elapsed = now.getTime() - createdDate.getTime()
      const percent = Math.max(0, ((totalTime - elapsed) / totalTime) * 100)

      setTimeRemaining(remaining)
      setPercentRemaining(percent)
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000) // Update every second

    return () => clearInterval(interval)
  }, [deadline, createdAt])

  const formatTime = (ms: number): string => {
    if (ms < 0) return 'OVERDUE'

    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  const getColor = (): string => {
    if (timeRemaining < 0) return 'text-red-600 dark:text-red-400'
    if (percentRemaining < 10) return 'text-orange-600 dark:text-orange-400'
    if (percentRemaining < 25) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getBgColor = (): string => {
    if (timeRemaining < 0) return 'bg-red-100 dark:bg-red-900/20'
    if (percentRemaining < 10) return 'bg-orange-100 dark:bg-orange-900/20'
    if (percentRemaining < 25) return 'bg-yellow-100 dark:bg-yellow-900/20'
    return 'bg-green-100 dark:bg-green-900/20'
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <Clock className={cn('w-4 h-4', getColor())} />
      )}
      <div className={cn('px-3 py-1.5 rounded-md font-mono text-sm font-semibold', getBgColor(), getColor())}>
        {formatTime(timeRemaining)}
      </div>
    </div>
  )
}
