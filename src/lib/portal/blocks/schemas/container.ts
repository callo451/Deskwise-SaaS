import { z } from 'zod'

// ============================================
// Section Block Schema
// ============================================

export const sectionPropsSchema = z.object({
  id: z.string(),
  padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  background: z.string().optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('none'),
  border: z.boolean().default(false),
  borderColor: z.string().optional(),
  maxWidth: z.enum(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'full']).default('full'),
  fullHeight: z.boolean().default(false),
  className: z.string().optional(),
})

export type SectionProps = z.infer<typeof sectionPropsSchema>

// ============================================
// Grid Block Schema
// ============================================

export const gridPropsSchema = z.object({
  id: z.string(),
  columns: z.union([
    z.number().min(1).max(12),
    z.object({
      mobile: z.number().min(1).max(12).default(1),
      tablet: z.number().min(1).max(12).default(2),
      desktop: z.number().min(1).max(12).default(3),
    }),
  ]).default(3),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('none'),
  align: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
  justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).default('start'),
  background: z.string().optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('none'),
  border: z.boolean().default(false),
  borderColor: z.string().optional(),
  autoFlow: z.enum(['row', 'column', 'dense']).default('row'),
  className: z.string().optional(),
})

export type GridProps = z.infer<typeof gridPropsSchema>

// ============================================
// Stack Block Schema
// ============================================

export const stackPropsSchema = z.object({
  id: z.string(),
  direction: z.enum(['vertical', 'horizontal']).default('vertical'),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('none'),
  align: z.enum(['start', 'center', 'end', 'stretch']).default('start'),
  justify: z.enum(['start', 'center', 'end', 'between', 'around', 'evenly']).default('start'),
  wrap: z.boolean().default(false),
  background: z.string().optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('none'),
  border: z.boolean().default(false),
  borderColor: z.string().optional(),
  fullWidth: z.boolean().default(true),
  className: z.string().optional(),
})

export type StackProps = z.infer<typeof stackPropsSchema>

// ============================================
// Container Block Schema (Generic)
// ============================================

export const containerPropsSchema = z.object({
  id: z.string(),
  tag: z.enum(['div', 'section', 'article', 'aside', 'main', 'header', 'footer', 'nav']).default('div'),
  padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('none'),
  background: z.string().optional(),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('none'),
  border: z.boolean().default(false),
  borderColor: z.string().optional(),
  maxWidth: z.enum(['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', 'full']).default('none'),
  centered: z.boolean().default(false),
  className: z.string().optional(),
})

export type ContainerProps = z.infer<typeof containerPropsSchema>
