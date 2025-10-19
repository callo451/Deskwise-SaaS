import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChangeManagementService } from '@/lib/services/change-management'

export async function POST(
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

    // Only admins can approve change requests
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can approve change requests' },
        { status: 403 }
      )
    }

    const { id } = await params
    const changeRequest = await ChangeManagementService.approveChangeRequest(
      id,
      session.user.orgId,
      session.user.id
    )

    if (!changeRequest) {
      return NextResponse.json(
        { success: false, error: 'Change request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: changeRequest,
      message: 'Change request approved successfully',
    })
  } catch (error) {
    console.error('Approve change request error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to approve change request' },
      { status: 500 }
    )
  }
}
