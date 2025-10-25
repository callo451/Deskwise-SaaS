'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { OrganizationBranding } from '@/lib/types'

interface BrandingContextValue {
  branding: OrganizationBranding | null
  isLoading: boolean
  error: string | null
  refreshBranding: () => Promise<void>
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: null,
  isLoading: true,
  error: null,
  refreshBranding: async () => {},
})

export const useBranding = () => useContext(BrandingContext)

interface BrandingProviderProps {
  children: React.ReactNode
}

/**
 * BrandingProvider
 *
 * Fetches and applies organization branding configuration.
 * Injects CSS variables for colors and fonts into the document.
 * Provides branding context to all child components.
 */
export function BrandingProvider({ children }: BrandingProviderProps) {
  const [branding, setBranding] = useState<OrganizationBranding | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBranding = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/branding')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch branding')
      }

      setBranding(data.data)
    } catch (err) {
      console.error('Failed to fetch branding:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBranding()
  }, [])

  // Apply branding to document
  useEffect(() => {
    if (!branding) return

    // Apply CSS variables for colors
    const root = document.documentElement
    const { colors } = branding

    // Primary color
    root.style.setProperty(
      '--primary',
      `${colors.primary.h} ${colors.primary.s}% ${colors.primary.l}%`
    )

    // Secondary color
    root.style.setProperty(
      '--secondary',
      `${colors.secondary.h} ${colors.secondary.s}% ${colors.secondary.l}%`
    )

    // Accent color
    root.style.setProperty(
      '--accent',
      `${colors.accent.h} ${colors.accent.s}% ${colors.accent.l}%`
    )

    // Background color (optional)
    if (colors.background) {
      root.style.setProperty(
        '--background',
        `${colors.background.h} ${colors.background.s}% ${colors.background.l}%`
      )
    }

    // Surface/Card color (optional)
    if (colors.surface) {
      root.style.setProperty(
        '--card',
        `${colors.surface.h} ${colors.surface.s}% ${colors.surface.l}%`
      )
      root.style.setProperty(
        '--popover',
        `${colors.surface.h} ${colors.surface.s}% ${colors.surface.l}%`
      )
    }

    // Apply typography
    const { typography } = branding
    if (typography.fontFamily) {
      root.style.setProperty('--font-family', typography.fontFamily)
      document.body.style.fontFamily = typography.fontFamily
    }

    if (typography.headingFontFamily) {
      root.style.setProperty('--heading-font-family', typography.headingFontFamily)
      // Apply to all headings
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach((heading) => {
        ;(heading as HTMLElement).style.fontFamily = typography.headingFontFamily!
      })
    }

    // Load Google Fonts if specified
    if (typography.googleFontsUrl) {
      loadGoogleFont(typography.googleFontsUrl)
    }

    // Update favicon if set
    if (branding.logos.favicon) {
      updateFavicon(branding.logos.favicon)
    }

    // Update page title with company name
    if (branding.identity.companyName && branding.identity.companyName !== 'Deskwise') {
      updatePageTitle(branding.identity.companyName)
    }
  }, [branding])

  const refreshBranding = async () => {
    await fetchBranding()
  }

  return (
    <BrandingContext.Provider
      value={{
        branding,
        isLoading,
        error,
        refreshBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  )
}

/**
 * Load Google Font dynamically
 */
function loadGoogleFont(url: string) {
  // Remove existing Google Fonts link if present
  const existing = document.querySelector('link[data-google-fonts]')
  if (existing) {
    existing.remove()
  }

  // Add new Google Fonts link
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = url
  link.setAttribute('data-google-fonts', 'true')
  document.head.appendChild(link)
}

/**
 * Update favicon dynamically
 */
function updateFavicon(s3Key: string) {
  // Generate presigned URL or public URL for favicon
  // For now, we'll assume the S3 key can be accessed via a public endpoint
  // In production, you might want to use a CDN or presigned URLs

  const existing = document.querySelector('link[rel="icon"]')
  if (existing) {
    existing.setAttribute('href', `/api/branding/asset/${s3Key}`)
  } else {
    const link = document.createElement('link')
    link.rel = 'icon'
    link.href = `/api/branding/asset/${s3Key}`
    document.head.appendChild(link)
  }
}

/**
 * Update page title with company name
 */
function updatePageTitle(companyName: string) {
  // Get current page title
  const currentTitle = document.title

  // Replace "Deskwise" with company name if present
  if (currentTitle.includes('Deskwise')) {
    document.title = currentTitle.replace(/Deskwise/g, companyName)
  }
}
