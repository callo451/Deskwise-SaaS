'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Lock, Edit, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface Comment {
  _id: string
  content: string
  isInternal: boolean
  createdBy: string
  createdByName?: string
  createdByAvatar?: string
  createdAt: Date
  updatedAt?: Date
  isEdited?: boolean
}

interface CommentItemProps {
  comment: Comment
  currentUserId?: string
  currentUserRole?: string
  onEdit?: (commentId: string, newContent: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
}

function getUserInitials(name: string): string {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isOwner = currentUserId === comment.createdBy
  const isAdmin = currentUserRole === 'admin'
  const canEdit = (isOwner || isAdmin) && onEdit
  const canDelete = (isOwner || isAdmin) && onDelete

  const handleSaveEdit = async () => {
    if (!editedContent.trim() || !onEdit) return

    setIsSaving(true)
    try {
      await onEdit(comment._id, editedContent)
      setIsEditing(false)
    } catch (error) {
      console.error('Error editing comment:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedContent(comment.content)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsDeleting(true)
    try {
      await onDelete(comment._id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting comment:', error)
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          'flex gap-3 p-4 rounded-lg border transition-all',
          comment.isInternal
            ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700'
            : 'bg-card border-border hover:shadow-sm'
        )}
      >
        {/* Avatar */}
        {comment.createdByAvatar ? (
          <img
            src={comment.createdByAvatar}
            alt={comment.createdByName || 'User'}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold shrink-0">
            {getUserInitials(comment.createdByName || 'User')}
          </div>
        )}

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {comment.createdByName || 'Unknown User'}
              </span>

              {comment.isInternal && (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Internal
                </Badge>
              )}

              <time
                className="text-xs text-muted-foreground"
                dateTime={comment.createdAt.toISOString()}
                title={format(comment.createdAt, 'PPpp')}
              >
                {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              </time>

              {comment.isEdited && (
                <span className="text-xs text-muted-foreground italic">(edited)</span>
              )}
            </div>

            {/* Actions Menu */}
            {(canEdit || canDelete) && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment Body */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={4}
                className="resize-none"
                disabled={isSaving}
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editedContent.trim()}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
