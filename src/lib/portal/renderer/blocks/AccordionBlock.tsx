import type { BlockProps } from '@/lib/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface AccordionBlockProps {
  props: BlockProps
}

export function AccordionBlock({ props }: AccordionBlockProps) {
  const { accordion, style } = props

  if (!accordion?.items || accordion.items.length === 0) return null

  return (
    <div className={cn('portal-accordion space-y-2', style?.className)}>
      {accordion.items.map((item, index) => (
        <Collapsible key={index} defaultOpen={item.defaultOpen}>
          <div className="border rounded-lg">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50">
              <span className="font-medium">{item.title}</span>
              <ChevronDown className="h-4 w-4 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 pt-0">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  )
}
