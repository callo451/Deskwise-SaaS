import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canViewPortalComposer } from '@/lib/portal/auth/permissions'
import { PortalAuditService } from '@/lib/portal/auth/audit'

/**
 * Portal Composer Middleware
 *
 * Protects all /admin/portal/** routes with authentication and permission checks
 * Logs unauthorized access attempts for security auditing
 */
export async function portalComposerMiddleware(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check authentication
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in to access the portal composer.' },
      { status: 401 }
    )
  }

  // Check permissions
  const hasPermission = await canViewPortalComposer(session)

  if (!hasPermission) {
    // Log unauthorized access attempt
    await PortalAuditService.logUnauthorizedAccess({
      orgId: session.user.orgId,
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      entityType: 'page',
      ipAddress: request.ip || request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      {
        error: 'Forbidden',
        message:
          'You do not have permission to access the portal composer. Required permissions: portal.view, portal.edit, or portal.create.',
      },
      { status: 403 }
    )
  }

  // User is authenticated and authorized
  return NextResponse.next()
}

/**
 * Helper to extract IP address from request
 */
export function getClientIP(request: NextRequest): string | undefined {
  return (
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    undefined
  )
}

/**
 * Helper to extract user agent from request
 */
export function getUserAgent(request: NextRequest): string | undefined {
  return request.headers.get('user-agent') || undefined
}
