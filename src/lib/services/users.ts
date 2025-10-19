import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { User, UserRole } from '@/lib/types'

export interface CreateUserInput {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  orgId: string
  createdBy?: string
  phone?: string
  title?: string
  department?: string
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  phone?: string
  title?: string
  department?: string
  role?: UserRole
  isActive?: boolean
}

export class UserService {
  /**
   * Create a new user with hashed password
   */
  static async createUser(input: CreateUserInput): Promise<User> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    // Check if user already exists
    const existing = await usersCollection.findOne({
      email: input.email.toLowerCase(),
      orgId: input.orgId
    })
    if (existing) {
      throw new Error('User with this email already exists in this organization')
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(input.password, 12)

    const now = new Date()
    const user: Omit<User, '_id'> = {
      email: input.email.toLowerCase(),
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      orgId: input.orgId,
      phone: input.phone,
      title: input.title,
      department: input.department,
      isActive: true,
      createdBy: input.createdBy || 'system',
      createdAt: now,
      updatedAt: now,
    }

    const result = await usersCollection.insertOne(user as User)

    return {
      ...user,
      _id: result.insertedId,
    } as User
  }

  /**
   * Authenticate user with email and password (with specific orgId)
   */
  static async authenticateUser(
    email: string,
    password: string,
    orgId: string
  ): Promise<User | null> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
      orgId,
      isActive: true,
    })

    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      }
    )

    return user
  }

  /**
   * Authenticate user with email and password only (finds user across all orgs)
   */
  static async authenticateUserByEmail(
    email: string,
    password: string
  ): Promise<User | null> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const user = await usersCollection.findOne({
      email: email.toLowerCase(),
      isActive: true,
    })

    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    // Update last login
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date()
        }
      }
    )

    return user
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string, orgId: string): Promise<User | null> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    return await usersCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(
    email: string,
    orgId: string
  ): Promise<User | null> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    return await usersCollection.findOne({
      email: email.toLowerCase(),
      orgId,
    })
  }

  /**
   * Get all users in an organization
   */
  static async getUsers(
    orgId: string,
    filters?: {
      role?: UserRole
      isActive?: boolean
      search?: string
    }
  ): Promise<User[]> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const query: any = { orgId }

    if (filters?.role) {
      query.role = filters.role
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive
    }

    if (filters?.search) {
      query.$or = [
        { firstName: { $regex: filters.search, $options: 'i' } },
        { lastName: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ]
    }

    return await usersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Update user
   */
  static async updateUser(
    id: string,
    orgId: string,
    updates: UpdateUserInput
  ): Promise<User | null> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  static async deleteUser(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Change user password
   */
  static async changePassword(
    id: string,
    orgId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const user = await usersCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    const result = await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }
}
