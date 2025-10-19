'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useComposerStore } from '@/lib/stores/composer-store'
import { BlockPalette } from '@/components/portal-composer/BlockPalette'
import { Canvas } from '@/components/portal-composer/Canvas'
import { Inspector } from '@/components/portal-composer/Inspector'
import { Toolbar } from '@/components/portal-composer/Toolbar'
import { LayerTree } from '@/components/portal-composer/LayerTree'
import { createBlockInstance } from '@/lib/portal-blocks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Box, Settings, Layers } from 'lucide-react'

export default function ComposerPage() {
  const params = useParams()
  const pageId = params?.pageId as string
  const { setPage, addBlock, reset, selectedBlockId } = useComposerStore()
  const [activeTab, setActiveTab] = useState('blocks')

  // Auto-switch to Properties tab when a block is selected
  useEffect(() => {
    if (selectedBlockId && activeTab !== 'properties') {
      setActiveTab('properties')
    }
  }, [selectedBlockId])

  // Load page data
  useEffect(() => {
    const loadPage = async () => {
      try {
        const response = await fetch(`/api/admin/portal/pages/${pageId}`)
        if (response.ok) {
          const data = await response.json()
          setPage(data)
        }
      } catch (error) {
        console.error('Failed to load page:', error)
      }
    }

    if (pageId) {
      loadPage()
    }

    return () => {
      reset()
    }
  }, [pageId, setPage, reset])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = e.target as HTMLElement
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Don't trigger shortcuts when typing
      if (isTyping && (e.key === 'Backspace' || e.key === 'Delete')) {
        return
      }

      const { undo, redo, deleteBlock, duplicateBlock, selectedBlockId } = useComposerStore.getState()

      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        redo()
      }

      // Delete (Del or Backspace) - only if not typing
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId && !isTyping) {
        e.preventDefault()
        deleteBlock(selectedBlockId)
      }

      // Duplicate (Ctrl+D)
      if (e.ctrlKey && e.key === 'd' && selectedBlockId) {
        e.preventDefault()
        duplicateBlock(selectedBlockId)
      }

      // Save (Ctrl+S)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        // Trigger save
        const saveButton = document.querySelector('[data-save-button]') as HTMLButtonElement
        saveButton?.click()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current

    // Dragging from palette (new block)
    if (activeData?.source === 'palette') {
      const newBlock = createBlockInstance(activeData.type)
      if (!newBlock) return

      // Calculate index based on drop position
      let targetIndex: number | undefined = undefined
      let parentId: string | undefined = undefined

      if (overData?.position === 'root') {
        // Dropping in empty root area
        targetIndex = 0
      } else if (overData?.blockId) {
        // Dropping near a specific block
        const { blocks } = useComposerStore.getState()
        const blockIndex = blocks.findIndex((b) => b.id === overData.blockId)

        if (overData.acceptsChildren) {
          // Dropping inside a container
          parentId = overData.blockId
          targetIndex = 0
        } else if (overData.position === 'after') {
          // Dropping after a block
          targetIndex = blockIndex + 1
        } else {
          // Dropping before a block (or default)
          targetIndex = blockIndex
        }
      }

      addBlock(newBlock, parentId, targetIndex)
    }
    // Moving existing block (reordering)
    else if (activeData?.blockId) {
      const { blocks, moveBlock } = useComposerStore.getState()
      const sourceBlockId = activeData.blockId

      // Don't do anything if dropping on itself
      if (overData?.blockId === sourceBlockId) return

      // Calculate new position
      let targetIndex: number | undefined = undefined
      let newParentId: string | null = null

      if (overData?.position === 'root') {
        // Move to root, first position
        targetIndex = 0
      } else if (overData?.blockId) {
        if (overData.acceptsChildren) {
          // Move inside a container
          newParentId = overData.blockId
          targetIndex = 0
        } else {
          // Move before/after another block
          const blockIndex = blocks.findIndex((b) => b.id === overData.blockId)
          if (blockIndex !== -1) {
            targetIndex = overData.position === 'after' ? blockIndex + 1 : blockIndex
          }
        }
      }

      // Only move if we have a valid target
      if (targetIndex !== undefined) {
        moveBlock(sourceBlockId, newParentId, targetIndex)
      }
    }
  }

  return (
    <DndContext
      onDragEnd={handleDragEnd}
      sensors={useSensors(
        useSensor(PointerSensor, {
          activationConstraint: {
            distance: 8, // Only start dragging after moving 8px
          },
        })
      )}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Toolbar */}
        <Toolbar />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Tabbed Panel */}
          <div className="w-80 border-r bg-card flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b bg-muted/50 h-12 flex-shrink-0">
                <TabsTrigger value="blocks" className="flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Blocks
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Properties
                </TabsTrigger>
                <TabsTrigger value="layers" className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Layers
                </TabsTrigger>
              </TabsList>

              <TabsContent value="blocks" className="flex-1 mt-0 overflow-y-auto min-h-0">
                <BlockPalette />
              </TabsContent>

              <TabsContent value="properties" className="flex-1 mt-0 overflow-y-auto min-h-0">
                <Inspector />
              </TabsContent>

              <TabsContent value="layers" className="flex-1 mt-0 overflow-y-auto min-h-0">
                <LayerTree />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Canvas (Full Width) */}
          <div className="flex-1 overflow-hidden">
            <Canvas />
          </div>
        </div>
      </div>

      {/* Drag Overlay (visual feedback while dragging) */}
      <DragOverlay>
        <div className="p-3 bg-primary text-primary-foreground rounded shadow-lg">
          Dragging block...
        </div>
      </DragOverlay>
    </DndContext>
  )
}
