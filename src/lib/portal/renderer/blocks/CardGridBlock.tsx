import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CardGridBlockProps {
  props: BlockProps
  children?: React.ReactNode
}

export function CardGridBlock({ props, children }: CardGridBlockProps) {
  const { layout, style } = props

  return (
    <div
      className={cn(
        'portal-card-grid grid gap-6',
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        style?.className
      )}
      style={{
        gap: layout?.gap ? `${layout.gap}px` : undefined
      }}
    >
      {children}
    </div>
  )
}
