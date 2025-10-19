import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SettingsCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  badge?: string
  stats?: Array<{ label: string; value: string | number }>
  className?: string
  iconColor?: string
  hoverColor?: string
}

export function SettingsCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
  stats,
  className,
  iconColor = 'text-primary',
  hoverColor = 'hover:border-primary/50',
}: SettingsCardProps) {
  return (
    <Link href={href} className="group">
      <Card
        className={cn(
          'h-full transition-all duration-200',
          'hover:shadow-md hover:-translate-y-0.5',
          hoverColor,
          className
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className={cn('h-6 w-6', iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="truncate">{title}</CardTitle>
                  {badge && (
                    <Badge variant="secondary" className="shrink-0">
                      {badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {description}
                </CardDescription>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </CardHeader>
        {stats && stats.length > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {stats.map((stat, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </Link>
  )
}
