import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomBytes } from 'crypto'

/**
 * S3StorageService
 *
 * Handles Amazon S3 file storage operations for ticket attachments.
 * Provides methods to upload, download, and delete files from S3.
 */
export class S3StorageService {
  private client: S3Client
  private bucketName: string

  /**
   * Initialize S3 client with environment variables
   */
  constructor() {
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY
    const region = process.env.AWS_S3_REGION || process.env.AWS_SES_REGION || 'us-east-1'
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || ''

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not configured. Check AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY.')
    }

    if (!this.bucketName) {
      throw new Error('S3 bucket name not configured. Check AWS_S3_BUCKET_NAME.')
    }

    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  /**
   * Generate a unique S3 key for a ticket attachment
   *
   * @param orgId - Organization ID
   * @param ticketId - Ticket ID
   * @param originalFilename - Original filename
   * @returns S3 key in format: orgId/tickets/{ticketId}/{uuid}-{sanitizedFilename}
   */
  generateTicketAttachmentKey(
    orgId: string,
    ticketId: string,
    originalFilename: string
  ): string {
    // Sanitize filename - remove dangerous characters
    const sanitized = originalFilename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 200) // Limit length

    // Generate unique filename to prevent conflicts using crypto.randomBytes
    const uniqueId = randomBytes(4).toString('hex')
    const filename = `${uniqueId}-${sanitized}`

    return `${orgId}/tickets/${ticketId}/${filename}`
  }

  /**
   * Upload a file to S3
   *
   * @param file - File buffer
   * @param key - S3 object key
   * @param contentType - MIME type
   * @param metadata - Optional metadata
   * @returns S3 upload result
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<{
    success: boolean
    key: string
    size: number
    etag?: string
  }> {
    try {
      const params: PutObjectCommandInput = {
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
        // Server-side encryption
        ServerSideEncryption: 'AES256',
      }

      const command = new PutObjectCommand(params)
      const response = await this.client.send(command)

      return {
        success: true,
        key,
        size: file.length,
        etag: response.ETag,
      }
    } catch (error: any) {
      console.error('S3 upload error:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  /**
   * Generate a presigned URL for downloading a file
   *
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
   * @param filename - Optional filename for Content-Disposition header
   * @returns Presigned URL
   */
  async getSignedUrl(
    key: string,
    expiresIn: number = 3600,
    filename?: string
  ): Promise<string> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ...(filename && {
          ResponseContentDisposition: `attachment; filename="${filename}"`,
        }),
      })

      const url = await getSignedUrl(this.client, command as any, { expiresIn })
      return url
    } catch (error: any) {
      console.error('S3 presigned URL error:', error)
      throw new Error(`Failed to generate download URL: ${error.message}`)
    }
  }

  /**
   * Delete a file from S3
   *
   * @param key - S3 object key
   * @returns Deletion result
   */
  async deleteFile(key: string): Promise<{ success: boolean }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)

      return { success: true }
    } catch (error: any) {
      console.error('S3 delete error:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  /**
   * Check if a file exists in S3
   *
   * @param key - S3 object key
   * @returns True if file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.client.send(command)
      return true
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * Get file metadata from S3
   *
   * @param key - S3 object key
   * @returns File metadata
   */
  async getFileMetadata(key: string): Promise<{
    size: number
    contentType: string
    lastModified: Date
    metadata?: Record<string, string>
  } | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const response = await this.client.send(command)

      return {
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        metadata: response.Metadata,
      }
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return null
      }
      throw error
    }
  }

  /**
   * Validate file type against allowed types
   *
   * @param contentType - MIME type
   * @param allowedTypes - Array of allowed MIME types (default: common document/image types)
   * @returns True if file type is allowed
   */
  static validateFileType(
    contentType: string,
    allowedTypes?: string[]
  ): boolean {
    const defaultAllowedTypes = [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Archives
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Other
      'application/json',
      'application/xml',
      'text/xml',
    ]

    const types = allowedTypes || defaultAllowedTypes
    return types.includes(contentType)
  }

  /**
   * Validate file size against maximum allowed size
   *
   * @param fileSize - File size in bytes
   * @param maxSizeMB - Maximum size in MB (default: 10MB)
   * @returns True if file size is valid
   */
  static validateFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return fileSize <= maxSizeBytes
  }
}

/**
 * Singleton instance for easy import
 */
let s3Instance: S3StorageService | null = null

export function getS3StorageService(): S3StorageService {
  if (!s3Instance) {
    s3Instance = new S3StorageService()
  }
  return s3Instance
}
