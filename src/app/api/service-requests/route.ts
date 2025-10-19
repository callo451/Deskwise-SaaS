import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ServiceRequestService } from '@/lib/services/service-requests'
import { z } from 'zod'

const createServiceRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().min(1, 'Category is required'),
  assignedTo: z.string().optional(),
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  formData: z.record(z.any()).optional(),
  sla: z.object({
    responseTime: z.number().positive(),
    resolutionTime: z.number().positive(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    const filters: any = {}

    if (searchParams.get('status')) {
      const statuses = searchParams.get('status')!.split(',')
      filters.status = statuses.length === 1 ? statuses[0] : statuses
    }

    if (searchParams.get('priority')) {
      const priorities = searchParams.get('priority')!.split(',')
      filters.priority = priorities.length === 1 ? priorities[0] : priorities
    }

    if (searchParams.get('category')) {
      filters.category = searchParams.get('category')!
    }

    if (searchParams.get('assignedTo')) {
      filters.assignedTo = searchParams.get('assignedTo')!
    }

    if (searchParams.get('requestedBy')) {
      filters.requestedBy = searchParams.get('requestedBy')!
    }

    if (searchParams.get('approvalStatus')) {
      filters.approvalStatus = searchParams.get('approvalStatus')!
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    const serviceRequests = await ServiceRequestService.getServiceRequests(
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: serviceRequests,
    })
  } catch (error) {
    console.error('Get service requests error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service requests' },
      { status: 500 }
    )
  }
}

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
    const validatedData = createServiceRequestSchema.parse(body)

    const serviceRequest = await ServiceRequestService.createServiceRequest(
      session.user.orgId,
      validatedData,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: serviceRequest,
      message: 'Service request created successfully',
    })
  } catch (error) {
    console.error('Create service request error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create service request' },
      { status: 500 }
    )
  }
}
