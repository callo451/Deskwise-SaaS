'use client'

import { BlockInstance } from '@/lib/types'
import { useComposerStore } from '@/lib/stores/composer-store'
import { getBlockDefinition } from '@/lib/portal-blocks'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'

interface BlockRendererProps {
  block: BlockInstance
}

// Helper function to dynamically render Lucide icons
const renderIcon = (iconName: string, className?: string) => {
  const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle
  return <IconComponent className={className} />
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const { selectedBlockId, hoveredBlockId, selectBlock, hoverBlock, deleteBlock, duplicateBlock, previewMode } = useComposerStore()
  const definition = getBlockDefinition(block.type)
  const isSelected = selectedBlockId === block.id
  const isHovered = hoveredBlockId === block.id
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0)
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block-${block.id}`,
    data: { blockId: block.id, type: block.type },
    disabled: previewMode, // Disable dragging in preview mode
  })

  // Always call useDroppable at top level, but conditionally enable/disable it
  const isContainer = block.type === 'container' || block.type === 'card-grid' || block.type === 'tabs'
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `droppable-${block.id}`,
    data: { blockId: block.id, acceptsChildren: isContainer },
    disabled: !isContainer, // Only enable for container blocks
  })

  if (!definition) return null

  const renderBlockContent = () => {
    switch (block.type) {
      case 'container': {
        const containerProps = block.props
        const layout = containerProps.layout || {}
        const dimensions = containerProps.dimensions || {}
        const spacing = containerProps.spacing || {}
        const background = containerProps.background || {}
        const border = containerProps.border || {}
        const effects = containerProps.effects || {}
        const position = containerProps.position || {}
        const responsive = containerProps.responsive || {}

        // Use droppable hooks from top level (no hook calls inside switch!)
        return (
          <div
            ref={setDropRef}
            className={cn(
              'border-2 border-dashed rounded-md min-h-[100px]',
              layout.display === 'flex' && 'flex',
              layout.display === 'grid' && 'grid',
              layout.display === 'block' && 'block',
              isOver ? 'border-primary bg-primary/5' : 'border-gray-300'
            )}
            style={{
              // Layout & Flexbox
              display: layout.display || 'flex',
              flexDirection: layout.direction || 'column',
              flexWrap: layout.wrap || 'nowrap',
              gap: `${layout.gap || 16}px`,
              alignItems: layout.align || 'start',
              justifyContent: layout.justify || 'start',
              alignContent: layout.alignContent || 'start',

              // Dimensions
              width: layout.container === 'fixed' ? '1200px' : layout.container === 'fluid' ? '90%' : layout.container === 'full' ? '100%' : dimensions.width || 'auto',
              minWidth: dimensions.minWidth ? `${dimensions.minWidth}px` : undefined,
              maxWidth: dimensions.maxWidth !== 'none' ? dimensions.maxWidth : undefined,
              height: dimensions.height || 'auto',
              minHeight: dimensions.minHeight ? `${dimensions.minHeight}px` : undefined,
              maxHeight: dimensions.maxHeight !== 'none' ? dimensions.maxHeight : undefined,

              // Spacing
              paddingTop: `${spacing.paddingTop || 16}px`,
              paddingRight: `${spacing.paddingRight || 16}px`,
              paddingBottom: `${spacing.paddingBottom || 16}px`,
              paddingLeft: `${spacing.paddingLeft || 16}px`,
              marginTop: `${spacing.marginTop || 0}px`,
              marginRight: `${spacing.marginRight || 0}px`,
              marginBottom: `${spacing.marginBottom || 0}px`,
              marginLeft: `${spacing.marginLeft || 0}px`,

              // Background
              backgroundColor: background.color || 'transparent',
              backgroundImage: background.imageUrl ? `url(${background.imageUrl})` : background.gradient || undefined,
              backgroundSize: background.imageSize || 'cover',
              backgroundPosition: background.imagePosition || 'center',
              backgroundAttachment: background.imageAttachment || 'scroll',

              // Border
              borderWidth: border.width ? `${border.width}px` : '0',
              borderStyle: border.style || 'solid',
              borderColor: border.color || 'transparent',
              borderTopLeftRadius: `${border.radiusTopLeft || 0}px`,
              borderTopRightRadius: `${border.radiusTopRight || 0}px`,
              borderBottomLeftRadius: `${border.radiusBottomLeft || 0}px`,
              borderBottomRightRadius: `${border.radiusBottomRight || 0}px`,

              // Effects
              boxShadow: effects.shadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                        effects.shadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                        effects.shadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' :
                        effects.shadow === 'xl' ? '0 20px 25px -5px rgb(0 0 0 / 0.1)' :
                        effects.shadow === 'inner' ? 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)' :
                        'none',
              backdropFilter: effects.backdropBlur ? `blur(${effects.backdropBlur}px)` : undefined,
              opacity: effects.opacity !== undefined ? effects.opacity / 100 : 1,

              // Position
              position: position.type || 'relative',
              zIndex: position.zIndex || 0,
              overflow: position.overflow || 'visible',
            }}
          >
            {block.children && block.children.length > 0 ? (
              block.children.map((child) => <BlockRenderer key={child.id} block={child} />)
            ) : (
              <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                Drop blocks here
              </div>
            )}
          </div>
        )
      }

      case 'heading':
        const HeadingTag = `h${block.props.text?.level || 2}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag
            className="font-bold"
            style={{
              textAlign: block.props.text?.align || 'left',
              color: block.props.text?.color || 'inherit',
              fontSize:
                block.props.text?.level === 1
                  ? '2.5rem'
                  : block.props.text?.level === 2
                  ? '2rem'
                  : block.props.text?.level === 3
                  ? '1.75rem'
                  : block.props.text?.level === 4
                  ? '1.5rem'
                  : block.props.text?.level === 5
                  ? '1.25rem'
                  : '1rem',
            }}
          >
            {block.props.text?.content || 'Heading Text'}
          </HeadingTag>
        )

      case 'paragraph':
        return (
          <div
            className="prose max-w-none"
            style={{
              textAlign: block.props.text?.align || 'left',
              fontSize: block.props.text?.size || '1rem',
            }}
            dangerouslySetInnerHTML={{ __html: block.props.text?.content || 'Enter text here...' }}
          />
        )

      case 'button':
        return (
          <button
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded font-medium transition-colors',
              {
                'bg-primary text-primary-foreground hover:bg-primary/90':
                  block.props.button?.variant === 'default' || !block.props.button?.variant,
                'bg-blue-600 text-white hover:bg-blue-700': block.props.button?.variant === 'primary',
                'bg-gray-200 text-gray-900 hover:bg-gray-300':
                  block.props.button?.variant === 'secondary',
                'border border-input bg-background hover:bg-accent':
                  block.props.button?.variant === 'outline',
                'hover:bg-accent hover:text-accent-foreground': block.props.button?.variant === 'ghost',
                'h-9 px-3 text-sm': block.props.button?.size === 'sm',
                'h-10 px-4': block.props.button?.size === 'md' || !block.props.button?.size,
                'h-11 px-8': block.props.button?.size === 'lg',
              }
            )}
          >
            {block.props.button?.icon && (
              <span className="w-4 h-4">
                {(() => {
                  const IconComp = (Icons as any)[block.props.button.icon]
                  return IconComp ? <IconComp className="w-4 h-4" /> : null
                })()}
              </span>
            )}
            {block.props.button?.text || 'Click Me'}
          </button>
        )

      case 'image':
        return (
          <img
            src={block.props.image?.src || 'https://via.placeholder.com/800x400'}
            alt={block.props.image?.alt || 'Image'}
            className="max-w-full h-auto rounded"
            style={{
              width: block.props.image?.width || '100%',
              height: block.props.image?.height || 'auto',
              objectFit: block.props.image?.objectFit || 'cover',
            }}
          />
        )

      case 'divider':
        return (
          <hr
            className="border-0"
            style={{
              height:
                block.props.divider?.orientation === 'horizontal'
                  ? `${block.props.divider?.thickness || 1}px`
                  : 'auto',
              width:
                block.props.divider?.orientation === 'vertical'
                  ? `${block.props.divider?.thickness || 1}px`
                  : '100%',
              backgroundColor: block.props.divider?.color || '#e5e7eb',
            }}
          />
        )

      case 'spacer':
        return (
          <div
            style={{
              height: `${block.props.spacer?.height || 32}px`,
              width: `${block.props.spacer?.width || 0}px`,
            }}
          />
        )

      case 'card': {
        const cardProps = block.props
        const linkType = cardProps.interaction?.linkType || 'none'
        const serviceCatalogId = cardProps.interaction?.serviceCatalogId
        const customHref = cardProps.interaction?.href
        const openInNewTab = cardProps.interaction?.openInNewTab

        // Generate href based on link type
        let href = ''
        if (linkType === 'service-catalog' && serviceCatalogId) {
          href = `/portal/service-request/${serviceCatalogId}`
        } else if (linkType === 'url' && customHref) {
          href = customHref
        }

        const cardContent = (
          <div
            className={cn(
              'rounded-lg p-6',
              {
                'border border-border': cardProps.card?.variant === 'bordered',
                'shadow-md': cardProps.card?.variant === 'elevated',
                'bg-card': !cardProps.card?.variant || cardProps.card?.variant === 'default',
                'cursor-pointer hover:shadow-lg transition-shadow': href !== '',
              }
            )}
          >
            {cardProps.card?.image && (
              <img
                src={cardProps.card.image}
                alt={cardProps.card.title || 'Card'}
                className="w-full h-48 object-cover rounded-t-lg -mt-6 -mx-6 mb-4"
              />
            )}
            {cardProps.card?.title && (
              <h3 className="text-xl font-semibold mb-2">{cardProps.card.title}</h3>
            )}
            {cardProps.card?.description && (
              <p className="text-muted-foreground">{cardProps.card.description}</p>
            )}
            {block.children && block.children.length > 0 && (
              <div className="mt-4 space-y-2">
                {block.children.map((child) => (
                  <BlockRenderer key={child.id} block={child} />
                ))}
              </div>
            )}
          </div>
        )

        // Wrap in link if href exists
        if (href) {
          return (
            <a
              href={href}
              target={openInNewTab ? '_blank' : undefined}
              rel={openInNewTab ? 'noopener noreferrer' : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              {cardContent}
            </a>
          )
        }

        return cardContent
      }

      case 'hero':
        return (
          <div
            className="relative w-full rounded-lg overflow-hidden"
            style={{
              height: `${block.props.image?.height || 400}px`,
              backgroundImage: block.props.image?.src
                ? `url(${block.props.image.src})`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ backgroundColor: block.props.style?.backgroundColor || 'rgba(0,0,0,0.5)' }}
            >
              <div className="text-center px-4 max-w-4xl">
                <h1
                  className="text-4xl md:text-5xl font-bold text-white mb-4"
                  style={{ textAlign: block.props.text?.align || 'center' }}
                >
                  {block.props.text?.content || 'Welcome to Our Portal'}
                </h1>
                {block.props.text?.size && (
                  <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                    {block.props.text.size}
                  </p>
                )}
                <div className="flex items-center justify-center gap-4">
                  {block.props.button?.text && (
                    <button className="px-6 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                      {block.props.button.icon && renderIcon(block.props.button.icon, 'w-5 h-5 inline mr-2')}
                      {block.props.button.text}
                    </button>
                  )}
                  {block.props.button?.href && (
                    <button className="px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors">
                      Learn More
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'card-grid': {
        const gridProps = block.props
        const grid = gridProps.grid || {}
        const gridSpacing = gridProps.spacing || {}
        const gridStyle = gridProps.style || {}
        const hover = gridProps.hover || {}
        const animation = gridProps.animation || {}
        const gridResponsive = gridProps.responsive || {}

        // Use droppable hooks from top level (no hook calls inside switch!)
        const cardVariantClasses = {
          bordered: 'border border-border',
          elevated: 'shadow-md',
          flat: 'bg-card',
          outlined: 'border-2 border-border',
          ghost: 'bg-transparent',
        }

        const shadowClasses = {
          none: '',
          xs: 'shadow-xs',
          sm: 'shadow-sm',
          md: 'shadow-md',
          lg: 'shadow-lg',
          xl: 'shadow-xl',
        }

        return (
          <div
            ref={setDropRef}
            className={cn(
              'grid border-2 border-dashed rounded-md min-h-[200px] p-4',
              grid.layoutMode === 'masonry' && 'masonry',
              grid.layoutMode === 'auto' && 'grid-auto-fit',
              isOver ? 'border-primary bg-primary/5' : 'border-gray-300'
            )}
            style={{
              // Grid Layout
              gridTemplateColumns: grid.layoutMode === 'fixed'
                ? `repeat(${grid.columns || 3}, 1fr)`
                : grid.layoutMode === 'auto'
                ? `repeat(auto-fit, minmax(${grid.minCardWidth || 280}px, ${grid.maxCardWidth || 400}px))`
                : `repeat(${grid.columns || 3}, 1fr)`,

              // Spacing
              columnGap: `${gridSpacing.columnGap || 24}px`,
              rowGap: `${gridSpacing.rowGap || 24}px`,
              padding: `${gridSpacing.containerPadding || 0}px`,

              // Alignment
              alignItems: grid.alignment || 'start',
              justifyContent: grid.justifyContent || 'start',

              // Responsive
              '@media (max-width: 768px)': {
                gridTemplateColumns: gridResponsive.stackOnMobile ? '1fr' : `repeat(${grid.responsiveColumns?.mobile || 1}, 1fr)`,
                gap: gridResponsive.reduceGapOnMobile ? `${gridResponsive.mobileGap || 16}px` : undefined,
                justifyContent: gridResponsive.centerOnMobile ? 'center' : undefined,
              },
            }}
          >
            {block.children && block.children.length > 0 ? (
              block.children.map((child) => (
                <div
                  key={child.id}
                  className={cn(
                    cardVariantClasses[gridStyle.variant as keyof typeof cardVariantClasses] || cardVariantClasses.bordered,
                    shadowClasses[gridStyle.shadowDepth as keyof typeof shadowClasses],
                    hover.enabled && 'transition-all duration-200',
                    hover.effect === 'lift' && hover.enabled && 'hover:-translate-y-1',
                    hover.shadowIncrease && hover.enabled && 'hover:shadow-lg',
                    grid.equalHeight && 'h-full'
                  )}
                  style={{
                    padding: `${gridSpacing.cardPadding || 24}px`,
                    borderRadius: `${gridStyle.borderRadius || 12}px`,
                    borderWidth: `${gridStyle.borderWidth || 1}px`,
                    borderColor: gridStyle.borderColor || 'border',
                    transform: hover.effect === 'scale' && hover.enabled ? `scale(${hover.scale || 1.02})` : undefined,
                    transitionDuration: hover.enabled ? `${hover.transitionDuration || 200}ms` : undefined,
                    animation: animation.enabled ? `${animation.entrance || 'fade-up'} ${animation.stagger ? `${animation.staggerDelay || 50}ms` : '0ms'}` : undefined,
                  }}
                >
                  <BlockRenderer block={child} />
                </div>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center h-32 text-sm text-muted-foreground">
                Drop blocks here to create cards
              </div>
            )}
          </div>
        )
      }

      case 'tabs': {
        const tabsProps = block.props
        const tabItems = tabsProps.items || [
          { label: 'Tab 1', icon: '', badge: '', children: [] },
          { label: 'Tab 2', icon: '', badge: '', children: [] },
        ]
        const tabDisplay = tabsProps.display || {}
        const tabStyle = tabsProps.style || {}
        const tabAnimation = tabsProps.animation || {}

        // Get children for each tab (stored in tab.children or fallback to empty)
        const getTabChildren = (tabIndex: number) => {
          return tabItems[tabIndex]?.children || []
        }

        const tabVariantClasses = {
          underline: 'border-b',
          pills: 'rounded-full bg-muted',
          bordered: 'border',
          enclosed: 'border border-b-0',
        }

        const tabSpacingClasses = {
          compact: 'gap-1',
          comfortable: 'gap-2',
          spacious: 'gap-4',
        }

        // Create a droppable for each tab using a separate hook call pattern
        const TabPanel = ({ tabIndex }: { tabIndex: number }) => {
          const { setNodeRef: setTabDropRef, isOver: isTabOver } = useDroppable({
            id: `droppable-tab-${block.id}-${tabIndex}`,
            data: { blockId: block.id, tabIndex, acceptsChildren: true },
          })

          const tabChildren = getTabChildren(tabIndex)

          return (
            <div
              ref={setTabDropRef}
              className={cn(
                'p-4 border-2 border-dashed rounded-md min-h-[150px]',
                isTabOver ? 'border-primary bg-primary/5' : 'border-gray-300'
              )}
              style={{
                animation: tabAnimation.enabled ? `${tabAnimation.transition || 'fade'}-in ${tabAnimation.duration || 200}ms` : undefined,
              }}
            >
              {tabChildren && tabChildren.length > 0 ? (
                <div className="space-y-2">
                  {tabChildren.map((child: any) => (
                    <BlockRenderer key={child.id} block={child} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
                  Drop blocks here
                </div>
              )}
            </div>
          )
        }

        return (
          <div className="border rounded-lg overflow-hidden">
            <div
              className={cn(
                'flex',
                tabDisplay.orientation === 'vertical' ? 'flex-col' : 'flex-row',
                tabDisplay.alignment === 'center' && 'justify-center',
                tabDisplay.alignment === 'end' && 'justify-end',
                tabDisplay.alignment === 'between' && 'justify-between',
                tabSpacingClasses[tabStyle.tabSpacing as keyof typeof tabSpacingClasses] || tabSpacingClasses.comfortable,
                tabDisplay.variant !== 'underline' && 'bg-muted p-1'
              )}
            >
              {tabItems.map((tab: any, index: number) => {
                const isActive = index === activeTabIndex
                const TabIcon = tab.icon && (Icons as any)[tab.icon]

                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTabIndex(index)
                    }}
                    className={cn(
                      'px-4 py-2 text-sm font-medium transition-all flex items-center gap-2',
                      tabDisplay.fullWidth && 'flex-1',

                      // Variant styles
                      tabDisplay.variant === 'underline' && [
                        isActive && 'border-b-2 border-primary text-foreground',
                        !isActive && 'text-muted-foreground hover:text-foreground',
                      ],
                      tabDisplay.variant === 'pills' && [
                        isActive && 'bg-background text-foreground shadow-sm',
                        !isActive && 'text-muted-foreground hover:bg-background/50',
                        'rounded-full',
                      ],
                      tabDisplay.variant === 'bordered' && [
                        isActive && 'bg-background text-foreground border-primary',
                        !isActive && 'text-muted-foreground hover:bg-background/50 border-transparent',
                        'border rounded',
                      ],
                      tabDisplay.variant === 'enclosed' && [
                        isActive && 'bg-background text-foreground border-primary',
                        !isActive && 'text-muted-foreground hover:bg-background/50',
                        'border border-b-0 rounded-t',
                      ],

                      // Animation
                      tabAnimation.enabled && `transition-all duration-${tabAnimation.duration || 200}`,
                    )}
                    style={{
                      color: isActive ? (tabStyle.activeColor === 'primary' ? 'var(--primary)' : tabStyle.activeColor === 'secondary' ? 'var(--secondary)' : tabStyle.activeColor) : undefined,
                    }}
                  >
                    {tabStyle.showIcons && TabIcon && <TabIcon className="w-4 h-4" />}
                    {tab.label}
                    {tabStyle.showBadges && tab.badge && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Render only the active tab panel */}
            <TabPanel tabIndex={activeTabIndex} />
          </div>
        )
      }

      case 'accordion':
        const accordionProps = block.props
        const accordionItems = accordionProps.items || [
          { title: 'Section 1', content: 'Content 1', icon: '', defaultOpen: false },
          { title: 'Section 2', content: 'Content 2', icon: '', defaultOpen: false },
        ]
        const accordionDisplay = accordionProps.display || {}
        const accordionStyle = accordionProps.style || {}
        const accordionAnimation = accordionProps.animation || {}
        const accordionColors = accordionProps.colors || {}

        const accordionSpacingClasses = {
          compact: 'space-y-1',
          comfortable: 'space-y-2',
          spacious: 'space-y-4',
        }

        const expandIconMap = {
          chevron: Icons.ChevronDown,
          plus: Icons.Plus,
          arrow: Icons.ArrowDown,
          caret: Icons.ChevronDown,
        }

        const ExpandIcon = expandIconMap[accordionStyle.expandIcon as keyof typeof expandIconMap] || Icons.ChevronDown

        return (
          <div
            className={cn(
              accordionSpacingClasses[accordionDisplay.spacing as keyof typeof accordionSpacingClasses] || accordionSpacingClasses.comfortable
            )}
          >
            {accordionItems.map((item: any, index: number) => {
              const isOpen = item.defaultOpen || index === 0
              const ItemIcon = item.icon && (Icons as any)[item.icon]

              return (
                <div
                  key={index}
                  className={cn(
                    'overflow-hidden',
                    accordionDisplay.variant === 'bordered' && 'border rounded-lg',
                    accordionDisplay.variant === 'separated' && 'border-b last:border-b-0',
                    accordionDisplay.variant === 'contained' && 'border rounded-lg shadow-sm',
                    accordionDisplay.variant === 'default' && 'border-b last:border-b-0'
                  )}
                  style={{
                    borderRadius: `${accordionStyle.borderRadius || 8}px`,
                    borderWidth: `${accordionStyle.borderWidth || 1}px`,
                    borderColor: accordionColors.borderColor || 'var(--border)',
                  }}
                >
                  <button
                    className={cn(
                      'w-full flex items-center gap-3 text-left transition-all',
                      accordionStyle.headerAlign === 'center' && 'justify-center',
                      accordionStyle.headerAlign === 'right' && 'justify-end',
                      accordionStyle.headerPadding === 'compact' && 'p-2',
                      accordionStyle.headerPadding === 'comfortable' && 'p-4',
                      accordionStyle.headerPadding === 'spacious' && 'p-6',
                      'hover:opacity-80'
                    )}
                    style={{
                      backgroundColor: accordionColors.headerBg === 'default'
                        ? 'transparent'
                        : accordionColors.headerBg === 'muted'
                        ? 'var(--muted)'
                        : accordionColors.headerBg === 'accent'
                        ? 'var(--accent)'
                        : accordionColors.headerBg,
                      color: accordionColors.headerText === 'default'
                        ? 'inherit'
                        : accordionColors.headerText,
                      transitionDuration: accordionAnimation.enabled ? `${accordionAnimation.duration || 200}ms` : undefined,
                    }}
                  >
                    {accordionDisplay.showIcons && accordionDisplay.iconPosition === 'left' && ItemIcon && (
                      <ItemIcon className="w-5 h-5 flex-shrink-0" />
                    )}

                    <span className="font-medium flex-1">{item.title}</span>

                    {accordionDisplay.showIcons && accordionDisplay.iconPosition === 'right' && ItemIcon && (
                      <ItemIcon className="w-5 h-5 flex-shrink-0" />
                    )}

                    <ExpandIcon
                      className={cn(
                        'w-4 h-4 flex-shrink-0 transition-transform',
                        isOpen && 'transform rotate-180'
                      )}
                      style={{
                        transitionDuration: accordionAnimation.enabled ? `${accordionAnimation.duration || 200}ms` : undefined,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className={cn(
                        'border-t',
                        accordionStyle.contentPadding === 'compact' && 'p-2',
                        accordionStyle.contentPadding === 'comfortable' && 'p-4',
                        accordionStyle.contentPadding === 'spacious' && 'p-6'
                      )}
                      style={{
                        backgroundColor: accordionColors.contentBg === 'default'
                          ? 'transparent'
                          : accordionColors.contentBg === 'muted'
                          ? 'var(--muted)'
                          : accordionColors.contentBg,
                        borderColor: accordionColors.borderColor || 'var(--border)',
                        animation: accordionAnimation.enabled
                          ? `accordion-slide-down ${accordionAnimation.duration || 200}ms ${accordionAnimation.easing || 'ease-in-out'}`
                          : undefined,
                      }}
                    >
                      <div
                        className="text-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: item.content }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )

      case 'video':
        return (
          <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              {block.props.video?.src ? (
                <iframe
                  src={block.props.video.src}
                  className="w-full h-full"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white">
                  <Icons.Video className="w-12 h-12" />
                  <p className="text-sm">Video preview</p>
                </div>
              )}
            </div>
          </div>
        )

      case 'announcement-bar':
        return (
          <div
            className={cn('px-4 py-3 rounded-lg flex items-center justify-between', {
              'bg-blue-100 text-blue-900': block.props.announcement?.type === 'info',
              'bg-yellow-100 text-yellow-900': block.props.announcement?.type === 'warning',
              'bg-red-100 text-red-900': block.props.announcement?.type === 'error',
              'bg-green-100 text-green-900': block.props.announcement?.type === 'success',
              'bg-muted text-foreground':
                !block.props.announcement?.type || block.props.announcement?.type === 'info',
            })}
          >
            <div className="flex items-center gap-2">
              <Icons.Bell className="w-4 h-4" />
              <span className="text-sm font-medium">
                {block.props.announcement?.message || 'Important announcement goes here'}
              </span>
            </div>
            {block.props.announcement?.dismissible && <Icons.X className="w-4 h-4 cursor-pointer" />}
          </div>
        )

      case 'stats-grid':
        const statsItems = block.props.stats?.items || [
          { label: 'Total Tickets', value: '1,234', icon: 'Ticket', trend: 'up', trendValue: '+12%' },
          { label: 'Resolved', value: '987', icon: 'CheckCircle', trend: 'up', trendValue: '+8%' },
          { label: 'Avg Response', value: '2.5h', icon: 'Clock', trend: 'down', trendValue: '-15%' },
        ]
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statsItems.map((stat, i) => {
              const StatIcon = stat.icon ? (Icons as any)[stat.icon] || Icons.BarChart3 : Icons.BarChart3
              return (
                <div key={i} className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <StatIcon className="w-6 h-6 text-primary" />
                    {stat.trend && (
                      <span
                        className={cn('text-xs font-medium flex items-center gap-1', {
                          'text-green-600': stat.trend === 'up',
                          'text-red-600': stat.trend === 'down',
                          'text-gray-600': stat.trend === 'neutral',
                        })}
                      >
                        {stat.trend === 'up' && <Icons.TrendingUp className="w-3 h-3" />}
                        {stat.trend === 'down' && <Icons.TrendingDown className="w-3 h-3" />}
                        {stat.trendValue}
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              )
            })}
          </div>
        )

      case 'icon-grid':
        const iconGridItems = block.props.iconGrid?.items || [
          { icon: 'Home', title: 'Dashboard', description: 'View your overview', href: '/dashboard' },
          { icon: 'Users', title: 'Team', description: 'Manage your team', href: '/team' },
          { icon: 'Settings', title: 'Settings', description: 'Configure options', href: '/settings' },
          { icon: 'HelpCircle', title: 'Support', description: 'Get help', href: '/support' },
        ]
        const iconGridColumns = block.props.iconGrid?.columns || 4
        return (
          <div
            className={cn('grid gap-6', {
              'grid-cols-1 md:grid-cols-2': iconGridColumns === 2,
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': iconGridColumns === 3,
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-4': iconGridColumns === 4,
            })}
          >
            {iconGridItems.map((item, i) => {
              const IconComp = (Icons as any)[item.icon] || Icons.Box
              const content = (
                <div className="flex flex-col items-center text-center gap-3 p-6 border rounded-lg hover:shadow-md hover:border-primary/50 transition-all group">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComp className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              )

              if (item.href) {
                return (
                  <a key={i} href={item.href} className="cursor-pointer">
                    {content}
                  </a>
                )
              }

              return <div key={i}>{content}</div>
            })}
          </div>
        )

      case 'testimonial':
        const testimonial = block.props.testimonial || {
          quote: 'This portal has transformed how we manage our IT services. Highly recommended!',
          author: 'John Doe',
          role: 'CTO, Example Corp',
        }
        return (
          <div className="p-8 border rounded-lg bg-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            <Icons.Quote className="w-10 h-10 text-primary/40 mb-6 relative" />
            <p className="text-lg mb-6 italic relative leading-relaxed">
              "{testimonial.quote}"
            </p>
            <div className="flex items-center gap-4 relative">
              {testimonial.avatar ? (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Icons.User className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold text-base">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </div>
          </div>
        )

      case 'faq':
        const faqItems = block.props.faq?.items || [
          { question: 'How do I submit a ticket?', answer: 'Click the "New Ticket" button in the navigation menu, fill out the form with details about your issue, and submit. You will receive a confirmation email with your ticket number.' },
          { question: 'What are your support hours?', answer: 'We provide 24/7 support for critical issues. Standard support is available Monday-Friday, 8:00 AM - 6:00 PM EST. Premium customers have access to extended support hours.' },
          { question: 'How long does it take to resolve a ticket?', answer: 'Resolution time depends on the priority and complexity of the issue. Critical issues are addressed within 1 hour, high priority within 4 hours, and standard issues within 24 hours.' },
        ]
        return (
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div key={i} className="border rounded-lg overflow-hidden bg-card">
                <button
                  onClick={() => setExpandedFaqIndex(expandedFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <Icons.HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{item.question}</span>
                  </div>
                  <Icons.ChevronDown
                    className={cn('w-5 h-5 text-muted-foreground transition-transform flex-shrink-0', {
                      'transform rotate-180': expandedFaqIndex === i,
                    })}
                  />
                </button>
                {expandedFaqIndex === i && (
                  <div className="px-4 pb-4 pt-0 pl-12">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )

      case 'custom-html':
        return (
          <div className="p-4 border-2 border-dashed rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icons.Code className="w-5 h-5" />
              <span className="text-sm">Custom HTML Content (sanitized)</span>
            </div>
          </div>
        )

      case 'form':
        const formTitle = block.props.form?.title || 'Service Request Form'
        const formDescription = block.props.form?.description || 'Fill out this form to submit a service request'
        const formFields = [
          { name: 'service', label: 'Service Type', type: 'select', required: true },
          { name: 'priority', label: 'Priority', type: 'select', required: true },
          { name: 'subject', label: 'Subject', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'attachment', label: 'Attachments', type: 'file', required: false },
        ]
        return (
          <div className="p-6 border rounded-lg bg-card space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">{formTitle}</h3>
              <p className="text-sm text-muted-foreground">{formDescription}</p>
            </div>
            <div className="space-y-4">
              {formFields.map((field, i) => (
                <div key={i}>
                  <label className="text-sm font-medium flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'text' && (
                    <div className="mt-1.5 h-10 w-full border rounded-md bg-background px-3 flex items-center text-sm text-muted-foreground">
                      Enter {field.label.toLowerCase()}...
                    </div>
                  )}
                  {field.type === 'select' && (
                    <div className="mt-1.5 h-10 w-full border rounded-md bg-background px-3 flex items-center justify-between text-sm text-muted-foreground">
                      <span>Select {field.label.toLowerCase()}...</span>
                      <Icons.ChevronDown className="w-4 h-4" />
                    </div>
                  )}
                  {field.type === 'textarea' && (
                    <div className="mt-1.5 h-24 w-full border rounded-md bg-background p-3 text-sm text-muted-foreground">
                      Enter detailed {field.label.toLowerCase()}...
                    </div>
                  )}
                  {field.type === 'file' && (
                    <div className="mt-1.5 h-20 w-full border-2 border-dashed rounded-md bg-background flex flex-col items-center justify-center text-sm text-muted-foreground">
                      <Icons.Upload className="w-6 h-6 mb-1" />
                      <span>Click to upload or drag and drop</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
              {block.props.form?.submitButtonText || 'Submit Request'}
            </button>
          </div>
        )

      case 'ticket-list':
        const ticketListData = [
          { id: 1001, title: 'Laptop not turning on', status: 'open', priority: 'high', updated: '2 hours ago' },
          { id: 1002, title: 'Email sync issue', status: 'in-progress', priority: 'medium', updated: '4 hours ago' },
          { id: 1003, title: 'VPN connection problem', status: 'open', priority: 'low', updated: '1 day ago' },
          { id: 1004, title: 'Password reset request', status: 'resolved', priority: 'medium', updated: '2 days ago' },
        ]
        return (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-muted">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icons.Ticket className="w-5 h-5" />
                  <h3 className="font-semibold">My Tickets</h3>
                </div>
                <button className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors">
                  New Ticket
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Icons.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <div className="h-9 w-full border rounded-md bg-background pl-9 pr-3 flex items-center text-sm text-muted-foreground">
                    Search tickets...
                  </div>
                </div>
                <button className="h-9 px-3 border rounded-md bg-background text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors">
                  <Icons.Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>
            </div>
            <div className="divide-y">
              {ticketListData.map((ticket) => (
                <div key={ticket.id} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <Icons.Ticket className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">#{ticket.id} {ticket.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">Updated {ticket.updated}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn('px-2 py-0.5 text-xs rounded-full font-medium', {
                          'bg-yellow-100 text-yellow-800': ticket.status === 'open',
                          'bg-blue-100 text-blue-800': ticket.status === 'in-progress',
                          'bg-green-100 text-green-800': ticket.status === 'resolved',
                        })}
                      >
                        {ticket.status}
                      </span>
                      <span
                        className={cn('px-2 py-0.5 text-xs rounded-full font-medium', {
                          'bg-red-100 text-red-800': ticket.priority === 'high',
                          'bg-orange-100 text-orange-800': ticket.priority === 'medium',
                          'bg-gray-100 text-gray-800': ticket.priority === 'low',
                        })}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t bg-muted/30 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Showing 4 of 12 tickets</span>
              <div className="flex items-center gap-1">
                <button className="p-1 hover:bg-muted rounded" disabled>
                  <Icons.ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 hover:bg-muted rounded">
                  <Icons.ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )

      case 'incident-list':
        return (
          <div className="border rounded-lg overflow-hidden">
            <div className="p-3 border-b bg-muted flex items-center gap-2">
              <Icons.AlertTriangle className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Active Incidents</h3>
            </div>
            <div className="divide-y">
              {['Email Server Outage', 'Network Latency Issues'].map((title, i) => (
                <div key={i} className="p-3 hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{title}</p>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Critical</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Started 30 minutes ago</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'kb-article-list':
        const kbArticles = [
          { title: 'How to Reset Your Password', category: 'Getting Started', rating: 4.5, views: 342, readTime: '3 min' },
          { title: 'VPN Setup Guide', category: 'Security', rating: 4.8, views: 521, readTime: '8 min' },
          { title: 'Email Configuration for Mobile', category: 'Email', rating: 4.2, views: 289, readTime: '5 min' },
          { title: 'Multi-Factor Authentication', category: 'Security', rating: 4.9, views: 634, readTime: '4 min' },
        ]
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icons.BookOpen className="w-5 h-5 text-primary" />
                Knowledge Base
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Icons.Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <div className="h-9 w-48 border rounded-md bg-background pl-8 pr-3 flex items-center text-sm text-muted-foreground">
                    Search articles...
                  </div>
                </div>
              </div>
            </div>
            {kbArticles.map((article, i) => (
              <div key={i} className="p-4 border rounded-lg hover:bg-muted/50 hover:border-primary/50 cursor-pointer transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icons.FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium group-hover:text-primary transition-colors">{article.title}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <Icons.Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{article.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full bg-muted">{article.category}</span>
                      <span className="flex items-center gap-1">
                        <Icons.Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icons.Eye className="w-3 h-3" />
                        {article.views} views
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'service-catalog':
        const catalogServices = [
          { name: 'New Laptop', icon: 'Laptop', category: 'Hardware', description: 'Request a new laptop or workstation', estimatedTime: '3-5 days', popular: true },
          { name: 'Software License', icon: 'ShoppingCart', category: 'Software', description: 'Request software licenses', estimatedTime: '1-2 days', popular: true },
          { name: 'Access Request', icon: 'Key', category: 'Security', description: 'Request access to systems or data', estimatedTime: '2-4 hours', popular: false },
          { name: 'Email Account', icon: 'Mail', category: 'Email', description: 'Create new email account', estimatedTime: '1 day', popular: false },
          { name: 'VPN Access', icon: 'Shield', category: 'Security', description: 'Request VPN credentials', estimatedTime: '4 hours', popular: true },
          { name: 'Office Supplies', icon: 'Package', category: 'General', description: 'Order office supplies', estimatedTime: '1 week', popular: false },
        ]
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icons.Grid3x3 className="w-5 h-5 text-primary" />
                Service Catalog
              </h3>
              <div className="flex items-center gap-2">
                <button className="h-9 px-3 border rounded-md bg-background text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors">
                  <Icons.LayoutGrid className="w-4 h-4" />
                </button>
                <button className="h-9 px-3 border rounded-md bg-muted text-sm flex items-center gap-2">
                  <Icons.List className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catalogServices.map((service, i) => {
                const ServiceIcon = (Icons as any)[service.icon] || Icons.Package
                return (
                  <div key={i} className="p-5 border rounded-lg hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group relative">
                    {service.popular && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        Popular
                      </span>
                    )}
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <ServiceIcon className="w-7 h-7 text-primary" />
                    </div>
                    <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">{service.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground">{service.category}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Icons.Clock className="w-3 h-3" />
                        {service.estimatedTime}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 rounded bg-gray-50">
            <p className="text-sm text-muted-foreground">
              {definition.label} block (preview not implemented)
            </p>
          </div>
        )
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...(!previewMode && listeners)}
      {...(!previewMode && attributes)}
      className={cn(
        'relative group transition-all',
        !previewMode && isDragging && 'opacity-50',
        !previewMode && isSelected && 'ring-2 ring-primary ring-offset-2',
        !previewMode && isHovered && !isSelected && 'ring-2 ring-blue-300'
      )}
      onClick={(e) => {
        if (!previewMode) {
          e.stopPropagation()
          selectBlock(block.id)
        }
      }}
      onMouseEnter={() => !previewMode && hoverBlock(block.id)}
      onMouseLeave={() => !previewMode && hoverBlock(null)}
    >
      {/* Block toolbar */}
      {!previewMode && (isSelected || isHovered) && (
        <div className="absolute -top-8 left-0 right-0 flex items-center justify-between px-2 py-1 bg-primary text-primary-foreground text-xs rounded-t-md z-10">
          <span className="font-medium">{definition.label}</span>
          <div className="flex items-center gap-1">
            <button
              className="p-1 hover:bg-primary-foreground/20 rounded"
              onClick={(e) => {
                e.stopPropagation()
                duplicateBlock(block.id)
              }}
              title="Duplicate block"
            >
              <Icons.Copy className="w-3 h-3" />
            </button>
            <button
              className="p-1 hover:bg-primary-foreground/20 rounded"
              onClick={(e) => {
                e.stopPropagation()
                deleteBlock(block.id)
              }}
              title="Delete block"
            >
              <Icons.Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {renderBlockContent()}
    </div>
  )
}
