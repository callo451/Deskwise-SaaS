/**
 * Portal Page Runtime Renderer
 * Dynamic route for published portal pages with ISR support
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import clientPromise from '@/lib/mongodb'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { PortalPage, PortalTheme, UserRole } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { BlockRenderer } from '@/lib/portal/renderer/BlockRenderer'
import { DataLoader } from '@/lib/portal/renderer/dataLoader'
import {
  loadTheme,
  generateThemeCSS,
  applyThemeOverrides,
  getDefaultTheme
} from '@/lib/portal/theme/themeApplicator'
import jwt from 'jsonwebtoken'

interface PageProps {
  params: Promise<{
    slug: string[]
  }>
  searchParams: Promise<{
    preview?: string
  }>
}

// ISR configuration - revalidate every 5 minutes
export const revalidate = 300

/**
 * Generate static paths for published pages (optional)
 */
export async function generateStaticParams() {
  try {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get all published pages
    const pages = await db
      .collection('portal_pages')
      .find({ status: 'published' })
      .project({ slug: 1 })
      .limit(100) // Limit to avoid too many static pages
      .toArray()

    return pages.map((page: any) => ({
      slug: page.slug.split('/').filter(Boolean)
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const slug = resolvedParams.slug.join('/')

  try {
    const page = await fetchPage(slug)

    if (!page) {
      return {
        title: 'Page Not Found'
      }
    }

    return {
      title: page.seo?.title || page.title,
      description: page.seo?.description || page.description,
      keywords: page.seo?.keywords,
      openGraph: {
        title: page.seo?.title || page.title,
        description: page.seo?.description || page.description,
        images: page.seo?.ogImage ? [page.seo.ogImage] : []
      },
      robots: {
        index: !page.seo?.noIndex,
        follow: !page.seo?.noFollow
      },
      alternates: {
        canonical: page.seo?.canonicalUrl
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'Portal'
    }
  }
}

/**
 * Main Page Component
 */
export default async function PortalPageRuntime({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const slug = resolvedParams.slug.join('/')
  const previewToken = resolvedSearchParams.preview

  // Get session for authentication
  const session = await getServerSession(authOptions)

  // Handle preview mode
  let page: PortalPage | null = null
  if (previewToken) {
    page = await fetchPagePreview(previewToken, session)
  } else {
    page = await fetchPage(slug)
  }

  if (!page) {
    notFound()
  }

  // Check access permissions
  const hasAccess = checkPageAccess(page, session)
  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to view this page.
        </p>
        <a
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </a>
      </div>
    )
  }

  // Load theme
  let theme: PortalTheme | null = null
  if (page.themeId) {
    theme = await loadTheme(page.orgId, page.themeId)
  } else {
    theme = await loadTheme(page.orgId)
  }

  // Apply theme overrides if present
  if (theme && page.themeOverrides) {
    theme = applyThemeOverrides(theme, page.themeOverrides)
  }

  // Use default theme if none found
  if (!theme) {
    theme = getDefaultTheme()
    theme.orgId = page.orgId
  }

  // Generate theme CSS
  const themeCSS = generateThemeCSS(theme)

  // Load data sources
  const dataLoader = new DataLoader(
    page.orgId,
    session?.user?.id
  )
  const dataContext = page.dataSources
    ? await dataLoader.loadDataSources(page.dataSources)
    : {}

  // Add user and page data to context
  const enrichedDataContext = {
    ...dataContext,
    user: session?.user || null,
    page: {
      title: page.title,
      slug: page.slug,
      description: page.description
    }
  }

  // Prepare user object for visibility guards
  const user = session?.user
    ? {
        id: session.user.id!,
        email: session.user.email!,
        role: session.user.role as UserRole,
        permissions: session.user.permissions || []
      }
    : undefined

  // Update view count (fire and forget)
  incrementViewCount(page._id.toString(), page.orgId).catch(console.error)

  // Determine max width class
  const maxWidthClass = page.layout?.maxWidth
    ? {
        sm: 'max-w-screen-sm',
        md: 'max-w-screen-md',
        lg: 'max-w-screen-lg',
        xl: 'max-w-screen-xl',
        '2xl': 'max-w-screen-2xl',
        full: 'w-full'
      }[page.layout.maxWidth]
    : 'max-w-screen-xl'

  return (
    <>
      {/* Inject theme CSS */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />

      <div className="portal-page-runtime">
        {/* Optional Header */}
        {page.layout?.header !== false && (
          <header className="border-b">
            <div className={`container mx-auto px-4 py-4 ${maxWidthClass}`}>
              <h1 className="text-2xl font-bold">{page.title}</h1>
              {page.description && (
                <p className="text-muted-foreground mt-1">{page.description}</p>
              )}
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className={`container mx-auto px-4 py-8 ${maxWidthClass}`}>
          {page.blocks.map((block) => (
            <BlockRenderer
              key={block.id}
              block={block}
              dataContext={enrichedDataContext}
              user={user}
              orgId={page.orgId}
            />
          ))}
        </main>

        {/* Optional Footer */}
        {page.layout?.footer !== false && (
          <footer className="border-t mt-12">
            <div className={`container mx-auto px-4 py-6 ${maxWidthClass}`}>
              <p className="text-sm text-muted-foreground text-center">
                &copy; {new Date().getFullYear()} - Powered by Deskwise ITSM
              </p>
            </div>
          </footer>
        )}
      </div>
    </>
  )
}

/**
 * Fetch published page by slug
 */
async function fetchPage(slug: string): Promise<PortalPage | null> {
  try {
    const client = await clientPromise
    const db = client.db('deskwise')

    const page = await db.collection('portal_pages').findOne({
      slug,
      status: 'published'
    })

    if (!page) {
      return null
    }

    return page as any
  } catch (error) {
    console.error('Error fetching page:', error)
    return null
  }
}

/**
 * Fetch page in preview mode
 */
async function fetchPagePreview(
  token: string,
  session: any
): Promise<PortalPage | null> {
  if (!session?.user) {
    return null
  }

  try {
    // Verify preview token
    const secret = process.env.NEXTAUTH_SECRET || 'preview-secret'
    const decoded = jwt.verify(token, secret) as {
      pageId: string
      userId: string
      exp: number
    }

    // Check if user has permission to preview
    if (decoded.userId !== session.user.id) {
      return null
    }

    // Fetch page (any status)
    const client = await clientPromise
    const db = client.db('deskwise')

    const page = await db.collection('portal_pages').findOne({
      _id: new ObjectId(decoded.pageId)
    })

    if (!page) {
      return null
    }

    return page as any
  } catch (error) {
    console.error('Error fetching preview page:', error)
    return null
  }
}

/**
 * Check if user has access to page
 */
function checkPageAccess(page: PortalPage, session: any): boolean {
  // Public pages are accessible to everyone
  if (page.isPublic) {
    return true
  }

  // Private pages require authentication
  if (!session?.user) {
    return false
  }

  // Check role-based access
  if (page.allowedRoles && page.allowedRoles.length > 0) {
    const userRole = session.user.role as UserRole
    if (!page.allowedRoles.includes(userRole)) {
      return false
    }
  }

  // Check permission-based access
  if (page.requiredPermissions && page.requiredPermissions.length > 0) {
    const userPermissions = session.user.permissions || []
    const hasRequiredPermission = page.requiredPermissions.some((perm: string) =>
      userPermissions.includes(perm)
    )
    if (!hasRequiredPermission) {
      return false
    }
  }

  return true
}

/**
 * Increment page view count
 */
async function incrementViewCount(pageId: string, orgId: string): Promise<void> {
  try {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('portal_pages').updateOne(
      { _id: new ObjectId(pageId), orgId },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() }
      }
    )
  } catch (error) {
    console.error('Error incrementing view count:', error)
  }
}
