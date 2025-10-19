import { z } from 'zod'
import { ReactNode } from 'react'

// ============================================
// Core Block Types
// ============================================

export type BlockCategory = 'container' | 'content' | 'data' | 'form' | 'widget'
export type RenderMode = 'client' | 'server'
export type VisibilityGuardType = 'role' | 'permission' | 'custom'

/**
 * Data Binding Configuration
 * Allows blocks to bind to dynamic data sources
 */
export interface DataBinding {
  id: string
  sourceType: 'context' | 'api' | 'store' | 'prop'
  sourcePath: string // e.g., 'user.email', 'tickets.items[0].title'
  targetProp: string // e.g., 'value', 'items', 'text'
  transform?: string // Optional transform function (evaluated safely)
  defaultValue?: any
}

/**
 * Visibility Guard
 * Controls when a block is visible based on conditions
 */
export interface VisibilityGuard {
  id: string
  type: VisibilityGuardType
  condition: string | string[] // Role name, permission key, or custom expression
  operator?: 'and' | 'or' // For multiple conditions
  negate?: boolean // If true, inverts the condition
}

/**
 * Block Instance
 * Represents a single block in the page tree
 */
export interface BlockInstance {
  id: string
  type: string
  props: Record<string, any>
  children?: BlockInstance[]
  bindings?: DataBinding[]
  guards?: VisibilityGuard[]
  renderMode: RenderMode
  order?: number // For ordering blocks within a container
  metadata?: {
    label?: string // Human-readable label for builder UI
    locked?: boolean // Prevent editing/deletion in builder
    hidden?: boolean // Hide from builder preview (but still render)
  }
}

/**
 * Block Metadata
 * Describes a block type for the builder UI
 */
export interface BlockMetadata {
  label: string
  description: string
  category: BlockCategory
  icon: string // Lucide icon name
  isContainer: boolean
  allowedChildren?: string[] // Block types that can be children (undefined = all)
  maxChildren?: number // Maximum number of children (undefined = unlimited)
  previewImage?: string // Optional preview image for builder palette
  tags?: string[] // For filtering/searching in builder
}

/**
 * Block Definition
 * Complete definition of a block type including component and validation
 */
export interface BlockDefinition<TProps = any> {
  type: string
  component: React.ComponentType<TProps>
  schema: z.ZodSchema<TProps>
  metadata: BlockMetadata
  defaultProps?: Partial<TProps>
}

/**
 * Block Registry
 * Map of block type to definition
 */
export type BlockRegistry = Record<string, BlockDefinition>

/**
 * Block Validation Result
 */
export interface BlockValidationResult {
  valid: boolean
  errors?: Array<{
    path: string
    message: string
    blockId?: string
  }>
}

// ============================================
// Common Block Prop Types
// ============================================

/**
 * Base props that all blocks receive
 */
export interface BaseBlockProps {
  id: string
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
}

/**
 * Container Block Props
 */
export interface ContainerBlockProps extends BaseBlockProps {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  background?: string
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  border?: boolean
  borderColor?: string
}

/**
 * Layout Block Props (Grid, Stack)
 */
export interface LayoutBlockProps extends ContainerBlockProps {
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

/**
 * Text Alignment
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify'

/**
 * Typography Variant
 */
export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'label'

/**
 * Button Variant
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive'

/**
 * Button Size
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Image Fit
 */
export type ImageFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'

/**
 * Icon Size
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Input Type
 */
export type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'date' | 'datetime-local' | 'time'

/**
 * File Accept Types
 */
export type FileAcceptType = 'image/*' | 'video/*' | 'audio/*' | 'application/pdf' | '.doc' | '.docx' | '.xls' | '.xlsx' | string

// ============================================
// Block Context Types
// ============================================

/**
 * Block Context
 * Runtime context available to all blocks
 */
export interface BlockContext {
  user?: {
    id: string
    email: string
    name: string
    role: string
    permissions: string[]
  }
  organization?: {
    id: string
    name: string
    settings?: Record<string, any>
  }
  page?: {
    id: string
    slug: string
    params?: Record<string, string>
    query?: Record<string, string>
  }
  data?: Record<string, any> // Custom data passed from page
  theme?: {
    primaryColor?: string
    accentColor?: string
    mode?: 'light' | 'dark'
  }
}

/**
 * Block Event Handlers
 */
export interface BlockEventHandlers {
  onClick?: (event: React.MouseEvent, blockId: string) => void
  onSubmit?: (data: Record<string, any>, blockId: string) => void | Promise<void>
  onChange?: (field: string, value: any, blockId: string) => void
  onError?: (error: Error, blockId: string) => void
}

// ============================================
// Builder-specific Types
// ============================================

/**
 * Block Drag Data
 * Used for drag-and-drop in builder
 */
export interface BlockDragData {
  blockType: string
  sourceIndex?: number
  sourceParentId?: string
}

/**
 * Block Insert Position
 */
export interface BlockInsertPosition {
  parentId: string
  index: number
}

/**
 * Block Move Operation
 */
export interface BlockMoveOperation {
  blockId: string
  fromParent: string
  toParent: string
  fromIndex: number
  toIndex: number
}

/**
 * Block Update Operation
 */
export interface BlockUpdateOperation {
  blockId: string
  props?: Record<string, any>
  bindings?: DataBinding[]
  guards?: VisibilityGuard[]
  renderMode?: RenderMode
}
