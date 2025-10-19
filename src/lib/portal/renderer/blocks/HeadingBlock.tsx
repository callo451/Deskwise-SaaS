import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HeadingBlockProps {
  props: BlockProps
}

export function HeadingBlock({ props }: HeadingBlockProps) {
  const { text, style } = props

  if (!text?.content) return null

  const level = text.level || 1
  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  const headingStyle: React.CSSProperties = {
    textAlign: text.align || 'left',
    fontSize: text.size,
    fontWeight: text.weight,
    color: text.color
  }

  return (
    <Tag
      className={cn('portal-heading', style?.className)}
      style={headingStyle}
    >
      {text.content}
    </Tag>
  )
}
