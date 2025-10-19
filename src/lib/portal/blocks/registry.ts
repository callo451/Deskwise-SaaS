/**
 * Block Registry
 *
 * Central registry of all block types with their components, schemas, and metadata
 */

import type { BlockDefinition, BlockRegistry } from './types'
import * as schemas from './schemas'
import * as components from './components'

// ============================================
// Container Blocks
// ============================================

const sectionBlock: BlockDefinition = {
  type: 'section',
  component: components.SectionBlock,
  schema: schemas.sectionPropsSchema,
  metadata: {
    label: 'Section',
    description: 'Full-width container with padding and background options',
    category: 'container',
    icon: 'Layout',
    isContainer: true,
    tags: ['layout', 'container', 'wrapper'],
  },
  defaultProps: {
    id: '',
    padding: 'md',
    gap: 'md',
    maxWidth: 'full',
  },
}

const gridBlock: BlockDefinition = {
  type: 'grid',
  component: components.GridBlock,
  schema: schemas.gridPropsSchema,
  metadata: {
    label: 'Grid',
    description: 'CSS Grid layout with configurable columns and responsive breakpoints',
    category: 'container',
    icon: 'Grid3x3',
    isContainer: true,
    tags: ['layout', 'grid', 'responsive'],
  },
  defaultProps: {
    id: '',
    columns: 3,
    gap: 'md',
  },
}

const stackBlock: BlockDefinition = {
  type: 'stack',
  component: components.StackBlock,
  schema: schemas.stackPropsSchema,
  metadata: {
    label: 'Stack',
    description: 'Flexbox vertical or horizontal stack with gap control',
    category: 'container',
    icon: 'Columns',
    isContainer: true,
    tags: ['layout', 'flex', 'stack'],
  },
  defaultProps: {
    id: '',
    direction: 'vertical',
    gap: 'md',
  },
}

const containerBlock: BlockDefinition = {
  type: 'container',
  component: components.ContainerBlock,
  schema: schemas.containerPropsSchema,
  metadata: {
    label: 'Container',
    description: 'Generic container with semantic HTML tag options',
    category: 'container',
    icon: 'Box',
    isContainer: true,
    tags: ['layout', 'container', 'generic'],
  },
  defaultProps: {
    id: '',
    tag: 'div',
    padding: 'md',
  },
}

// ============================================
// Content Blocks
// ============================================

const textBlock: BlockDefinition = {
  type: 'text',
  component: components.TextBlock,
  schema: schemas.textPropsSchema,
  metadata: {
    label: 'Text',
    description: 'Typography with rich text support and markdown',
    category: 'content',
    icon: 'Type',
    isContainer: false,
    tags: ['text', 'typography', 'content'],
  },
  defaultProps: {
    id: '',
    content: 'Text content',
    variant: 'body1',
  },
}

const imageBlock: BlockDefinition = {
  type: 'image',
  component: components.ImageBlock,
  schema: schemas.imagePropsSchema,
  metadata: {
    label: 'Image',
    description: 'Responsive image with alt text and sizing options',
    category: 'content',
    icon: 'Image',
    isContainer: false,
    tags: ['image', 'media', 'visual'],
  },
  defaultProps: {
    id: '',
    src: '',
    alt: '',
    fit: 'cover',
  },
}

const buttonBlock: BlockDefinition = {
  type: 'button',
  component: components.ButtonBlock,
  schema: schemas.buttonPropsSchema,
  metadata: {
    label: 'Button',
    description: 'Call-to-action button with link or custom action',
    category: 'content',
    icon: 'MousePointerClick',
    isContainer: false,
    tags: ['button', 'cta', 'action'],
  },
  defaultProps: {
    id: '',
    text: 'Button',
    variant: 'primary',
  },
}

const iconBlock: BlockDefinition = {
  type: 'icon',
  component: components.IconBlock,
  schema: schemas.iconPropsSchema,
  metadata: {
    label: 'Icon',
    description: 'Lucide icon with size and color options',
    category: 'content',
    icon: 'Smile',
    isContainer: false,
    tags: ['icon', 'lucide', 'visual'],
  },
  defaultProps: {
    id: '',
    name: 'Circle',
    size: 'md',
  },
}

const dividerBlock: BlockDefinition = {
  type: 'divider',
  component: components.DividerBlock,
  schema: schemas.dividerPropsSchema,
  metadata: {
    label: 'Divider',
    description: 'Visual separator with optional label',
    category: 'content',
    icon: 'Minus',
    isContainer: false,
    tags: ['divider', 'separator', 'hr'],
  },
  defaultProps: {
    id: '',
    orientation: 'horizontal',
  },
}

const spacerBlock: BlockDefinition = {
  type: 'spacer',
  component: components.SpacerBlock,
  schema: schemas.spacerPropsSchema,
  metadata: {
    label: 'Spacer',
    description: 'Empty space for vertical or horizontal spacing',
    category: 'content',
    icon: 'MoveVertical',
    isContainer: false,
    tags: ['spacer', 'spacing', 'gap'],
  },
  defaultProps: {
    id: '',
    size: 'md',
  },
}

// ============================================
// Data Blocks
// ============================================

const listBlock: BlockDefinition = {
  type: 'list',
  component: components.ListBlock,
  schema: schemas.listPropsSchema,
  metadata: {
    label: 'List',
    description: 'Repeater for data arrays with item template',
    category: 'data',
    icon: 'List',
    isContainer: true,
    tags: ['list', 'repeater', 'data'],
  },
  defaultProps: {
    id: '',
    dataSource: { type: 'static', items: [] },
    layout: 'list',
  },
}

const tableBlock: BlockDefinition = {
  type: 'table',
  component: components.TableBlock,
  schema: schemas.tablePropsSchema,
  metadata: {
    label: 'Table',
    description: 'Data table with sorting, filtering, and pagination',
    category: 'data',
    icon: 'Table',
    isContainer: false,
    tags: ['table', 'data', 'grid'],
  },
  defaultProps: {
    id: '',
    dataSource: { type: 'static', items: [] },
    columns: [],
  },
}

const cardGridBlock: BlockDefinition = {
  type: 'card-grid',
  component: components.CardGridBlock,
  schema: schemas.cardGridPropsSchema,
  metadata: {
    label: 'Card Grid',
    description: 'Responsive grid of cards with data binding',
    category: 'data',
    icon: 'Grid2x2',
    isContainer: false,
    tags: ['cards', 'grid', 'data'],
  },
  defaultProps: {
    id: '',
    dataSource: { type: 'static', items: [] },
    cardTemplate: { title: '' },
    columns: 3,
  },
}

// ============================================
// Form Blocks
// ============================================

const inputBlock: BlockDefinition = {
  type: 'input',
  component: components.InputBlock,
  schema: schemas.inputPropsSchema,
  metadata: {
    label: 'Text Input',
    description: 'Text input with validation support',
    category: 'form',
    icon: 'TextCursor',
    isContainer: false,
    tags: ['input', 'form', 'text'],
  },
  defaultProps: {
    id: '',
    name: 'input',
    label: 'Label',
    type: 'text',
  },
}

const textareaBlock: BlockDefinition = {
  type: 'textarea',
  component: components.TextareaBlock,
  schema: schemas.textareaPropsSchema,
  metadata: {
    label: 'Textarea',
    description: 'Multi-line text input',
    category: 'form',
    icon: 'AlignLeft',
    isContainer: false,
    tags: ['textarea', 'form', 'text'],
  },
  defaultProps: {
    id: '',
    name: 'textarea',
    label: 'Label',
    rows: 4,
  },
}

const selectBlock: BlockDefinition = {
  type: 'select',
  component: components.SelectBlock,
  schema: schemas.selectPropsSchema,
  metadata: {
    label: 'Select',
    description: 'Dropdown selector with search support',
    category: 'form',
    icon: 'ChevronDown',
    isContainer: false,
    tags: ['select', 'form', 'dropdown'],
  },
  defaultProps: {
    id: '',
    name: 'select',
    label: 'Label',
    options: [],
  },
}

const checkboxBlock: BlockDefinition = {
  type: 'checkbox',
  component: components.CheckboxBlock,
  schema: schemas.checkboxPropsSchema,
  metadata: {
    label: 'Checkbox',
    description: 'Single checkbox input',
    category: 'form',
    icon: 'CheckSquare',
    isContainer: false,
    tags: ['checkbox', 'form', 'boolean'],
  },
  defaultProps: {
    id: '',
    name: 'checkbox',
    label: 'Label',
  },
}

const checkboxGroupBlock: BlockDefinition = {
  type: 'checkbox-group',
  component: components.CheckboxGroupBlock,
  schema: schemas.checkboxGroupPropsSchema,
  metadata: {
    label: 'Checkbox Group',
    description: 'Multiple checkboxes for multi-select',
    category: 'form',
    icon: 'ListChecks',
    isContainer: false,
    tags: ['checkbox', 'form', 'group'],
  },
  defaultProps: {
    id: '',
    name: 'checkbox-group',
    label: 'Label',
    options: [],
  },
}

const radioGroupBlock: BlockDefinition = {
  type: 'radio-group',
  component: components.RadioGroupBlock,
  schema: schemas.radioGroupPropsSchema,
  metadata: {
    label: 'Radio Group',
    description: 'Radio buttons for single selection',
    category: 'form',
    icon: 'CircleDot',
    isContainer: false,
    tags: ['radio', 'form', 'group'],
  },
  defaultProps: {
    id: '',
    name: 'radio-group',
    label: 'Label',
    options: [],
  },
}

const fileUploadBlock: BlockDefinition = {
  type: 'file-upload',
  component: components.FileUploadBlock,
  schema: schemas.fileUploadPropsSchema,
  metadata: {
    label: 'File Upload',
    description: 'File picker with drag-and-drop support',
    category: 'form',
    icon: 'Upload',
    isContainer: false,
    tags: ['file', 'upload', 'form'],
  },
  defaultProps: {
    id: '',
    name: 'file-upload',
    label: 'Upload File',
  },
}

const switchBlock: BlockDefinition = {
  type: 'switch',
  component: components.SwitchBlock,
  schema: schemas.switchPropsSchema,
  metadata: {
    label: 'Switch',
    description: 'Toggle switch for boolean values',
    category: 'form',
    icon: 'ToggleLeft',
    isContainer: false,
    tags: ['switch', 'toggle', 'form'],
  },
  defaultProps: {
    id: '',
    name: 'switch',
    label: 'Label',
  },
}

const sliderBlock: BlockDefinition = {
  type: 'slider',
  component: components.SliderBlock,
  schema: schemas.sliderPropsSchema,
  metadata: {
    label: 'Slider',
    description: 'Range slider for numeric input',
    category: 'form',
    icon: 'SlidersHorizontal',
    isContainer: false,
    tags: ['slider', 'range', 'form'],
  },
  defaultProps: {
    id: '',
    name: 'slider',
    label: 'Label',
    min: 0,
    max: 100,
  },
}

const datePickerBlock: BlockDefinition = {
  type: 'date-picker',
  component: components.DatePickerBlock,
  schema: schemas.datePickerPropsSchema,
  metadata: {
    label: 'Date Picker',
    description: 'Date and time picker with range support',
    category: 'form',
    icon: 'Calendar',
    isContainer: false,
    tags: ['date', 'picker', 'form'],
  },
  defaultProps: {
    id: '',
    name: 'date-picker',
    label: 'Select Date',
  },
}

const richTextEditorBlock: BlockDefinition = {
  type: 'rich-text-editor',
  component: components.RichTextEditorBlock,
  schema: schemas.richTextEditorPropsSchema,
  metadata: {
    label: 'Rich Text Editor',
    description: 'WYSIWYG editor for formatted text',
    category: 'form',
    icon: 'FileText',
    isContainer: false,
    tags: ['editor', 'wysiwyg', 'form'],
  },
  defaultProps: {
    id: '',
    name: 'rich-text-editor',
    label: 'Content',
  },
}

const submitButtonBlock: BlockDefinition = {
  type: 'submit-button',
  component: components.SubmitButtonBlock,
  schema: schemas.submitButtonPropsSchema,
  metadata: {
    label: 'Submit Button',
    description: 'Form submission button',
    category: 'form',
    icon: 'Send',
    isContainer: false,
    tags: ['submit', 'button', 'form'],
  },
  defaultProps: {
    id: '',
    text: 'Submit',
  },
}

const formBlock: BlockDefinition = {
  type: 'form',
  component: components.FormBlock,
  schema: schemas.formPropsSchema,
  metadata: {
    label: 'Form',
    description: 'Form container with validation and submission',
    category: 'form',
    icon: 'FormInput',
    isContainer: true,
    allowedChildren: [
      'input',
      'textarea',
      'select',
      'checkbox',
      'checkbox-group',
      'radio-group',
      'file-upload',
      'switch',
      'slider',
      'date-picker',
      'rich-text-editor',
      'submit-button',
      'text',
      'divider',
      'spacer',
    ],
    tags: ['form', 'container'],
  },
  defaultProps: {
    id: '',
    name: 'form',
    action: '',
    method: 'POST',
  },
}

// ============================================
// Widget Blocks
// ============================================

const ticketCreateWidgetBlock: BlockDefinition = {
  type: 'ticket-create-widget',
  component: components.TicketCreateWidget,
  schema: schemas.ticketCreateWidgetPropsSchema,
  metadata: {
    label: 'Ticket Create',
    description: 'Inline ticket creation form',
    category: 'widget',
    icon: 'Ticket',
    isContainer: false,
    tags: ['ticket', 'create', 'widget'],
  },
  defaultProps: {
    id: '',
    title: 'Create Support Ticket',
  },
}

const ticketListWidgetBlock: BlockDefinition = {
  type: 'ticket-list-widget',
  component: components.TicketListWidget,
  schema: schemas.ticketListWidgetPropsSchema,
  metadata: {
    label: 'Ticket List',
    description: 'Display user tickets with filters',
    category: 'widget',
    icon: 'ListTodo',
    isContainer: false,
    tags: ['ticket', 'list', 'widget'],
  },
  defaultProps: {
    id: '',
    title: 'My Tickets',
  },
}

const incidentStatusWidgetBlock: BlockDefinition = {
  type: 'incident-status-widget',
  component: components.IncidentStatusWidget,
  schema: schemas.incidentStatusWidgetPropsSchema,
  metadata: {
    label: 'Incident Status',
    description: 'System status and incident timeline',
    category: 'widget',
    icon: 'AlertTriangle',
    isContainer: false,
    tags: ['incident', 'status', 'widget'],
  },
  defaultProps: {
    id: '',
    title: 'System Status',
  },
}

const kbSearchWidgetBlock: BlockDefinition = {
  type: 'kb-search-widget',
  component: components.KBSearchWidget,
  schema: schemas.kbSearchWidgetPropsSchema,
  metadata: {
    label: 'KB Search',
    description: 'Knowledge base search with results',
    category: 'widget',
    icon: 'Search',
    isContainer: false,
    tags: ['knowledge', 'search', 'widget'],
  },
  defaultProps: {
    id: '',
    title: 'Search Knowledge Base',
  },
}

const serviceCatalogWidgetBlock: BlockDefinition = {
  type: 'service-catalog-widget',
  component: components.ServiceCatalogWidget,
  schema: schemas.serviceCatalogWidgetPropsSchema,
  metadata: {
    label: 'Service Catalog',
    description: 'Service catalog grid with request forms',
    category: 'widget',
    icon: 'ShoppingCart',
    isContainer: false,
    tags: ['service', 'catalog', 'widget'],
  },
  defaultProps: {
    id: '',
    title: 'Request a Service',
  },
}

const announcementBannerBlock: BlockDefinition = {
  type: 'announcement-banner',
  component: components.AnnouncementBanner,
  schema: schemas.announcementBannerPropsSchema,
  metadata: {
    label: 'Announcement Banner',
    description: 'Alert banner for announcements',
    category: 'widget',
    icon: 'Megaphone',
    isContainer: false,
    tags: ['announcement', 'banner', 'widget'],
  },
  defaultProps: {
    id: '',
    message: 'Important announcement',
    type: 'info',
  },
}

const userProfileWidgetBlock: BlockDefinition = {
  type: 'user-profile-widget',
  component: components.UserProfileWidget,
  schema: schemas.userProfileWidgetPropsSchema,
  metadata: {
    label: 'User Profile',
    description: 'User profile display with actions',
    category: 'widget',
    icon: 'User',
    isContainer: false,
    tags: ['user', 'profile', 'widget'],
  },
  defaultProps: {
    id: '',
  },
}

// ============================================
// Block Registry
// ============================================

export const blockRegistry: BlockRegistry = {
  // Containers
  section: sectionBlock,
  grid: gridBlock,
  stack: stackBlock,
  container: containerBlock,
  // Content
  text: textBlock,
  image: imageBlock,
  button: buttonBlock,
  icon: iconBlock,
  divider: dividerBlock,
  spacer: spacerBlock,
  // Data
  list: listBlock,
  table: tableBlock,
  'card-grid': cardGridBlock,
  // Forms
  input: inputBlock,
  textarea: textareaBlock,
  select: selectBlock,
  checkbox: checkboxBlock,
  'checkbox-group': checkboxGroupBlock,
  'radio-group': radioGroupBlock,
  'file-upload': fileUploadBlock,
  switch: switchBlock,
  slider: sliderBlock,
  'date-picker': datePickerBlock,
  'rich-text-editor': richTextEditorBlock,
  'submit-button': submitButtonBlock,
  form: formBlock,
  // Widgets
  'ticket-create-widget': ticketCreateWidgetBlock,
  'ticket-list-widget': ticketListWidgetBlock,
  'incident-status-widget': incidentStatusWidgetBlock,
  'kb-search-widget': kbSearchWidgetBlock,
  'service-catalog-widget': serviceCatalogWidgetBlock,
  'announcement-banner': announcementBannerBlock,
  'user-profile-widget': userProfileWidgetBlock,
}

/**
 * Get a block definition by type
 */
export function getBlockDefinition(type: string): BlockDefinition | undefined {
  return blockRegistry[type]
}

/**
 * Get all block definitions
 */
export function getAllBlockDefinitions(): BlockDefinition[] {
  return Object.values(blockRegistry)
}

/**
 * Get block definitions by category
 */
export function getBlockDefinitionsByCategory(category: string): BlockDefinition[] {
  return Object.values(blockRegistry).filter((block) => block.metadata.category === category)
}

/**
 * Validate block props against schema
 */
export function validateBlockProps(type: string, props: any): { success: boolean; data?: any; error?: any } {
  const definition = getBlockDefinition(type)
  if (!definition) {
    return { success: false, error: new Error(`Unknown block type: ${type}`) }
  }

  const result = definition.schema.safeParse(props)
  return result
}

/**
 * Get block component by type
 */
export function getBlockComponent(type: string): React.ComponentType<any> | undefined {
  const definition = getBlockDefinition(type)
  return definition?.component
}
