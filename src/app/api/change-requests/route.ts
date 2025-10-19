import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChangeManagementService } from '@/lib/services/change-management'
import { z } from 'zod'

const createChangeRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  risk: z.enum(['low', 'medium', 'high']),
  impact: z.enum(['low', 'medium', 'high']),
  category: z.string().min(1, 'Category is required'),
  plannedStartDate: z.string(),
  plannedEndDate: z.string(),
  affectedAssets: z.array(z.string()),
  relatedTickets: z.array(z.string()),
  backoutPlan: z.string().optional(),
  testPlan: z.string().optional(),
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
    const filters = {
      status: searchParams.get('status') || undefined,
      risk: searchParams.get('risk') || undefined,
      impact: searchParams.get('impact') || undefined,
      category: searchParams.get('category') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const changeRequests = await ChangeManagementService.getChangeRequests(
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: changeRequests,
    })
  } catch (error) {
    console.error('Get change requests error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch change requests' },
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
    const validatedData = createChangeRequestSchema.parse(body)

    const changeRequest = await ChangeManagementService.createChangeRequest(
      session.user.orgId,
      {
        ...validatedData,
        plannedStartDate: new Date(validatedData.plannedStartDate),
        plannedEndDate: new Date(validatedData.plannedEndDate),
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: changeRequest,
      message: 'Change request created successfully',
    })
  } catch (error) {
    console.error('Create change request error:', error)

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
      { success: false, error: 'Failed to create change request' },
      { status: 500 }
    )
  }
}
