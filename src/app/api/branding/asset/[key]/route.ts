import { NextRequest, NextResponse } from 'next/server'
import { S3StorageService } from '@/lib/services/s3-storage'

interface RouteParams {
  params: Promise<{
    key: string
  }>
}

/**
 * GET /api/branding/asset/[key]
 * Retrieve a branding asset from S3 and serve it
 * This endpoint generates a presigned URL and redirects to it
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const s3Key = decodeURIComponent(resolvedParams.key)

    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: 'S3 key is required' },
        { status: 400 }
      )
    }

    // Validate that this is a branding asset (security check)
    if (!s3Key.includes('/branding/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset path' },
        { status: 403 }
      )
    }

    // Generate presigned URL (valid for 7 days for branding assets)
    const s3Service = new S3StorageService()
    const presignedUrl = await s3Service.getPresignedUrl(s3Key, 7 * 24 * 60 * 60)

    // Redirect to presigned URL
    return NextResponse.redirect(presignedUrl)
  } catch (error) {
    console.error('Get branding asset error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve branding asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
