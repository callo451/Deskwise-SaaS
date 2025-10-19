'use client'

import { useState } from 'react'
import { useComposerStore } from '@/lib/stores/composer-store'
import { BlockInstance } from '@/lib/types'
import { getBlockDefinition } from '@/lib/portal-blocks'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import * as Icons from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayerItemProps {
  block: BlockInstance
  depth: number
}

function LayerItem({ block, depth }: LayerItemProps) {
  const { selectedBlockId, selectBlock, deleteBlock, duplicateBlock } = useComposerStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const definition = getBlockDefinition(block.type)
  const isSelected = selectedBlockId === block.id
  const hasChildren = block.children && block.children.length > 0

  if (!definition) return null

  const IconComponent = (Icons as any)[definition.icon] || Icons.Box

  return (
    <div className="select-none">
      {/* Layer Item */}
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group',
          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => selectBlock(block.id)}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            <Icons.ChevronRight
              className={cn(
                'w-3 h-3 transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Block Icon */}
        <IconComponent className="w-4 h-4 flex-shrink-0" />

        {/* Block Label */}
        <span className="text-sm flex-1 truncate">{definition.label}</span>

        {/* Actions */}
        <div
          className={cn(
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isSelected && 'opacity-100'
          )}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              duplicateBlock(block.id)
            }}
            className="p-1 hover:bg-muted rounded"
            title="Duplicate"
          >
            <Icons.Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteBlock(block.id)
            }}
            className="p-1 hover:bg-muted rounded text-destructive"
            title="Delete"
          >
            <Icons.Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {block.children!.map((child) => (
            <LayerItem key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function LayerTree() {
  const { blocks } = useComposerStore()

  return (
    <div className="h-full flex flex-col">
      {/* Tree */}
      <ScrollArea className="flex-1">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center p-4">
            <p className="text-sm text-muted-foreground">
              No blocks yet. Start by dragging blocks from the palette.
            </p>
          </div>
        ) : (
          <div className="p-2">
            {blocks.map((block) => (
              <LayerItem key={block.id} block={block} depth={0} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
