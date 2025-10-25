'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OrganizationBranding } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, Image as ImageIcon, Check, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoUploadSectionProps {
  branding: OrganizationBranding | null
  onUpdate: () => Promise<void>
}

interface UploadZoneProps {
  title: string
  description: string
  currentLogoKey?: string
  onUpload: (file: File) => Promise<void>
  aspectRatio?: string
  maxSizeMB?: number
}

/**
 * Logo Upload Zone Component
 *
 * Provides drag-and-drop file upload functionality with preview.
 */
function UploadZone({
  title,
  description,
  currentLogoKey,
  onUpload,
  aspectRatio = '16:9',
  maxSizeMB = 5,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return 'Invalid file type. Please upload PNG, JPEG, SVG, or WebP.'
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSizeMB}MB limit.`
    }

    return null
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setError(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      toast({
        title: 'Upload Failed',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      await onUpload(file)
      toast({
        title: 'Upload Successful',
        description: `${title} uploaded successfully.`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      toast({
        title: 'Upload Failed',
        description: err instanceof Error ? err.message : 'Upload failed',
        variant: 'destructive',
      })
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [])

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Get display URL for current logo
  const displayUrl = previewUrl || (currentLogoKey ? `/api/branding/asset/${currentLogoKey}` : null)

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-semibold">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          uploading && 'opacity-50 pointer-events-none'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Display Current or Preview Image */}
        {displayUrl ? (
          <div className="space-y-4">
            <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
              <Image
                src={displayUrl}
                alt={title}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>{previewUrl ? 'New image selected' : 'Current logo'}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Change
                </Button>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-muted rounded-full">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">
                    Drag and drop your image here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPEG, SVG, WebP (max {maxSizeMB}MB)
                  </p>
                  {aspectRatio && (
                    <p className="text-xs text-muted-foreground">
                      Recommended ratio: {aspectRatio}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

/**
 * Logo Upload Section Component
 *
 * Manages all logo uploads for the organization:
 * - Light mode logo
 * - Dark mode logo
 * - Favicon
 * - Login screen logo
 */
export function LogoUploadSection({ branding, onUpdate }: LogoUploadSectionProps) {
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Upload logo to server
  const uploadLogo = async (file: File, type: 'light' | 'dark' | 'favicon' | 'login') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    const response = await fetch('/api/branding/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Upload failed')
    }

    // Update branding configuration
    await updateBrandingWithLogo(type, data.data.s3Key)

    return data.data.s3Key
  }

  // Update branding configuration with new logo
  const updateBrandingWithLogo = async (
    type: 'light' | 'dark' | 'favicon' | 'login',
    s3Key: string
  ) => {
    setSaving(true)
    try {
      const updates: any = { logos: {} }

      if (type === 'light' || type === 'dark') {
        updates.logos.primary = {
          ...(branding?.logos?.primary || {}),
          [type]: s3Key,
        }
      } else {
        updates.logos[type === 'login' ? 'loginScreen' : type] = s3Key
      }

      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to update branding')
      }

      await onUpdate()
    } catch (err) {
      throw err
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo Management</CardTitle>
        <CardDescription>
          Upload your organization's logos and branding assets. Supports PNG, JPEG, SVG, and WebP formats.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Light Mode Logo */}
        <UploadZone
          title="Light Mode Logo"
          description="Primary logo displayed in light theme"
          currentLogoKey={branding?.logos?.primary?.light}
          onUpload={(file) => uploadLogo(file, 'light')}
          aspectRatio="16:9 or square"
        />

        {/* Dark Mode Logo */}
        <UploadZone
          title="Dark Mode Logo"
          description="Logo displayed in dark theme (optional)"
          currentLogoKey={branding?.logos?.primary?.dark}
          onUpload={(file) => uploadLogo(file, 'dark')}
          aspectRatio="16:9 or square"
        />

        {/* Favicon */}
        <UploadZone
          title="Favicon"
          description="Small icon displayed in browser tabs"
          currentLogoKey={branding?.logos?.favicon}
          onUpload={(file) => uploadLogo(file, 'favicon')}
          aspectRatio="1:1 (square)"
          maxSizeMB={1}
        />

        {/* Login Screen Logo */}
        <UploadZone
          title="Login Screen Logo"
          description="Logo displayed on the login page"
          currentLogoKey={branding?.logos?.loginScreen}
          onUpload={(file) => uploadLogo(file, 'login')}
          aspectRatio="16:9 or square"
        />

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            For best results, use PNG or SVG files with transparent backgrounds. Recommended minimum width: 400px for logos, 32px for favicon.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
