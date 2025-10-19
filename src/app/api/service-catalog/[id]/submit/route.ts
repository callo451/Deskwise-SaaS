import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ServiceCatalogSubmissionService } from '@/lib/services/service-catalog-submissions'

/**
 * POST /api/service-catalog/[id]/submit
 * Submit a service catalog request form
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: serviceId } = await params
    const body = await request.json()

    if (!body.formData || typeof body.formData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      )
    }

    // Submit the request and route to appropriate module
    const result = await ServiceCatalogSubmissionService.submitRequest(
      serviceId,
      session.user.id,
      session.user.name || session.user.email,
      body.formData,
      session.user.orgId
    )

    // Increment service popularity counter
    await ServiceCatalogSubmissionService.incrementServicePopularity(
      serviceId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      ...result,
    })
  } catch (error: any) {
    console.error('Error submitting service request:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to submit request'
      },
      { status: 500 }
    )
  }
}
