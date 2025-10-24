'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { toast } from '@/hooks/use-toast'
import {
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Download,
  Trash2,
  Loader2,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TicketAttachment } from '@/lib/types'

interface AttachmentsTabProps {
  ticketId: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function AttachmentsTab({ ticketId }: AttachmentsTabProps) {
  const { data: session } = useSession()
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [attachmentToDelete, setAttachmentToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchAttachments()
  }, [ticketId])

  const fetchAttachments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/unified-tickets/${ticketId}/attachments`)
      const data = await response.json()

      if (data.success) {
        setAttachments(data.attachments || [])
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to load attachments',
        })
      }
    } catch (error) {
      console.error('Error fetching attachments:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load attachments',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
      })
      return
    }

    try {
      setUploading(true)
      setUploadProgress(0)

      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          if (data.success) {
            toast({
              title: 'Success',
              description: 'File uploaded successfully',
            })
            fetchAttachments()
          } else {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: data.error || 'Failed to upload file',
            })
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to upload file',
          })
        }
        setUploading(false)
        setUploadProgress(0)
      })

      xhr.addEventListener('error', () => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to upload file',
        })
        setUploading(false)
        setUploadProgress(0)
      })

      xhr.open('POST', `/api/unified-tickets/${ticketId}/attachments`)
      xhr.send(formData)
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload file',
      })
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDownload = async (attachment: TicketAttachment) => {
    try {
      const response = await fetch(
        `/api/unified-tickets/${ticketId}/attachments/${attachment.id}`
      )
      const data = await response.json()

      if (data.success && data.downloadUrl) {
        // Open download URL in new tab
        window.open(data.downloadUrl, '_blank')
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to get download link',
        })
      }
    } catch (error) {
      console.error('Download error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download file',
      })
    }
  }

  const handleDelete = async () => {
    if (!attachmentToDelete) return

    try {
      const response = await fetch(
        `/api/unified-tickets/${ticketId}/attachments/${attachmentToDelete}`,
        {
          method: 'DELETE',
        }
      )
      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Attachment deleted successfully',
        })
        fetchAttachments()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to delete attachment',
        })
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete attachment',
      })
    } finally {
      setDeleteDialogOpen(false)
      setAttachmentToDelete(null)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files)
    }
  }, [])

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return ImageIcon
    if (contentType.startsWith('video/')) return Video
    if (contentType.startsWith('audio/')) return Music
    if (contentType.includes('pdf')) return FileText
    if (
      contentType.includes('zip') ||
      contentType.includes('rar') ||
      contentType.includes('7z')
    )
      return Archive
    return File
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg p-8 transition-colors',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-muted-foreground/50',
              uploading && 'pointer-events-none opacity-50'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
            />

            <div className="flex flex-col items-center justify-center gap-4 text-center">
              {uploading ? (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Uploading...</p>
                    <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Drop files here or{' '}
                      <label
                        htmlFor="file-upload"
                        className="text-primary cursor-pointer hover:underline"
                      >
                        browse
                      </label>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No attachments yet</p>
              <p className="text-sm mt-1">Upload files to attach them to this ticket</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.contentType)
            return (
              <Card key={attachment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2 shrink-0">
                      <FileIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-medium text-sm truncate"
                        title={attachment.originalFilename}
                      >
                        {attachment.originalFilename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(attachment.fileSize)}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {attachment.uploadedByName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(attachment.uploadedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(attachment)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAttachmentToDelete(attachment.id)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
