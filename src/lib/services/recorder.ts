import { ObjectId } from 'mongodb'
import clientPromise, { COLLECTIONS } from '@/lib/mongodb'
import type {
  RecordingSession,
  RecordingStep,
  RecorderScreenshot,
  RecordingSessionStatus,
} from '@/lib/types'

export class RecorderService {
  // ============================================
  // Session Management
  // ============================================

  /**
   * Create a new recording session
   */
  static async createSession(
    orgId: string,
    userId: string,
    data: {
      sessionId: string
      url: string
      title: string
      description?: string
    }
  ): Promise<RecordingSession> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    const now = new Date()
    const session: RecordingSession = {
      _id: new ObjectId(),
      orgId,
      userId,
      sessionId: data.sessionId,
      url: data.url,
      title: data.title,
      description: data.description,
      status: 'recording',
      stepCount: 0,
      duration: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    }

    await collection.insertOne(session)
    return session
  }

  /**
   * Get a recording session by sessionId
   */
  static async getSession(
    sessionId: string,
    orgId: string
  ): Promise<RecordingSession | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    return await collection.findOne({
      sessionId,
      orgId,
      isActive: true,
    })
  }

  /**
   * Get session by MongoDB _id
   */
  static async getSessionById(
    id: string,
    orgId: string
  ): Promise<RecordingSession | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    return await collection.findOne({
      _id: new ObjectId(id),
      orgId,
      isActive: true,
    })
  }

  /**
   * Update a recording session
   */
  static async updateSession(
    sessionId: string,
    orgId: string,
    updates: {
      title?: string
      description?: string
      status?: RecordingSessionStatus
      duration?: number
      stepCount?: number
    }
  ): Promise<RecordingSession | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    const result = await collection.findOneAndUpdate(
      { sessionId, orgId, isActive: true },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * List recording sessions
   */
  static async listSessions(
    orgId: string,
    userId?: string,
    status?: RecordingSessionStatus
  ): Promise<RecordingSession[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    const query: any = { orgId, isActive: true }
    if (userId) query.userId = userId
    if (status) query.status = status

    return await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Delete a recording session (soft delete)
   */
  static async deleteSession(
    sessionId: string,
    orgId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    const result = await collection.updateOne(
      { sessionId, orgId },
      { $set: { isActive: false, updatedAt: new Date() } }
    )

    return result.modifiedCount > 0
  }

  /**
   * Link session to generated article
   */
  static async linkArticle(
    sessionId: string,
    orgId: string,
    articleId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    const result = await collection.updateOne(
      { sessionId, orgId, isActive: true },
      { $set: { articleId, updatedAt: new Date() } }
    )

    return result.modifiedCount > 0
  }

  // ============================================
  // Step Management
  // ============================================

  /**
   * Add a step to a recording session
   */
  static async addStep(
    sessionId: string,
    orgId: string,
    data: {
      stepNumber: number
      action: string
      description: string
      selector?: string
      value?: string
      element?: any
      viewport?: any
      coordinates?: any
      screenshotId?: string
      timestamp: number
      url?: string
    }
  ): Promise<RecordingStep> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const stepCollection = db.collection<RecordingStep>(COLLECTIONS.RECORDING_STEPS)
    const sessionCollection = db.collection<RecordingSession>(
      COLLECTIONS.RECORDING_SESSIONS
    )

    const step: RecordingStep = {
      _id: new ObjectId(),
      sessionId,
      orgId,
      stepNumber: data.stepNumber,
      action: data.action as any,
      description: data.description,
      selector: data.selector,
      value: data.value,
      element: data.element,
      viewport: data.viewport,
      coordinates: data.coordinates,
      screenshotId: data.screenshotId,
      timestamp: data.timestamp,
      url: data.url,
      createdAt: new Date(),
    }

    // Insert step
    await stepCollection.insertOne(step)

    // Increment step count in session
    await sessionCollection.updateOne(
      { sessionId, orgId },
      { $inc: { stepCount: 1 }, $set: { updatedAt: new Date() } }
    )

    return step
  }

  /**
   * Get all steps for a session
   */
  static async getSteps(
    sessionId: string,
    orgId: string
  ): Promise<RecordingStep[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingStep>(COLLECTIONS.RECORDING_STEPS)

    return await collection
      .find({ sessionId, orgId })
      .sort({ stepNumber: 1 })
      .toArray()
  }

  /**
   * Update a step
   */
  static async updateStep(
    stepId: string,
    orgId: string,
    updates: {
      description?: string
      selector?: string
      value?: string
      screenshotId?: string
    }
  ): Promise<RecordingStep | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingStep>(COLLECTIONS.RECORDING_STEPS)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(stepId), orgId },
      { $set: updates },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete a step
   */
  static async deleteStep(
    stepId: string,
    orgId: string,
    sessionId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const stepCollection = db.collection<RecordingStep>(COLLECTIONS.RECORDING_STEPS)
    const sessionCollection = db.collection<RecordingSession>(
      COLLECTIONS.RECORDING_SESSIONS
    )

    // Delete step
    const result = await stepCollection.deleteOne({
      _id: new ObjectId(stepId),
      orgId,
    })

    // Decrement step count if step was deleted
    if (result.deletedCount > 0) {
      await sessionCollection.updateOne(
        { sessionId, orgId },
        { $inc: { stepCount: -1 }, $set: { updatedAt: new Date() } }
      )
    }

    return result.deletedCount > 0
  }

  // ============================================
  // Screenshot Management
  // ============================================

  /**
   * Save screenshot metadata (actual file is saved separately)
   */
  static async saveScreenshotMetadata(
    sessionId: string,
    stepNumber: number,
    orgId: string,
    data: {
      filename: string
      url: string
      width: number
      height: number
      contentType: string
      size: number
      annotations?: any[]
    }
  ): Promise<RecorderScreenshot> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecorderScreenshot>(
      COLLECTIONS.RECORDER_SCREENSHOTS
    )

    const screenshot: RecorderScreenshot = {
      _id: new ObjectId(),
      sessionId,
      stepNumber,
      orgId,
      filename: data.filename,
      url: data.url,
      width: data.width,
      height: data.height,
      contentType: data.contentType,
      size: data.size,
      annotations: data.annotations,
      createdAt: new Date(),
    }

    await collection.insertOne(screenshot)
    return screenshot
  }

  /**
   * Get screenshot by ID
   */
  static async getScreenshot(
    screenshotId: string,
    orgId: string
  ): Promise<RecorderScreenshot | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecorderScreenshot>(
      COLLECTIONS.RECORDER_SCREENSHOTS
    )

    return await collection.findOne({
      _id: new ObjectId(screenshotId),
      orgId,
    })
  }

  /**
   * Get all screenshots for a session
   */
  static async getSessionScreenshots(
    sessionId: string,
    orgId: string
  ): Promise<RecorderScreenshot[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecorderScreenshot>(
      COLLECTIONS.RECORDER_SCREENSHOTS
    )

    return await collection
      .find({ sessionId, orgId })
      .sort({ stepNumber: 1 })
      .toArray()
  }

  /**
   * Delete screenshot
   */
  static async deleteScreenshot(
    screenshotId: string,
    orgId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecorderScreenshot>(
      COLLECTIONS.RECORDER_SCREENSHOTS
    )

    const result = await collection.deleteOne({
      _id: new ObjectId(screenshotId),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Update screenshot annotations
   */
  static async updateAnnotations(
    screenshotId: string,
    orgId: string,
    annotations: any[]
  ): Promise<RecorderScreenshot | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecorderScreenshot>(
      COLLECTIONS.RECORDER_SCREENSHOTS
    )

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(screenshotId), orgId },
      { $set: { annotations } },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Update screenshot metadata (URL, annotations, edited status, etc.)
   */
  static async updateScreenshot(
    screenshotId: string,
    orgId: string,
    updates: {
      url?: string
      annotations?: any[]
      edited?: boolean
      editedBy?: string
      editedAt?: Date
    }
  ): Promise<RecorderScreenshot | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecorderScreenshot>(
      COLLECTIONS.RECORDER_SCREENSHOTS
    )

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(screenshotId), orgId },
      { $set: updates },
      { returnDocument: 'after' }
    )

    return result
  }

  // ============================================
  // Statistics & Analytics
  // ============================================

  /**
   * Get recording statistics for an organization
   */
  static async getRecordingStats(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    const stats = await collection
      .aggregate([
        { $match: { orgId, isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            recording: {
              $sum: { $cond: [{ $eq: ['$status', 'recording'] }, 1, 0] },
            },
            totalSteps: { $sum: '$stepCount' },
            avgSteps: { $avg: '$stepCount' },
            avgDuration: { $avg: '$duration' },
          },
        },
      ])
      .toArray()

    if (stats.length === 0) {
      return {
        total: 0,
        completed: 0,
        recording: 0,
        totalSteps: 0,
        avgSteps: 0,
        avgDuration: 0,
      }
    }

    return stats[0]
  }

  /**
   * Auto-archive completed sessions older than specified days
   * Keeps sessions with linked articles for audit purposes
   * @param orgId - Organization ID
   * @param daysOld - Archive sessions older than this many days (default: 30)
   * @returns Number of sessions archived
   */
  static async autoArchiveOldSessions(
    orgId: string,
    daysOld: number = 30
  ): Promise<number> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    // Calculate the cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Archive completed sessions that:
    // 1. Are older than cutoffDate
    // 2. Are completed (not recording or paused)
    // 3. Have a linked article (articleId exists)
    const result = await collection.updateMany(
      {
        orgId,
        status: 'completed',
        createdAt: { $lt: cutoffDate },
        articleId: { $exists: true, $ne: null },
        isActive: true,
      },
      {
        $set: {
          status: 'archived',
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount
  }

  /**
   * Get sessions eligible for auto-archive
   * @param orgId - Organization ID
   * @param daysOld - Check sessions older than this many days (default: 30)
   * @returns Count of sessions that would be archived
   */
  static async getArchivableSessionsCount(
    orgId: string,
    daysOld: number = 30
  ): Promise<number> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<RecordingSession>(COLLECTIONS.RECORDING_SESSIONS)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return await collection.countDocuments({
      orgId,
      status: 'completed',
      createdAt: { $lt: cutoffDate },
      articleId: { $exists: true, $ne: null },
      isActive: true,
    })
  }
}
