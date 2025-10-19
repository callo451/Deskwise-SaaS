'use client'

import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Play, XCircle, RotateCcw, User } from 'lucide-react'
import { TicketStatus } from '@/lib/types'

interface QuickStatusButtonsProps {
  currentStatus: TicketStatus
  onStatusChange: (newStatus: TicketStatus) => Promise<void>
  onAssignToMe?: () => Promise<void>
  isAssignedToMe?: boolean
  disabled?: boolean
}

const statusTransitions: Record<TicketStatus, Array<{ status: TicketStatus; label: string; icon: any; variant?: any }>> = {
  new: [
    { status: 'open', label: 'Open', icon: Play, variant: 'default' },
  ],
  open: [
    { status: 'pending', label: 'Pending', icon: Clock, variant: 'secondary' },
    { status: 'resolved', label: 'Resolve', icon: CheckCircle2, variant: 'default' },
  ],
  pending: [
    { status: 'open', label: 'Reopen', icon: RotateCcw, variant: 'secondary' },
    { status: 'resolved', label: 'Resolve', icon: CheckCircle2, variant: 'default' },
  ],
  resolved: [
    { status: 'closed', label: 'Close', icon: XCircle, variant: 'default' },
    { status: 'open', label: 'Reopen', icon: RotateCcw, variant: 'secondary' },
  ],
  closed: [
    { status: 'open', label: 'Reopen', icon: RotateCcw, variant: 'secondary' },
  ],
}

export function QuickStatusButtons({
  currentStatus,
  onStatusChange,
  onAssignToMe,
  isAssignedToMe,
  disabled,
}: QuickStatusButtonsProps) {
  const transitions = statusTransitions[currentStatus] || []

  return (
    <div className="flex flex-wrap gap-2">
      {/* Assign to Me button (only show if not assigned or on new tickets) */}
      {onAssignToMe && !isAssignedToMe && (currentStatus === 'new' || currentStatus === 'open') && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAssignToMe}
          disabled={disabled}
          className="border-dashed"
        >
          <User className="w-4 h-4 mr-2" />
          Assign to Me
        </Button>
      )}

      {/* Status transition buttons */}
      {transitions.map((transition) => {
        const Icon = transition.icon
        return (
          <Button
            key={transition.status}
            variant={transition.variant || 'outline'}
            size="sm"
            onClick={() => onStatusChange(transition.status)}
            disabled={disabled}
          >
            <Icon className="w-4 h-4 mr-2" />
            {transition.label}
          </Button>
        )
      })}
    </div>
  )
}
