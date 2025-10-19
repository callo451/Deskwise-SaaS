import { Session } from 'next-auth'
import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { PortalPage, VisibilityGuard, BlockInstance } from '@/lib/types'
import { PermissionService } from '@/lib/services/permissions'

/**
 * Rate Limiting for Guest Access
 *
 * Simple in-memory rate limiter for guest actions
 * In production, use Redis or similar distributed cache
 */
const guestRateLimits = new Map<string, { count: number; resetAt: number }>()

const GUEST_RATE_LIMIT = 10 // requests per window
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

/**
 * Check if IP address is rate limited
 */
function isRateLimited(ipAddress: string): boolean {
  const now = Date.now()
  const limit = guestRateLimits.get(ipAddress)

  if (!limit || limit.resetAt < now) {
    // Reset or create new limit
    guestRateLimits.set(ipAddress, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    })
    return false
  }

  if (limit.count >= GUEST_RATE_LIMIT) {
    return true // Rate limited
  }

  // Increment count
  limit.count++
  return false
}

/**
 * Clean up expired rate limit entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  for (const [ip, limit] of guestRateLimits.entries()) {
    if (limit.resetAt < now) {
      guestRateLimits.delete(ip)
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000)

/**
 * Check if user can access a portal page
 */
export async function canAccessPage(
  session: Session | null,
  page: PortalPage
): Promise<{ allowed: boolean; reason?: string }> {
  // Public pages - anyone can access
  if (page.isPublic) {
    return { allowed: true }
  }

  // Protected pages - require authentication
  if (!session?.user) {
    return { allowed: false, reason: 'Authentication required' }
  }

  // Check role-based access
  if (page.allowedRoles && page.allowedRoles.length > 0) {
    if (!page.allowedRoles.includes(session.user.role)) {
      return { allowed: false, reason: 'Insufficient role' }
    }
  }

  // Check permission-based access
  if (page.requiredPermissions && page.requiredPermissions.length > 0) {
    const hasPermission = await PermissionService.hasAllPermissions(
      session.user.id,
      session.user.orgId,
      page.requiredPermissions
    )

    if (!hasPermission) {
      return { allowed: false, reason: 'Insufficient permissions' }
    }
  }

  return { allowed: true }
}

/**
 * Get accessible portal page by slug
 */
export async function getAccessiblePage(
  session: Session | null,
  orgId: string,
  slug: string
): Promise<PortalPage | null> {
  const db = await getDatabase()
  const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

  const page = await pagesCollection.findOne({
    orgId,
    slug,
    status: 'published',
  })

  if (!page) {
    return null
  }

  const access = await canAccessPage(session, page)
  if (!access.allowed) {
    return null
  }

  return page
}

/**
 * Evaluate visibility guard for a block
 */
export async function evaluateVisibilityGuard(
  session: Session | null,
  guard: VisibilityGuard
): Promise<boolean> {
  switch (guard.type) {
    case 'authenticated':
      return !!session?.user

    case 'role':
      if (!session?.user || !guard.roles) return false
      return guard.roles.includes(session.user.role)

    case 'permission':
      if (!session?.user || !guard.permissions) return false
      return await PermissionService.hasAllPermissions(
        session.user.id,
        session.user.orgId,
        guard.permissions
      )

    case 'custom':
      // Custom expressions would be evaluated here
      // For security, only allow safe operations
      // This is a placeholder - implement carefully
      console.warn('Custom visibility guards not yet implemented')
      return false

    default:
      return true
  }
}

/**
 * Filter blocks based on visibility guards
 */
export async function filterBlocksByVisibility(
  session: Session | null,
  blocks: BlockInstance[]
): Promise<BlockInstance[]> {
  const filteredBlocks: BlockInstance[] = []

  for (const block of blocks) {
    let isVisible = true

    // Check visibility guards
    if (block.visibilityGuards && block.visibilityGuards.length > 0) {
      // All guards must pass (AND logic)
      for (const guard of block.visibilityGuards) {
        const passed = await evaluateVisibilityGuard(session, guard)
        if (!passed) {
          isVisible = false
          break
        }
      }
    }

    if (isVisible) {
      // Recursively filter children
      const filteredBlock = { ...block }
      if (block.children && block.children.length > 0) {
        filteredBlock.children = await filterBlocksByVisibility(session, block.children)
      }
      filteredBlocks.push(filteredBlock)
    }
  }

  return filteredBlocks
}

/**
 * Check if guest access is allowed and not rate limited
 */
export function checkGuestAccess(
  page: PortalPage,
  ipAddress: string
): { allowed: boolean; reason?: string } {
  if (!page.isPublic) {
    return { allowed: false, reason: 'Page is not public' }
  }

  if (isRateLimited(ipAddress)) {
    return { allowed: false, reason: 'Rate limit exceeded' }
  }

  return { allowed: true }
}

/**
 * Get page for rendering (with visibility filtering)
 */
export async function getPageForRender(
  session: Session | null,
  orgId: string,
  slug: string,
  ipAddress?: string
): Promise<{
  page: PortalPage | null
  error?: string
}> {
  const db = await getDatabase()
  const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

  const page = await pagesCollection.findOne({
    orgId,
    slug,
    status: 'published',
  })

  if (!page) {
    return { page: null, error: 'Page not found' }
  }

  // Check access
  const access = await canAccessPage(session, page)
  if (!access.allowed) {
    return { page: null, error: access.reason || 'Access denied' }
  }

  // For public pages with guest access, check rate limit
  if (page.isPublic && !session && ipAddress) {
    const guestAccess = checkGuestAccess(page, ipAddress)
    if (!guestAccess.allowed) {
      return { page: null, error: guestAccess.reason || 'Access denied' }
    }
  }

  // Filter blocks by visibility
  const filteredBlocks = await filterBlocksByVisibility(session, page.blocks)

  // Return page with filtered blocks
  return {
    page: {
      ...page,
      blocks: filteredBlocks,
    },
  }
}

/**
 * Increment page view count
 */
export async function incrementPageViews(pageId: string): Promise<void> {
  try {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    await pagesCollection.updateOne(
      { _id: new ObjectId(pageId) },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() },
      }
    )
  } catch (error) {
    console.error('Failed to increment page views:', error)
    // Don't throw - view counting should not break page rendering
  }
}

/**
 * Validate guest form submission
 */
export async function validateGuestSubmission(
  pageId: string,
  email: string,
  ipAddress: string
): Promise<{ valid: boolean; reason?: string }> {
  // Check rate limit
  if (isRateLimited(ipAddress)) {
    return { valid: false, reason: 'Rate limit exceeded. Please try again later.' }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Invalid email address' }
  }

  // Check if page allows guest submissions
  const db = await getDatabase()
  const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

  const page = await pagesCollection.findOne({
    _id: new ObjectId(pageId),
    status: 'published',
    isPublic: true,
  })

  if (!page) {
    return { valid: false, reason: 'Page not found or not public' }
  }

  return { valid: true }
}
