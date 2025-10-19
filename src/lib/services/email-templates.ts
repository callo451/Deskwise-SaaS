import { ObjectId } from 'mongodb'
import Handlebars from 'handlebars'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { NotificationTemplate, NotificationEvent } from '@/lib/types'

/**
 * TemplateService
 *
 * Manages email notification templates with Handlebars rendering.
 * Handles template CRUD operations, rendering, and validation.
 */
export class TemplateService {
  /**
   * Create a new notification template
   *
   * @param orgId - Organization ID
   * @param createdBy - User ID who created the template
   * @param templateData - Template data
   * @returns Created template
   */
  static async createTemplate(
    orgId: string,
    createdBy: string,
    templateData: {
      name: string
      description: string
      subject: string
      htmlBody: string
      textBody?: string
      event: NotificationEvent
      availableVariables: string[]
      previewData?: Record<string, any>
    }
  ): Promise<NotificationTemplate> {
    const db = await getDatabase()
    const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

    // Validate template syntax
    try {
      Handlebars.compile(templateData.subject)
      Handlebars.compile(templateData.htmlBody)
      if (templateData.textBody) {
        Handlebars.compile(templateData.textBody)
      }
    } catch (error: any) {
      throw new Error(`Invalid template syntax: ${error.message}`)
    }

    const now = new Date()
    const template: Omit<NotificationTemplate, '_id'> = {
      orgId,
      name: templateData.name,
      description: templateData.description,
      subject: templateData.subject,
      htmlBody: templateData.htmlBody,
      textBody: templateData.textBody,
      availableVariables: templateData.availableVariables,
      event: templateData.event,
      isSystem: false,
      isActive: true,
      usageCount: 0,
      previewData: templateData.previewData,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await templatesCollection.insertOne(template as NotificationTemplate)

    return {
      ...template,
      _id: result.insertedId,
    } as NotificationTemplate
  }

  /**
   * Update an existing template
   *
   * @param templateId - Template ID
   * @param orgId - Organization ID
   * @param updates - Fields to update
   * @returns Updated template or null
   */
  static async updateTemplate(
    templateId: string,
    orgId: string,
    updates: {
      name?: string
      description?: string
      subject?: string
      htmlBody?: string
      textBody?: string
      availableVariables?: string[]
      isActive?: boolean
      previewData?: Record<string, any>
    }
  ): Promise<NotificationTemplate | null> {
    const db = await getDatabase()
    const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

    // Validate template syntax if updating content
    if (updates.subject || updates.htmlBody || updates.textBody) {
      try {
        if (updates.subject) Handlebars.compile(updates.subject)
        if (updates.htmlBody) Handlebars.compile(updates.htmlBody)
        if (updates.textBody) Handlebars.compile(updates.textBody)
      } catch (error: any) {
        throw new Error(`Invalid template syntax: ${error.message}`)
      }
    }

    const result = await templatesCollection.findOneAndUpdate(
      { _id: new ObjectId(templateId), orgId, isSystem: false },
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
   * Delete a template
   *
   * @param templateId - Template ID
   * @param orgId - Organization ID
   * @returns True if deleted successfully
   */
  static async deleteTemplate(templateId: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

    // Don't allow deleting system templates
    const result = await templatesCollection.deleteOne({
      _id: new ObjectId(templateId),
      orgId,
      isSystem: false,
    })

    return result.deletedCount > 0
  }

  /**
   * Get a template by ID
   *
   * @param templateId - Template ID
   * @param orgId - Organization ID
   * @returns Template or null
   */
  static async getTemplate(
    templateId: string,
    orgId: string
  ): Promise<NotificationTemplate | null> {
    const db = await getDatabase()
    const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

    return await templatesCollection.findOne({
      _id: new ObjectId(templateId),
      orgId,
    })
  }

  /**
   * Get all templates for an organization
   *
   * @param orgId - Organization ID
   * @param filters - Optional filters
   * @returns Array of templates
   */
  static async getTemplates(
    orgId: string,
    filters?: {
      event?: NotificationEvent
      isActive?: boolean
      isSystem?: boolean
    }
  ): Promise<NotificationTemplate[]> {
    const db = await getDatabase()
    const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

    const query: any = { orgId }

    if (filters?.event) {
      query.event = filters.event
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive
    }

    if (filters?.isSystem !== undefined) {
      query.isSystem = filters.isSystem
    }

    return await templatesCollection
      .find(query)
      .sort({ isSystem: -1, name: 1 })
      .toArray()
  }

  /**
   * Render a template with variables
   *
   * @param templateId - Template ID
   * @param orgId - Organization ID
   * @param variables - Variables to substitute
   * @returns Rendered subject, HTML body, and text body
   */
  static async renderTemplate(
    templateId: string,
    orgId: string,
    variables: Record<string, any>
  ): Promise<{
    subject: string
    htmlBody: string
    textBody?: string
  }> {
    const template = await this.getTemplate(templateId, orgId)

    if (!template) {
      throw new Error('Template not found')
    }

    if (!template.isActive) {
      throw new Error('Template is not active')
    }

    try {
      // Compile templates
      const subjectTemplate = Handlebars.compile(template.subject)
      const htmlTemplate = Handlebars.compile(template.htmlBody)
      const textTemplate = template.textBody ? Handlebars.compile(template.textBody) : null

      // Render with variables
      const rendered = {
        subject: subjectTemplate(variables),
        htmlBody: htmlTemplate(variables),
        textBody: textTemplate ? textTemplate(variables) : undefined,
      }

      // Update usage count
      await this.incrementUsageCount(templateId, orgId)

      return rendered
    } catch (error: any) {
      console.error('Template rendering error:', error)
      throw new Error(`Failed to render template: ${error.message}`)
    }
  }

  /**
   * Render template with custom content (for preview without saving)
   *
   * @param subject - Subject template
   * @param htmlBody - HTML body template
   * @param textBody - Text body template (optional)
   * @param variables - Variables to substitute
   * @returns Rendered content
   */
  static renderCustomTemplate(
    subject: string,
    htmlBody: string,
    textBody: string | undefined,
    variables: Record<string, any>
  ): {
    subject: string
    htmlBody: string
    textBody?: string
  } {
    try {
      const subjectTemplate = Handlebars.compile(subject)
      const htmlTemplate = Handlebars.compile(htmlBody)
      const textTemplate = textBody ? Handlebars.compile(textBody) : null

      return {
        subject: subjectTemplate(variables),
        htmlBody: htmlTemplate(variables),
        textBody: textTemplate ? textTemplate(variables) : undefined,
      }
    } catch (error: any) {
      throw new Error(`Failed to render template: ${error.message}`)
    }
  }

  /**
   * Validate template syntax
   *
   * @param subject - Subject template
   * @param htmlBody - HTML body template
   * @param textBody - Text body template (optional)
   * @returns Validation result
   */
  static validateTemplate(
    subject: string,
    htmlBody: string,
    textBody?: string
  ): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    try {
      Handlebars.compile(subject)
    } catch (error: any) {
      errors.push(`Subject: ${error.message}`)
    }

    try {
      Handlebars.compile(htmlBody)
    } catch (error: any) {
      errors.push(`HTML Body: ${error.message}`)
    }

    if (textBody) {
      try {
        Handlebars.compile(textBody)
      } catch (error: any) {
        errors.push(`Text Body: ${error.message}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Increment template usage count
   *
   * @param templateId - Template ID
   * @param orgId - Organization ID
   */
  private static async incrementUsageCount(templateId: string, orgId: string): Promise<void> {
    const db = await getDatabase()
    const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

    await templatesCollection.updateOne(
      { _id: new ObjectId(templateId), orgId },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: new Date() },
      }
    )
  }

  /**
   * Clone a template
   *
   * @param sourceTemplateId - Template ID to clone
   * @param orgId - Organization ID
   * @param newName - Name for the cloned template
   * @param createdBy - User ID who cloned the template
   * @returns Cloned template
   */
  static async cloneTemplate(
    sourceTemplateId: string,
    orgId: string,
    newName: string,
    createdBy: string
  ): Promise<NotificationTemplate> {
    const sourceTemplate = await this.getTemplate(sourceTemplateId, orgId)

    if (!sourceTemplate) {
      throw new Error('Source template not found')
    }

    return await this.createTemplate(orgId, createdBy, {
      name: newName,
      description: `${sourceTemplate.description} (Copy)`,
      subject: sourceTemplate.subject,
      htmlBody: sourceTemplate.htmlBody,
      textBody: sourceTemplate.textBody,
      event: sourceTemplate.event,
      availableVariables: sourceTemplate.availableVariables,
      previewData: sourceTemplate.previewData,
    })
  }

  /**
   * Seed default email templates for a new organization
   *
   * This is automatically called when a new organization is created.
   * Creates 9 production-ready email templates covering all major notification events.
   *
   * @param orgId - Organization ID
   * @returns Number of templates created
   */
  static async seedDefaultTemplates(orgId: string): Promise<number> {
    const db = await getDatabase()
    const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

    // Check if templates already exist
    const existingCount = await templatesCollection.countDocuments({ orgId })
    if (existingCount > 0) {
      console.log(`Organization ${orgId} already has ${existingCount} templates, skipping seeding`)
      return 0
    }

    const { getDefaultTemplates } = await import('@/lib/data/default-email-templates')
    const defaultTemplates = getDefaultTemplates()

    const now = new Date()
    const templatesToInsert = defaultTemplates.map(template => ({
      orgId,
      name: template.name,
      description: template.description,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      availableVariables: template.availableVariables,
      event: template.event,
      isSystem: true,
      isActive: true,
      usageCount: 0,
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
    }))

    const result = await templatesCollection.insertMany(templatesToInsert as NotificationTemplate[])

    console.log(`✅ Seeded ${result.insertedCount} default email templates for organization ${orgId}`)
    return result.insertedCount
  }
}
