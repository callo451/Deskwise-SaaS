'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OrganizationBranding } from '@/lib/types'
import { Sun, Moon, LayoutDashboard, Home, Ticket, Users, Settings } from 'lucide-react'
import Image from 'next/image'

interface LivePreviewPaneProps {
  branding: OrganizationBranding | null
}

/**
 * Live Preview Pane Component
 *
 * Displays a real-time preview of how the branding will appear:
 * - Dashboard header with logo and colors
 * - Sidebar navigation with colors
 * - Sample cards and UI elements
 * - Light/dark mode toggle
 */
export function LivePreviewPane({ branding }: LivePreviewPaneProps) {
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')

  // Get colors from branding
  const primaryColor = branding?.colors?.primary || { h: 222, s: 47, l: 11 }
  const secondaryColor = branding?.colors?.secondary || { h: 210, s: 40, l: 96 }
  const accentColor = branding?.colors?.accent || { h: 142, s: 76, l: 36 }
  const backgroundColor = branding?.colors?.background || { h: 0, s: 0, l: 100 }
  const surfaceColor = branding?.colors?.surface || { h: 0, s: 0, l: 98 }

  // Get typography
  const fontFamily = branding?.typography?.fontFamily || 'Inter'
  const headingFontFamily = branding?.typography?.headingFontFamily || fontFamily

  // Get identity
  const companyName = branding?.identity?.companyName || 'Deskwise'

  // Get logo
  const logoKey = previewMode === 'dark'
    ? branding?.logos?.primary?.dark || branding?.logos?.primary?.light
    : branding?.logos?.primary?.light
  const logoUrl = logoKey ? `/api/branding/asset/${logoKey}` : null

  // Helper to convert HSL to CSS string
  const hslToCss = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-pink-600" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your branding will appear in the application
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('light')}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={previewMode === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('dark')}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Preview Container */}
          <div
            className="rounded-lg border-2 border-border overflow-hidden shadow-lg"
            style={{
              backgroundColor: previewMode === 'dark'
                ? hslToCss(0, 0, 10)
                : hslToCss(backgroundColor.h, backgroundColor.s, backgroundColor.l),
              fontFamily,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{
                backgroundColor: previewMode === 'dark'
                  ? hslToCss(0, 0, 15)
                  : hslToCss(surfaceColor.h, surfaceColor.s, surfaceColor.l),
                borderColor: previewMode === 'dark'
                  ? hslToCss(0, 0, 25)
                  : hslToCss(0, 0, 90),
              }}
            >
              {/* Logo */}
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <div className="relative w-32 h-10">
                    <Image
                      src={logoUrl}
                      alt={companyName}
                      fill
                      className="object-contain object-left"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="text-xl font-bold"
                    style={{
                      color: previewMode === 'dark'
                        ? hslToCss(0, 0, 100)
                        : hslToCss(primaryColor.h, primaryColor.s, primaryColor.l),
                      fontFamily: headingFontFamily,
                    }}
                  >
                    {companyName}
                  </div>
                )}
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: hslToCss(accentColor.h, accentColor.s, accentColor.l),
                    color: 'white',
                  }}
                >
                  Preview
                </Badge>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex">
              {/* Sidebar */}
              <div
                className="w-64 p-4 border-r"
                style={{
                  backgroundColor: previewMode === 'dark'
                    ? hslToCss(0, 0, 12)
                    : hslToCss(surfaceColor.h, surfaceColor.s, surfaceColor.l),
                  borderColor: previewMode === 'dark'
                    ? hslToCss(0, 0, 25)
                    : hslToCss(0, 0, 90),
                }}
              >
                <nav className="space-y-1">
                  {[
                    { icon: Home, label: 'Dashboard' },
                    { icon: Ticket, label: 'Tickets' },
                    { icon: Users, label: 'Clients' },
                    { icon: Settings, label: 'Settings' },
                  ].map((item, index) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                      style={{
                        backgroundColor: index === 0
                          ? hslToCss(primaryColor.h, primaryColor.s, primaryColor.l)
                          : 'transparent',
                        color: index === 0
                          ? 'white'
                          : previewMode === 'dark'
                          ? hslToCss(0, 0, 70)
                          : hslToCss(0, 0, 30),
                      }}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                {/* Page Title */}
                <h1
                  className="text-2xl font-bold mb-6"
                  style={{
                    color: previewMode === 'dark'
                      ? hslToCss(0, 0, 95)
                      : hslToCss(0, 0, 10),
                    fontFamily: headingFontFamily,
                  }}
                >
                  Dashboard
                </h1>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { title: 'Total Tickets', value: '156' },
                    { title: 'Open Issues', value: '42' },
                  ].map((stat, index) => (
                    <div
                      key={stat.title}
                      className="p-4 rounded-lg border"
                      style={{
                        backgroundColor: previewMode === 'dark'
                          ? hslToCss(0, 0, 15)
                          : hslToCss(surfaceColor.h, surfaceColor.s, surfaceColor.l),
                        borderColor: previewMode === 'dark'
                          ? hslToCss(0, 0, 25)
                          : hslToCss(0, 0, 90),
                      }}
                    >
                      <p
                        className="text-xs mb-1"
                        style={{
                          color: previewMode === 'dark'
                            ? hslToCss(0, 0, 60)
                            : hslToCss(0, 0, 50),
                        }}
                      >
                        {stat.title}
                      </p>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          color: previewMode === 'dark'
                            ? hslToCss(0, 0, 95)
                            : hslToCss(0, 0, 10),
                        }}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Sample Card */}
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: previewMode === 'dark'
                      ? hslToCss(0, 0, 15)
                      : hslToCss(surfaceColor.h, surfaceColor.s, surfaceColor.l),
                    borderColor: previewMode === 'dark'
                      ? hslToCss(0, 0, 25)
                      : hslToCss(0, 0, 90),
                  }}
                >
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{
                      color: previewMode === 'dark'
                        ? hslToCss(0, 0, 95)
                        : hslToCss(0, 0, 10),
                      fontFamily: headingFontFamily,
                    }}
                  >
                    Sample Card Title
                  </h3>
                  <p
                    className="text-sm mb-4"
                    style={{
                      color: previewMode === 'dark'
                        ? hslToCss(0, 0, 70)
                        : hslToCss(0, 0, 40),
                    }}
                  >
                    This is sample text demonstrating how your selected typography will appear in cards and other UI elements.
                  </p>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                      style={{
                        backgroundColor: hslToCss(primaryColor.h, primaryColor.s, primaryColor.l),
                      }}
                    >
                      Primary Button
                    </button>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: previewMode === 'dark'
                          ? hslToCss(0, 0, 20)
                          : hslToCss(secondaryColor.h, secondaryColor.s, secondaryColor.l),
                        color: previewMode === 'dark'
                          ? hslToCss(0, 0, 90)
                          : hslToCss(0, 0, 20),
                      }}
                    >
                      Secondary
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> This is a simplified preview. Your actual application will include all features and functionality with these visual styles applied.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
