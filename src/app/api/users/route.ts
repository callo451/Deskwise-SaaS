import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserService } from '@/lib/services/users'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'technician', 'user']),
  phone: z.string().optional(),
  title: z.string().optional(),
  department: z.string().optional(),
})

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
    const role = searchParams.get('role') as any
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const filters: any = {}
    if (role) filters.role = role
    if (isActive !== null) filters.isActive = isActive === 'true'
    if (search) filters.search = search

    const users = await UserService.getUsers(session.user.orgId, filters)

    // Remove password from response
    const sanitizedUsers = users.map(({ password, ...user }) => user)

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
    })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Generate temporary password (user will be prompted to change)
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

    const user = await UserService.createUser({
      ...validatedData,
      password: tempPassword,
      orgId: session.user.orgId,
      createdBy: session.user.id,
    })

    // Remove password from response
    const { password, ...sanitizedUser } = user

    return NextResponse.json({
      success: true,
      data: {
        user: sanitizedUser,
        temporaryPassword: tempPassword,
      },
      message: 'User created successfully',
    })
  } catch (error) {
    console.error('Create user error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
