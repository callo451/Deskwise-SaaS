'use client'

import React from 'react'
import { useComposerStore } from '@/lib/stores/composer-store'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import * as Icons from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PageSettingsDialog } from './PageSettingsDialog'
import { PortalPage } from '@/lib/types'

export function Toolbar() {
  const router = useRouter()
  const {
    zoom,
    setZoom,
    breakpoint,
    setBreakpoint,
    showGrid,
    setShowGrid,
    previewMode,
    setPreviewMode,
    canUndo,
    canRedo,
    undo,
    redo,
    isDirty,
    page,
  } = useComposerStore()

  const [isSaving, setIsSaving] = React.useState(false)
  const [isPublishing, setIsPublishing] = React.useState(false)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false)

  const handleSave = async () => {
    if (!page) return

    try {
      setIsSaving(true)
      setSaveMessage(null)
      const { blocks, theme } = useComposerStore.getState()

      const response = await fetch(`/api/admin/portal/pages/${page._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks,
          themeOverrides: theme,
        }),
      })

      if (response.ok) {
        useComposerStore.getState().markClean()
        setSaveMessage('Saved successfully')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        const data = await response.json()
        setSaveMessage(data.error || 'Failed to save')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Failed to save page:', error)
      setSaveMessage('Failed to save')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!page) return

    try {
      setIsPublishing(true)
      setSaveMessage(null)
      const { blocks, theme } = useComposerStore.getState()

      const response = await fetch(`/api/admin/portal/pages/${page._id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks,
          themeOverrides: theme,
        }),
      })

      if (response.ok) {
        useComposerStore.getState().markClean()
        setSaveMessage('Published successfully')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        const data = await response.json()
        setSaveMessage(data.error || 'Failed to publish')
        setTimeout(() => setSaveMessage(null), 3000)
      }
    } catch (error) {
      console.error('Failed to publish page:', error)
      setSaveMessage('Failed to publish')
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSaveSettings = async (settings: NonNullable<PortalPage['pageSettings']>) => {
    if (!page) return

    const response = await fetch(`/api/admin/portal/pages/${page._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageSettings: settings,
      }),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to save settings')
    }

    // Update the page in the store
    const updatedPage = await response.json()
    useComposerStore.getState().setPage(updatedPage)
  }

  return (
    <div className="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/portal')}
        >
          <Icons.ArrowLeft className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Icons.Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Icons.Redo className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(25, zoom - 25))}
            disabled={zoom <= 25}
          >
            <Icons.ZoomOut className="w-4 h-4" />
          </Button>
          <Select value={String(zoom)} onValueChange={(val) => setZoom(Number(val))}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="125">125%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
              <SelectItem value="200">200%</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            disabled={zoom >= 200}
          >
            <Icons.ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grid Toggle */}
        <Button
          variant={showGrid ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Grid"
        >
          <Icons.Grid3x3 className="w-4 h-4" />
        </Button>
      </div>

      {/* Center Section - Page Title */}
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">{page?.title || 'Untitled Page'}</h2>
        {isDirty && <span className="text-xs text-muted-foreground">(Unsaved changes)</span>}
        {saveMessage && (
          <span className={`text-xs px-2 py-1 rounded ${
            saveMessage.toLowerCase().includes('success')
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
          }`}>
            {saveMessage}
          </span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Breakpoint Switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded">
          <Button
            variant={breakpoint === 'mobile' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setBreakpoint('mobile')}
            title="Mobile View"
          >
            <Icons.Smartphone className="w-4 h-4" />
          </Button>
          <Button
            variant={breakpoint === 'tablet' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setBreakpoint('tablet')}
            title="Tablet View"
          >
            <Icons.Tablet className="w-4 h-4" />
          </Button>
          <Button
            variant={breakpoint === 'desktop' ? 'default' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setBreakpoint('desktop')}
            title="Desktop View"
          >
            <Icons.Monitor className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Preview */}
        <Button
          variant={previewMode ? 'default' : 'outline'}
          onClick={() => setPreviewMode(!previewMode)}
        >
          <Icons.Eye className="w-4 h-4 mr-2" />
          {previewMode ? 'Exit Preview' : 'Preview'}
        </Button>

        {/* Save */}
        <Button
          variant="outline"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          data-save-button
        >
          {isSaving ? (
            <Icons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Icons.Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {/* Publish */}
        <Button onClick={handlePublish} disabled={isPublishing}>
          {isPublishing ? (
            <Icons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Icons.Upload className="w-4 h-4 mr-2" />
          )}
          {isPublishing ? 'Publishing...' : 'Publish'}
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsDialogOpen(true)}
          title="Page Settings"
        >
          <Icons.Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Page Settings Dialog */}
      <PageSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        page={page}
        onSave={handleSaveSettings}
      />
    </div>
  )
}
