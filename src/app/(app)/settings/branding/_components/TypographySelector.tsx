'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { OrganizationBranding } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Type, Save, Loader2, Info, CheckCircle2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface TypographySelectorProps {
  branding: OrganizationBranding | null
  onUpdate: () => Promise<void>
}

/**
 * Popular Google Fonts presets
 */
const GOOGLE_FONTS = [
  { name: 'Inter', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  { name: 'Roboto', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap' },
  { name: 'Open Sans', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap' },
  { name: 'Lato', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap' },
  { name: 'Montserrat', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap' },
  { name: 'Poppins', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' },
  { name: 'Source Sans 3', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap' },
  { name: 'Raleway', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&display=swap' },
  { name: 'Ubuntu', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap' },
  { name: 'Nunito', category: 'Sans-serif', url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700&display=swap' },
  { name: 'Playfair Display', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap' },
  { name: 'Merriweather', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&display=swap' },
  { name: 'PT Serif', category: 'Serif', url: 'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap' },
]

/**
 * Typography Selector Component
 *
 * Allows customization of fonts used throughout the application:
 * - Body font (main content)
 * - Heading font (titles and headers)
 * - Google Fonts integration
 */
export function TypographySelector({ branding, onUpdate }: TypographySelectorProps) {
  const [fontFamily, setFontFamily] = useState('Inter')
  const [headingFontFamily, setHeadingFontFamily] = useState('')
  const [useSeparateHeadingFont, setUseSeparateHeadingFont] = useState(false)
  const [googleFontsUrl, setGoogleFontsUrl] = useState('')
  const [customGoogleFontsUrl, setCustomGoogleFontsUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  // Load current typography settings
  useEffect(() => {
    if (branding?.typography) {
      setFontFamily(branding.typography.fontFamily || 'Inter')
      setHeadingFontFamily(branding.typography.headingFontFamily || '')
      setUseSeparateHeadingFont(!!branding.typography.headingFontFamily)
      setGoogleFontsUrl(branding.typography.googleFontsUrl || '')
    }
  }, [branding])

  // Handle font change
  const handleFontChange = (fontName: string) => {
    setFontFamily(fontName)

    // Find the Google Fonts URL for this font
    const font = GOOGLE_FONTS.find((f) => f.name === fontName)
    if (font) {
      setGoogleFontsUrl(font.url)
      setCustomGoogleFontsUrl('')
    }

    setHasChanges(true)
  }

  // Handle heading font change
  const handleHeadingFontChange = (fontName: string) => {
    setHeadingFontFamily(fontName)
    setHasChanges(true)
  }

  // Handle custom Google Fonts URL change
  const handleCustomUrlChange = (url: string) => {
    setCustomGoogleFontsUrl(url)

    // Validate Google Fonts URL
    if (url && !url.includes('fonts.googleapis.com')) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid Google Fonts URL.',
        variant: 'destructive',
      })
      return
    }

    if (url) {
      setGoogleFontsUrl(url)
    }

    setHasChanges(true)
  }

  // Handle separate heading font toggle
  const handleSeparateHeadingToggle = (checked: boolean) => {
    setUseSeparateHeadingFont(checked)
    if (!checked) {
      setHeadingFontFamily('')
    }
    setHasChanges(true)
  }

  // Save typography settings
  const handleSave = async () => {
    setSaving(true)
    try {
      const typography = {
        fontFamily,
        googleFontsUrl: googleFontsUrl || customGoogleFontsUrl,
        headingFontFamily: useSeparateHeadingFont ? headingFontFamily : undefined,
      }

      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typography }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save typography')
      }

      await onUpdate()
      setHasChanges(false)
      toast({
        title: 'Typography Saved',
        description: 'Your font settings have been updated successfully.',
      })

      // Reload page to apply new fonts
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save typography',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-pink-600" />
              Typography
            </CardTitle>
            <CardDescription>
              Choose fonts that match your brand identity. Changes require page reload to take effect.
            </CardDescription>
          </div>
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
                Save Typography
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Body Font Selection */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="bodyFont" className="text-base font-semibold">
              Body Font
            </Label>
            <p className="text-sm text-muted-foreground">
              Font used for main content, paragraphs, and UI text
            </p>
          </div>

          <Select value={fontFamily} onValueChange={handleFontChange}>
            <SelectTrigger id="bodyFont">
              <SelectValue placeholder="Select a font" />
            </SelectTrigger>
            <SelectContent>
              {GOOGLE_FONTS.map((font) => (
                <SelectItem key={font.name} value={font.name}>
                  <div className="flex items-center justify-between gap-4">
                    <span style={{ fontFamily: font.name }}>{font.name}</span>
                    <span className="text-xs text-muted-foreground">{font.category}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Font Preview */}
          <div className="p-6 border rounded-lg space-y-2" style={{ fontFamily }}>
            <p className="text-2xl font-bold">The quick brown fox jumps over the lazy dog</p>
            <p className="text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <p className="text-sm text-muted-foreground">
              0123456789 !@#$%^&*()
            </p>
          </div>
        </div>

        {/* Separate Heading Font */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="separateHeadingFont" className="text-base font-semibold">
                Use Separate Heading Font
              </Label>
              <p className="text-sm text-muted-foreground">
                Apply a different font to headings (h1-h6)
              </p>
            </div>
            <Switch
              id="separateHeadingFont"
              checked={useSeparateHeadingFont}
              onCheckedChange={handleSeparateHeadingToggle}
            />
          </div>

          {useSeparateHeadingFont && (
            <>
              <div>
                <Label htmlFor="headingFont" className="text-base font-semibold">
                  Heading Font
                </Label>
                <p className="text-sm text-muted-foreground">
                  Font used for titles and headers
                </p>
              </div>

              <Select value={headingFontFamily} onValueChange={handleHeadingFontChange}>
                <SelectTrigger id="headingFont">
                  <SelectValue placeholder="Select a heading font" />
                </SelectTrigger>
                <SelectContent>
                  {GOOGLE_FONTS.map((font) => (
                    <SelectItem key={font.name} value={font.name}>
                      <div className="flex items-center justify-between gap-4">
                        <span style={{ fontFamily: font.name }}>{font.name}</span>
                        <span className="text-xs text-muted-foreground">{font.category}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Heading Preview */}
              <div className="p-6 border rounded-lg space-y-3">
                <h1 className="text-3xl font-bold" style={{ fontFamily: headingFontFamily || fontFamily }}>
                  Heading Level 1
                </h1>
                <h2 className="text-2xl font-semibold" style={{ fontFamily: headingFontFamily || fontFamily }}>
                  Heading Level 2
                </h2>
                <h3 className="text-xl font-semibold" style={{ fontFamily: headingFontFamily || fontFamily }}>
                  Heading Level 3
                </h3>
                <p className="text-base" style={{ fontFamily }}>
                  This is body text that uses the primary font family.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Custom Google Fonts URL */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="customFontUrl" className="text-base font-semibold">
              Custom Google Fonts URL (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Use a custom Google Fonts URL with specific weights or additional fonts
            </p>
          </div>

          <Input
            id="customFontUrl"
            type="url"
            value={customGoogleFontsUrl}
            onChange={(e) => handleCustomUrlChange(e.target.value)}
            placeholder="https://fonts.googleapis.com/css2?family=..."
          />

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  To use a custom Google Fonts URL:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Visit <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">fonts.google.com</a></li>
                  <li>Select your desired fonts and weights</li>
                  <li>Copy the generated {'<link>'} tag URL</li>
                  <li>Paste it here</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Current Google Fonts URL */}
        {googleFontsUrl && (
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Active Google Fonts URL
            </Label>
            <div className="p-3 bg-muted rounded-lg">
              <code className="text-xs break-all">{googleFontsUrl}</code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
