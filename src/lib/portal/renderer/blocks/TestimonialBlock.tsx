import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Quote } from 'lucide-react'
import Image from 'next/image'

interface TestimonialBlockProps {
  props: BlockProps
}

export function TestimonialBlock({ props }: TestimonialBlockProps) {
  const { testimonial, style } = props

  if (!testimonial?.quote) return null

  return (
    <div className={cn('portal-testimonial border rounded-lg p-8 bg-muted/30', style?.className)}>
      <Quote className="h-8 w-8 text-primary/30 mb-4" />
      <blockquote className="text-lg font-medium mb-6">
        {testimonial.quote}
      </blockquote>
      <div className="flex items-center gap-4">
        {testimonial.avatar && (
          <div className="relative w-12 h-12 rounded-full overflow-hidden">
            <Image
              src={testimonial.avatar}
              alt={testimonial.author || ''}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div>
          {testimonial.author && (
            <p className="font-semibold">{testimonial.author}</p>
          )}
          {testimonial.role && (
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          )}
        </div>
      </div>
    </div>
  )
}
