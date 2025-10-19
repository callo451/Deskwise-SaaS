'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Send, Lock, Smile, Paperclip, FileText } from 'lucide-react'
import { CannedResponseSelector } from '@/components/tickets/canned-response-selector'
import { FileUpload } from '@/components/tickets/file-upload'
import { cn } from '@/lib/utils'

interface Comment {
  _id: string
  content: string
  createdBy: string
  createdByName?: string
  createdAt: string
  isInternal: boolean
  reactions?: Record<string, string[]> // emoji -> array of user IDs
}

interface EnhancedCommentSectionProps {
  ticketId: string
  comments: Comment[]
  onAddComment: (content: string, isInternal: boolean) => Promise<void>
  onReaction?: (commentId: string, emoji: string) => Promise<void>
  cannedResponseVariables?: Record<string, any>
  currentUserId?: string
}

const reactions = ['👍', '❤️', '😊', '🎉', '🚀', '👀']

export function EnhancedCommentSection({
  ticketId,
  comments,
  onAddComment,
  onReaction,
  cannedResponseVariables,
  currentUserId,
}: EnhancedCommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      await onAddComment(newComment, isInternal)
      setNewComment('')
      setIsInternal(false)
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCannedResponseSelect = (content: string) => {
    setNewComment((prev) => {
      const separator = prev.trim() ? '\n\n' : ''
      return prev + separator + content
    })
    textareaRef.current?.focus()
  }

  const insertText = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = newComment

    const newValue = currentValue.substring(0, start) + text + currentValue.substring(end)
    setNewComment(newValue)

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length
      textarea.focus()
    }, 0)
  }

  const handleReaction = async (commentId: string, emoji: string) => {
    if (onReaction) {
      await onReaction(commentId, emoji)
    }
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className={cn(
                'flex gap-3 p-4 rounded-lg border',
                comment.isInternal
                  ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700'
                  : 'bg-card'
              )}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {(comment.createdByName || comment.createdBy)[0]?.toUpperCase()}
              </div>

              {/* Comment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm">
                    {comment.createdByName || `User ${comment.createdBy}`}
                  </span>
                  {comment.isInternal && (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3" />
                      Internal Note
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm whitespace-pre-wrap mb-2">{comment.content}</p>

                {/* Reactions */}
                {onReaction && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {reactions.map((emoji) => {
                      const reactionUsers = comment.reactions?.[emoji] || []
                      const hasReacted = currentUserId && reactionUsers.includes(currentUserId)

                      return (
                        <TooltipProvider key={emoji}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleReaction(comment._id, emoji)}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
                                  hasReacted
                                    ? 'bg-primary/10 border border-primary'
                                    : 'bg-muted hover:bg-muted/80 border border-transparent'
                                )}
                              >
                                <span>{emoji}</span>
                                {reactionUsers.length > 0 && (
                                  <span className="text-xs font-medium">{reactionUsers.length}</span>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {reactionUsers.length > 0
                                ? `${reactionUsers.length} ${reactionUsers.length === 1 ? 'person' : 'people'} reacted`
                                : 'React'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
        <div>
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... (Ctrl+Enter to submit)"
            value={newComment}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none"
            disabled={submitting}
          />
        </div>

        {/* File Upload Section */}
        {showFileUpload && (
          <div className="p-4 border rounded-lg bg-muted/30">
            <FileUpload ticketId={ticketId} onUploadComplete={() => setShowFileUpload(false)} />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Canned Responses */}
            {cannedResponseVariables && (
              <CannedResponseSelector
                onSelect={handleCannedResponseSelect}
                variables={cannedResponseVariables}
                disabled={submitting}
              />
            )}

            {/* Attachment Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFileUpload(!showFileUpload)}
                    disabled={submitting}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Emoji Reactions */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertText('😊')}
                    disabled={submitting}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Insert emoji</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-3">
            {/* Internal Note Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="internal-note"
                checked={isInternal}
                onCheckedChange={setIsInternal}
                disabled={submitting}
              />
              <Label
                htmlFor="internal-note"
                className="text-sm cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                Internal Note
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Sending...' : 'Add Comment'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to submit
        </p>
      </form>
    </div>
  )
}
