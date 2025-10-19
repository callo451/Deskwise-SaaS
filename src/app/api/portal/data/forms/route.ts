import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

/**
 * GET /api/portal/data/forms
 * Get available form templates for portal block selection
 * Returns simplified data optimized for dropdowns
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('deskwise')

    // Fetch form templates
    const templates = await db
      .collection('form_templates')
      .find({
        orgId: session.user.orgId,
      })
      .project({
        _id: 1,
        name: 1,
        description: 1,
        category: 1,
        icon: 1,
        itilCategory: 1,
        isSystemTemplate: 1,
      })
      .sort({ name: 1 })
      .toArray()

    // Transform to dropdown-friendly format
    const simplified = templates.map(template => ({
      value: template._id.toString(),
      label: template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      itilCategory: template.itilCategory,
      isSystem: template.isSystemTemplate || false,
    }))

    return NextResponse.json(simplified)
  } catch (error: any) {
    console.error('Error fetching forms for portal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
