import { z } from 'zod'

// ============================================
// Text Block Schema
// ============================================

export const textPropsSchema = z.object({
  id: z.string(),
  content: z.string(),
  variant: z.enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body1', 'body2', 'caption', 'label']).default('body1'),
  align: z.enum(['left', 'center', 'right', 'justify']).default('left'),
  color: z.string().optional(),
  weight: z.enum(['normal', 'medium', 'semibold', 'bold']).default('normal'),
  italic: z.boolean().default(false),
  underline: z.boolean().default(false),
  truncate: z.boolean().default(false),
  maxLines: z.number().min(1).optional(), // Clamp text to N lines
  markdown: z.boolean().default(false), // Enable markdown parsing
  className: z.string().optional(),
})

export type TextProps = z.infer<typeof textPropsSchema>

// ============================================
// Image Block Schema
// ============================================

export const imagePropsSchema = z.object({
  id: z.string(),
  src: z.string().url('Invalid image URL'),
  alt: z.string().min(1, 'Alt text is required for accessibility'),
  width: z.union([z.number(), z.string()]).optional(),
  height: z.union([z.number(), z.string()]).optional(),
  fit: z.enum(['contain', 'cover', 'fill', 'none', 'scale-down']).default('cover'),
  rounded: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('none'),
  border: z.boolean().default(false),
  borderColor: z.string().optional(),
  shadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('none'),
  aspectRatio: z.enum(['square', '16/9', '4/3', '3/2', '21/9', 'auto']).default('auto'),
  loading: z.enum(['eager', 'lazy']).default('lazy'),
  priority: z.boolean().default(false), // Next.js Image priority
  className: z.string().optional(),
})

export type ImageProps = z.infer<typeof imagePropsSchema>

// ============================================
// Button Block Schema
// ============================================

export const buttonPropsSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Button text is required'),
  variant: z.enum(['primary', 'secondary', 'outline', 'ghost', 'link', 'destructive']).default('primary'),
  size: z.enum(['sm', 'md', 'lg']).default('md'),
  fullWidth: z.boolean().default(false),
  disabled: z.boolean().default(false),
  loading: z.boolean().default(false),
  icon: z.string().optional(), // Lucide icon name
  iconPosition: z.enum(['left', 'right']).default('left'),
  // Action configuration
  action: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('link'),
      href: z.string().url('Invalid URL'),
      target: z.enum(['_self', '_blank', '_parent', '_top']).default('_self'),
      external: z.boolean().default(false),
    }),
    z.object({
      type: z.literal('submit'),
      formId: z.string().optional(),
    }),
    z.object({
      type: z.literal('custom'),
      handler: z.string(), // Function name or code
    }),
  ]).optional(),
  className: z.string().optional(),
})

export type ButtonProps = z.infer<typeof buttonPropsSchema>

// ============================================
// Icon Block Schema
// ============================================

export const iconPropsSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Icon name is required'), // Lucide icon name
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl']).default('md'),
  color: z.string().optional(),
  strokeWidth: z.number().min(1).max(3).default(2),
  rotate: z.number().min(0).max(360).default(0),
  flip: z.enum(['none', 'horizontal', 'vertical', 'both']).default('none'),
  // Background circle
  background: z.boolean().default(false),
  backgroundColor: z.string().optional(),
  backgroundPadding: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
  rounded: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('full'),
  className: z.string().optional(),
})

export type IconProps = z.infer<typeof iconPropsSchema>

// ============================================
// Divider Block Schema
// ============================================

export const dividerPropsSchema = z.object({
  id: z.string(),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  thickness: z.enum(['thin', 'medium', 'thick']).default('thin'),
  color: z.string().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  spacing: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'), // Margin around divider
  text: z.string().optional(), // Optional label text
  textAlign: z.enum(['left', 'center', 'right']).default('center'),
  className: z.string().optional(),
})

export type DividerProps = z.infer<typeof dividerPropsSchema>

// ============================================
// Spacer Block Schema
// ============================================

export const spacerPropsSchema = z.object({
  id: z.string(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']).default('md'),
  className: z.string().optional(),
})

export type SpacerProps = z.infer<typeof spacerPropsSchema>
