'use client'

import { useState, useRef } from 'react'
import { Send, Lock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CommentItem, Comment } from './comment-item'
import { CannedResponses } from './canned-responses'

interface EnhancedCommentSectionProps {
  ticketId: string
  comments: Comment[]
  currentUserId?: string
  currentUserRole?: string
  onAddComment: (content: string, isInternal: boolean) => Promise<void>
  onEditComment?: (commentId: string, newContent: string) => Promise<void>
  onDeleteComment?: (commentId: string) => Promise<void>
  cannedResponseVariables?: Record<string, any>
  loading?: boolean
}

export function EnhancedCommentSection({
  ticketId,
  comments,
  currentUserId,
  currentUserRole,
  onAddComment,
  onEditComment,
  onDeleteComment,
  cannedResponseVariables,
  loading = false,
}: EnhancedCommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Hide internal toggle from end users
  const canUseInternal = currentUserRole !== 'user'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    setError('')

    try {
      await onAddComment(newComment, isInternal)
      setNewComment('')
      setIsInternal(false)
    } catch (err: any) {
      setError(err.message || 'Failed to add comment')
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  // Filter out internal comments for end users
  const visibleComments = comments.filter((comment) => {
    if (currentUserRole === 'user' && comment.isInternal) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-pulse">Loading comments...</div>
          </div>
        ) : visibleComments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium">No comments yet</p>
            <p className="text-sm mt-1">Be the first to comment on this ticket</p>
          </div>
        ) : (
          visibleComments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
            />
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t">
        <div>
          <Label htmlFor="new-comment" className="text-sm font-medium mb-2 block">
            Add a Comment
          </Label>
          <Textarea
            ref={textareaRef}
            id="new-comment"
            placeholder="Type your comment here... (Ctrl+Enter to submit)"
            value={newComment}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={4}
            className="resize-none"
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> to
            submit
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {/* Canned Responses */}
            {cannedResponseVariables && (
              <CannedResponses
                onSelect={handleCannedResponseSelect}
                variables={cannedResponseVariables}
                disabled={submitting}
              />
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Internal Note Toggle */}
            {canUseInternal && (
              <div className="flex items-center gap-2">
                <Switch
                  id="internal-note"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                  disabled={submitting}
                />
                <Label
                  htmlFor="internal-note"
                  className="text-sm cursor-pointer flex items-center gap-1.5 font-medium"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Internal Note
                </Label>
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Posting...' : 'Add Comment'}
            </Button>
          </div>
        </div>

        {/* Info about internal notes */}
        {canUseInternal && isInternal && (
          <Alert>
            <Lock className="w-4 h-4" />
            <AlertDescription>
              This comment will be marked as <strong>internal</strong> and will only be visible to
              technicians and administrators.
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
