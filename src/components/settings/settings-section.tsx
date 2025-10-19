import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface SettingsSectionProps {
  title: string
  description?: string
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  headerAction,
}: SettingsSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-primary" />}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}
