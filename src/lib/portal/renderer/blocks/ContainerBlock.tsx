import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ContainerBlockProps {
  props: BlockProps
  children?: React.ReactNode
}

export function ContainerBlock({ props, children }: ContainerBlockProps) {
  const { layout, style } = props

  const containerClasses = cn(
    'portal-container',
    layout?.container === 'fixed' && 'container mx-auto px-4',
    layout?.container === 'fluid' && 'w-full px-4',
    layout?.container === 'full' && 'w-full',
    layout?.direction === 'column' && 'flex flex-col',
    layout?.direction === 'row' && 'flex flex-row',
    style?.className
  )

  const containerStyle: React.CSSProperties = {
    gap: layout?.gap ? `${layout.gap}px` : undefined,
    padding: layout?.padding ? `${layout.padding}px` : undefined,
    margin: layout?.margin ? `${layout.margin}px` : undefined,
    alignItems: layout?.align,
    justifyContent: layout?.justify,
    backgroundColor: style?.backgroundColor,
    backgroundImage: style?.backgroundImage,
    borderRadius: style?.borderRadius ? `${style.borderRadius}px` : undefined,
    border: style?.border,
    boxShadow: style?.boxShadow
  }

  return (
    <div className={containerClasses} style={containerStyle}>
      {children}
    </div>
  )
}
