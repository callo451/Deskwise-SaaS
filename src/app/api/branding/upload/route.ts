import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { S3StorageService } from '@/lib/services/s3-storage'
import { randomBytes } from 'crypto'

// Allowed file types for branding assets
const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
  'image/x-icon',
  'image/vnd.microsoft.icon',
]

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * POST /api/branding/upload
 * Upload a branding asset (logo, favicon, etc.) to S3
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // RBAC check - need settings.edit permission
    const hasPermission = await requireAnyPermission(session, [
      'settings.edit',
      'settings.manage',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('settings.edit') },
        { status: 403 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const assetType = formData.get('assetType') as string | null // 'logo-light', 'logo-dark', 'favicon', 'login'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File is required' },
        { status: 400 }
      )
    }

    if (!assetType) {
      return NextResponse.json(
        { success: false, error: 'Asset type is required (logo-light, logo-dark, favicon, login)' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Allowed: PNG, JPEG, SVG, WebP, ICO',
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate S3 key for branding asset
    const s3Key = generateBrandingAssetKey(
      session.user.orgId,
      assetType,
      file.name
    )

    // Upload to S3
    const s3Service = new S3StorageService()
    const uploadResult = await s3Service.uploadFile(
      buffer,
      s3Key,
      file.type,
      {
        'original-filename': file.name,
        'asset-type': assetType,
        'uploaded-by': session.user.id,
      }
    )

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to S3' },
        { status: 500 }
      )
    }

    // Generate presigned URL for immediate access (valid for 7 days)
    const presignedUrl = await s3Service.getPresignedUrl(s3Key, 7 * 24 * 60 * 60)

    return NextResponse.json({
      success: true,
      data: {
        s3Key,
        url: presignedUrl,
        size: uploadResult.size,
        contentType: file.type,
        assetType,
      },
      message: 'Branding asset uploaded successfully',
    })
  } catch (error) {
    console.error('Upload branding asset error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload branding asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Generate a unique S3 key for a branding asset
 *
 * @param orgId - Organization ID
 * @param assetType - Type of asset (logo-light, logo-dark, favicon, login)
 * @param originalFilename - Original filename
 * @returns S3 key in format: orgId/branding/{assetType}/{uuid}-{sanitizedFilename}
 */
function generateBrandingAssetKey(
  orgId: string,
  assetType: string,
  originalFilename: string
): string {
  // Sanitize filename - remove dangerous characters
  const sanitized = originalFilename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 200) // Limit length

  // Generate unique filename to prevent conflicts
  const uniqueId = randomBytes(4).toString('hex')

  // Get file extension
  const ext = sanitized.split('.').pop() || 'png'

  // Create filename with timestamp for versioning
  const timestamp = Date.now()
  const filename = `${assetType}-${timestamp}-${uniqueId}.${ext}`

  return `${orgId}/branding/${filename}`
}
