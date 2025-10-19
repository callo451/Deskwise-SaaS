import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'

interface HeroBlockProps {
  props: BlockProps
  children?: React.ReactNode
}

export function HeroBlock({ props, children }: HeroBlockProps) {
  const { text, image, style } = props

  return (
    <div
      className={cn('portal-hero relative overflow-hidden', style?.className)}
      style={{
        backgroundColor: style?.backgroundColor || '#f3f4f6',
        backgroundImage: image?.src ? `url(${image.src})` : style?.backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '400px'
      }}
    >
      <div className="container mx-auto px-4 py-20 relative z-10">
        {text?.content && (
          <h1
            className="text-5xl font-bold mb-4"
            style={{
              textAlign: text.align || 'left',
              color: text.color || '#1f2937'
            }}
          >
            {text.content}
          </h1>
        )}
        {children}
      </div>
    </div>
  )
}
