import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import * as Icons from 'lucide-react'

interface IconGridBlockProps {
  props: BlockProps
}

export function IconGridBlock({ props }: IconGridBlockProps) {
  const { iconGrid, style } = props

  if (!iconGrid?.items || iconGrid.items.length === 0) return null

  const columns = iconGrid.columns || 3

  return (
    <div
      className={cn(
        'portal-icon-grid grid gap-6',
        columns === 2 && 'md:grid-cols-2',
        columns === 3 && 'md:grid-cols-3',
        columns === 4 && 'md:grid-cols-4',
        style?.className
      )}
    >
      {iconGrid.items.map((item, index) => {
        const IconComponent = (Icons as any)[item.icon] || Icons.HelpCircle

        const content = (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
              <IconComponent className="h-6 w-6" />
            </div>
            <h4 className="font-semibold mb-2">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        )

        if (item.href) {
          return (
            <Link
              key={index}
              href={item.href}
              className="hover:bg-muted/50 rounded-lg p-4 transition-colors"
            >
              {content}
            </Link>
          )
        }

        return (
          <div key={index} className="p-4">
            {content}
          </div>
        )
      })}
    </div>
  )
}
