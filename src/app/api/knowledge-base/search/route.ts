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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const visibility = searchParams.get('visibility')

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      )
    }

    const articles = await KnowledgeBaseService.searchArticles(
      session.user.orgId,
      query,
      visibility as any
    )

    return NextResponse.json({
      success: true,
      data: articles,
    })
  } catch (error) {
    console.error('Search articles error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search articles' },
      { status: 500 }
    )
  }
}
