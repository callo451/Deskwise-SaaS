import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserService } from './services/users'
import { PermissionService } from './services/permissions'
import { OrganizationService } from './services/organizations'
import { UserRole } from './types'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        try {
          const user = await UserService.authenticateUserByEmail(
            credentials.email,
            credentials.password
          )

          if (!user) {
            throw new Error('Invalid email or password')
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            orgId: user.orgId,
            avatar: user.avatar,
            roleId: user.roleId,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw new Error('Authentication failed')
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id
        token.role = user.role
        token.orgId = user.orgId
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.avatar = user.avatar
        token.roleId = user.roleId

        // Fetch and cache user permissions in JWT token
        try {
          const permissions = await PermissionService.getUserPermissions(
            user.id,
            user.orgId
          )
          token.permissions = permissions
        } catch (error) {
          console.error('Failed to fetch user permissions:', error)
          token.permissions = []
        }

        // Fetch organization mode
        try {
          const org = await OrganizationService.getOrganizationById(user.orgId)
          token.orgMode = org?.mode || 'internal'
        } catch (error) {
          console.error('Failed to fetch organization mode:', error)
          token.orgMode = 'internal'
        }
      }

      // Ensure permissions exist (for existing tokens)
      if (!token.permissions) {
        token.permissions = []
      }

      // Ensure orgMode exists (for existing tokens)
      if (!token.orgMode) {
        token.orgMode = 'internal'
      }

      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.orgId = token.orgId as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.avatar = token.avatar as string | undefined
        session.user.roleId = token.roleId as string | undefined
        session.user.permissions = token.permissions as string[] | undefined
        session.user.orgMode = token.orgMode as 'msp' | 'internal'
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
