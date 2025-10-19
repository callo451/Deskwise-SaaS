'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, File, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  ticketId: string
  onUploadComplete?: () => void
  maxFileSize?: number // in bytes
  maxTotalSize?: number // in bytes
}

interface UploadingFile {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB

export function FileUpload({
  ticketId,
  onUploadComplete,
  maxFileSize = MAX_FILE_SIZE,
  maxTotalSize = MAX_TOTAL_SIZE,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFiles = (newFiles: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    const currentTotalSize = files.reduce((sum, f) => sum + f.file.size, 0)
    let newTotalSize = currentTotalSize

    for (const file of newFiles) {
      // Check individual file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File size exceeds ${formatFileSize(maxFileSize)}`)
        continue
      }

      // Check total size
      if (newTotalSize + file.size > maxTotalSize) {
        errors.push(`${file.name}: Total size would exceed ${formatFileSize(maxTotalSize)}`)
        continue
      }

      // Check for duplicates
      if (files.some((f) => f.file.name === file.name && f.file.size === file.size)) {
        errors.push(`${file.name}: File already added`)
        continue
      }

      valid.push(file)
      newTotalSize += file.size
    }

    return { valid, errors }
  }

  const handleFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)
    const { valid, errors } = validateFiles(fileArray)

    if (errors.length > 0) {
      setUploadError(errors.join(', '))
    } else {
      setUploadError(null)
    }

    if (valid.length > 0) {
      const uploadingFiles: UploadingFile[] = valid.map((file) => ({
        file,
        status: 'pending',
      }))

      setFiles((prev) => [...prev, ...uploadingFiles])
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadError(null)

    try {
      // Update all files to uploading status
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'uploading' as const,
          progress: 0,
        }))
      )

      // Create form data
      const formData = new FormData()
      files.forEach((f) => {
        formData.append('files', f.file)
      })

      // Upload
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Mark all as success
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'success' as const,
          progress: 100,
        }))
      )

      // Clear files after a short delay
      setTimeout(() => {
        setFiles([])
        if (onUploadComplete) {
          onUploadComplete()
        }
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      setUploadError(errorMessage)

      // Mark all as error
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: 'error' as const,
          error: errorMessage,
        }))
      )
    } finally {
      setUploading(false)
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
      >
        <Upload className={cn(
          'mx-auto h-12 w-12 mb-4',
          isDragging ? 'text-primary' : 'text-muted-foreground'
        )} />
        <p className="text-lg font-medium mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Maximum {formatFileSize(maxFileSize)} per file,{' '}
          {formatFileSize(maxTotalSize)} total
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Select Files
        </Button>
      </div>

      {/* Error message */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            {files.map((uploadingFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
              >
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(uploadingFile.file.size)}
                  </p>
                </div>

                {uploadingFile.status === 'pending' && !uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                {uploadingFile.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}

                {uploadingFile.status === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}

                {uploadingFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? 's' : ''} •{' '}
              {formatFileSize(totalSize)}
            </div>
            <Button
              onClick={uploadFiles}
              disabled={uploading || files.every((f) => f.status !== 'pending')}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length} File{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
