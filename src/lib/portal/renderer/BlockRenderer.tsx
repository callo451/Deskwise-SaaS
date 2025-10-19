/**
 * Block Renderer Component
 * Recursively renders portal page blocks with visibility guards and data bindings
 */

import type { BlockInstance, BlockProps, UserRole } from '@/lib/types'
import { evaluateVisibilityGuards, type EvaluationContext } from './visibilityGuards'
import { resolveDataBindings } from './dataLoader'
import { ErrorBoundary } from '@/components/error-boundary'

// Import block components
import { ContainerBlock } from './blocks/ContainerBlock'
import { HeroBlock } from './blocks/HeroBlock'
import { HeadingBlock } from './blocks/HeadingBlock'
import { ParagraphBlock } from './blocks/ParagraphBlock'
import { ButtonBlock } from './blocks/ButtonBlock'
import { ImageBlock } from './blocks/ImageBlock'
import { VideoBlock } from './blocks/VideoBlock'
import { DividerBlock } from './blocks/DividerBlock'
import { SpacerBlock } from './blocks/SpacerBlock'
import { CardBlock } from './blocks/CardBlock'
import { CardGridBlock } from './blocks/CardGridBlock'
import { AccordionBlock } from './blocks/AccordionBlock'
import { TabsBlock } from './blocks/TabsBlock'
import { FormBlock } from './blocks/FormBlock'
import { TicketListBlock } from './blocks/TicketListBlock'
import { IncidentListBlock } from './blocks/IncidentListBlock'
import { KBArticleListBlock } from './blocks/KBArticleListBlock'
import { ServiceCatalogBlock } from './blocks/ServiceCatalogBlock'
import { AnnouncementBarBlock } from './blocks/AnnouncementBarBlock'
import { StatsGridBlock } from './blocks/StatsGridBlock'
import { IconGridBlock } from './blocks/IconGridBlock'
import { TestimonialBlock } from './blocks/TestimonialBlock'
import { FAQBlock } from './blocks/FAQBlock'
import { CustomHTMLBlock } from './blocks/CustomHTMLBlock'

export interface BlockRendererProps {
  block: BlockInstance
  dataContext: Record<string, any>
  user?: {
    id: string
    email: string
    role: UserRole
    permissions: string[]
  }
  orgId: string
}

/**
 * Main Block Renderer Component
 * Handles visibility evaluation, data binding, and rendering
 */
export function BlockRenderer({ block, dataContext, user, orgId }: BlockRendererProps) {
  // Evaluate visibility guards
  const evaluationContext: EvaluationContext = {
    user,
    orgId,
    dataContext
  }

  const { visible, fallbackContent } = evaluateVisibilityGuards(
    block.visibilityGuards,
    evaluationContext
  )

  // If not visible, render fallback or nothing
  if (!visible) {
    if (fallbackContent) {
      return <div dangerouslySetInnerHTML={{ __html: fallbackContent }} />
    }
    return null
  }

  // Resolve data bindings in props
  const resolvedProps = resolveDataBindings(block.props, dataContext)

  // Render the block with error boundary
  return (
    <ErrorBoundary fallback={<BlockErrorFallback blockType={block.type} />}>
      <BlockComponent
        type={block.type}
        props={resolvedProps}
        children={block.children}
        dataContext={dataContext}
        user={user}
        orgId={orgId}
      />
    </ErrorBoundary>
  )
}

/**
 * Block Component Renderer
 * Maps block types to their respective components
 */
interface BlockComponentProps {
  type: BlockInstance['type']
  props: BlockProps
  children?: BlockInstance[]
  dataContext: Record<string, any>
  user?: BlockRendererProps['user']
  orgId: string
}

function BlockComponent({ type, props, children, dataContext, user, orgId }: BlockComponentProps) {
  // Render children recursively if present
  const renderedChildren = children?.map((child) => (
    <BlockRenderer
      key={child.id}
      block={child}
      dataContext={dataContext}
      user={user}
      orgId={orgId}
    />
  ))

  // Map block type to component
  switch (type) {
    case 'container':
      return <ContainerBlock props={props}>{renderedChildren}</ContainerBlock>

    case 'hero':
      return <HeroBlock props={props}>{renderedChildren}</HeroBlock>

    case 'heading':
      return <HeadingBlock props={props} />

    case 'paragraph':
      return <ParagraphBlock props={props} />

    case 'button':
      return <ButtonBlock props={props} />

    case 'image':
      return <ImageBlock props={props} />

    case 'video':
      return <VideoBlock props={props} />

    case 'divider':
      return <DividerBlock props={props} />

    case 'spacer':
      return <SpacerBlock props={props} />

    case 'card':
      return <CardBlock props={props}>{renderedChildren}</CardBlock>

    case 'card-grid':
      return <CardGridBlock props={props}>{renderedChildren}</CardGridBlock>

    case 'accordion':
      return <AccordionBlock props={props} />

    case 'tabs':
      return <TabsBlock props={props} />

    case 'form':
      return <FormBlock props={props} user={user} orgId={orgId} />

    case 'ticket-list':
      return <TicketListBlock props={props} user={user} orgId={orgId} />

    case 'incident-list':
      return <IncidentListBlock props={props} user={user} orgId={orgId} />

    case 'kb-article-list':
      return <KBArticleListBlock props={props} orgId={orgId} />

    case 'service-catalog':
      return <ServiceCatalogBlock props={props} user={user} orgId={orgId} />

    case 'announcement-bar':
      return <AnnouncementBarBlock props={props} />

    case 'stats-grid':
      return <StatsGridBlock props={props} />

    case 'icon-grid':
      return <IconGridBlock props={props} />

    case 'testimonial':
      return <TestimonialBlock props={props} />

    case 'faq':
      return <FAQBlock props={props} />

    case 'custom-html':
      return <CustomHTMLBlock props={props} />

    default:
      return <BlockNotFound type={type} />
  }
}

/**
 * Block Error Fallback
 */
function BlockErrorFallback({ blockType }: { blockType: string }) {
  return (
    <div className="border-2 border-dashed border-red-300 bg-red-50 p-4 rounded">
      <p className="text-sm text-red-600">
        Error rendering block: <code className="font-mono">{blockType}</code>
      </p>
      <p className="text-xs text-red-500 mt-1">
        This block could not be rendered due to an error. Please contact support if this persists.
      </p>
    </div>
  )
}

/**
 * Block Not Found
 */
function BlockNotFound({ type }: { type: string }) {
  return (
    <div className="border-2 border-dashed border-gray-300 bg-gray-50 p-4 rounded">
      <p className="text-sm text-gray-600">
        Unknown block type: <code className="font-mono">{type}</code>
      </p>
      <p className="text-xs text-gray-500 mt-1">
        This block type is not supported in the current renderer version.
      </p>
    </div>
  )
}
