import type { BlockProps, UserRole, Ticket } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface TicketListBlockProps {
  props: BlockProps
  user?: {
    id: string
    email: string
    role: UserRole
    permissions: string[]
  }
  orgId: string
}

export function TicketListBlock({ props, user, orgId }: TicketListBlockProps) {
  const { list, style } = props

  // In a real implementation, this would fetch tickets from the data context
  // For now, show a placeholder
  const tickets: Ticket[] = []

  return (
    <div className={cn('portal-ticket-list', style?.className)}>
      <h3 className="text-xl font-semibold mb-4">My Tickets</h3>

      {tickets.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No tickets found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link
              key={ticket._id.toString()}
              href={`/portal/tickets/${ticket._id}`}
              className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {ticket.ticketNumber}
                  </p>
                </div>
                <Badge>{ticket.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
