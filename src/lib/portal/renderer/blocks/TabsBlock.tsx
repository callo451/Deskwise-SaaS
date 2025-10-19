import type { BlockProps, BlockInstance } from '@/lib/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { renderBlock } from '../BlockRenderer'

interface TabsBlockProps {
  props: BlockProps
  children?: BlockInstance[]
}

export function TabsBlock({ props, children }: TabsBlockProps) {
  const { tabs, display, style } = props

  if (!tabs?.items || tabs.items.length === 0) return null

  const defaultValue = display?.defaultTab !== undefined ? `tab-${display.defaultTab}` : 'tab-0'

  // Group children by tab index if they have a tabIndex property
  const getTabChildren = (tabIndex: number): BlockInstance[] => {
    if (!children) return []

    // Check if tab has children array stored in items
    const tabItem = tabs.items[tabIndex]
    if (tabItem?.children) {
      return tabItem.children
    }

    // Fallback: filter children by tabIndex property
    return children.filter((child: any) => child.tabIndex === tabIndex)
  }

  return (
    <Tabs defaultValue={defaultValue} className={cn('portal-tabs', style?.className)}>
      <TabsList>
        {tabs.items.map((item, index) => (
          <TabsTrigger key={index} value={`tab-${index}`}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.items.map((item, index) => {
        const tabChildren = getTabChildren(index)

        return (
          <TabsContent key={index} value={`tab-${index}`}>
            {tabChildren && tabChildren.length > 0 ? (
              <div className="space-y-4">
                {tabChildren.map((child) => renderBlock(child))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                No content in this tab
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
