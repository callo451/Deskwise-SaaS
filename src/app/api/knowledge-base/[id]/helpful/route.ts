import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { KnowledgeBaseService } from '@/lib/services/knowledge-base'

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

    const { id } = await params
    const body = await request.json()
    const { isHelpful } = body

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isHelpful must be a boolean' },
        { status: 400 }
      )
    }

    await KnowledgeBaseService.markHelpful(
      id,
      session.user.orgId,
      isHelpful
    )

    // Fetch updated article to return new counts
    const article = await KnowledgeBaseService.getArticleById(
      id,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: {
        helpful: article.helpful,
        notHelpful: article.notHelpful,
      },
      message: 'Feedback recorded',
    })
  } catch (error: any) {
    console.error('Error marking article helpful:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
