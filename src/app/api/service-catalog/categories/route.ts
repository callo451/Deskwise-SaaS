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

    const client = await clientPromise
    const db = client.db('deskwise')

    const categories = await db
      .collection('service_catalog_categories')
      .find({ orgId: session.user.orgId, isActive: true })
      .sort({ order: 1, name: 1 })
      .toArray()

    // Get service counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await db.collection('service_catalog').countDocuments({
          orgId: session.user.orgId,
          category: category.name,
          isActive: true,
        })
        return { ...category, serviceCount: count }
      })
    )

    return NextResponse.json(categoriesWithCounts)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const client = await clientPromise
    const db = client.db('deskwise')

    const category = {
      ...body,
      orgId: session.user.orgId,
      createdBy: session.user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    const result = await db
      .collection('service_catalog_categories')
      .insertOne(category)

    return NextResponse.json({
      success: true,
      data: { _id: result.insertedId, ...category },
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
