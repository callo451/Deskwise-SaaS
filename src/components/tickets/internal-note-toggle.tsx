'use client'

import { useState } from 'react'
import { Lock, LockOpen } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface InternalNoteToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  className?: string
}

export function InternalNoteToggle({
  value,
  onChange,
  disabled = false,
  className,
}: InternalNoteToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        'border border-input',
        value
          ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
          : 'bg-background text-muted-foreground hover:bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={
        value
          ? 'Internal note - Only visible to your team'
          : 'Public comment - Visible to everyone'
      }
    >
      {value ? (
        <>
          <Lock className="w-4 h-4" />
          <span>Internal Note</span>
        </>
      ) : (
        <>
          <LockOpen className="w-4 h-4" />
          <span>Public Comment</span>
        </>
      )}
    </button>
  )
}
