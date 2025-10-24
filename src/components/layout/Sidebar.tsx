'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import {
  LayoutDashboard,
  Ticket,
  AlertCircle,
  FolderKanban,
  Calendar,
  GitBranch,
  HardDrive,
  Package,
  BookOpen,
  Users,
  FileText,
  DollarSign,
  Settings,
  Headphones,
  ClipboardList,
  Wrench,
  FolderOpen,
  Map,
  GraduationCap,
  Globe,
  UserCircle,
  Shield,
  BarChart3,
  ListChecks,
  Bug,
  Workflow,
  ChevronDown,
  ChevronRight,
  UserCog,
  Briefcase,
} from 'lucide-react'

// Navigation structure organized by service management categories
interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  adminOnly?: boolean
  mspOnly?: boolean
  subItems?: NavigationItem[]
}

interface NavigationCategory {
  name: string
  icon?: React.ComponentType<{ className?: string }>
  items: NavigationItem[]
  mspOnly?: boolean // Only show for MSP mode organizations
}

const navigationCategories: NavigationCategory[] = [
  {
    name: 'Overview',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    name: 'Service Desk',
    icon: Headphones,
    items: [
      { name: 'Tickets', href: '/unified-tickets', icon: Ticket },
    ],
  },
  {
    name: 'Projects',
    icon: Wrench,
    items: [
      {
        name: 'Projects',
        icon: FolderKanban,
        subItems: [
          { name: 'Projects', href: '/projects', icon: FolderKanban },
          { name: 'Resources', href: '/resources', icon: UserCog },
          { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
        ],
      },
      { name: 'Scheduling', href: '/scheduling', icon: Calendar },
      { name: 'Workflows', href: '/workflows', icon: Workflow },
      {
        name: 'Analytics',
        icon: BarChart3,
        subItems: [
          { name: 'Overview', href: '/analytics/overview', icon: BarChart3 },
          { name: 'Service Desk', href: '/analytics/tickets', icon: Ticket },
          { name: 'Incidents', href: '/analytics/incidents', icon: AlertCircle },
          { name: 'Projects', href: '/analytics/projects', icon: FolderKanban },
          { name: 'Assets', href: '/analytics/assets', icon: HardDrive },
          { name: 'SLA Performance', href: '/analytics/sla', icon: FileText },
          { name: 'Reports', href: '/analytics/reports/library', icon: FileText },
        ],
      },
    ],
  },
  {
    name: 'Assets & Inventory',
    icon: HardDrive,
    items: [
      { name: 'Assets', href: '/assets', icon: HardDrive },
      { name: 'Inventory', href: '/inventory', icon: Package },
    ],
  },
  {
    name: 'Knowledge & Resources',
    icon: BookOpen,
    items: [
      { name: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
    ],
  },
  {
    name: 'Business',
    icon: DollarSign,
    mspOnly: true, // Only show for MSP organizations
    items: [
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Products', href: '/products', icon: Package },
      { name: 'Quoting', href: '/quotes', icon: FileText },
      { name: 'Billing', href: '/billing', icon: DollarSign },
    ],
  },
  {
    name: 'Administration',
    icon: Settings,
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const { data: session } = useSession()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Get organization mode from session
  const orgMode = (session?.user as any)?.orgMode || 'internal'
  const isMSP = orgMode === 'msp'

  // Filter navigation categories based on org mode
  const visibleCategories = navigationCategories.filter(category => {
    // If category is mspOnly, only show for MSP orgs
    if (category.mspOnly) {
      return isMSP
    }
    return true
  })

  // Auto-expand Analytics if we're on an analytics page
  useEffect(() => {
    if (pathname.startsWith('/analytics')) {
      setExpandedItems(prev => ({ ...prev, Analytics: true }))
    }
  }, [pathname])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }))
  }

  // Determine which logo to show
  // If theme is 'system', check the actual applied theme from document
  const getLogoSrc = () => {
    if (typeof window === 'undefined') return '/deskwise_light.png'

    if (theme === 'dark') {
      return '/deskwise_dark.png'
    } else if (theme === 'light') {
      return '/deskwise_light.png'
    } else {
      // For system theme, check the actual applied class
      const isDark = document.documentElement.classList.contains('dark')
      return isDark ? '/deskwise_dark.png' : '/deskwise_light.png'
    }
  }

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src={getLogoSrc()}
            alt="Deskwise Logo"
            width={140}
            height={32}
            className="h-8 w-auto object-contain"
            priority
            unoptimized
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {visibleCategories.map((category, categoryIndex) => (
            <div key={category.name}>
              {/* Category Header */}
              <div className="flex items-center gap-2 px-3 mb-2">
                {category.icon && (
                  <category.icon className="w-4 h-4 text-muted-foreground/60" />
                )}
                <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
                  {category.name}
                </h3>
              </div>

              {/* Category Items */}
              <div className="space-y-1">
                {category.items.map((item) => {
                  // Check if item has sub-items (expandable)
                  if (item.subItems && item.subItems.length > 0) {
                    const isExpanded = expandedItems[item.name]
                    const hasActiveSubItem = item.subItems.some(
                      subItem => pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
                    )

                    return (
                      <div key={item.name}>
                        {/* Expandable Item Button */}
                        <button
                          onClick={() => toggleExpanded(item.name)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
                            'group relative w-full',
                            hasActiveSubItem
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <item.icon className={cn(
                            'w-5 h-5 transition-transform duration-150',
                            'group-hover:scale-110'
                          )} />
                          <span className="flex-1 text-left">{item.name}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        {/* Sub-Items */}
                        {isExpanded && (
                          <div className="ml-4 mt-1 space-y-1 border-l-2 border-border/50 pl-2">
                            {item.subItems.map((subItem) => {
                              const isActive = pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
                              return (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href!}
                                  className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150',
                                    'group relative',
                                    isActive
                                      ? 'bg-primary text-primary-foreground shadow-sm font-medium'
                                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                  )}
                                >
                                  <subItem.icon className="w-4 h-4" />
                                  <span className="flex-1">{subItem.name}</span>
                                  {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                                  )}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Regular link item
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  return (
                    <Link
                      key={item.name}
                      href={item.href!}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
                        'group relative',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className={cn(
                        'w-5 h-5 transition-transform duration-150',
                        isActive ? '' : 'group-hover:scale-110'
                      )} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-semibold rounded-full',
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-r-full" />
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Visual Separator (except for last category) */}
              {categoryIndex < visibleCategories.length - 1 && (
                <div className="mt-4 mb-2 border-t border-border/50" />
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - Optional user info or quick actions */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="flex-1">ITSM Platform</span>
          <span className="font-semibold">v2.0</span>
        </div>
      </div>
    </div>
  )
}
