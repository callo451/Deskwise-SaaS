import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

/**
 * File Storage Service
 * Handles file uploads, storage, and retrieval
 *
 * Current implementation: Filesystem storage
 * Future: Can be extended to support S3, Azure Blob, etc.
 */

export interface FileUploadOptions {
  maxFileSize?: number // bytes
  allowedMimeTypes?: string[]
  generateThumbnail?: boolean
}

export interface StoredFile {
  id: string
  filename: string
  originalFilename: string
  contentType: string
  size: number
  url: string
  thumbnailUrl?: string
  path: string
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'tickets')
const THUMBNAIL_DIR = path.join(process.cwd(), 'public', 'uploads', 'thumbnails')

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
]

export class FileStorageService {
  /**
   * Initialize storage directories
   */
  static async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true })
      await fs.mkdir(THUMBNAIL_DIR, { recursive: true })
    } catch (error) {
      console.error('Failed to initialize storage directories:', error)
      throw error
    }
  }

  /**
   * Generate a unique filename
   */
  static generateUniqueFilename(originalFilename: string): string {
    const timestamp = Date.now()
    const randomString = randomBytes(8).toString('hex')
    const ext = path.extname(originalFilename)
    const baseName = path.basename(originalFilename, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50)

    return `${timestamp}_${randomString}_${baseName}${ext}`
  }

  /**
   * Validate file
   */
  static validateFile(
    file: File,
    options: FileUploadOptions = {}
  ): { valid: boolean; error?: string } {
    const maxSize = options.maxFileSize || DEFAULT_MAX_FILE_SIZE
    const allowedTypes = options.allowedMimeTypes || ALLOWED_MIME_TYPES

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      }
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`,
      }
    }

    return { valid: true }
  }

  /**
   * Save uploaded file to storage
   */
  static async saveFile(
    file: File,
    options: FileUploadOptions = {}
  ): Promise<StoredFile> {
    // Validate file
    const validation = this.validateFile(file, options)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Ensure directories exist
    await this.initializeStorage()

    // Generate unique filename
    const filename = this.generateUniqueFilename(file.name)
    const filePath = path.join(UPLOAD_DIR, filename)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Write file to disk
    await fs.writeFile(filePath, buffer)

    // Generate file URL
    const url = `/uploads/tickets/${filename}`

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined
    if (file.type.startsWith('image/') && options.generateThumbnail) {
      thumbnailUrl = await this.generateThumbnail(filename, file.type)
    }

    return {
      id: randomBytes(12).toString('hex'),
      filename,
      originalFilename: file.name,
      contentType: file.type,
      size: file.size,
      url,
      thumbnailUrl,
      path: filePath,
    }
  }

  /**
   * Generate thumbnail for image files
   * Note: This is a placeholder. In production, use Sharp library for image processing
   */
  static async generateThumbnail(
    filename: string,
    contentType: string
  ): Promise<string | undefined> {
    // For now, return undefined. Implement with Sharp library in production:
    //
    // import sharp from 'sharp'
    //
    // const inputPath = path.join(UPLOAD_DIR, filename)
    // const thumbnailFilename = `thumb_${filename}`
    // const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename)
    //
    // await sharp(inputPath)
    //   .resize(200, 200, { fit: 'inside' })
    //   .toFile(thumbnailPath)
    //
    // return `/uploads/thumbnails/${thumbnailFilename}`

    return undefined
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, filename)

    try {
      await fs.unlink(filePath)

      // Try to delete thumbnail if it exists
      const thumbnailPath = path.join(THUMBNAIL_DIR, `thumb_${filename}`)
      try {
        await fs.unlink(thumbnailPath)
      } catch {
        // Thumbnail doesn't exist, ignore
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw new Error('Failed to delete file')
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(filename: string): Promise<{
    exists: boolean
    size?: number
    path?: string
  }> {
    const filePath = path.join(UPLOAD_DIR, filename)

    try {
      const stats = await fs.stat(filePath)
      return {
        exists: true,
        size: stats.size,
        path: filePath,
      }
    } catch {
      return { exists: false }
    }
  }

  /**
   * Calculate total size of all attachments for a ticket
   */
  static calculateTotalSize(files: { size: number }[]): number {
    return files.reduce((total, file) => total + file.size, 0)
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase().substring(1)
  }

  /**
   * Check if file is an image
   */
  static isImage(contentType: string): boolean {
    return contentType.startsWith('image/')
  }

  /**
   * Get icon name for file type (for Lucide icons)
   */
  static getFileIcon(contentType: string): string {
    if (contentType.startsWith('image/')) return 'Image'
    if (contentType.startsWith('video/')) return 'Video'
    if (contentType.startsWith('audio/')) return 'Music'
    if (contentType === 'application/pdf') return 'FileText'
    if (contentType.includes('word')) return 'FileText'
    if (contentType.includes('excel') || contentType.includes('sheet')) return 'Sheet'
    if (contentType.includes('powerpoint') || contentType.includes('presentation')) return 'Presentation'
    if (contentType.includes('zip') || contentType.includes('rar') || contentType.includes('7z')) return 'Archive'
    if (contentType.startsWith('text/')) return 'FileCode'
    return 'File'
  }
}
