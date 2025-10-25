'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OrganizationBranding } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Mail, Save, Loader2, Eye, Info } from 'lucide-react'

interface EmailBrandingSectionProps {
  branding: OrganizationBranding | null
  onUpdate: () => Promise<void>
}

/**
 * Email Branding Section Component
 *
 * Manages email-specific branding settings:
 * - From name
 * - Reply-to email address
 * - Footer text
 * - Email header color
 * - Logo URL for emails
 */
export function EmailBrandingSection({ branding, onUpdate }: EmailBrandingSectionProps) {
  const [fromName, setFromName] = useState('')
  const [replyToEmail, setReplyToEmail] = useState('')
  const [footerText, setFooterText] = useState('')
  const [headerColor, setHeaderColor] = useState('#222222')
  const [logoUrl, setLogoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()

  // Load current email branding settings
  useEffect(() => {
    if (branding?.email) {
      setFromName(branding.email.fromName || '')
      setReplyToEmail(branding.email.replyToEmail || '')
      setFooterText(branding.email.footerText || '')
      setHeaderColor(branding.email.headerColor || '#222222')
      setLogoUrl(branding.email.logoUrl || '')
    }
  }, [branding])

  // Handle field changes
  const handleChange = (field: string, value: string) => {
    switch (field) {
      case 'fromName':
        setFromName(value)
        break
      case 'replyToEmail':
        setReplyToEmail(value)
        break
      case 'footerText':
        setFooterText(value)
        break
      case 'headerColor':
        setHeaderColor(value)
        break
      case 'logoUrl':
        setLogoUrl(value)
        break
    }
    setHasChanges(true)
  }

  // Save email branding settings
  const handleSave = async () => {
    // Validate email address
    if (replyToEmail && !isValidEmail(replyToEmail)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid reply-to email address.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const email = {
        fromName,
        replyToEmail: replyToEmail || undefined,
        footerText: footerText || undefined,
        headerColor,
        logoUrl: logoUrl || undefined,
      }

      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save email branding')
      }

      await onUpdate()
      setHasChanges(false)
      toast({
        title: 'Email Branding Saved',
        description: 'Your email branding has been updated successfully.',
      })
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save email branding',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-pink-600" />
                Email Branding
              </CardTitle>
              <CardDescription>
                Customize the appearance and sender information for system emails
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
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
                    Save Email Branding
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* From Name */}
          <div className="space-y-2">
            <Label htmlFor="fromName" className="text-base font-semibold">
              From Name *
            </Label>
            <p className="text-sm text-muted-foreground">
              The name that appears in the "From" field of emails
            </p>
            <Input
              id="fromName"
              value={fromName}
              onChange={(e) => handleChange('fromName', e.target.value)}
              placeholder="e.g., Acme Support Team"
              required
            />
          </div>

          {/* Reply-To Email */}
          <div className="space-y-2">
            <Label htmlFor="replyToEmail" className="text-base font-semibold">
              Reply-To Email Address (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Email address where replies will be sent (if different from sender)
            </p>
            <Input
              id="replyToEmail"
              type="email"
              value={replyToEmail}
              onChange={(e) => handleChange('replyToEmail', e.target.value)}
              placeholder="e.g., support@yourcompany.com"
            />
          </div>

          {/* Email Header Color */}
          <div className="space-y-2">
            <Label htmlFor="headerColor" className="text-base font-semibold">
              Email Header Color
            </Label>
            <p className="text-sm text-muted-foreground">
              Background color for the email header banner
            </p>
            <div className="flex items-center gap-4">
              <Input
                id="headerColor"
                type="color"
                value={headerColor}
                onChange={(e) => handleChange('headerColor', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={headerColor}
                onChange={(e) => handleChange('headerColor', e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono"
              />
            </div>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="text-base font-semibold">
              Email Logo URL (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Publicly accessible URL to your logo image for emails
            </p>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              placeholder="https://yourcompany.com/logo.png"
            />
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The logo must be hosted at a publicly accessible URL. For best results, use a PNG with transparent background (recommended size: 200x60px).
              </AlertDescription>
            </Alert>
          </div>

          {/* Footer Text */}
          <div className="space-y-2">
            <Label htmlFor="footerText" className="text-base font-semibold">
              Email Footer Text (Optional)
            </Label>
            <p className="text-sm text-muted-foreground">
              Custom text displayed at the bottom of all emails
            </p>
            <Textarea
              id="footerText"
              value={footerText}
              onChange={(e) => handleChange('footerText', e.target.value)}
              placeholder="e.g., © 2024 Acme Corporation. All rights reserved."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {footerText.length}/500 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              Preview how your branded emails will appear to recipients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {/* Email Header */}
              <div
                className="p-6 flex items-center justify-center"
                style={{ backgroundColor: headerColor }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Email Logo"
                    className="max-h-16 max-w-[200px] object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="text-white text-2xl font-bold">
                    {branding?.identity?.companyName || 'Your Company'}
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div className="p-6 bg-white">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>From:</strong> {fromName || 'Your Company'}
                  </p>
                  {replyToEmail && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Reply-To:</strong> {replyToEmail}
                    </p>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-2">Sample Email Heading</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This is a preview of how your emails will look with the current branding settings. Your actual email content will appear here.
                    </p>
                    <Button className="bg-primary hover:bg-primary/90">
                      Sample Action Button
                    </Button>
                  </div>
                </div>
              </div>

              {/* Email Footer */}
              {footerText && (
                <div className="p-6 bg-muted border-t text-center">
                  <p className="text-xs text-muted-foreground">{footerText}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
