'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditProps {
  value: string
  onSave: (value: string) => Promise<void>
  multiline?: boolean
  placeholder?: string
  className?: string
  displayClassName?: string
  inputClassName?: string
}

export function InlineEdit({
  value,
  onSave,
  multiline = false,
  placeholder = 'Click to edit',
  className,
  displayClassName,
  inputClassName,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length
        )
      } else {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  const handleSave = async () => {
    if (currentValue === value) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await onSave(currentValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving:', error)
      setCurrentValue(value) // Revert on error
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setCurrentValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Enter' && multiline && e.ctrlKey) {
      e.preventDefault()
      handleSave()
    }
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={cn(
          'cursor-pointer rounded px-2 py-1 -ml-2 hover:bg-muted/50 transition-colors group',
          className
        )}
      >
        <span className={cn('whitespace-pre-wrap', displayClassName)}>
          {value || <span className="text-muted-foreground italic">{placeholder}</span>}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {multiline ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className={cn('min-h-[100px]', inputClassName)}
          placeholder={placeholder}
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className={inputClassName}
          placeholder={placeholder}
        />
      )}

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || currentValue === value}
        >
          {isSaving ? (
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <Check className="w-3 h-3 mr-1" />
          )}
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
          <X className="w-3 h-3 mr-1" />
          Cancel
        </Button>
        {multiline && (
          <span className="text-xs text-muted-foreground ml-auto">
            Press Ctrl+Enter to save, Esc to cancel
          </span>
        )}
      </div>
    </div>
  )
}
