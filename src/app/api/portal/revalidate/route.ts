/**
 * On-Demand Revalidation API for Portal Pages
 * Allows invalidating ISR cache when pages are published
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and users with portal management permission can revalidate
    const isAdmin = session.user.role === 'admin'
    const hasPermission = session.user.permissions?.includes('portal.manage')

    if (!isAdmin && !hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get slug from request body
    const body = await req.json()
    const { slug } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Revalidate the portal page path
    const path = `/portal/${slug}`
    revalidatePath(path)

    return NextResponse.json({
      success: true,
      revalidated: true,
      path,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error revalidating portal page:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Revalidate all portal pages
 */
export async function DELETE(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can revalidate all pages
    const isAdmin = session.user.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Revalidate all portal pages
    revalidatePath('/portal/[...slug]', 'page')

    return NextResponse.json({
      success: true,
      revalidated: true,
      message: 'All portal pages revalidated',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error revalidating all portal pages:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
