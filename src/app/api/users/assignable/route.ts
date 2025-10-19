import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserService } from '@/lib/services/users'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all active users who can be assigned tickets (admins and technicians)
    const users = await UserService.getUsers(session.user.orgId, {
      isActive: true,
    })

    // Filter to only admins and technicians
    const assignableUsers = users.filter(u => u.role === 'admin' || u.role === 'technician')

    // Get ticket counts for each user
    const client = await clientPromise
    const db = client.db('deskwise')
    const tickets = db.collection('tickets')

    const usersWithWorkload = await Promise.all(
      assignableUsers.map(async (user) => {
        const openTicketsCount = await tickets.countDocuments({
          orgId: session.user.orgId,
          assignedTo: user._id.toString(),
          status: { $in: ['new', 'open', 'pending'] },
        })

        const totalTicketsCount = await tickets.countDocuments({
          orgId: session.user.orgId,
          assignedTo: user._id.toString(),
        })

        // Remove password from response
        const { password, ...sanitizedUser } = user

        return {
          ...sanitizedUser,
          workload: {
            openTickets: openTicketsCount,
            totalTickets: totalTicketsCount,
          },
        }
      })
    )

    // Sort by role (admins first, then technicians) and then by name
    usersWithWorkload.sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === 'admin' ? -1 : 1
      }
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    })

    return NextResponse.json({
      success: true,
      data: usersWithWorkload,
    })
  } catch (error) {
    console.error('Get assignable users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignable users' },
      { status: 500 }
    )
  }
}
