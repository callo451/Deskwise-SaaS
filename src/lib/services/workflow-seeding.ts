/**
 * Workflow Template Seeding Service
 *
 * This module provides functions to automatically seed workflow templates
 * for new organizations during signup and for existing organizations.
 */

import { getDatabase } from '@/lib/mongodb'
import { WorkflowTemplateService } from './workflow-templates'
import { ObjectId } from 'mongodb'

export interface WorkflowSeedingResult {
  success: boolean
  seededCount: number
  skippedCount: number
  errors: string[]
}

/**
 * Seed workflow templates for a specific organization
 * This function is called automatically during organization creation
 */
export async function seedWorkflowTemplatesForOrganization(
  orgId: string
): Promise<WorkflowSeedingResult> {
  const result: WorkflowSeedingResult = {
    success: true,
    seededCount: 0,
    skippedCount: 0,
    errors: [],
  }

  try {
    const db = await getDatabase()
    const workflowsCollection = db.collection('workflows')

    // Get all system templates
    const systemTemplates = WorkflowTemplateService.getSystemTemplates()

    for (const template of systemTemplates) {
      try {
        // Check if this template already exists for the organization
        const existingWorkflow = await workflowsCollection.findOne({
          orgId,
          name: template.name,
          isTemplate: true,
        })

        if (existingWorkflow) {
          result.skippedCount++
          continue
        }

        // Create workflow from template
        const workflow = {
          _id: new ObjectId(),
          orgId,
          name: template.name,
          description: template.description,
          category: template.category,
          status: 'inactive', // Templates start inactive, users can activate them
          version: 1,
          nodes: template.nodes,
          edges: template.edges,
          trigger: template.trigger,
          settings: {
            enabled: false,
            runAsync: true,
            maxRetries: 3,
            timeout: 300000, // 5 minutes
            onError: 'stop' as const,
          },
          isTemplate: true,
          isSystem: true,
          icon: template.icon || 'workflow',
          tags: template.tags || [],
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            seededAt: new Date(),
            source: 'system-template',
          },
        }

        await workflowsCollection.insertOne(workflow)
        result.seededCount++
      } catch (error) {
        result.errors.push(
          `Failed to seed "${template.name}": ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }

    if (result.errors.length > 0) {
      result.success = false
    }
  } catch (error) {
    result.success = false
    result.errors.push(
      `Critical error during seeding: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  return result
}

/**
 * Seed workflow templates for all existing organizations
 * This is useful for backfilling workflows into existing organizations
 */
export async function seedWorkflowTemplatesForAllOrganizations(): Promise<{
  totalOrgs: number
  successfulOrgs: number
  failedOrgs: number
  totalSeeded: number
  results: Record<string, WorkflowSeedingResult>
}> {
  const db = await getDatabase()
  const usersCollection = db.collection('users')

  // Get all unique organization IDs
  const orgs = await usersCollection.distinct('orgId', { orgId: { $exists: true } })

  const results: Record<string, WorkflowSeedingResult> = {}
  let successfulOrgs = 0
  let failedOrgs = 0
  let totalSeeded = 0

  for (const orgId of orgs) {
    if (orgId) {
      const result = await seedWorkflowTemplatesForOrganization(orgId as string)
      results[orgId as string] = result

      if (result.success) {
        successfulOrgs++
        totalSeeded += result.seededCount
      } else {
        failedOrgs++
      }
    }
  }

  return {
    totalOrgs: orgs.length,
    successfulOrgs,
    failedOrgs,
    totalSeeded,
    results,
  }
}

/**
 * Activate a specific workflow template for an organization
 * This enables the workflow to start executing
 */
export async function activateWorkflowTemplate(
  orgId: string,
  workflowName: string
): Promise<boolean> {
  try {
    const db = await getDatabase()
    const workflowsCollection = db.collection('workflows')

    const result = await workflowsCollection.updateOne(
      {
        orgId,
        name: workflowName,
        isTemplate: true,
      },
      {
        $set: {
          status: 'active',
          'settings.enabled': true,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error('Error activating workflow template:', error)
    return false
  }
}

/**
 * Deactivate a specific workflow template for an organization
 */
export async function deactivateWorkflowTemplate(
  orgId: string,
  workflowName: string
): Promise<boolean> {
  try {
    const db = await getDatabase()
    const workflowsCollection = db.collection('workflows')

    const result = await workflowsCollection.updateOne(
      {
        orgId,
        name: workflowName,
        isTemplate: true,
      },
      {
        $set: {
          status: 'inactive',
          'settings.enabled': false,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error('Error deactivating workflow template:', error)
    return false
  }
}

/**
 * Get workflow template statistics for an organization
 */
export async function getWorkflowTemplateStats(orgId: string): Promise<{
  total: number
  active: number
  inactive: number
  system: number
  custom: number
}> {
  const db = await getDatabase()
  const workflowsCollection = db.collection('workflows')

  const [total, active, inactive, system, custom] = await Promise.all([
    workflowsCollection.countDocuments({ orgId, isTemplate: true }),
    workflowsCollection.countDocuments({ orgId, isTemplate: true, status: 'active' }),
    workflowsCollection.countDocuments({ orgId, isTemplate: true, status: 'inactive' }),
    workflowsCollection.countDocuments({ orgId, isTemplate: true, isSystem: true }),
    workflowsCollection.countDocuments({ orgId, isTemplate: true, isSystem: { $ne: true } }),
  ])

  return {
    total,
    active,
    inactive,
    system,
    custom,
  }
}
