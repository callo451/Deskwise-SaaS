import 'next-auth'
import { UserRole } from '@/lib/types'

declare module 'next-auth' {
  interface User {
    id: string
    role: UserRole
    orgId: string
    firstName: string
    lastName: string
    avatar?: string
    roleId?: string
    permissions?: string[]
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      orgId: string
      firstName: string
      lastName: string
      avatar?: string
      roleId?: string
      permissions?: string[]
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    orgId: string
    firstName: string
    lastName: string
    avatar?: string
    roleId?: string
    permissions?: string[]
  }
}
