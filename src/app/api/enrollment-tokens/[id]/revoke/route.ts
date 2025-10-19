import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EnrollmentTokenService } from '@/lib/services/enrollment-tokens'

/**
 * POST /api/enrollment-tokens/[id]/revoke - Revoke an enrollment token
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const success = await EnrollmentTokenService.revokeToken(id, session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { error: 'Token not found or already revoked' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking enrollment token:', error)
    return NextResponse.json(
      { error: 'Failed to revoke enrollment token' },
      { status: 500 }
    )
  }
}
