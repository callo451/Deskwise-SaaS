/**
 * Resource Management Service
 *
 * Handles resource allocation, capacity planning, and utilization tracking
 * for projects and tasks. Supports conflict detection and workload balancing.
 */

import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ResourceAllocation {
  _id?: ObjectId
  orgId: string
  userId: string
  userName: string
  userEmail: string
  resourceType: 'project' | 'task'
  projectId: string
  projectName: string
  taskId?: string
  taskName?: string
  allocatedHours: number // Total hours allocated
  startDate: Date
  endDate: Date
  allocationPercentage: number // 0-100 (e.g., 50% = part-time)
  role?: string // e.g., "Developer", "Designer", "Manager"
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  notes?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ResourceCapacity {
  userId: string
  userName: string
  userEmail: string
  availableHoursPerWeek: number
  currentAllocatedHours: number
  utilizationRate: number // percentage
  allocations: ResourceAllocation[]
  conflicts: ResourceConflict[]
}

export interface ResourceConflict {
  userId: string
  conflictDate: Date
  allocatedHours: number
  availableHours: number
  overallocationHours: number
  conflictingAllocations: Array<{
    projectName: string
    taskName?: string
    hours: number
  }>
}

export interface ResourceUtilization {
  userId: string
  userName: string
  period: {
    startDate: Date
    endDate: Date
  }
  plannedHours: number
  actualHours: number
  utilizationRate: number // actual / planned
  billableHours: number
  nonBillableHours: number
  projects: Array<{
    projectId: string
    projectName: string
    plannedHours: number
    actualHours: number
  }>
}

export interface TeamWorkload {
  totalMembers: number
  activeAllocations: number
  averageUtilization: number
  overallocatedMembers: number
  underutilizedMembers: number
  members: Array<{
    userId: string
    userName: string
    utilizationRate: number
    allocatedHours: number
    status: 'overallocated' | 'optimal' | 'underutilized'
  }>
}

// ============================================================================
// Resource Management Service
// ============================================================================

export class ResourceManagementService {
  /**
   * Create a new resource allocation
   */
  static async createAllocation(
    orgId: string,
    allocation: Omit<ResourceAllocation, '_id' | 'orgId' | 'createdAt' | 'updatedAt'>
  ): Promise<ResourceAllocation> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const newAllocation: ResourceAllocation = {
      ...allocation,
      orgId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('resource_allocations').insertOne(newAllocation)
    return { ...newAllocation, _id: result.insertedId }
  }

  /**
   * Update an existing resource allocation
   */
  static async updateAllocation(
    allocationId: string,
    orgId: string,
    updates: Partial<ResourceAllocation>
  ): Promise<ResourceAllocation | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('resource_allocations').findOneAndUpdate(
      { _id: new ObjectId(allocationId), orgId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    return result as ResourceAllocation | null
  }

  /**
   * Delete a resource allocation
   */
  static async deleteAllocation(
    allocationId: string,
    orgId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('resource_allocations').deleteOne({
      _id: new ObjectId(allocationId),
      orgId
    })

    return result.deletedCount > 0
  }

  /**
   * Get all allocations for a project
   */
  static async getProjectAllocations(
    projectId: string,
    orgId: string
  ): Promise<ResourceAllocation[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const allocations = await db.collection('resource_allocations')
      .find({ projectId, orgId })
      .sort({ startDate: 1 })
      .toArray()

    return allocations as ResourceAllocation[]
  }

  /**
   * Get all allocations for a user
   */
  static async getUserAllocations(
    userId: string,
    orgId: string,
    options?: {
      startDate?: Date
      endDate?: Date
      status?: ResourceAllocation['status']
    }
  ): Promise<ResourceAllocation[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { userId, orgId }

    if (options?.startDate || options?.endDate) {
      query.$or = [
        {
          startDate: {
            $gte: options.startDate,
            $lte: options.endDate
          }
        },
        {
          endDate: {
            $gte: options.startDate,
            $lte: options.endDate
          }
        }
      ]
    }

    if (options?.status) {
      query.status = options.status
    }

    const allocations = await db.collection('resource_allocations')
      .find(query)
      .sort({ startDate: 1 })
      .toArray()

    return allocations as ResourceAllocation[]
  }

  /**
   * Get resource capacity for a user
   */
  static async getResourceCapacity(
    userId: string,
    orgId: string,
    weekStartDate: Date
  ): Promise<ResourceCapacity> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get user info
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId), orgId })
    if (!user) {
      throw new Error('User not found')
    }

    // Calculate week end date
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 7)

    // Get allocations for this week
    const allocations = await this.getUserAllocations(userId, orgId, {
      startDate: weekStartDate,
      endDate: weekEndDate,
      status: 'active'
    })

    // Calculate total allocated hours for this week
    const totalAllocatedHours = allocations.reduce((sum, allocation) => {
      // Calculate hours per week based on total hours and duration
      const durationWeeks = Math.ceil(
        (allocation.endDate.getTime() - allocation.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      const hoursPerWeek = allocation.allocatedHours / durationWeeks
      return sum + hoursPerWeek
    }, 0)

    // Default available hours per week (40 hours = full-time)
    const availableHoursPerWeek = 40
    const utilizationRate = (totalAllocatedHours / availableHoursPerWeek) * 100

    // Detect conflicts (over-allocation)
    const conflicts: ResourceConflict[] = []
    if (totalAllocatedHours > availableHoursPerWeek) {
      conflicts.push({
        userId,
        conflictDate: weekStartDate,
        allocatedHours: totalAllocatedHours,
        availableHours: availableHoursPerWeek,
        overallocationHours: totalAllocatedHours - availableHoursPerWeek,
        conflictingAllocations: allocations.map(a => ({
          projectName: a.projectName,
          taskName: a.taskName,
          hours: a.allocatedHours / Math.ceil(
            (a.endDate.getTime() - a.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          )
        }))
      })
    }

    return {
      userId,
      userName: user.name || user.email,
      userEmail: user.email,
      availableHoursPerWeek,
      currentAllocatedHours: totalAllocatedHours,
      utilizationRate,
      allocations,
      conflicts
    }
  }

  /**
   * Get resource utilization for a user over a period
   */
  static async getResourceUtilization(
    userId: string,
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ResourceUtilization> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get user info
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId), orgId })
    if (!user) {
      throw new Error('User not found')
    }

    // Get allocations for period
    const allocations = await this.getUserAllocations(userId, orgId, {
      startDate,
      endDate
    })

    // Calculate planned hours
    const plannedHours = allocations.reduce((sum, a) => sum + a.allocatedHours, 0)

    // Get actual time entries for period
    const timeEntries = await db.collection('time_entries')
      .find({
        orgId,
        userId,
        createdAt: { $gte: startDate, $lte: endDate }
      })
      .toArray()

    const actualHours = timeEntries.reduce((sum: number, entry: any) => sum + (entry.totalMinutes / 60), 0)
    const billableHours = timeEntries
      .filter((entry: any) => entry.isBillable)
      .reduce((sum: number, entry: any) => sum + (entry.totalMinutes / 60), 0)
    const nonBillableHours = actualHours - billableHours

    // Group by project
    const projectMap = new Map<string, { projectId: string, projectName: string, plannedHours: number, actualHours: number }>()

    allocations.forEach(allocation => {
      if (!projectMap.has(allocation.projectId)) {
        projectMap.set(allocation.projectId, {
          projectId: allocation.projectId,
          projectName: allocation.projectName,
          plannedHours: 0,
          actualHours: 0
        })
      }
      const project = projectMap.get(allocation.projectId)!
      project.plannedHours += allocation.allocatedHours
    })

    timeEntries.forEach((entry: any) => {
      if (entry.projectId && projectMap.has(entry.projectId)) {
        const project = projectMap.get(entry.projectId)!
        project.actualHours += entry.totalMinutes / 60
      }
    })

    return {
      userId,
      userName: user.name || user.email,
      period: { startDate, endDate },
      plannedHours,
      actualHours,
      utilizationRate: plannedHours > 0 ? (actualHours / plannedHours) * 100 : 0,
      billableHours,
      nonBillableHours,
      projects: Array.from(projectMap.values())
    }
  }

  /**
   * Get team workload overview
   */
  static async getTeamWorkload(
    orgId: string,
    weekStartDate: Date
  ): Promise<TeamWorkload> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get all active users
    const users = await db.collection('users')
      .find({ orgId, isActive: true })
      .toArray()

    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekEndDate.getDate() + 7)

    // Get all active allocations for this week
    const allocations = await db.collection('resource_allocations')
      .find({
        orgId,
        status: 'active',
        $or: [
          { startDate: { $gte: weekStartDate, $lte: weekEndDate } },
          { endDate: { $gte: weekStartDate, $lte: weekEndDate } }
        ]
      })
      .toArray() as ResourceAllocation[]

    // Calculate metrics for each user
    const memberMetrics = await Promise.all(
      users.map(async (user) => {
        const userAllocations = allocations.filter(a => a.userId === user._id.toString())

        const allocatedHours = userAllocations.reduce((sum, allocation) => {
          const durationWeeks = Math.ceil(
            (allocation.endDate.getTime() - allocation.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          )
          return sum + (allocation.allocatedHours / durationWeeks)
        }, 0)

        const availableHours = 40 // Full-time
        const utilizationRate = (allocatedHours / availableHours) * 100

        let status: 'overallocated' | 'optimal' | 'underutilized'
        if (utilizationRate > 100) {
          status = 'overallocated'
        } else if (utilizationRate >= 70) {
          status = 'optimal'
        } else {
          status = 'underutilized'
        }

        return {
          userId: user._id.toString(),
          userName: user.name || user.email,
          utilizationRate,
          allocatedHours,
          status
        }
      })
    )

    // Calculate aggregate metrics
    const totalMembers = memberMetrics.length
    const activeAllocations = allocations.length
    const averageUtilization = totalMembers > 0
      ? memberMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) / totalMembers
      : 0
    const overallocatedMembers = memberMetrics.filter(m => m.status === 'overallocated').length
    const underutilizedMembers = memberMetrics.filter(m => m.status === 'underutilized').length

    return {
      totalMembers,
      activeAllocations,
      averageUtilization,
      overallocatedMembers,
      underutilizedMembers,
      members: memberMetrics
    }
  }

  /**
   * Check for allocation conflicts before creating/updating
   */
  static async checkAllocationConflicts(
    userId: string,
    orgId: string,
    startDate: Date,
    endDate: Date,
    allocatedHours: number,
    excludeAllocationId?: string
  ): Promise<ResourceConflict[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = {
      orgId,
      userId,
      status: 'active',
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        {
          $and: [
            { startDate: { $lte: startDate } },
            { endDate: { $gte: endDate } }
          ]
        }
      ]
    }

    if (excludeAllocationId) {
      query._id = { $ne: new ObjectId(excludeAllocationId) }
    }

    const existingAllocations = await db.collection('resource_allocations')
      .find(query)
      .toArray() as ResourceAllocation[]

    // Calculate duration in weeks
    const durationWeeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )
    const newHoursPerWeek = allocatedHours / durationWeeks

    // Calculate existing hours per week
    const existingHoursPerWeek = existingAllocations.reduce((sum, allocation) => {
      const allocationWeeks = Math.ceil(
        (allocation.endDate.getTime() - allocation.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      return sum + (allocation.allocatedHours / allocationWeeks)
    }, 0)

    const totalHoursPerWeek = existingHoursPerWeek + newHoursPerWeek
    const availableHours = 40 // Full-time

    const conflicts: ResourceConflict[] = []
    if (totalHoursPerWeek > availableHours) {
      conflicts.push({
        userId,
        conflictDate: startDate,
        allocatedHours: totalHoursPerWeek,
        availableHours,
        overallocationHours: totalHoursPerWeek - availableHours,
        conflictingAllocations: [
          ...existingAllocations.map(a => ({
            projectName: a.projectName,
            taskName: a.taskName,
            hours: a.allocatedHours / Math.ceil(
              (a.endDate.getTime() - a.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
            )
          })),
          {
            projectName: 'New Allocation',
            hours: newHoursPerWeek
          }
        ]
      })
    }

    return conflicts
  }

  /**
   * Get available resources (not over-allocated) for a time period
   */
  static async getAvailableResources(
    orgId: string,
    startDate: Date,
    endDate: Date,
    minAvailableHours: number = 10
  ): Promise<Array<{
    userId: string
    userName: string
    userEmail: string
    availableHours: number
    currentUtilization: number
  }>> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get all active users
    const users = await db.collection('users')
      .find({ orgId, isActive: true })
      .toArray()

    const availableResources = []

    for (const user of users) {
      const capacity = await this.getResourceCapacity(user._id.toString(), orgId, startDate)

      const availableHours = capacity.availableHoursPerWeek - capacity.currentAllocatedHours

      if (availableHours >= minAvailableHours) {
        availableResources.push({
          userId: user._id.toString(),
          userName: user.name || user.email,
          userEmail: user.email,
          availableHours,
          currentUtilization: capacity.utilizationRate
        })
      }
    }

    // Sort by most available hours
    return availableResources.sort((a, b) => b.availableHours - a.availableHours)
  }
}
