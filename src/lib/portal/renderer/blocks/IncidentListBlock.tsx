import type { BlockProps, UserRole, Incident } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

interface IncidentListBlockProps {
  props: BlockProps
  user?: {
    id: string
    email: string
    role: UserRole
    permissions: string[]
  }
  orgId: string
}

export function IncidentListBlock({ props, user, orgId }: IncidentListBlockProps) {
  const { list, style } = props

  // In a real implementation, this would fetch incidents from the data context
  const incidents: Incident[] = []

  return (
    <div className={cn('portal-incident-list', style?.className)}>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        Current Incidents
      </h3>

      {incidents.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No active incidents.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div
              key={incident._id.toString()}
              className="border rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{incident.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {incident.description}
                  </p>
                </div>
                <Badge variant={incident.severity === 'critical' ? 'destructive' : 'default'}>
                  {incident.severity}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="outline">{incident.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  Started: {new Date(incident.startedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
