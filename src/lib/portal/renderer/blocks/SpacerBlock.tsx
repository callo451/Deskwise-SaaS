import type { BlockProps } from '@/lib/types'

interface SpacerBlockProps {
  props: BlockProps
}

export function SpacerBlock({ props }: SpacerBlockProps) {
  const { spacer } = props

  return (
    <div
      className="portal-spacer"
      style={{
        height: spacer?.height ? `${spacer.height}px` : '1rem',
        width: spacer?.width ? `${spacer.width}px` : '100%'
      }}
    />
  )
}
