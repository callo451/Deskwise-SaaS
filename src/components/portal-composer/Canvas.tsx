'use client'

import { useComposerStore } from '@/lib/stores/composer-store'
import { BlockInstance } from '@/lib/types'
import { useDroppable } from '@dnd-kit/core'
import { BlockRenderer } from './BlockRenderer'
import { cn } from '@/lib/utils'

function DropZone({ blockId, position }: { blockId?: string; position?: 'before' | 'after' | 'inside' }) {
  const { isOver, setNodeRef } = useDroppable({
    id: blockId ? `drop-${blockId}-${position}` : `drop-root`,
    data: { blockId, position: position || 'root' },
  })

  // Make the initial drop zone (root) larger and more prominent
  const isRootDropZone = !blockId && (!position || position === 'root')

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-2 border-dashed transition-all rounded-md flex items-center justify-center',
        isRootDropZone
          ? 'h-48 border-muted-foreground/40'
          : 'h-8 border-muted-foreground/20',
        isOver && 'border-primary bg-primary/10',
        isOver && isRootDropZone && 'h-56 border-primary/80 bg-primary/15'
      )}
    >
      {isRootDropZone && !isOver && (
        <div className="text-center text-muted-foreground px-4">
          <svg
            className="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm font-medium">Drop blocks here to get started</p>
          <p className="text-xs mt-1 opacity-70">Drag blocks from the palette on the left</p>
        </div>
      )}
      {isRootDropZone && isOver && (
        <div className="text-center text-primary px-4">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm font-medium">Release to drop block here</p>
        </div>
      )}
    </div>
  )
}

export function Canvas() {
  const { blocks, zoom, showGrid, breakpoint, previewMode, selectBlock } = useComposerStore()

  // Calculate canvas width based on breakpoint
  const getCanvasWidth = () => {
    switch (breakpoint) {
      case 'mobile':
        return '375px'
      case 'tablet':
        return '768px'
      case 'desktop':
      default:
        return '100%'
    }
  }

  const canvasMaxWidth = breakpoint === 'desktop' ? '1440px' : getCanvasWidth()

  return (
    <div className="flex-1 h-full overflow-auto bg-muted/30">
      <div
        className="mx-auto py-8 transition-all duration-200"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          width: zoom < 100 ? `${(100 / zoom) * 100}%` : '100%',
        }}
      >
        {/* Grid Background */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          />
        )}

        {/* Canvas Content */}
        <div
          className="mx-auto bg-white dark:bg-card rounded-lg shadow-lg min-h-[800px] relative transition-all duration-200"
          style={{
            width: breakpoint === 'desktop' ? '100%' : getCanvasWidth(),
            maxWidth: canvasMaxWidth,
          }}
          onClick={() => selectBlock(null)}
        >
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[800px] text-center p-8">
              {!previewMode && <DropZone />}
              <div className="mt-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {previewMode ? 'Empty Page' : 'Start Building'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {previewMode
                    ? 'This page has no content yet'
                    : 'Drag blocks from the palette on the left to the drop zone above'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {blocks.map((block, index) => (
                <div key={block.id} className="space-y-2">
                  {!previewMode && index === 0 && <DropZone />}
                  <BlockRenderer block={block} />
                  {!previewMode && <DropZone blockId={block.id} position="after" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
