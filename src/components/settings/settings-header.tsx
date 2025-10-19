import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsHeaderProps {
  title: string
  description: string
  breadcrumbs?: Array<{ label: string; href: string }>
  actions?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function SettingsHeader({
  title,
  description,
  breadcrumbs,
  actions,
  icon,
  className,
}: SettingsHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            </div>
          ))}
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{title}</span>
        </div>
      )}

      {/* Header Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Link href={breadcrumbs[breadcrumbs.length - 1]?.href || '/settings'}>
              <Button variant="outline" size="icon" className="shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {icon && (
            <div className="p-3 rounded-lg bg-primary/10 shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight truncate">{title}</h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
