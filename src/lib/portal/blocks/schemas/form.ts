import { z } from 'zod'

// ============================================
// Base Form Field Props
// ============================================

const baseFormFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  description: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  readonly: z.boolean().default(false),
  defaultValue: z.any().optional(),
  className: z.string().optional(),
})

// ============================================
// Input Block Schema
// ============================================

export const inputPropsSchema = baseFormFieldSchema.extend({
  type: z.enum(['text', 'email', 'password', 'tel', 'url', 'number', 'date', 'datetime-local', 'time']).default('text'),
  autocomplete: z.string().optional(),
  pattern: z.string().optional(), // Regex pattern for validation
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  min: z.number().optional(), // For number/date inputs
  max: z.number().optional(), // For number/date inputs
  step: z.number().optional(), // For number input
  icon: z.string().optional(), // Lucide icon name
  iconPosition: z.enum(['left', 'right']).default('left'),
  // Validation
  validation: z.object({
    pattern: z.string().optional(),
    message: z.string().optional(),
    custom: z.string().optional(), // Custom validation function
  }).optional(),
})

export type InputProps = z.infer<typeof inputPropsSchema>

// ============================================
// Textarea Block Schema
// ============================================

export const textareaPropsSchema = baseFormFieldSchema.extend({
  rows: z.number().min(2).max(20).default(4),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  resize: z.enum(['none', 'vertical', 'horizontal', 'both']).default('vertical'),
  autoResize: z.boolean().default(false), // Auto-grow with content
  showCharCount: z.boolean().default(false),
})

export type TextareaProps = z.infer<typeof textareaPropsSchema>

// ============================================
// Select Block Schema
// ============================================

export const selectPropsSchema = baseFormFieldSchema.extend({
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().default(false),
    icon: z.string().optional(),
  })).min(1, 'At least one option is required'),
  multiple: z.boolean().default(false),
  searchable: z.boolean().default(false),
  searchPlaceholder: z.string().default('Search...'),
  clearable: z.boolean().default(false),
  // Dynamic options from API
  dynamicOptions: z.object({
    enabled: z.boolean().default(false),
    endpoint: z.string().url('Invalid API endpoint').optional(),
    method: z.enum(['GET', 'POST']).default('GET'),
    headers: z.record(z.string()).optional(),
    valueField: z.string().default('value'),
    labelField: z.string().default('label'),
    transformResponse: z.string().optional(),
  }).optional(),
})

export type SelectProps = z.infer<typeof selectPropsSchema>

// ============================================
// Checkbox Block Schema
// ============================================

export const checkboxPropsSchema = baseFormFieldSchema.extend({
  checked: z.boolean().default(false),
  helperText: z.string().optional(),
})

export type CheckboxProps = z.infer<typeof checkboxPropsSchema>

// ============================================
// Checkbox Group Block Schema
// ============================================

export const checkboxGroupPropsSchema = baseFormFieldSchema.extend({
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().default(false),
  })).min(1, 'At least one option is required'),
  layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
  gridColumns: z.number().min(2).max(4).optional(),
  minSelection: z.number().min(0).optional(),
  maxSelection: z.number().min(1).optional(),
})

export type CheckboxGroupProps = z.infer<typeof checkboxGroupPropsSchema>

// ============================================
// Radio Group Block Schema
// ============================================

export const radioGroupPropsSchema = baseFormFieldSchema.extend({
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
    disabled: z.boolean().default(false),
  })).min(1, 'At least one option is required'),
  layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
  gridColumns: z.number().min(2).max(4).optional(),
})

export type RadioGroupProps = z.infer<typeof radioGroupPropsSchema>

// ============================================
// File Upload Block Schema
// ============================================

export const fileUploadPropsSchema = baseFormFieldSchema.extend({
  accept: z.union([
    z.array(z.string()),
    z.string(),
  ]).optional(), // e.g., ['image/*', '.pdf'], 'image/*'
  maxSize: z.number().min(1).optional(), // Max file size in bytes
  maxFiles: z.number().min(1).optional(), // Max number of files
  multiple: z.boolean().default(false),
  // Upload configuration
  uploadEndpoint: z.string().url('Invalid upload endpoint').optional(),
  uploadMethod: z.enum(['POST', 'PUT']).default('POST'),
  uploadHeaders: z.record(z.string()).optional(),
  // UI options
  dragAndDrop: z.boolean().default(true),
  showPreview: z.boolean().default(true),
  previewType: z.enum(['thumbnail', 'list']).default('thumbnail'),
  // Validation messages
  messages: z.object({
    invalidType: z.string().default('Invalid file type'),
    tooLarge: z.string().default('File is too large'),
    tooMany: z.string().default('Too many files'),
  }).optional(),
})

export type FileUploadProps = z.infer<typeof fileUploadPropsSchema>

// ============================================
// Switch Block Schema
// ============================================

export const switchPropsSchema = baseFormFieldSchema.extend({
  checked: z.boolean().default(false),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
})

export type SwitchProps = z.infer<typeof switchPropsSchema>

// ============================================
// Slider Block Schema
// ============================================

export const sliderPropsSchema = baseFormFieldSchema.extend({
  min: z.number().default(0),
  max: z.number().default(100),
  step: z.number().min(1).default(1),
  showValue: z.boolean().default(true),
  showTicks: z.boolean().default(false),
  tickValues: z.array(z.number()).optional(),
  tickLabels: z.record(z.string()).optional(), // e.g., { '0': 'Low', '50': 'Medium', '100': 'High' }
})

export type SliderProps = z.infer<typeof sliderPropsSchema>

// ============================================
// Date Picker Block Schema
// ============================================

export const datePickerPropsSchema = baseFormFieldSchema.extend({
  mode: z.enum(['single', 'range', 'multiple']).default('single'),
  format: z.string().default('yyyy-MM-dd'),
  minDate: z.string().optional(), // ISO date string
  maxDate: z.string().optional(), // ISO date string
  disabledDates: z.array(z.string()).optional(), // Array of ISO date strings
  showTime: z.boolean().default(false),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  clearable: z.boolean().default(true),
})

export type DatePickerProps = z.infer<typeof datePickerPropsSchema>

// ============================================
// Rich Text Editor Block Schema
// ============================================

export const richTextEditorPropsSchema = baseFormFieldSchema.extend({
  minHeight: z.number().min(100).default(200),
  maxHeight: z.number().min(100).optional(),
  features: z.object({
    bold: z.boolean().default(true),
    italic: z.boolean().default(true),
    underline: z.boolean().default(true),
    strikethrough: z.boolean().default(false),
    headings: z.boolean().default(true),
    lists: z.boolean().default(true),
    links: z.boolean().default(true),
    images: z.boolean().default(false),
    code: z.boolean().default(false),
    codeBlock: z.boolean().default(false),
    blockquote: z.boolean().default(false),
    tables: z.boolean().default(false),
  }).optional(),
  imageUploadEndpoint: z.string().url('Invalid image upload endpoint').optional(),
})

export type RichTextEditorProps = z.infer<typeof richTextEditorPropsSchema>

// ============================================
// Submit Button Block Schema
// ============================================

export const submitButtonPropsSchema = z.object({
  id: z.string(),
  text: z.string().default('Submit'),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  fullWidth: z.boolean().default(false),
  icon: z.string().optional(), // Lucide icon name
  iconPosition: z.enum(['left', 'right']).default('left'),
  loadingText: z.string().default('Submitting...'),
  disableOnSubmit: z.boolean().default(true),
  // Success/Error handling
  successMessage: z.string().optional(),
  errorMessage: z.string().optional(),
  redirectOnSuccess: z.string().optional(), // URL to redirect to after successful submission
  className: z.string().optional(),
})

export type SubmitButtonProps = z.infer<typeof submitButtonPropsSchema>

// ============================================
// Form Container Block Schema
// ============================================

export const formPropsSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Form name is required'),
  method: z.enum(['POST', 'PUT', 'PATCH']).default('POST'),
  action: z.string().url('Invalid form action URL'),
  // Validation
  validateOnBlur: z.boolean().default(true),
  validateOnChange: z.boolean().default(false),
  validateOnSubmit: z.boolean().default(true),
  // Submission
  submitHandler: z.string().optional(), // Custom submit handler function
  resetOnSubmit: z.boolean().default(false),
  // Headers
  headers: z.record(z.string()).optional(),
  // Layout
  layout: z.enum(['vertical', 'horizontal', 'inline']).default('vertical'),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  // Styling
  className: z.string().optional(),
})

export type FormProps = z.infer<typeof formPropsSchema>
