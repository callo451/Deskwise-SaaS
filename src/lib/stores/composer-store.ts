import { create } from 'zustand'
import { BlockInstance, PortalPage, PortalTheme } from '@/lib/types'

/**
 * Composer State
 */
interface ComposerState {
  // Current page data
  page: PortalPage | null
  blocks: BlockInstance[]
  theme: Partial<PortalTheme> | null

  // Selection state
  selectedBlockId: string | null
  hoveredBlockId: string | null

  // Undo/Redo stacks
  undoStack: BlockInstance[][]
  redoStack: BlockInstance[][]
  canUndo: boolean
  canRedo: boolean

  // UI state
  previewMode: boolean
  zoom: number
  breakpoint: 'mobile' | 'tablet' | 'desktop'
  showGrid: boolean
  isDirty: boolean
  lastSaved: Date | null

  // Actions
  setPage: (page: PortalPage) => void
  setBlocks: (blocks: BlockInstance[]) => void
  setTheme: (theme: Partial<PortalTheme>) => void

  // Block operations
  addBlock: (block: BlockInstance, parentId?: string, index?: number) => void
  updateBlock: (blockId: string, updates: Partial<BlockInstance>) => void
  deleteBlock: (blockId: string) => void
  moveBlock: (blockId: string, newParentId: string | null, newIndex: number) => void
  duplicateBlock: (blockId: string) => void

  // Selection
  selectBlock: (blockId: string | null) => void
  hoverBlock: (blockId: string | null) => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  pushHistory: () => void

  // UI controls
  setPreviewMode: (enabled: boolean) => void
  setZoom: (zoom: number) => void
  setBreakpoint: (breakpoint: 'mobile' | 'tablet' | 'desktop') => void
  setShowGrid: (show: boolean) => void

  // Save
  markDirty: () => void
  markClean: () => void

  // Reset
  reset: () => void
}

/**
 * Helper: Find block by ID in tree
 */
const findBlockById = (
  blocks: BlockInstance[],
  blockId: string
): BlockInstance | null => {
  for (const block of blocks) {
    if (block.id === blockId) return block
    if (block.children) {
      const found = findBlockById(block.children, blockId)
      if (found) return found
    }
  }
  return null
}

/**
 * Helper: Remove block from tree
 */
const removeBlockFromTree = (
  blocks: BlockInstance[],
  blockId: string
): BlockInstance[] => {
  return blocks
    .filter((block) => block.id !== blockId)
    .map((block) => ({
      ...block,
      children: block.children ? removeBlockFromTree(block.children, blockId) : undefined,
    }))
}

/**
 * Helper: Update block in tree
 */
const updateBlockInTree = (
  blocks: BlockInstance[],
  blockId: string,
  updates: Partial<BlockInstance>
): BlockInstance[] => {
  return blocks.map((block) => {
    if (block.id === blockId) {
      return { ...block, ...updates }
    }
    if (block.children) {
      return {
        ...block,
        children: updateBlockInTree(block.children, blockId, updates),
      }
    }
    return block
  })
}

/**
 * Helper: Insert block into tree
 */
const insertBlockIntoTree = (
  blocks: BlockInstance[],
  newBlock: BlockInstance,
  parentId: string | null,
  index?: number
): BlockInstance[] => {
  // If no parent, insert at root level
  if (!parentId) {
    const targetIndex = index ?? blocks.length
    return [
      ...blocks.slice(0, targetIndex),
      newBlock,
      ...blocks.slice(targetIndex),
    ]
  }

  // Find parent and insert into children
  return blocks.map((block) => {
    if (block.id === parentId) {
      const children = block.children || []
      const targetIndex = index ?? children.length
      return {
        ...block,
        children: [
          ...children.slice(0, targetIndex),
          newBlock,
          ...children.slice(targetIndex),
        ],
      }
    }
    if (block.children) {
      return {
        ...block,
        children: insertBlockIntoTree(block.children, newBlock, parentId, index),
      }
    }
    return block
  })
}

/**
 * Composer Store
 */
export const useComposerStore = create<ComposerState>((set, get) => ({
  // Initial state
  page: null,
  blocks: [],
  theme: null,
  selectedBlockId: null,
  hoveredBlockId: null,
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  previewMode: false,
  zoom: 100,
  breakpoint: 'desktop',
  showGrid: true,
  isDirty: false,
  lastSaved: null,

  // Setters
  setPage: (page) => set({ page, blocks: page.blocks, theme: page.themeOverrides || null }),
  setBlocks: (blocks) => {
    const state = get()
    state.pushHistory()
    set({ blocks, isDirty: true })
  },
  setTheme: (theme) => set({ theme, isDirty: true }),

  // Block operations
  addBlock: (block, parentId, index) => {
    const state = get()
    state.pushHistory()
    const newBlocks = insertBlockIntoTree(state.blocks, block, parentId || null, index)
    set({ blocks: newBlocks, selectedBlockId: block.id, isDirty: true })
  },

  updateBlock: (blockId, updates) => {
    const state = get()
    state.pushHistory()
    const newBlocks = updateBlockInTree(state.blocks, blockId, updates)
    set({ blocks: newBlocks, isDirty: true })
  },

  deleteBlock: (blockId) => {
    const state = get()
    state.pushHistory()
    const newBlocks = removeBlockFromTree(state.blocks, blockId)
    set({
      blocks: newBlocks,
      selectedBlockId: state.selectedBlockId === blockId ? null : state.selectedBlockId,
      isDirty: true,
    })
  },

  moveBlock: (blockId, newParentId, newIndex) => {
    const state = get()
    state.pushHistory()

    // Find the block to move
    const blockToMove = findBlockById(state.blocks, blockId)
    if (!blockToMove) return

    // Remove from old position
    let newBlocks = removeBlockFromTree(state.blocks, blockId)

    // Insert at new position
    newBlocks = insertBlockIntoTree(newBlocks, blockToMove, newParentId, newIndex)

    set({ blocks: newBlocks, isDirty: true })
  },

  duplicateBlock: (blockId) => {
    const state = get()
    const blockToDuplicate = findBlockById(state.blocks, blockId)
    if (!blockToDuplicate) return

    // Create copy with new ID
    const newBlock: BlockInstance = {
      ...JSON.parse(JSON.stringify(blockToDuplicate)), // Deep clone
      id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Find parent of original block
    const findParent = (
      blocks: BlockInstance[],
      targetId: string,
      parentId: string | null = null
    ): string | null => {
      for (const block of blocks) {
        if (block.id === targetId) return parentId
        if (block.children) {
          const found = findParent(block.children, targetId, block.id)
          if (found !== null) return found
        }
      }
      return null
    }

    const parentId = findParent(state.blocks, blockId)
    state.pushHistory()

    // Insert after original
    const parent = parentId ? findBlockById(state.blocks, parentId) : null
    const siblings = parent ? parent.children || [] : state.blocks
    const index = siblings.findIndex((b) => b.id === blockId)

    const newBlocks = insertBlockIntoTree(state.blocks, newBlock, parentId, index + 1)
    set({ blocks: newBlocks, selectedBlockId: newBlock.id, isDirty: true })
  },

  // Selection
  selectBlock: (blockId) => set({ selectedBlockId: blockId }),
  hoverBlock: (blockId) => set({ hoveredBlockId: blockId }),

  // Undo/Redo
  undo: () => {
    const state = get()
    if (state.undoStack.length === 0) return

    const previousBlocks = state.undoStack[state.undoStack.length - 1]
    const newUndoStack = state.undoStack.slice(0, -1)
    const newRedoStack = [...state.redoStack, state.blocks]

    set({
      blocks: previousBlocks,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: newUndoStack.length > 0,
      canRedo: true,
      isDirty: true,
    })
  },

  redo: () => {
    const state = get()
    if (state.redoStack.length === 0) return

    const nextBlocks = state.redoStack[state.redoStack.length - 1]
    const newRedoStack = state.redoStack.slice(0, -1)
    const newUndoStack = [...state.undoStack, state.blocks]

    set({
      blocks: nextBlocks,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: true,
      canRedo: newRedoStack.length > 0,
      isDirty: true,
    })
  },

  pushHistory: () => {
    const state = get()
    const newUndoStack = [...state.undoStack, state.blocks]
    // Limit history to 50 entries
    if (newUndoStack.length > 50) {
      newUndoStack.shift()
    }
    set({
      undoStack: newUndoStack,
      redoStack: [], // Clear redo stack on new action
      canUndo: true,
      canRedo: false,
    })
  },

  // UI controls
  setPreviewMode: (enabled) => set({ previewMode: enabled }),
  setZoom: (zoom) => set({ zoom }),
  setBreakpoint: (breakpoint) => set({ breakpoint }),
  setShowGrid: (show) => set({ showGrid: show }),

  // Save
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false, lastSaved: new Date() }),

  // Reset
  reset: () =>
    set({
      page: null,
      blocks: [],
      theme: null,
      selectedBlockId: null,
      hoveredBlockId: null,
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
      previewMode: false,
      zoom: 100,
      breakpoint: 'desktop',
      showGrid: true,
      isDirty: false,
      lastSaved: null,
    }),
}))
