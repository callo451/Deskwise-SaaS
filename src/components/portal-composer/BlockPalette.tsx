'use client'

import { useState, useMemo } from 'react'
import * as Icons from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BLOCK_CATEGORIES, getBlocksByCategory, createBlockInstance } from '@/lib/portal-blocks'
import { useComposerStore } from '@/lib/stores/composer-store'
import { PortalBlockType } from '@/lib/types'
import { useDraggable } from '@dnd-kit/core'

interface DraggableBlockItemProps {
  type: PortalBlockType
  label: string
  description: string
  icon: string
}

function DraggableBlockItem({ type, label, description, icon }: DraggableBlockItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, source: 'palette' },
  })

  const IconComponent = (Icons as any)[icon] || Icons.Box

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
              flex items-center gap-3 p-3 rounded-md border border-border
              bg-card hover:bg-accent hover:border-primary
              cursor-grab active:cursor-grabbing transition-colors
              ${isDragging ? 'opacity-50' : ''}
            `}
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-muted">
              <IconComponent className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{label}</p>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function BlockPalette() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['container', 'content'])

  // Filter blocks based on search
  const filteredCategories = useMemo(() => {
    return BLOCK_CATEGORIES.map((category) => {
      const blocks = getBlocksByCategory(category.id).filter((block) =>
        searchQuery
          ? block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            block.description.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
      return { ...category, blocks }
    }).filter((cat) => cat.blocks.length > 0)
  }, [searchQuery])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <Input
          placeholder="Search blocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
        />
      </div>

      {/* Block List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredCategories.map((category) => {
            const CategoryIcon = (Icons as any)[category.icon] || Icons.Box
            const isExpanded = expandedCategories.includes(category.id)

            return (
              <div key={category.id} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent text-sm font-medium transition-colors"
                >
                  <CategoryIcon className="w-4 h-4" />
                  <span className="flex-1 text-left">{category.label}</span>
                  <Icons.ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Category Blocks */}
                {isExpanded && (
                  <div className="space-y-1 pl-2">
                    {category.blocks.map((block) => (
                      <DraggableBlockItem
                        key={block.type}
                        type={block.type}
                        label={block.label}
                        description={block.description}
                        icon={block.icon}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Drag blocks onto the canvas to build your page
        </p>
      </div>
    </div>
  )
}
