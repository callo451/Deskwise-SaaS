'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OrganizationBranding } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Palette, RotateCcw, Save, Loader2, AlertCircle, Info } from 'lucide-react'

interface ColorPaletteEditorProps {
  branding: OrganizationBranding | null
  onUpdate: () => Promise<void>
}

interface HSLColor {
  h: number
  s: number
  l: number
}

interface ColorEditorProps {
  label: string
  description: string
  color: HSLColor
  onChange: (color: HSLColor) => void
}

/**
 * HSL Color Editor Component
 *
 * Provides sliders for Hue, Saturation, and Lightness with live preview.
 */
function ColorEditor({ label, description, color, onChange }: ColorEditorProps) {
  // Convert HSL to hex for display
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  // Convert hex to HSL
  const hexToHsl = (hex: string): HSLColor => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return color

    const r = parseInt(result[1], 16) / 255
    const g = parseInt(result[2], 16) / 255
    const b = parseInt(result[3], 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    }
  }

  const hexValue = hslToHex(color.h, color.s, color.l)

  const handleHexChange = (hex: string) => {
    if (hex.match(/^#[0-9A-Fa-f]{6}$/)) {
      onChange(hexToHsl(hex))
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Label className="text-base font-semibold">{label}</Label>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div
          className="w-16 h-16 rounded-lg border-2 border-border shadow-sm shrink-0"
          style={{ backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)` }}
        />
      </div>

      {/* Hue Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Hue</Label>
          <span className="text-sm text-muted-foreground">{color.h}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={color.h}
          onChange={(e) => onChange({ ...color, h: parseInt(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              hsl(0, ${color.s}%, ${color.l}%),
              hsl(60, ${color.s}%, ${color.l}%),
              hsl(120, ${color.s}%, ${color.l}%),
              hsl(180, ${color.s}%, ${color.l}%),
              hsl(240, ${color.s}%, ${color.l}%),
              hsl(300, ${color.s}%, ${color.l}%),
              hsl(360, ${color.s}%, ${color.l}%)
            )`,
          }}
        />
      </div>

      {/* Saturation Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Saturation</Label>
          <span className="text-sm text-muted-foreground">{color.s}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={color.s}
          onChange={(e) => onChange({ ...color, s: parseInt(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              hsl(${color.h}, 0%, ${color.l}%),
              hsl(${color.h}, 100%, ${color.l}%)
            )`,
          }}
        />
      </div>

      {/* Lightness Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Lightness</Label>
          <span className="text-sm text-muted-foreground">{color.l}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={color.l}
          onChange={(e) => onChange({ ...color, l: parseInt(e.target.value) })}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              hsl(${color.h}, ${color.s}%, 0%),
              hsl(${color.h}, ${color.s}%, 50%),
              hsl(${color.h}, ${color.s}%, 100%)
            )`,
          }}
        />
      </div>

      {/* Hex Input */}
      <div className="space-y-2">
        <Label className="text-sm">Hex Color</Label>
        <Input
          type="text"
          value={hexValue}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          className="font-mono"
        />
      </div>
    </div>
  )
}

/**
 * Color Palette Editor Component
 *
 * Allows customization of the organization's color scheme:
 * - Primary color (buttons, links, accents)
 * - Secondary color (secondary UI elements)
 * - Accent color (highlights, notifications)
 * - Background color (page background)
 * - Surface color (cards, modals)
 */
export function ColorPaletteEditor({ branding, onUpdate }: ColorPaletteEditorProps) {
  const [colors, setColors] = useState({
    primary: { h: 222, s: 47, l: 11 },
    secondary: { h: 210, s: 40, l: 96 },
    accent: { h: 142, s: 76, l: 36 },
    background: { h: 0, s: 0, l: 100 },
    surface: { h: 0, s: 0, l: 98 },
  })
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  // Load current branding colors
  useEffect(() => {
    if (branding?.colors) {
      setColors({
        primary: branding.colors.primary,
        secondary: branding.colors.secondary,
        accent: branding.colors.accent,
        background: branding.colors.background || { h: 0, s: 0, l: 100 },
        surface: branding.colors.surface || { h: 0, s: 0, l: 98 },
      })
    }
  }, [branding])

  // Handle color change
  const handleColorChange = (colorKey: keyof typeof colors, newColor: HSLColor) => {
    setColors((prev) => ({ ...prev, [colorKey]: newColor }))
    setHasChanges(true)
  }

  // Save colors
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colors }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save colors')
      }

      await onUpdate()
      setHasChanges(false)
      toast({
        title: 'Colors Saved',
        description: 'Your color palette has been updated successfully.',
      })
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save colors',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Reset to defaults
  const handleReset = () => {
    setColors({
      primary: { h: 222, s: 47, l: 11 },
      secondary: { h: 210, s: 40, l: 96 },
      accent: { h: 142, s: 76, l: 36 },
      background: { h: 0, s: 0, l: 100 },
      surface: { h: 0, s: 0, l: 98 },
    })
    setHasChanges(true)
    toast({
      title: 'Colors Reset',
      description: 'Color palette reset to default values.',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-pink-600" />
              Color Palette
            </CardTitle>
            <CardDescription>
              Customize your organization's color scheme. Changes will apply immediately after saving.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-pink-600 hover:bg-pink-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Colors
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Colors are defined using HSL (Hue, Saturation, Lightness) format for maximum flexibility and consistency across your application.
          </AlertDescription>
        </Alert>

        {/* Color Editors */}
        <div className="grid gap-6 md:grid-cols-2">
          <ColorEditor
            label="Primary Color"
            description="Main brand color used for buttons, links, and primary UI elements"
            color={colors.primary}
            onChange={(color) => handleColorChange('primary', color)}
          />

          <ColorEditor
            label="Secondary Color"
            description="Secondary UI elements and subtle accents"
            color={colors.secondary}
            onChange={(color) => handleColorChange('secondary', color)}
          />

          <ColorEditor
            label="Accent Color"
            description="Highlights, notifications, and call-to-action elements"
            color={colors.accent}
            onChange={(color) => handleColorChange('accent', color)}
          />

          <ColorEditor
            label="Background Color"
            description="Main page background color"
            color={colors.background}
            onChange={(color) => handleColorChange('background', color)}
          />

          <ColorEditor
            label="Surface Color"
            description="Cards, modals, and elevated surfaces"
            color={colors.surface}
            onChange={(color) => handleColorChange('surface', color)}
          />
        </div>

        {/* Color Accessibility Note */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Accessibility Tip:</strong> Ensure sufficient contrast between text and background colors for WCAG 2.1 Level AA compliance (minimum 4.5:1 ratio for normal text).
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
