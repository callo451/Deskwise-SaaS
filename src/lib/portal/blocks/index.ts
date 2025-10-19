/**
 * Portal Blocks - Main Export
 *
 * Central export point for the block registry system
 */

// Types
export type {
  BlockCategory,
  RenderMode,
  VisibilityGuardType,
  DataBinding,
  VisibilityGuard,
  BlockInstance,
  BlockMetadata,
  BlockDefinition,
  BlockRegistry,
  BlockValidationResult,
  BaseBlockProps,
  ContainerBlockProps,
  LayoutBlockProps,
  TextAlign,
  TypographyVariant,
  ButtonVariant,
  ButtonSize,
  ImageFit,
  IconSize,
  InputType,
  FileAcceptType,
  BlockContext,
  BlockEventHandlers,
  BlockDragData,
  BlockInsertPosition,
  BlockMoveOperation,
  BlockUpdateOperation,
} from './types'

// Schemas and their types
export * from './schemas'

// Components
export * from './components'

// Registry
export {
  blockRegistry,
  getBlockDefinition,
  getAllBlockDefinitions,
  getBlockDefinitionsByCategory,
  validateBlockProps,
  getBlockComponent,
} from './registry'

// Utilities
export {
  validateBlock,
  validateBlockTree,
  findBlockById,
  findParentBlock,
  getBlocksByType,
  flattenBlocks,
  cloneBlock,
  generateBlockId,
  removeBlock,
  updateBlock,
  moveBlock,
  resolveBinding,
  resolveBlockBindings,
  checkVisibility,
  serializeBlocks,
  deserializeBlocks,
  getBlockTreeDepth,
  countBlocks,
  getBlockStatistics,
} from './utils'
