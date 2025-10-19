/**
 * Theme Applicator for Portal Pages
 * Handles theme loading and CSS custom property injection
 */

import clientPromise from '@/lib/mongodb'
import type { PortalTheme } from '@/lib/types'
import { ObjectId } from 'mongodb'

/**
 * Load theme for organization
 */
export async function loadTheme(
  orgId: string,
  themeId?: string
): Promise<PortalTheme | null> {
  const client = await clientPromise
  const db = client.db('deskwise')

  let theme: any = null

  if (themeId) {
    // Load specific theme
    theme = await db.collection('portal_themes').findOne({
      _id: new ObjectId(themeId),
      orgId
    })
  } else {
    // Load default theme for organization
    theme = await db.collection('portal_themes').findOne({
      orgId,
      isDefault: true
    })
  }

  // If no theme found, return null (will use default CSS variables)
  if (!theme) {
    return null
  }

  return theme as PortalTheme
}

/**
 * Generate CSS custom properties from theme
 */
export function generateThemeCSS(theme: PortalTheme): string {
  const { colors, typography, spacing, borderRadius, shadows } = theme

  const cssVariables: Record<string, string> = {
    // Colors
    '--primary': colors.primary,
    '--primary-foreground': colors.primaryForeground,
    '--secondary': colors.secondary,
    '--secondary-foreground': colors.secondaryForeground,
    '--accent': colors.accent,
    '--accent-foreground': colors.accentForeground,
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--muted': colors.muted,
    '--muted-foreground': colors.mutedForeground,
    '--card': colors.card,
    '--card-foreground': colors.cardForeground,
    '--popover': colors.popover,
    '--popover-foreground': colors.popoverForeground,
    '--border': colors.border,
    '--input': colors.input,
    '--ring': colors.ring,
    '--destructive': colors.destructive,
    '--destructive-foreground': colors.destructiveForeground,

    // Typography
    '--font-family': typography.fontFamily,
    '--font-family-heading': typography.headingFontFamily || typography.fontFamily,
    '--font-size-xs': typography.fontSize.xs,
    '--font-size-sm': typography.fontSize.sm,
    '--font-size-base': typography.fontSize.base,
    '--font-size-lg': typography.fontSize.lg,
    '--font-size-xl': typography.fontSize.xl,
    '--font-size-2xl': typography.fontSize['2xl'],
    '--font-size-3xl': typography.fontSize['3xl'],
    '--font-size-4xl': typography.fontSize['4xl'],
    '--font-weight-normal': typography.fontWeight.normal.toString(),
    '--font-weight-medium': typography.fontWeight.medium.toString(),
    '--font-weight-semibold': typography.fontWeight.semibold.toString(),
    '--font-weight-bold': typography.fontWeight.bold.toString(),
    '--line-height-tight': typography.lineHeight.tight.toString(),
    '--line-height-normal': typography.lineHeight.normal.toString(),
    '--line-height-relaxed': typography.lineHeight.relaxed.toString(),

    // Spacing
    '--spacing-xs': spacing.xs,
    '--spacing-sm': spacing.sm,
    '--spacing-md': spacing.md,
    '--spacing-lg': spacing.lg,
    '--spacing-xl': spacing.xl,
    '--spacing-2xl': spacing['2xl'],

    // Border Radius
    '--radius-none': borderRadius.none,
    '--radius-sm': borderRadius.sm,
    '--radius-md': borderRadius.md,
    '--radius-lg': borderRadius.lg,
    '--radius-full': borderRadius.full,

    // Shadows
    '--shadow-sm': shadows.sm,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-xl': shadows.xl
  }

  // Generate CSS string
  const cssString = `:root {\n${Object.entries(cssVariables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')}\n}`

  // Add custom CSS if provided
  if (theme.customCss) {
    return `${cssString}\n\n${theme.customCss}`
  }

  return cssString
}

/**
 * Apply theme overrides to base theme
 */
export function applyThemeOverrides(
  baseTheme: PortalTheme,
  overrides: Partial<PortalTheme>
): PortalTheme {
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...(overrides.colors || {})
    },
    typography: {
      ...baseTheme.typography,
      ...(overrides.typography || {}),
      fontSize: {
        ...baseTheme.typography.fontSize,
        ...(overrides.typography?.fontSize || {})
      },
      fontWeight: {
        ...baseTheme.typography.fontWeight,
        ...(overrides.typography?.fontWeight || {})
      },
      lineHeight: {
        ...baseTheme.typography.lineHeight,
        ...(overrides.typography?.lineHeight || {})
      }
    },
    spacing: {
      ...baseTheme.spacing,
      ...(overrides.spacing || {})
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...(overrides.borderRadius || {})
    },
    shadows: {
      ...baseTheme.shadows,
      ...(overrides.shadows || {})
    }
  }
}

/**
 * Get default theme
 */
export function getDefaultTheme(): PortalTheme {
  return {
    _id: new ObjectId(),
    orgId: '',
    name: 'Default',
    description: 'Default portal theme',
    isDefault: true,
    colors: {
      primary: 'hsl(222, 47%, 11%)',
      primaryForeground: 'hsl(210, 40%, 98%)',
      secondary: 'hsl(210, 40%, 96%)',
      secondaryForeground: 'hsl(222, 47%, 11%)',
      accent: 'hsl(210, 40%, 96%)',
      accentForeground: 'hsl(222, 47%, 11%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(222, 47%, 11%)',
      muted: 'hsl(210, 40%, 96%)',
      mutedForeground: 'hsl(215, 16%, 47%)',
      card: 'hsl(0, 0%, 100%)',
      cardForeground: 'hsl(222, 47%, 11%)',
      popover: 'hsl(0, 0%, 100%)',
      popoverForeground: 'hsl(222, 47%, 11%)',
      border: 'hsl(214, 32%, 91%)',
      input: 'hsl(214, 32%, 91%)',
      ring: 'hsl(222, 47%, 11%)',
      destructive: 'hsl(0, 84%, 60%)',
      destructiveForeground: 'hsl(210, 40%, 98%)'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  }
}
