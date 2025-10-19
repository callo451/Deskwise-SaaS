import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { ServiceCatalogueItem, FormField } from '../types'
import { UnifiedTicketService } from './unified-tickets'
import { FormBuilderService } from './form-builder'

/**
 * Service Catalog Submission Service
 * Routes service catalog form submissions to appropriate modules based on itilCategory
 */
export class ServiceCatalogSubmissionService {
  /**
   * Submit a service catalog request and route to appropriate module
   */
  static async submitRequest(
    serviceId: string,
    userId: string,
    userName: string,
    formData: Record<string, any>,
    orgId: string
  ): Promise<{
    success: boolean
    itemType: string
    itemId: string
    itemNumber: string
    data: any
  }> {
    const db = await getDatabase()
    const servicesCollection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    // Get the service catalog item
    const service = await servicesCollection.findOne({
      _id: new ObjectId(serviceId),
      orgId,
    })

    if (!service) {
      throw new Error('Service not found')
    }

    // Get the current published form schema
    const publishedVersion = service.formVersions.find((v) => v.isPublished)
    if (!publishedVersion && service.formVersions.length === 0) {
      throw new Error('No form schema found for this service')
    }

    const schema = publishedVersion?.schema || service.formVersions[service.formVersions.length - 1]?.schema

    // Validate form data against schema
    if (schema) {
      const validation = FormBuilderService.validateFormData(schema, formData)
      if (!validation.isValid) {
        throw new Error(`Form validation failed: ${JSON.stringify(validation.errors)}`)
      }
    }

    // Extract mapped ITIL fields from form data
    const mappedFields = this.extractMappedFields(schema?.fields || [], formData)

    // Calculate priority if impact and urgency are provided
    let calculatedPriority = mappedFields.priority || 'medium'
    if (mappedFields.impact && mappedFields.urgency) {
      calculatedPriority = FormBuilderService.calculatePriority(
        mappedFields.impact as any,
        mappedFields.urgency as any
      )
    }

    // Build SLA configuration if provided
    const sla = service.slaResponseTime || service.slaResolutionTime
      ? {
          responseTime: service.slaResponseTime || 240, // 4 hours default
          resolutionTime: service.slaResolutionTime || 480, // 8 hours default
          responseDeadline: new Date(Date.now() + (service.slaResponseTime || 240) * 60 * 1000),
          resolutionDeadline: new Date(Date.now() + (service.slaResolutionTime || 480) * 60 * 1000),
          breached: false,
        }
      : undefined

    // Route to appropriate module based on itilCategory
    let result: any

    switch (service.itilCategory) {
      case 'service-request':
        result = await UnifiedTicketService.create(
          orgId,
          {
            ticketType: 'service_request',
            title: formData.title || service.name,
            description: formData.description || service.description,
            priority: calculatedPriority as any,
            category: service.category,
            requesterId: userId,
            metadata: {
              ticketType: 'service_request',
              estimatedCost: formData.estimatedCost,
              estimatedEffort: formData.estimatedEffort,
              approvers: formData.approvers || [],
              formData,
            },
            sla,
          },
          userId
        )
        return {
          success: true,
          itemType: 'service_request',
          itemId: result._id.toString(),
          itemNumber: result.ticketNumber,
          data: result,
        }

      case 'incident':
        result = await UnifiedTicketService.create(
          orgId,
          {
            ticketType: 'incident',
            title: formData.title || service.name,
            description: formData.description || service.description,
            priority: calculatedPriority as any,
            category: service.category,
            requesterId: userId,
            metadata: {
              ticketType: 'incident',
              severity: mappedFields.severity || 'minor',
              impactedServices: formData.affectedServices || [service.name],
              publicSummary: formData.description || service.description,
            },
            sla,
          },
          userId
        )
        return {
          success: true,
          itemType: 'incident',
          itemId: result._id.toString(),
          itemNumber: result.ticketNumber,
          data: result,
        }

      case 'problem':
        result = await UnifiedTicketService.create(
          orgId,
          {
            ticketType: 'problem',
            title: formData.title || service.name,
            description: formData.description || service.description,
            priority: calculatedPriority as any,
            category: service.category,
            requesterId: userId,
            metadata: {
              ticketType: 'problem',
              impact: mappedFields.impact || 'low',
              urgency: mappedFields.urgency || 'low',
              relatedIncidents: formData.relatedIncidents || [],
            },
            sla,
          },
          userId
        )
        return {
          success: true,
          itemType: 'problem',
          itemId: result._id.toString(),
          itemNumber: result.ticketNumber,
          data: result,
        }

      case 'change':
        result = await UnifiedTicketService.create(
          orgId,
          {
            ticketType: 'change',
            title: formData.title || service.name,
            description: formData.description || service.description,
            priority: calculatedPriority as any,
            category: service.category,
            requesterId: userId,
            metadata: {
              ticketType: 'change',
              changeType: formData.changeType || 'standard',
              risk: mappedFields.risk || 'low',
              impact: mappedFields.impact || 'low',
              plannedStartDate: formData.plannedStartDate ? new Date(formData.plannedStartDate) : new Date(),
              plannedEndDate: formData.plannedEndDate
                ? new Date(formData.plannedEndDate)
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              affectedAssets: formData.affectedAssets || [],
              backoutPlan: formData.backoutPlan,
              testPlan: formData.testPlan,
              implementationSteps: formData.implementationSteps || [],
            },
            sla,
          },
          userId
        )
        return {
          success: true,
          itemType: 'change',
          itemId: result._id.toString(),
          itemNumber: result.ticketNumber,
          data: result,
        }

      case 'general':
      default:
        // Create as general ticket
        result = await UnifiedTicketService.create(
          orgId,
          {
            ticketType: 'ticket',
            title: formData.title || service.name,
            description: formData.description || service.description,
            priority: calculatedPriority as any,
            category: service.category,
            requesterId: userId,
            metadata: {
              ticketType: 'ticket',
            },
            tags: formData.tags || [service.category],
            sla,
          },
          userId
        )
        return {
          success: true,
          itemType: 'ticket',
          itemId: result._id.toString(),
          itemNumber: result.ticketNumber,
          data: result,
        }
    }
  }

  /**
   * Extract mapped ITIL fields from form data based on field mappings
   */
  private static extractMappedFields(
    fields: FormField[],
    formData: Record<string, any>
  ): Record<string, any> {
    const mapped: Record<string, any> = {}

    fields.forEach((field) => {
      if (field.itilMapping?.standardField) {
        const value = formData[field.id]
        if (value !== undefined && value !== null && value !== '') {
          mapped[field.itilMapping.standardField] = value
        }
      }

      // Direct field type mapping
      if (field.type === 'priority' && formData[field.id]) {
        mapped.priority = formData[field.id]
      }
      if (field.type === 'impact' && formData[field.id]) {
        mapped.impact = formData[field.id]
      }
      if (field.type === 'urgency' && formData[field.id]) {
        mapped.urgency = formData[field.id]
      }
    })

    return mapped
  }

  /**
   * Get submission by ID and type
   */
  static async getSubmission(
    itemType: string,
    itemId: string,
    orgId: string
  ): Promise<any> {
    switch (itemType) {
      case 'service-request':
        return await ServiceRequestService.getServiceRequestById(itemId, orgId)
      case 'incident':
        return await IncidentService.getIncidentById(itemId, orgId)
      case 'problem':
        return await ProblemService.getProblemById(itemId, orgId)
      case 'change':
        return await ChangeManagementService.getChangeRequestById(itemId, orgId)
      case 'ticket':
        return await TicketService.getTicketById(itemId, orgId)
      default:
        throw new Error(`Unknown item type: ${itemType}`)
    }
  }

  /**
   * Increment service popularity counter
   */
  static async incrementServicePopularity(serviceId: string, orgId: string): Promise<void> {
    const db = await getDatabase()
    const servicesCollection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

    await servicesCollection.updateOne(
      { _id: new ObjectId(serviceId), orgId },
      {
        $inc: { popularity: 1 },
        $set: { updatedAt: new Date() },
      }
    )
  }
}
