import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

const DEFAULT_CATEGORIES = [
  {
    name: 'Hardware',
    description: 'Computer, laptop, printer, and other hardware requests',
    icon: 'Monitor',
    color: '#3b82f6',
    order: 1,
  },
  {
    name: 'Software',
    description: 'Application installations, licenses, and software support',
    icon: 'Package',
    color: '#8b5cf6',
    order: 2,
  },
  {
    name: 'Access & Permissions',
    description: 'Account access, password resets, and permission requests',
    icon: 'Key',
    color: '#10b981',
    order: 3,
  },
  {
    name: 'Email & Communication',
    description: 'Email issues, distribution lists, and communication tools',
    icon: 'Mail',
    color: '#f59e0b',
    order: 4,
  },
  {
    name: 'Network & Connectivity',
    description: 'Internet, VPN, WiFi, and network-related issues',
    icon: 'Wifi',
    color: '#06b6d4',
    order: 5,
  },
  {
    name: 'Mobile Devices',
    description: 'Smartphones, tablets, and mobile device management',
    icon: 'Smartphone',
    color: '#ec4899',
    order: 6,
  },
  {
    name: 'Onboarding & Offboarding',
    description: 'New employee setup and departing employee processes',
    icon: 'UserPlus',
    color: '#6366f1',
    order: 7,
  },
  {
    name: 'Training & Documentation',
    description: 'IT training sessions and documentation requests',
    icon: 'BookOpen',
    color: '#14b8a6',
    order: 8,
  },
  {
    name: 'Security',
    description: 'Security concerns, incidents, and policy questions',
    icon: 'Shield',
    color: '#ef4444',
    order: 9,
  },
  {
    name: 'Other Services',
    description: 'General IT support and other service requests',
    icon: 'Wrench',
    color: '#64748b',
    order: 10,
  },
]

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('deskwise')

    // Check if categories already exist
    const existingCount = await db
      .collection('service_catalog_categories')
      .countDocuments({ orgId: session.user.orgId })

    if (existingCount > 0) {
      return NextResponse.json(
        { error: 'Categories already exist' },
        { status: 400 }
      )
    }

    const categories = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      orgId: session.user.orgId,
      createdBy: session.user.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }))

    await db.collection('service_catalog_categories').insertMany(categories)

    return NextResponse.json({ success: true, count: categories.length })
  } catch (error) {
    console.error('Error seeding categories:', error)
    return NextResponse.json(
      { error: 'Failed to seed categories' },
      { status: 500 }
    )
  }
}
