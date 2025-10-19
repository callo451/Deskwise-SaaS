'use client'

import React, { useState } from 'react'
import { Save, Play, Power, PowerOff, ZoomIn, ZoomOut, Maximize2, Settings, MoreVertical } from 'lucide-react'
import { useWorkflowStore } from '@/lib/stores/workflow-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  workflowName: string
  isEnabled: boolean
  onSave: () => Promise<void>
  onTest: () => Promise<void>
  onToggleEnabled: () => Promise<void>
  onZoomIn?: () => void
  onZoomOut?: () => void
  onFitView?: () => void
}

export function Toolbar({
  workflowName,
  isEnabled,
  onSave,
  onTest,
  onToggleEnabled,
  onZoomIn,
  onZoomOut,
  onFitView,
}: ToolbarProps) {
  const { isDirty, isSaving } = useWorkflowStore()
  const [isTesting, setIsTesting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Handle save
  const handleSave = async () => {
    try {
      await onSave()
    } catch (error) {
      console.error('Failed to save workflow:', error)
    }
  }

  // Handle test
  const handleTest = async () => {
    setIsTesting(true)
    try {
      await onTest()
    } catch (error) {
      console.error('Failed to test workflow:', error)
    } finally {
      setIsTesting(false)
    }
  }

  // Handle toggle enabled
  const handleToggleEnabled = async () => {
    setIsToggling(true)
    try {
      await onToggleEnabled()
    } catch (error) {
      console.error('Failed to toggle workflow:', error)
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="h-16 bg-white dark:bg-[#141927] border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6">
      {/* Left side - Workflow name */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{workflowName}</h1>
          {isDirty && (
            <p className="text-xs text-amber-500 dark:text-amber-400">Unsaved changes</p>
          )}
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 mr-2 border border-gray-200 dark:border-white/10 rounded-lg p-1 bg-gray-100 dark:bg-[#1e2536]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomOut}
            className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#252d42]"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onZoomIn}
            className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#252d42]"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFitView}
            className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-[#252d42]"
            title="Fit View"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Test button */}
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={isTesting || isDirty}
          className="border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252d42]"
        >
          <Play className="w-4 h-4 mr-2" />
          {isTesting ? 'Testing...' : 'Test'}
        </Button>

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={cn(
            'min-w-[100px]',
            isDirty && 'bg-indigo-600 hover:bg-indigo-700'
          )}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>

        {/* Enable/Disable toggle */}
        <Button
          variant={isEnabled ? 'default' : 'outline'}
          onClick={handleToggleEnabled}
          disabled={isToggling}
          className={cn(
            'min-w-[120px]',
            isEnabled && 'bg-green-600 hover:bg-green-700',
            !isEnabled && 'border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252d42]'
          )}
        >
          {isEnabled ? (
            <>
              <Power className="w-4 h-4 mr-2" />
              Enabled
            </>
          ) : (
            <>
              <PowerOff className="w-4 h-4 mr-2" />
              Disabled
            </>
          )}
        </Button>

        {/* Settings menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252d42]"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10">
            <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252d42]">
              <Settings className="w-4 h-4 mr-2" />
              Workflow Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
            <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252d42]">
              Export Workflow
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-[#252d42]">
              Clone Workflow
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-white/10" />
            <DropdownMenuItem className="text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#252d42]">
              Delete Workflow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
