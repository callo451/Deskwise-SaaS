import type { BlockProps } from '@/lib/types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { ChevronDown, HelpCircle } from 'lucide-react'

interface FAQBlockProps {
  props: BlockProps
}

export function FAQBlock({ props }: FAQBlockProps) {
  const { faq, style } = props

  if (!faq?.items || faq.items.length === 0) return null

  return (
    <div className={cn('portal-faq', style?.className)}>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <HelpCircle className="h-5 w-5" />
        Frequently Asked Questions
      </h3>
      <div className="space-y-2">
        {faq.items.map((item, index) => (
          <Collapsible key={index}>
            <div className="border rounded-lg">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50">
                <span className="font-medium">{item.question}</span>
                <ChevronDown className="h-4 w-4 transition-transform shrink-0" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 pt-0">
                <p className="text-muted-foreground">{item.answer}</p>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}
