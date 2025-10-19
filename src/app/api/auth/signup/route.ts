import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/users'
import { OrganizationService } from '@/lib/services/organizations'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  organizationName: z.string().min(1, 'Organization name is required'),
  mode: z.enum(['msp', 'internal']),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = signupSchema.parse(body)

    // Create organization first
    const organization = await OrganizationService.createOrganization({
      name: validatedData.organizationName,
      mode: validatedData.mode,
    })

    // Create admin user
    const user = await UserService.createUser({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: 'admin', // First user is always admin
      orgId: organization._id.toString(),
      createdBy: 'system',
    })

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      data: {
        userId: user._id.toString(),
        orgId: organization._id.toString(),
      },
    })
  } catch (error) {
    console.error('Signup error:', error)

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
        {
          success: false,
          error: error.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create account',
      },
      { status: 500 }
    )
  }
}
