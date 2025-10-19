import type { BlockProps } from '@/lib/types'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageBlockProps {
  props: BlockProps
}

export function ImageBlock({ props }: ImageBlockProps) {
  const { image, style } = props

  if (!image?.src) return null

  const isExternalUrl = image.src.startsWith('http')

  return (
    <div className={cn('portal-image', style?.className)}>
      {isExternalUrl ? (
        <img
          src={image.src}
          alt={image.alt || ''}
          style={{
            width: image.width || '100%',
            height: image.height || 'auto',
            objectFit: image.objectFit || 'cover'
          }}
        />
      ) : (
        <Image
          src={image.src}
          alt={image.alt || ''}
          width={typeof image.width === 'number' ? image.width : 800}
          height={typeof image.height === 'number' ? image.height : 600}
          style={{
            objectFit: image.objectFit || 'cover'
          }}
        />
      )}
    </div>
  )
}
