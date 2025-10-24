import { NextRequest, NextResponse } from 'next/server'
import { UserService } from '@/lib/services/users'
import { OrganizationService } from '@/lib/services/organizations'
import { RoleService } from '@/lib/services/roles'
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

    const orgId = organization._id.toString()

    // Automatically seed RBAC roles for the new organization
    let systemAdminRoleId: string | null = null
    try {
      await RoleService.seedDefaultRoles(orgId)
      console.log(`✅ RBAC roles seeded for organization: ${validatedData.organizationName}`)

      // Get the System Administrator role ID
      systemAdminRoleId = await RoleService.getDefaultRoleId(orgId, 'system_administrator')
    } catch (error) {
      console.error('Failed to seed RBAC roles during signup:', error)
      // Continue with user creation even if role seeding fails
      // User will be created with legacy 'admin' role
    }

    // Create admin user with System Administrator role
    const user = await UserService.createUser({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: 'admin', // Legacy role for backward compatibility
      roleId: systemAdminRoleId || undefined, // RBAC role ID (System Administrator)
      orgId,
      createdBy: 'system',
    })

    console.log(`✅ First user created as System Administrator for ${validatedData.organizationName}`)

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
