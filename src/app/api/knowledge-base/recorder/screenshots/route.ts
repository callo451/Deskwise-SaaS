import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecorderService } from '@/lib/services/recorder'
import { ScreenshotStorageService } from '@/lib/services/screenshot-storage'
import { z } from 'zod'

const uploadScreenshotSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  stepNumber: z.number().int().positive(),
  imageData: z.string().min(1, 'Image data is required'), // base64 data URL
  width: z.number().optional(),
  height: z.number().optional(),
  annotations: z.any().optional(),
})

/**
 * POST /api/knowledge-base/recorder/screenshots
 * Upload a screenshot
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

    const body = await request.json()
    const validatedData = uploadScreenshotSchema.parse(body)

    // Convert base64 to buffer
    const { buffer, contentType } = ScreenshotStorageService.dataUrlToBuffer(
      validatedData.imageData
    )

    // Generate filename
    const timestamp = Date.now()
    const extension = contentType.split('/')[1] || 'png'
    const filename = `${validatedData.sessionId}_step${validatedData.stepNumber}_${timestamp}.${extension}`

    // Upload to GridFS
    const fileId = await ScreenshotStorageService.upload(buffer, filename, {
      sessionId: validatedData.sessionId,
      stepNumber: validatedData.stepNumber,
      orgId: session.user.orgId,
      contentType,
    })

    // Get URL for the screenshot
    const url = ScreenshotStorageService.getUrl(fileId)

    // Save screenshot metadata to database
    const screenshot = await RecorderService.saveScreenshotMetadata(
      validatedData.sessionId,
      validatedData.stepNumber,
      session.user.orgId,
      {
        filename,
        url,
        width: validatedData.width || 0,
        height: validatedData.height || 0,
        contentType,
        size: buffer.length,
        annotations: validatedData.annotations,
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        screenshotId: screenshot._id.toString(),
        url: screenshot.url,
        filename: screenshot.filename,
      },
      message: 'Screenshot uploaded successfully',
    })
  } catch (error: any) {
    console.error('Error uploading screenshot:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/knowledge-base/recorder/screenshots?sessionId=xxx
 * Get all screenshots for a session
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId query parameter is required' },
        { status: 400 }
      )
    }

    const screenshots = await RecorderService.getSessionScreenshots(
      sessionId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: screenshots,
    })
  } catch (error: any) {
    console.error('Error fetching screenshots:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
