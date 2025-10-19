import { GridFSBucket, ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export class ScreenshotStorageService {
  /**
   * Get GridFS bucket for screenshots
   */
  private static async getBucket(): Promise<GridFSBucket> {
    const client = await clientPromise
    const db = client.db('deskwise')
    return new GridFSBucket(db, { bucketName: 'screenshots' })
  }

  /**
   * Upload screenshot to GridFS
   * @param buffer Image buffer
   * @param filename Filename
   * @param metadata Additional metadata
   * @returns File ID
   */
  static async upload(
    buffer: Buffer,
    filename: string,
    metadata: {
      sessionId: string
      stepNumber: number
      orgId: string
      contentType: string
    }
  ): Promise<ObjectId> {
    const bucket = await this.getBucket()

    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename, {
        metadata,
        contentType: metadata.contentType,
      })

      uploadStream.on('finish', () => {
        resolve(uploadStream.id as ObjectId)
      })

      uploadStream.on('error', (error) => {
        reject(error)
      })

      uploadStream.write(buffer)
      uploadStream.end()
    })
  }

  /**
   * Download screenshot from GridFS
   * @param fileId File ID
   * @returns Buffer and metadata
   */
  static async download(
    fileId: ObjectId | string
  ): Promise<{ buffer: Buffer; metadata: any; contentType: string }> {
    const bucket = await this.getBucket()
    const _id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId

    // Get file metadata
    const files = await bucket.find({ _id }).toArray()
    if (files.length === 0) {
      throw new Error('Screenshot not found')
    }

    const file = files[0]

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const downloadStream = bucket.openDownloadStream(_id)

      downloadStream.on('data', (chunk) => {
        chunks.push(chunk)
      })

      downloadStream.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          metadata: file.metadata,
          contentType: file.contentType || 'image/png',
        })
      })

      downloadStream.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Delete screenshot from GridFS
   * @param fileId File ID
   */
  static async delete(fileId: ObjectId | string): Promise<void> {
    const bucket = await this.getBucket()
    const _id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId

    await bucket.delete(_id)
  }

  /**
   * Get screenshot URL (for GridFS, this will be an API route)
   * @param fileId File ID
   * @returns URL to access the screenshot
   */
  static getUrl(fileId: ObjectId | string): string {
    const id = typeof fileId === 'string' ? fileId : fileId.toString()
    return `/api/knowledge-base/recorder/screenshots/${id}`
  }

  /**
   * Convert base64 data URL to Buffer
   * @param dataUrl Base64 data URL (e.g., data:image/png;base64,...)
   * @returns Buffer
   */
  static dataUrlToBuffer(dataUrl: string): {
    buffer: Buffer
    contentType: string
  } {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      throw new Error('Invalid data URL format')
    }

    const contentType = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')

    return { buffer, contentType }
  }
}
