import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ReportBuilderService, ReportQuery } from './report-builder'
import { ExportService, ExportFormat } from './export-service'

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly'

export interface ReportSchedule {
  _id?: ObjectId
  orgId: string
  reportId: string
  reportName: string
  enabled: boolean
  frequency: ScheduleFrequency
  dayOfWeek?: number // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number // 1-31 for monthly
  time: string // HH:mm format (e.g., "09:00")
  timezone: string
  recipients: string[] // Email addresses
  formats: ExportFormat[] // ['pdf', 'excel', 'csv']
  query: ReportQuery
  lastRun?: Date
  nextRun?: Date
  runCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ScheduledReportExecution {
  _id?: ObjectId
  scheduleId: string
  orgId: string
  reportName: string
  executedAt: Date
  status: 'success' | 'failed'
  error?: string
  recipientCount: number
  executionTimeMs: number
  resultCount: number
}

/**
 * Report Scheduler Service
 * Manages scheduled report execution and email distribution
 */
export class ReportSchedulerService {
  /**
   * Create a new scheduled report
   */
  static async createSchedule(
    schedule: Omit<ReportSchedule, '_id' | 'createdAt' | 'updatedAt' | 'runCount' | 'lastRun'>
  ): Promise<ReportSchedule> {
    const db = await getDatabase()
    const collection = db.collection('report_schedules')

    const now = new Date()
    const newSchedule: ReportSchedule = {
      ...schedule,
      runCount: 0,
      nextRun: this.calculateNextRun(schedule),
      createdAt: now,
      updatedAt: now,
    }

    const result = await collection.insertOne(newSchedule as any)

    return {
      ...newSchedule,
      _id: result.insertedId,
    }
  }

  /**
   * Update a scheduled report
   */
  static async updateSchedule(
    scheduleId: string,
    updates: Partial<ReportSchedule>
  ): Promise<void> {
    const db = await getDatabase()
    const collection = db.collection('report_schedules')

    // If schedule timing changed, recalculate next run
    if (
      updates.frequency ||
      updates.dayOfWeek !== undefined ||
      updates.dayOfMonth !== undefined ||
      updates.time
    ) {
      const currentSchedule = await collection.findOne({
        _id: new ObjectId(scheduleId),
      })

      if (currentSchedule) {
        const mergedSchedule = { ...currentSchedule, ...updates }
        updates.nextRun = this.calculateNextRun(mergedSchedule as ReportSchedule)
      }
    }

    await collection.updateOne(
      { _id: new ObjectId(scheduleId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Delete a scheduled report
   */
  static async deleteSchedule(scheduleId: string): Promise<void> {
    const db = await getDatabase()
    const collection = db.collection('report_schedules')

    await collection.deleteOne({ _id: new ObjectId(scheduleId) })
  }

  /**
   * Get all schedules for an organization
   */
  static async getSchedules(orgId: string): Promise<ReportSchedule[]> {
    const db = await getDatabase()
    const collection = db.collection('report_schedules')

    const schedules = await collection
      .find({ orgId })
      .sort({ createdAt: -1 })
      .toArray()

    return schedules as ReportSchedule[]
  }

  /**
   * Get schedules that are due to run
   */
  static async getDueSchedules(): Promise<ReportSchedule[]> {
    const db = await getDatabase()
    const collection = db.collection('report_schedules')

    const now = new Date()

    const schedules = await collection
      .find({
        enabled: true,
        nextRun: { $lte: now },
      })
      .toArray()

    return schedules as ReportSchedule[]
  }

  /**
   * Execute a scheduled report
   */
  static async executeSchedule(scheduleId: string): Promise<void> {
    const startTime = Date.now()
    const db = await getDatabase()
    const schedulesCollection = db.collection('report_schedules')
    const executionsCollection = db.collection('report_executions')

    // Get schedule
    const schedule = (await schedulesCollection.findOne({
      _id: new ObjectId(scheduleId),
    })) as ReportSchedule | null

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`)
    }

    try {
      // Execute query
      const result = await ReportBuilderService.executeQuery(
        schedule.orgId,
        schedule.query
      )

      // Generate exports for each format
      const exports: Array<{
        format: ExportFormat
        data: string | Buffer
        filename: string
      }> = []

      for (const format of schedule.formats) {
        const columns = schedule.query.columns.map((col) => ({
          key: col,
          label: col,
          type: 'string' as const,
        }))

        const exportResult = await ExportService.export(
          result.data,
          columns,
          {
            format,
            filename: `${schedule.reportName}-${new Date().toISOString().split('T')[0]}.${format}`,
            title: schedule.reportName,
          }
        )

        exports.push({
          format,
          data: exportResult.data,
          filename: exportResult.filename,
        })
      }

      // Send emails (placeholder - would integrate with email service)
      // await this.sendReportEmails(schedule, exports)

      // Log execution
      const execution: ScheduledReportExecution = {
        scheduleId: scheduleId,
        orgId: schedule.orgId,
        reportName: schedule.reportName,
        executedAt: new Date(),
        status: 'success',
        recipientCount: schedule.recipients.length,
        executionTimeMs: Date.now() - startTime,
        resultCount: result.data.length,
      }

      await executionsCollection.insertOne(execution as any)

      // Update schedule
      await schedulesCollection.updateOne(
        { _id: new ObjectId(scheduleId) },
        {
          $set: {
            lastRun: new Date(),
            nextRun: this.calculateNextRun(schedule),
            updatedAt: new Date(),
          },
          $inc: { runCount: 1 },
        }
      )
    } catch (error: any) {
      // Log failed execution
      const execution: ScheduledReportExecution = {
        scheduleId: scheduleId,
        orgId: schedule.orgId,
        reportName: schedule.reportName,
        executedAt: new Date(),
        status: 'failed',
        error: error.message,
        recipientCount: 0,
        executionTimeMs: Date.now() - startTime,
        resultCount: 0,
      }

      await executionsCollection.insertOne(execution as any)

      throw error
    }
  }

  /**
   * Calculate next run time for a schedule
   */
  private static calculateNextRun(schedule: ReportSchedule): Date {
    const now = new Date()
    const [hours, minutes] = schedule.time.split(':').map(Number)

    let nextRun = new Date()
    nextRun.setHours(hours, minutes, 0, 0)

    switch (schedule.frequency) {
      case 'daily':
        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
        break

      case 'weekly':
        // Find next occurrence of the specified day of week
        const targetDay = schedule.dayOfWeek || 0
        const currentDay = nextRun.getDay()
        let daysUntilTarget = targetDay - currentDay

        if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
          daysUntilTarget += 7
        }

        nextRun.setDate(nextRun.getDate() + daysUntilTarget)
        break

      case 'monthly':
        // Schedule for the specified day of month
        const targetDate = schedule.dayOfMonth || 1
        nextRun.setDate(targetDate)

        // If date has passed this month, schedule for next month
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }

        // Handle months with fewer days (e.g., Feb 30 -> Feb 28)
        if (nextRun.getDate() !== targetDate) {
          nextRun.setDate(0) // Set to last day of previous month
        }
        break
    }

    return nextRun
  }

  /**
   * Get execution history for a schedule
   */
  static async getExecutionHistory(
    scheduleId: string,
    limit: number = 50
  ): Promise<ScheduledReportExecution[]> {
    const db = await getDatabase()
    const collection = db.collection('report_executions')

    const executions = await collection
      .find({ scheduleId })
      .sort({ executedAt: -1 })
      .limit(limit)
      .toArray()

    return executions as ScheduledReportExecution[]
  }

  /**
   * Placeholder for sending report emails
   * In production, this would integrate with your email service
   */
  private static async sendReportEmails(
    schedule: ReportSchedule,
    exports: Array<{ format: ExportFormat; data: any; filename: string }>
  ): Promise<void> {
    // TODO: Integrate with email service
    // For each recipient:
    // 1. Compose email with report name and execution time
    // 2. Attach exports as files
    // 3. Send email
    console.log(`Would send report to ${schedule.recipients.length} recipients`)
  }
}
