'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OrganizationBranding } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Building2, Save, Loader2, CheckCircle2, XCircle, AlertCircle, Globe } from 'lucide-react'

interface CompanyIdentitySectionProps {
  branding: OrganizationBranding | null
  onUpdate: () => Promise<void>
}

/**
 * Custom debounce implementation
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Company Identity Section Component
 *
 * Manages organization identity settings:
 * - Company name
 * - Tagline
 * - Subdomain (with real-time validation)
 * - Custom domain
 */
export function CompanyIdentitySection({ branding, onUpdate }: CompanyIdentitySectionProps) {
  const [companyName, setCompanyName] = useState('')
  const [tagline, setTagline] = useState('')
  const [subdomain, setSubdomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [subdomainValidation, setSubdomainValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid'
    message?: string
  }>({ status: 'idle' })
  const { toast } = useToast()

  // Load current identity settings
  useEffect(() => {
    if (branding?.identity) {
      setCompanyName(branding.identity.companyName || '')
      setTagline(branding.identity.tagline || '')
      setSubdomain(branding.identity.subdomain || '')
      setCustomDomain(branding.identity.customDomain || '')
    }
  }, [branding])

  // Validate subdomain with API
  const validateSubdomain = async (value: string) => {
    if (!value) {
      setSubdomainValidation({ status: 'idle' })
      return
    }

    // Basic client-side validation
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/
    if (!subdomainRegex.test(value)) {
      setSubdomainValidation({
        status: 'invalid',
        message: 'Subdomain must be 3-63 characters, lowercase letters, numbers, and hyphens only',
      })
      return
    }

    // Reserved subdomains
    const reserved = ['www', 'api', 'app', 'admin', 'dashboard', 'mail', 'ftp', 'smtp', 'pop', 'imap']
    if (reserved.includes(value.toLowerCase())) {
      setSubdomainValidation({
        status: 'invalid',
        message: 'This subdomain is reserved and cannot be used',
      })
      return
    }

    // Check availability with API
    setSubdomainValidation({ status: 'checking' })

    try {
      const response = await fetch(`/api/branding/validate-subdomain?subdomain=${value}`)
      const data = await response.json()

      if (data.success && data.data.available) {
        setSubdomainValidation({
          status: 'valid',
          message: 'Subdomain is available',
        })
      } else {
        setSubdomainValidation({
          status: 'invalid',
          message: data.data?.message || 'Subdomain is already taken',
        })
      }
    } catch (err) {
      setSubdomainValidation({
        status: 'invalid',
        message: 'Failed to validate subdomain',
      })
    }
  }

  // Debounced subdomain validation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedValidateSubdomain = useCallback(
    debounce((value: string) => {
      validateSubdomain(value)
    }, 500),
    []
  )

  // Handle subdomain change
  const handleSubdomainChange = (value: string) => {
    // Convert to lowercase and remove invalid characters
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomain(cleaned)
    setHasChanges(true)

    // Validate if not the current subdomain
    if (cleaned !== branding?.identity?.subdomain) {
      debouncedValidateSubdomain(cleaned)
    } else {
      setSubdomainValidation({ status: 'idle' })
    }
  }

  // Handle other field changes
  const handleChange = (field: string, value: string) => {
    switch (field) {
      case 'companyName':
        setCompanyName(value)
        break
      case 'tagline':
        setTagline(value)
        break
      case 'customDomain':
        setCustomDomain(value)
        break
    }
    setHasChanges(true)
  }

  // Save identity settings
  const handleSave = async () => {
    // Validate subdomain before saving
    if (subdomain && subdomain !== branding?.identity?.subdomain) {
      if (subdomainValidation.status !== 'valid') {
        toast({
          title: 'Validation Error',
          description: 'Please fix subdomain validation errors before saving.',
          variant: 'destructive',
        })
        return
      }
    }

    setSaving(true)
    try {
      const identity = {
        companyName,
        tagline: tagline || undefined,
        subdomain: subdomain || undefined,
        customDomain: customDomain || undefined,
      }

      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to save identity')
      }

      await onUpdate()
      setHasChanges(false)
      toast({
        title: 'Identity Saved',
        description: 'Your company identity has been updated successfully.',
      })
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Failed to save identity',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Get validation icon
  const getValidationIcon = () => {
    switch (subdomainValidation.status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      case 'valid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-pink-600" />
              Company Identity
            </CardTitle>
            <CardDescription>
              Define your organization's brand identity and web presence
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
                Save Identity
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-base font-semibold">
            Company Name *
          </Label>
          <p className="text-sm text-muted-foreground">
            Your organization's official name, displayed throughout the application
          </p>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="e.g., Acme Corporation"
            required
          />
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="tagline" className="text-base font-semibold">
            Tagline (Optional)
          </Label>
          <p className="text-sm text-muted-foreground">
            A brief description or slogan for your organization
          </p>
          <Textarea
            id="tagline"
            value={tagline}
            onChange={(e) => handleChange('tagline', e.target.value)}
            placeholder="e.g., Your trusted IT service partner"
            rows={2}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">
            {tagline.length}/200 characters
          </p>
        </div>

        {/* Subdomain */}
        <div className="space-y-2">
          <Label htmlFor="subdomain" className="text-base font-semibold">
            Subdomain
          </Label>
          <p className="text-sm text-muted-foreground">
            Your unique subdomain on the Deskwise platform
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Input
                id="subdomain"
                value={subdomain}
                onChange={(e) => handleSubdomainChange(e.target.value)}
                placeholder="your-company"
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon()}
              </div>
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              .deskwise.net
            </span>
          </div>
          {subdomainValidation.message && (
            <p
              className={`text-sm ${
                subdomainValidation.status === 'valid'
                  ? 'text-green-600'
                  : 'text-destructive'
              }`}
            >
              {subdomainValidation.message}
            </p>
          )}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Requirements:</strong> 3-63 characters, lowercase letters, numbers, and hyphens. Must start and end with a letter or number.
            </AlertDescription>
          </Alert>
        </div>

        {/* Custom Domain */}
        <div className="space-y-2">
          <Label htmlFor="customDomain" className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Custom Domain (Optional)
          </Label>
          <p className="text-sm text-muted-foreground">
            Use your own domain name (e.g., support.yourcompany.com)
          </p>
          <Input
            id="customDomain"
            value={customDomain}
            onChange={(e) => handleChange('customDomain', e.target.value)}
            placeholder="e.g., support.yourcompany.com"
            type="url"
          />
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Custom domains require DNS configuration. After saving, you'll receive instructions for setting up CNAME records with your domain registrar.
            </AlertDescription>
          </Alert>
        </div>

        {/* Preview */}
        {(companyName || subdomain) && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <Label className="text-sm font-semibold">Preview</Label>
            <div className="space-y-1">
              {companyName && (
                <p className="text-lg font-bold">{companyName}</p>
              )}
              {tagline && (
                <p className="text-sm text-muted-foreground italic">{tagline}</p>
              )}
              {subdomain && (
                <p className="text-sm">
                  <span className="text-muted-foreground">URL: </span>
                  <code className="text-primary">https://{subdomain}.deskwise.net</code>
                </p>
              )}
              {customDomain && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Custom URL: </span>
                  <code className="text-primary">https://{customDomain}</code>
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
