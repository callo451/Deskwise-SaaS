import type { BlockProps } from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface DividerBlockProps {
  props: BlockProps
}

export function DividerBlock({ props }: DividerBlockProps) {
  const { divider, style } = props

  return (
    <Separator
      orientation={divider?.orientation || 'horizontal'}
      className={cn('portal-divider', style?.className)}
      style={{
        backgroundColor: divider?.color,
        height: divider?.orientation === 'horizontal' ? `${divider?.thickness || 1}px` : undefined,
        width: divider?.orientation === 'vertical' ? `${divider?.thickness || 1}px` : undefined
      }}
    />
  )
}
