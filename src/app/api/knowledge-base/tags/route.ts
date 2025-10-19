import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KnowledgeBaseService } from '@/lib/services/knowledge-base'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tags = await KnowledgeBaseService.getTags(session.user.orgId)

    return NextResponse.json({
      success: true,
      data: tags,
    })
  } catch (error) {
    console.error('Get tags error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}
