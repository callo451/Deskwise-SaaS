import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const category = searchParams.get('category') // optional filter
    const featured = searchParams.get('featured') // optional filter for featured articles

    const client = await clientPromise
    const db = client.db('deskwise')

    // Build query
    const query: any = {
      orgId: session.user.orgId,
      status: 'published' // Only show published articles in portal
    }

    if (category && category !== 'all') {
      query.category = category
    }

    if (featured === 'true') {
      query.featured = true
    }

    // Fetch KB articles
    const articles = await db.collection('kb_articles')
      .find(query)
      .sort({ featured: -1, viewCount: -1, createdAt: -1 }) // Featured first, then by views, then newest
      .limit(limit)
      .toArray()

    // Format articles for frontend
    const formattedArticles = articles.map(article => ({
      id: article._id.toString(),
      title: article.title || 'Untitled Article',
      summary: article.summary || article.content?.substring(0, 150) || '',
      content: article.content || '',
      category: article.category || 'General',
      tags: article.tags || [],
      author: article.author || article.authorName || 'Unknown',
      authorName: article.authorName || 'Unknown',
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      viewCount: article.viewCount || 0,
      helpful: article.helpful || 0,
      notHelpful: article.notHelpful || 0,
      featured: article.featured || false,
      slug: article.slug || article._id.toString(),
      attachments: article.attachments || []
    }))

    return NextResponse.json(formattedArticles)
  } catch (error) {
    console.error('Failed to fetch KB articles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
