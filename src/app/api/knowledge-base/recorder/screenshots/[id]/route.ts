import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecorderService } from '@/lib/services/recorder'
import { ScreenshotStorageService } from '@/lib/services/screenshot-storage'
import { z } from 'zod'

const updateScreenshotSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  annotations: z.array(z.any()).optional(),
})

/**
 * GET /api/knowledge-base/recorder/screenshots/[id]
 * Retrieve a screenshot file from GridFS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get screenshot metadata to verify ownership
    const screenshot = await RecorderService.getScreenshot(
      id,
      session.user.orgId
    )

    if (!screenshot) {
      return NextResponse.json(
        { success: false, error: 'Screenshot not found' },
        { status: 404 }
      )
    }

    // Download from GridFS
    // The URL stored is in format /api/knowledge-base/recorder/screenshots/[gridfsId]
    // Extract the GridFS ID from the URL
    const gridfsId = screenshot.url.split('/').pop()

    if (!gridfsId) {
      throw new Error('Invalid screenshot URL')
    }

    const { buffer, contentType } = await ScreenshotStorageService.download(
      gridfsId
    )

    // Return the image
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error: any) {
    console.error('Error retrieving screenshot:', error)

    if (error.message === 'Screenshot not found') {
      return NextResponse.json(
        { success: false, error: 'Screenshot not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/knowledge-base/recorder/screenshots/[id]
 * Update a screenshot with edited image data and annotations
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateScreenshotSchema.parse(body)

    // Get existing screenshot
    const screenshot = await RecorderService.getScreenshot(
      id,
      session.user.orgId
    )

    if (!screenshot) {
      return NextResponse.json(
        { success: false, error: 'Screenshot not found' },
        { status: 404 }
      )
    }

    // Convert base64 to buffer
    const base64Data = validatedData.imageData.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Upload edited image to GridFS
    const gridfsId = await ScreenshotStorageService.upload(
      imageBuffer,
      {
        orgId: session.user.orgId,
        sessionId: screenshot.sessionId,
        stepNumber: screenshot.stepNumber,
        edited: true,
        editedBy: session.user.id,
        editedAt: new Date(),
        hasAnnotations: (validatedData.annotations?.length || 0) > 0,
      }
    )

    const newUrl = `/api/knowledge-base/recorder/screenshots/file/${gridfsId}`

    // Update screenshot metadata with new URL and annotations
    const updatedScreenshot = await RecorderService.updateScreenshot(
      id,
      session.user.orgId,
      {
        url: newUrl,
        annotations: validatedData.annotations || [],
        edited: true,
        editedBy: session.user.id,
        editedAt: new Date(),
      }
    )

    if (!updatedScreenshot) {
      return NextResponse.json(
        { success: false, error: 'Failed to update screenshot' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: updatedScreenshot._id.toString(),
        url: newUrl,
        annotations: validatedData.annotations || [],
        edited: true,
      },
    })
  } catch (error: any) {
    console.error('Error updating screenshot:', error)

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
 * DELETE /api/knowledge-base/recorder/screenshots/[id]
 * Delete a screenshot
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get screenshot metadata
    const screenshot = await RecorderService.getScreenshot(
      id,
      session.user.orgId
    )

    if (!screenshot) {
      return NextResponse.json(
        { success: false, error: 'Screenshot not found' },
        { status: 404 }
      )
    }

    // Extract GridFS ID from URL
    const gridfsId = screenshot.url.split('/').pop()

    if (!gridfsId) {
      throw new Error('Invalid screenshot URL')
    }

    // Delete from GridFS
    await ScreenshotStorageService.delete(gridfsId)

    // Delete metadata
    await RecorderService.deleteScreenshot(id, session.user.orgId)

    return NextResponse.json({
      success: true,
      message: 'Screenshot deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting screenshot:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
