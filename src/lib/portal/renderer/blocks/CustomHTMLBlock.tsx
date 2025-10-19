import type { BlockProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import DOMPurify from 'isomorphic-dompurify'

interface CustomHTMLBlockProps {
  props: BlockProps
}

export function CustomHTMLBlock({ props }: CustomHTMLBlockProps) {
  const { customHtml, style } = props

  if (!customHtml?.html) return null

  // Sanitize HTML to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(customHtml.html, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'strong', 'em', 'u', 'br', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote',
      'code', 'pre'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'width', 'height', 'target', 'rel'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
  })

  return (
    <div className={cn('portal-custom-html', style?.className)}>
      {customHtml.css && (
        <style dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(customHtml.css) }} />
      )}
      <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
    </div>
  )
}
