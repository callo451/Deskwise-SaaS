/**
 * Portal Page Service
 * Handles portal page operations including preview token generation
 */

import clientPromise from '@/lib/mongodb'
import type { PortalPage, PortalPageVersion } from '@/lib/types'
import { ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

export class PortalPageService {
  /**
   * Generate preview token for a page
   */
  static async generatePreviewToken(
    pageId: string,
    userId: string,
    expiresInMinutes: number = 60
  ): Promise<string> {
    const secret = process.env.NEXTAUTH_SECRET || 'preview-secret'
    const expiresIn = expiresInMinutes * 60 // Convert to seconds

    const token = jwt.sign(
      {
        pageId,
        userId,
        type: 'preview'
      },
      secret,
      { expiresIn }
    )

    // Store token in database for tracking
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('portal_preview_tokens').insertOne({
      token,
      pageId: new ObjectId(pageId),
      userId,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      createdAt: new Date()
    })

    return token
  }

  /**
   * Verify preview token
   */
  static async verifyPreviewToken(
    token: string
  ): Promise<{ pageId: string; userId: string } | null> {
    try {
      const secret = process.env.NEXTAUTH_SECRET || 'preview-secret'
      const decoded = jwt.verify(token, secret) as {
        pageId: string
        userId: string
        type: string
      }

      if (decoded.type !== 'preview') {
        return null
      }

      return {
        pageId: decoded.pageId,
        userId: decoded.userId
      }
    } catch (error) {
      console.error('Error verifying preview token:', error)
      return null
    }
  }

  /**
   * Publish a page
   */
  static async publishPage(
    pageId: string,
    userId: string,
    orgId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get current page
    const page = await db.collection('portal_pages').findOne({
      _id: new ObjectId(pageId),
      orgId
    })

    if (!page) {
      throw new Error('Page not found')
    }

    // Create version snapshot before publishing
    await this.createPageVersion(pageId, orgId, userId, 'Published page')

    // Update page status
    const result = await db.collection('portal_pages').updateOne(
      { _id: new ObjectId(pageId), orgId },
      {
        $set: {
          status: 'published',
          publishedAt: new Date(),
          publishedBy: userId,
          updatedAt: new Date()
        }
      }
    )

    // Trigger revalidation
    if (result.modifiedCount > 0) {
      await this.revalidatePage(page.slug)
    }

    return result.modifiedCount > 0
  }

  /**
   * Unpublish a page
   */
  static async unpublishPage(
    pageId: string,
    orgId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const page = await db.collection('portal_pages').findOne({
      _id: new ObjectId(pageId),
      orgId
    })

    if (!page) {
      throw new Error('Page not found')
    }

    const result = await db.collection('portal_pages').updateOne(
      { _id: new ObjectId(pageId), orgId },
      {
        $set: {
          status: 'draft',
          updatedAt: new Date()
        }
      }
    )

    // Trigger revalidation to remove from cache
    if (result.modifiedCount > 0) {
      await this.revalidatePage(page.slug)
    }

    return result.modifiedCount > 0
  }

  /**
   * Create page version snapshot
   */
  static async createPageVersion(
    pageId: string,
    orgId: string,
    userId: string,
    changeMessage?: string
  ): Promise<string> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get current page
    const page = (await db.collection('portal_pages').findOne({
      _id: new ObjectId(pageId),
      orgId
    })) as any

    if (!page) {
      throw new Error('Page not found')
    }

    // Get current version number
    const currentVersion = page.version || 1

    // Create version document
    const version: Omit<PortalPageVersion, '_id'> = {
      orgId,
      pageId,
      version: currentVersion,
      title: page.title,
      blocks: page.blocks,
      dataSources: page.dataSources,
      changeMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    }

    const result = await db.collection('portal_page_versions').insertOne(version as any)

    return result.insertedId.toString()
  }

  /**
   * Restore page from version
   */
  static async restorePageVersion(
    pageId: string,
    versionNumber: number,
    orgId: string,
    userId: string
  ): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get version
    const version = await db.collection('portal_page_versions').findOne({
      pageId,
      version: versionNumber,
      orgId
    })

    if (!version) {
      throw new Error('Version not found')
    }

    // Create snapshot of current state before restoring
    await this.createPageVersion(
      pageId,
      orgId,
      userId,
      `Restored from version ${versionNumber}`
    )

    // Update page with version data
    const result = await db.collection('portal_pages').updateOne(
      { _id: new ObjectId(pageId), orgId },
      {
        $set: {
          blocks: version.blocks,
          dataSources: version.dataSources,
          version: (version.version as number) + 1,
          previousVersionId: version._id.toString(),
          updatedAt: new Date()
        }
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Trigger ISR revalidation for a page
   */
  private static async revalidatePage(slug: string): Promise<void> {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:9002'

      await fetch(`${baseUrl}/api/portal/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slug })
      })
    } catch (error) {
      console.error('Error revalidating page:', error)
      // Don't throw - revalidation is not critical
    }
  }

  /**
   * Get page by slug
   */
  static async getPageBySlug(
    slug: string,
    orgId: string,
    includeUnpublished: boolean = false
  ): Promise<PortalPage | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { slug, orgId }

    if (!includeUnpublished) {
      query.status = 'published'
    }

    const page = await db.collection('portal_pages').findOne(query)

    if (!page) {
      return null
    }

    return page as any
  }

  /**
   * Get all pages for organization
   */
  static async getPages(
    orgId: string,
    filters?: {
      status?: string
      isPublic?: boolean
      showInNav?: boolean
    }
  ): Promise<PortalPage[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId, ...filters }

    const pages = await db
      .collection('portal_pages')
      .find(query)
      .sort({ order: 1, createdAt: -1 })
      .toArray()

    return pages as any[]
  }

  /**
   * Delete page
   */
  static async deletePage(pageId: string, orgId: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Delete page
    const result = await db.collection('portal_pages').deleteOne({
      _id: new ObjectId(pageId),
      orgId
    })

    // Delete associated versions
    await db.collection('portal_page_versions').deleteMany({
      pageId,
      orgId
    })

    return result.deletedCount > 0
  }

  /**
   * Duplicate page
   */
  static async duplicatePage(
    pageId: string,
    orgId: string,
    userId: string,
    newTitle: string,
    newSlug: string
  ): Promise<string> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get original page
    const originalPage = (await db.collection('portal_pages').findOne({
      _id: new ObjectId(pageId),
      orgId
    })) as any

    if (!originalPage) {
      throw new Error('Page not found')
    }

    // Create duplicate
    const newPage: Omit<PortalPage, '_id'> = {
      ...originalPage,
      title: newTitle,
      slug: newSlug,
      status: 'draft',
      publishedAt: undefined,
      publishedBy: undefined,
      version: 1,
      previousVersionId: undefined,
      viewCount: 0,
      lastViewedAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    }

    delete (newPage as any)._id

    const result = await db.collection('portal_pages').insertOne(newPage as any)

    return result.insertedId.toString()
  }
}
