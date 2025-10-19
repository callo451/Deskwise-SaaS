import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ParagraphBlockProps {
  props: BlockProps
}

export function ParagraphBlock({ props }: ParagraphBlockProps) {
  const { text, style } = props

  if (!text?.content) return null

  const paragraphStyle: React.CSSProperties = {
    textAlign: text.align || 'left',
    fontSize: text.size,
    fontWeight: text.weight,
    color: text.color
  }

  return (
    <div
      className={cn('portal-paragraph prose max-w-none', style?.className)}
      style={paragraphStyle}
      dangerouslySetInnerHTML={{ __html: text.content }}
    />
  )
}
