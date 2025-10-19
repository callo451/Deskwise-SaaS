'use client'

import { useState } from 'react'
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Download,
  Trash2,
  Loader2,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
import { cn } from '@/lib/utils'
import { TicketAttachment } from '@/lib/types'

interface AttachmentListProps {
  ticketId: string
  attachments: TicketAttachment[]
  onAttachmentDeleted?: () => void
  showDelete?: boolean
}

export function AttachmentList({
  ticketId,
  attachments,
  onAttachmentDeleted,
  showDelete = true,
}: AttachmentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return Image
    if (contentType.startsWith('video/')) return Video
    if (contentType.startsWith('audio/')) return Music
    if (contentType === 'application/pdf') return FileText
    if (contentType.includes('word')) return FileText
    if (
      contentType.includes('excel') ||
      contentType.includes('sheet') ||
      contentType.includes('spreadsheet')
    )
      return FileText
    if (contentType.includes('powerpoint') || contentType.includes('presentation'))
      return FileText
    if (
      contentType.includes('zip') ||
      contentType.includes('rar') ||
      contentType.includes('7z')
    )
      return Archive
    return File
  }

  const getFileIconColor = (contentType: string): string => {
    if (contentType.startsWith('image/')) return 'text-blue-600'
    if (contentType.startsWith('video/')) return 'text-purple-600'
    if (contentType.startsWith('audio/')) return 'text-pink-600'
    if (contentType === 'application/pdf') return 'text-red-600'
    if (contentType.includes('word')) return 'text-blue-700'
    if (contentType.includes('excel') || contentType.includes('sheet'))
      return 'text-green-600'
    if (contentType.includes('powerpoint') || contentType.includes('presentation'))
      return 'text-orange-600'
    if (contentType.includes('zip') || contentType.includes('rar'))
      return 'text-yellow-600'
    return 'text-gray-600'
  }

  const handleDelete = async (attachmentId: string) => {
    setDeletingId(attachmentId)

    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/attachments/${attachmentId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete attachment')
      }

      if (onAttachmentDeleted) {
        onAttachmentDeleted()
      }
    } catch (error) {
      console.error('Delete attachment error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete attachment')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  const handleDownload = (attachment: TicketAttachment) => {
    // Create a temporary link and click it
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.originalFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No attachments yet</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.map((attachment) => {
          const IconComponent = getFileIcon(attachment.contentType)
          const iconColor = getFileIconColor(attachment.contentType)
          const isImage = attachment.contentType.startsWith('image/')

          return (
            <Card
              key={attachment.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* File icon/thumbnail */}
                <div className="flex items-center justify-center h-24 bg-muted rounded-md relative overflow-hidden">
                  {isImage && attachment.url ? (
                    <img
                      src={attachment.url}
                      alt={attachment.originalFilename}
                      className="w-full h-full object-contain cursor-pointer"
                      onClick={() => setPreviewImage(attachment.url)}
                    />
                  ) : (
                    <IconComponent className={cn('h-12 w-12', iconColor)} />
                  )}
                </div>

                {/* File info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate" title={attachment.originalFilename}>
                    {attachment.originalFilename}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(attachment.uploadedAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isImage && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewImage(attachment.url)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={isImage ? 'flex-1' : 'flex-1'}
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  {showDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(attachment.id)}
                      disabled={deletingId === attachment.id}
                    >
                      {deletingId === attachment.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image preview dialog */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
