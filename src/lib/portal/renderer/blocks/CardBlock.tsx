import type { BlockProps } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import Image from 'next/image'

interface CardBlockProps {
  props: BlockProps
  children?: React.ReactNode
}

export function CardBlock({ props, children }: CardBlockProps) {
  const { card, style } = props

  const CardWrapper = card?.href ? (
    <Link href={card.href}>
      <Card className={style?.className}>
        <CardContent />
      </Card>
    </Link>
  ) : (
    <Card className={style?.className} />
  )

  return (
    <Card className={style?.className}>
      {card?.image && (
        <div className="relative w-full h-48">
          <Image
            src={card.image}
            alt={card.title || ''}
            fill
            className="object-cover rounded-t-lg"
          />
        </div>
      )}
      {(card?.title || card?.description) && (
        <CardHeader>
          {card.title && <CardTitle>{card.title}</CardTitle>}
          {card.description && <CardDescription>{card.description}</CardDescription>}
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}
