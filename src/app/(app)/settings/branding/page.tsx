'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SettingsHeader } from '@/components/settings/settings-header'
import { useBranding } from '@/components/providers/BrandingProvider'
import {
  Palette,
  ImageIcon,
  Type,
  Building2,
  Mail,
  Eye,
  History,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { LogoUploadSection } from './_components/LogoUploadSection'
import { ColorPaletteEditor } from './_components/ColorPaletteEditor'
import { TypographySelector } from './_components/TypographySelector'
import { CompanyIdentitySection } from './_components/CompanyIdentitySection'
import { EmailBrandingSection } from './_components/EmailBrandingSection'
import { LivePreviewPane } from './_components/LivePreviewPane'
import { BrandingHistory } from './_components/BrandingHistory'

/**
 * White-Label Branding Settings Page
 *
 * Allows organizations to fully customize their Deskwise instance with:
 * - Custom logos (light/dark mode, favicon, login screen)
 * - Color palette (primary, secondary, accent, background, surface)
 * - Typography (font family, Google Fonts)
 * - Company identity (name, tagline, subdomain, custom domain)
 * - Email branding (from name, reply-to, footer, header color)
 * - Live preview of changes
 * - Version history and rollback capability
 *
 * @requires Admin role
 */
export default function BrandingSettingsPage() {
  const { data: session } = useSession()
  const { branding, isLoading, error, refreshBranding } = useBranding()
  const [activeTab, setActiveTab] = useState('logos')

  const isAdmin = session?.user?.role === 'admin'

  // Check admin access
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="White-Label Branding"
          description="Customize your organization's branding"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Palette className="h-6 w-6 text-pink-600" />}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access branding settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="White-Label Branding"
          description="Customize your organization's branding"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Palette className="h-6 w-6 text-pink-600" />}
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="White-Label Branding"
          description="Customize your organization's branding"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Palette className="h-6 w-6 text-pink-600" />}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load branding settings: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="White-Label Branding"
        description="Customize your organization's appearance, colors, and identity"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Palette className="h-6 w-6 text-pink-600" />}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-pink-200 bg-pink-50/50">
          <div className="p-6">
            <div className="text-sm text-pink-700 mb-1">Branding Status</div>
            <div className="text-2xl font-bold text-pink-900">
              {branding?.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Current Version</div>
            <div className="text-2xl font-bold">v{branding?.version || 1}</div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Last Modified</div>
            <div className="text-base font-semibold">
              {branding?.lastModifiedAt
                ? new Date(branding.lastModifiedAt).toLocaleDateString()
                : 'Never'}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-sm text-muted-foreground mb-1">Company Name</div>
            <div className="text-base font-semibold truncate">
              {branding?.identity?.companyName || 'Deskwise'}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="logos" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Logos</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Colors</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="h-4 w-4" />
            <span className="hidden sm:inline">Typography</span>
          </TabsTrigger>
          <TabsTrigger value="identity" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Identity</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Logos Tab */}
        <TabsContent value="logos" className="space-y-6">
          <LogoUploadSection branding={branding} onUpdate={refreshBranding} />
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <ColorPaletteEditor branding={branding} onUpdate={refreshBranding} />
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-6">
          <TypographySelector branding={branding} onUpdate={refreshBranding} />
        </TabsContent>

        {/* Identity Tab */}
        <TabsContent value="identity" className="space-y-6">
          <CompanyIdentitySection branding={branding} onUpdate={refreshBranding} />
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          <EmailBrandingSection branding={branding} onUpdate={refreshBranding} />
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <LivePreviewPane branding={branding} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <BrandingHistory onRollback={refreshBranding} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
