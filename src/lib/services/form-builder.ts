import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type {
  ServiceCatalogueItem,
  FormTemplate,
  FormField,
  FormSection,
  FormSchemaVersion,
  ConditionalRule,
} from '../types'

/**
 * Form Builder Service
 * Comprehensive service for managing service catalog forms with versioning, templates, and conditional logic
 */
export class FormBuilderService {
  /**
   * Create a new service catalog item with form builder
   */
  static async createService(
    orgId: string,
    createdBy: string,
    data: {
      name: string
      description: string
      shortDescription?: string
      category: string
      icon?: string
      tags?: string[]
      type: string
      estimatedTime?: string
      requiresApproval?: boolean
      availableFor?: string[]
      slaResponseTime?: number
      slaResolutionTime?: number
      itilCategory: 'service-request' | 'incident' | 'problem' | 'change' | 'general'
      requestType?: string
      templateId?: string // If creating from template
    }
  ): Promise<ServiceCatalogueItem> {
    const db = await getDatabase()
    const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    // If template ID provided, load template
    let initialFields: FormField[] = []
    let initialSections: FormSection[] = []

    if (data.templateId) {
      const template = await this.getTemplate(data.templateId, orgId)
      if (template) {
        initialFields = template.schema.fields
        initialSections = template.schema.sections
      }
    }

    const service: ServiceCatalogueItem = {
      _id: new ObjectId(),
      orgId,
      name: data.name,
      description: data.description,
      shortDescription: data.shortDescription,
      category: data.category,
      icon: data.icon || 'Wrench',
      tags: data.tags || [],
      isActive: true,
      type: data.type as any,
      defaultRate: 0,
      currency: 'USD',
      estimatedTime: data.estimatedTime,
      availableFor: data.availableFor as any,
      requiresApproval: data.requiresApproval || false,
      slaResponseTime: data.slaResponseTime,
      slaResolutionTime: data.slaResolutionTime,
      itilCategory: data.itilCategory,
      requestType: data.requestType,
      currentVersion: 1,
      formVersions: [
        {
          version: 1,
          createdAt: new Date(),
          createdBy,
          schema: {
            fields: initialFields,
            sections: initialSections,
          },
          isPublished: false,
        },
      ],
      templateId: data.templateId,
      popularity: 0,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await collection.insertOne(service)
    return service
  }

  /**
   * Get service with current form version
   */
  static async getService(serviceId: string, orgId: string): Promise<ServiceCatalogueItem | null> {
    const db = await getDatabase()
    const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    const service = await collection.findOne({
      _id: new ObjectId(serviceId),
      orgId,
    })

    return service
  }

  /**
   * Update service basic information (non-form fields)
   */
  static async updateServiceInfo(
    serviceId: string,
    orgId: string,
    updates: {
      name?: string
      description?: string
      shortDescription?: string
      category?: string
      icon?: string
      tags?: string[]
      estimatedTime?: string
      requiresApproval?: boolean
      slaResponseTime?: number
      slaResolutionTime?: number
      isActive?: boolean
    }
  ): Promise<ServiceCatalogueItem | null> {
    const db = await getDatabase()
    const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(serviceId), orgId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Update form schema (creates new version)
   */
  static async updateFormSchema(
    serviceId: string,
    orgId: string,
    updatedBy: string,
    schema: {
      fields: FormField[]
      sections: FormSection[]
    },
    changelog?: string
  ): Promise<ServiceCatalogueItem | null> {
    const db = await getDatabase()
    const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    const service = await this.getService(serviceId, orgId)
    if (!service) return null

    const newVersion: FormSchemaVersion = {
      version: service.currentVersion + 1,
      createdAt: new Date(),
      createdBy: updatedBy,
      changelog,
      schema,
      isPublished: false,
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(serviceId), orgId },
      {
        $set: {
          currentVersion: newVersion.version,
          updatedAt: new Date(),
        },
        $push: {
          formVersions: newVersion as any,
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Publish a form version
   */
  static async publishFormVersion(
    serviceId: string,
    orgId: string,
    version: number
  ): Promise<ServiceCatalogueItem | null> {
    const db = await getDatabase()
    const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    // Unpublish all versions first
    await collection.updateOne(
      { _id: new ObjectId(serviceId), orgId },
      {
        $set: {
          'formVersions.$[].isPublished': false,
        },
      }
    )

    // Publish the specific version
    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(serviceId),
        orgId,
        'formVersions.version': version,
      },
      {
        $set: {
          'formVersions.$.isPublished': true,
          'formVersions.$.publishedAt': new Date(),
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Evaluate conditional rules
   * Returns list of actions to apply based on form values
   */
  static evaluateConditionalRules(
    fields: FormField[],
    formValues: Record<string, any>
  ): Array<{ action: string; targetFieldIds: string[] }> {
    const actionsToApply: Array<{ action: string; targetFieldIds: string[] }> = []

    fields.forEach((field) => {
      if (field.conditionalRules && field.conditionalRules.length > 0) {
        const fieldValue = formValues[field.id]

        field.conditionalRules.forEach((rule) => {
          let conditionMet = false

          switch (rule.operator) {
            case 'equals':
              conditionMet = fieldValue === rule.value
              break
            case 'not-equals':
              conditionMet = fieldValue !== rule.value
              break
            case 'contains':
              conditionMet = fieldValue && fieldValue.includes(rule.value)
              break
            case 'not-contains':
              conditionMet = fieldValue && !fieldValue.includes(rule.value)
              break
            case 'greater-than':
              conditionMet = fieldValue > rule.value
              break
            case 'less-than':
              conditionMet = fieldValue < rule.value
              break
            case 'is-empty':
              conditionMet = !fieldValue || fieldValue === ''
              break
            case 'is-not-empty':
              conditionMet = fieldValue && fieldValue !== ''
              break
            case 'in':
              conditionMet = Array.isArray(rule.value) && rule.value.includes(fieldValue)
              break
            case 'not-in':
              conditionMet = Array.isArray(rule.value) && !rule.value.includes(fieldValue)
              break
          }

          if (conditionMet) {
            actionsToApply.push({
              action: rule.action,
              targetFieldIds: rule.targetFieldIds,
            })
          }
        })
      }
    })

    return actionsToApply
  }

  /**
   * Calculate priority from impact and urgency matrix
   */
  static calculatePriority(
    impact: 'low' | 'medium' | 'high',
    urgency: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Priority Matrix (Impact × Urgency)
    const matrix: Record<string, Record<string, 'low' | 'medium' | 'high' | 'critical'>> = {
      high: {
        high: 'critical',
        medium: 'high',
        low: 'medium',
      },
      medium: {
        high: 'high',
        medium: 'medium',
        low: 'low',
      },
      low: {
        high: 'medium',
        medium: 'low',
        low: 'low',
      },
    }

    return matrix[impact]?.[urgency] || 'medium'
  }

  /**
   * Validate form data against schema
   */
  static validateFormData(
    schema: { fields: FormField[]; sections: FormSection[] },
    formData: Record<string, any>
  ): { isValid: boolean; errors: Record<string, string[]> } {
    const errors: Record<string, string[]> = {}

    schema.fields.forEach((field) => {
      const fieldErrors: string[] = []
      const value = formData[field.id]

      // Required validation
      if (field.required && (!value || value === '')) {
        fieldErrors.push(`${field.label} is required`)
      }

      // Type-specific validations
      if (value && field.validations) {
        field.validations.forEach((validation) => {
          switch (validation.type) {
            case 'min-length':
              if (typeof value === 'string' && value.length < (validation.value as number)) {
                fieldErrors.push(validation.message)
              }
              break
            case 'max-length':
              if (typeof value === 'string' && value.length > (validation.value as number)) {
                fieldErrors.push(validation.message)
              }
              break
            case 'min-value':
              if (typeof value === 'number' && value < (validation.value as number)) {
                fieldErrors.push(validation.message)
              }
              break
            case 'max-value':
              if (typeof value === 'number' && value > (validation.value as number)) {
                fieldErrors.push(validation.message)
              }
              break
            case 'pattern':
              if (typeof value === 'string') {
                const regex = new RegExp(validation.value as string)
                if (!regex.test(value)) {
                  fieldErrors.push(validation.message)
                }
              }
              break
            case 'email':
              if (typeof value === 'string') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailRegex.test(value)) {
                  fieldErrors.push(validation.message)
                }
              }
              break
            case 'url':
              if (typeof value === 'string') {
                try {
                  new URL(value)
                } catch {
                  fieldErrors.push(validation.message)
                }
              }
              break
          }
        })
      }

      if (fieldErrors.length > 0) {
        errors[field.id] = fieldErrors
      }
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  /**
   * Create form template
   */
  static async createTemplate(
    orgId: string,
    createdBy: string,
    data: {
      name: string
      description: string
      category: string
      icon?: string
      itilCategory: 'service-request' | 'incident' | 'problem' | 'change' | 'general'
      schema: {
        fields: FormField[]
        sections: FormSection[]
      }
      isSystemTemplate?: boolean
      tags?: string[]
    }
  ): Promise<FormTemplate> {
    const db = await getDatabase()
    const collection = db.collection<FormTemplate>(COLLECTIONS.FORM_TEMPLATES)

    const template: FormTemplate = {
      _id: new ObjectId(),
      orgId,
      name: data.name,
      description: data.description,
      category: data.category,
      icon: data.icon,
      itilCategory: data.itilCategory,
      schema: data.schema,
      isSystemTemplate: data.isSystemTemplate || false,
      usageCount: 0,
      tags: data.tags || [],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await collection.insertOne(template)
    return template
  }

  /**
   * Get template by ID
   */
  static async getTemplate(templateId: string, orgId: string): Promise<FormTemplate | null> {
    const db = await getDatabase()
    const collection = db.collection<FormTemplate>(COLLECTIONS.FORM_TEMPLATES)

    const template = await collection.findOne({
      _id: new ObjectId(templateId),
      $or: [{ orgId }, { isSystemTemplate: true }],
    })

    return template
  }

  /**
   * List all templates
   */
  static async listTemplates(orgId: string): Promise<FormTemplate[]> {
    const db = await getDatabase()
    const collection = db.collection<FormTemplate>(COLLECTIONS.FORM_TEMPLATES)

    const templates = await collection
      .find({
        $or: [{ orgId }, { isSystemTemplate: true }],
      })
      .sort({ usageCount: -1, createdAt: -1 })
      .toArray()

    return templates
  }

  /**
   * Delete service
   */
  static async deleteService(serviceId: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    const result = await collection.deleteOne({
      _id: new ObjectId(serviceId),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * List all services
   */
  static async listServices(orgId: string, filters?: {
    category?: string
    isActive?: boolean
    itilCategory?: string
  }): Promise<ServiceCatalogueItem[]> {
    const db = await getDatabase()
    const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    const query: any = { orgId }

    if (filters?.category) {
      query.category = filters.category
    }
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive
    }
    if (filters?.itilCategory) {
      query.itilCategory = filters.itilCategory
    }

    const services = await collection
      .find(query)
      .sort({ popularity: -1, createdAt: -1 })
      .toArray()

    return services
  }
}
