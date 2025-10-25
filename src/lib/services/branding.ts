import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import {
  Organization,
  OrganizationBranding,
  BrandingVersion,
  UpdateBrandingInput,
} from '@/lib/types'

/**
 * Default Deskwise branding configuration
 */
export const DEFAULT_BRANDING: OrganizationBranding = {
  logos: {
    primary: {
      light: undefined,
      dark: undefined,
    },
    favicon: undefined,
    loginScreen: undefined,
  },
  colors: {
    primary: { h: 221.2, s: 83.2, l: 53.3 }, // Deskwise blue
    secondary: { h: 210, s: 40, l: 96.1 }, // Light gray
    accent: { h: 210, s: 40, l: 96.1 }, // Light gray
    background: { h: 0, s: 0, l: 100 }, // White
    surface: { h: 0, s: 0, l: 100 }, // White
  },
  typography: {
    fontFamily: 'Inter',
    googleFontsUrl: undefined,
    headingFontFamily: undefined,
  },
  identity: {
    companyName: 'Deskwise',
    tagline: undefined,
    customDomain: undefined,
    subdomain: undefined,
  },
  email: {
    fromName: 'Deskwise Support',
    replyToEmail: undefined,
    footerText: undefined,
    logoUrl: undefined,
    headerColor: '#667eea',
  },
  version: 1,
  isActive: true,
  lastModifiedBy: undefined,
  lastModifiedAt: undefined,
}

/**
 * Branding Service - Manages white-label branding configurations
 */
export class BrandingService {
  /**
   * Get branding configuration for an organization
   */
  static async getBranding(orgId: string): Promise<OrganizationBranding> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    const org = await orgsCollection.findOne({ _id: new ObjectId(orgId) })

    if (!org) {
      throw new Error('Organization not found')
    }

    // Return organization's branding or default
    return org.branding || DEFAULT_BRANDING
  }

  /**
   * Update branding configuration for an organization
   */
  static async updateBranding(
    orgId: string,
    updates: UpdateBrandingInput,
    userId: string,
    userName: string,
    changeDescription?: string
  ): Promise<OrganizationBranding> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    // Get current branding
    const org = await orgsCollection.findOne({ _id: new ObjectId(orgId) })
    if (!org) {
      throw new Error('Organization not found')
    }

    const currentBranding = org.branding || DEFAULT_BRANDING

    // Merge updates with current branding
    const updatedBranding: OrganizationBranding = {
      logos: {
        primary: {
          light: updates.logos?.primary?.light ?? currentBranding.logos.primary.light,
          dark: updates.logos?.primary?.dark ?? currentBranding.logos.primary.dark,
        },
        favicon: updates.logos?.favicon ?? currentBranding.logos.favicon,
        loginScreen: updates.logos?.loginScreen ?? currentBranding.logos.loginScreen,
      },
      colors: {
        primary: updates.colors?.primary ?? currentBranding.colors.primary,
        secondary: updates.colors?.secondary ?? currentBranding.colors.secondary,
        accent: updates.colors?.accent ?? currentBranding.colors.accent,
        background: updates.colors?.background ?? currentBranding.colors.background,
        surface: updates.colors?.surface ?? currentBranding.colors.surface,
      },
      typography: {
        fontFamily: updates.typography?.fontFamily ?? currentBranding.typography.fontFamily,
        googleFontsUrl: updates.typography?.googleFontsUrl ?? currentBranding.typography.googleFontsUrl,
        headingFontFamily: updates.typography?.headingFontFamily ?? currentBranding.typography.headingFontFamily,
      },
      identity: {
        companyName: updates.identity?.companyName ?? currentBranding.identity.companyName,
        tagline: updates.identity?.tagline ?? currentBranding.identity.tagline,
        customDomain: updates.identity?.customDomain ?? currentBranding.identity.customDomain,
        subdomain: updates.identity?.subdomain ?? currentBranding.identity.subdomain,
      },
      email: {
        fromName: updates.email?.fromName ?? currentBranding.email.fromName,
        replyToEmail: updates.email?.replyToEmail ?? currentBranding.email.replyToEmail,
        footerText: updates.email?.footerText ?? currentBranding.email.footerText,
        logoUrl: updates.email?.logoUrl ?? currentBranding.email.logoUrl,
        headerColor: updates.email?.headerColor ?? currentBranding.email.headerColor,
      },
      version: currentBranding.version + 1,
      isActive: true,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    }

    // Save version history
    await this.saveBrandingVersion(
      orgId,
      currentBranding,
      userId,
      userName,
      changeDescription
    )

    // Update organization with new branding
    const result = await orgsCollection.findOneAndUpdate(
      { _id: new ObjectId(orgId) },
      {
        $set: {
          branding: updatedBranding,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result || !result.branding) {
      throw new Error('Failed to update branding')
    }

    return result.branding
  }

  /**
   * Reset branding to default Deskwise theme
   */
  static async resetBranding(
    orgId: string,
    userId: string,
    userName: string
  ): Promise<OrganizationBranding> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    // Get current branding for version history
    const org = await orgsCollection.findOne({ _id: new ObjectId(orgId) })
    if (!org) {
      throw new Error('Organization not found')
    }

    const currentBranding = org.branding || DEFAULT_BRANDING

    // Save version history before reset
    await this.saveBrandingVersion(
      orgId,
      currentBranding,
      userId,
      userName,
      'Reset to default Deskwise theme'
    )

    // Reset to default
    const resetBranding: OrganizationBranding = {
      ...DEFAULT_BRANDING,
      version: currentBranding.version + 1,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    }

    const result = await orgsCollection.findOneAndUpdate(
      { _id: new ObjectId(orgId) },
      {
        $set: {
          branding: resetBranding,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result || !result.branding) {
      throw new Error('Failed to reset branding')
    }

    return result.branding
  }

  /**
   * Save branding version to history
   */
  private static async saveBrandingVersion(
    orgId: string,
    branding: OrganizationBranding,
    userId: string,
    userName: string,
    changeDescription?: string
  ): Promise<void> {
    const db = await getDatabase()
    const versionsCollection = db.collection<BrandingVersion>(
      COLLECTIONS.BRANDING_VERSIONS
    )

    const version: Omit<BrandingVersion, '_id'> = {
      orgId,
      version: branding.version,
      branding,
      modifiedBy: userId,
      modifiedByName: userName,
      changeDescription,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    }

    await versionsCollection.insertOne(version as BrandingVersion)
  }

  /**
   * Get branding version history
   */
  static async getBrandingHistory(
    orgId: string,
    limit: number = 20
  ): Promise<BrandingVersion[]> {
    const db = await getDatabase()
    const versionsCollection = db.collection<BrandingVersion>(
      COLLECTIONS.BRANDING_VERSIONS
    )

    return await versionsCollection
      .find({ orgId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Rollback to a specific branding version
   */
  static async rollbackToVersion(
    orgId: string,
    versionNumber: number,
    userId: string,
    userName: string
  ): Promise<OrganizationBranding> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)
    const versionsCollection = db.collection<BrandingVersion>(
      COLLECTIONS.BRANDING_VERSIONS
    )

    // Find the version to rollback to
    const targetVersion = await versionsCollection.findOne({
      orgId,
      version: versionNumber,
    })

    if (!targetVersion) {
      throw new Error('Branding version not found')
    }

    // Get current branding for history
    const org = await orgsCollection.findOne({ _id: new ObjectId(orgId) })
    if (!org) {
      throw new Error('Organization not found')
    }

    const currentBranding = org.branding || DEFAULT_BRANDING

    // Save current state to history before rollback
    await this.saveBrandingVersion(
      orgId,
      currentBranding,
      userId,
      userName,
      `Rollback to version ${versionNumber}`
    )

    // Create rolled-back branding with new version number
    const rolledBackBranding: OrganizationBranding = {
      ...targetVersion.branding,
      version: currentBranding.version + 1,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    }

    // Update organization
    const result = await orgsCollection.findOneAndUpdate(
      { _id: new ObjectId(orgId) },
      {
        $set: {
          branding: rolledBackBranding,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result || !result.branding) {
      throw new Error('Failed to rollback branding')
    }

    return result.branding
  }

  /**
   * Export branding configuration as JSON
   */
  static async exportBranding(orgId: string): Promise<{
    organization: string
    exportedAt: Date
    branding: OrganizationBranding
  }> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    const org = await orgsCollection.findOne({ _id: new ObjectId(orgId) })
    if (!org) {
      throw new Error('Organization not found')
    }

    return {
      organization: org.name,
      exportedAt: new Date(),
      branding: org.branding || DEFAULT_BRANDING,
    }
  }

  /**
   * Import branding configuration from JSON
   */
  static async importBranding(
    orgId: string,
    brandingData: OrganizationBranding,
    userId: string,
    userName: string
  ): Promise<OrganizationBranding> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    // Get current branding for history
    const org = await orgsCollection.findOne({ _id: new ObjectId(orgId) })
    if (!org) {
      throw new Error('Organization not found')
    }

    const currentBranding = org.branding || DEFAULT_BRANDING

    // Save current state to history
    await this.saveBrandingVersion(
      orgId,
      currentBranding,
      userId,
      userName,
      'Imported branding configuration'
    )

    // Import with new version number
    const importedBranding: OrganizationBranding = {
      ...brandingData,
      version: currentBranding.version + 1,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
      isActive: true,
    }

    // Update organization
    const result = await orgsCollection.findOneAndUpdate(
      { _id: new ObjectId(orgId) },
      {
        $set: {
          branding: importedBranding,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    if (!result || !result.branding) {
      throw new Error('Failed to import branding')
    }

    return result.branding
  }

  /**
   * Generate CSS variables from branding colors
   */
  static generateCSSVariables(branding: OrganizationBranding): Record<string, string> {
    const { colors } = branding

    return {
      '--primary': `${colors.primary.h} ${colors.primary.s}% ${colors.primary.l}%`,
      '--secondary': `${colors.secondary.h} ${colors.secondary.s}% ${colors.secondary.l}%`,
      '--accent': `${colors.accent.h} ${colors.accent.s}% ${colors.accent.l}%`,
      '--background': colors.background
        ? `${colors.background.h} ${colors.background.s}% ${colors.background.l}%`
        : '0 0% 100%',
      '--card': colors.surface
        ? `${colors.surface.h} ${colors.surface.s}% ${colors.surface.l}%`
        : '0 0% 100%',
    }
  }

  /**
   * Validate subdomain availability
   */
  static async validateSubdomain(
    subdomain: string,
    excludeOrgId?: string
  ): Promise<{ available: boolean; message?: string }> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    // Check format: alphanumeric and hyphens only, 3-63 characters
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/
    if (!subdomainRegex.test(subdomain)) {
      return {
        available: false,
        message: 'Subdomain must be 3-63 characters, alphanumeric and hyphens only',
      }
    }

    // Reserved subdomains
    const reserved = [
      'www',
      'mail',
      'admin',
      'api',
      'app',
      'portal',
      'support',
      'help',
      'docs',
      'status',
      'blog',
      'deskwise',
    ]
    if (reserved.includes(subdomain.toLowerCase())) {
      return {
        available: false,
        message: 'This subdomain is reserved',
      }
    }

    // Check if subdomain is already in use
    const query: any = {
      'branding.identity.subdomain': subdomain.toLowerCase(),
    }
    if (excludeOrgId) {
      query._id = { $ne: new ObjectId(excludeOrgId) }
    }

    const existing = await orgsCollection.findOne(query)
    if (existing) {
      return {
        available: false,
        message: 'This subdomain is already in use',
      }
    }

    return { available: true }
  }
}
