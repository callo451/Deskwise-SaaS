import type { BlockProps } from '@/lib/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ButtonBlockProps {
  props: BlockProps
}

export function ButtonBlock({ props }: ButtonBlockProps) {
  const { button, style } = props

  if (!button?.text) return null

  const ButtonContent = (
    <Button
      variant={button.variant === 'primary' ? 'default' : button.variant || 'default'}
      size={button.size || 'md'}
      className={style?.className}
    >
      {button.text}
    </Button>
  )

  if (button.href) {
    if (button.openInNewTab) {
      return (
        <a href={button.href} target="_blank" rel="noopener noreferrer">
          {ButtonContent}
        </a>
      )
    }

    return <Link href={button.href}>{ButtonContent}</Link>
  }

  return ButtonContent
}
