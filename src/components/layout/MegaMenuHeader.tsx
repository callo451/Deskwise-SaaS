'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
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
  User,
  LogOut,
  Bell,
  Moon,
  Sun,
  Monitor,
  Search,
  Command,
  Sparkles,
  Zap,
  Menu,
  X,
} from 'lucide-react'

// Navigation structure
interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  featured?: boolean
  subItems?: NavigationItem[]
}

interface MegaMenuSection {
  name: string
  icon: React.ComponentType<{ className?: string }>
  items: NavigationItem[]
  featured?: NavigationItem
  color?: string
}

const megaMenuSections: MegaMenuSection[] = [
  {
    name: 'Service',
    icon: Headphones,
    color: 'from-blue-500 to-cyan-500',
    items: [
      {
        name: 'Tickets',
        href: '/unified-tickets',
        icon: Ticket,
        description: 'Manage all service requests and incidents',
        featured: true
      },
      {
        name: 'Incidents',
        href: '/unified-tickets?type=incident',
        icon: AlertCircle,
        description: 'Track and resolve incidents'
      },
      {
        name: 'Service Requests',
        href: '/unified-tickets?type=service_request',
        icon: Headphones,
        description: 'Handle service requests'
      },
      {
        name: 'Changes',
        href: '/unified-tickets?type=change',
        icon: GitBranch,
        description: 'Manage change requests'
      },
    ],
  },
  {
    name: 'Projects',
    icon: Wrench,
    color: 'from-purple-500 to-pink-500',
    items: [
      {
        name: 'All Projects',
        href: '/projects',
        icon: FolderKanban,
        description: 'View and manage projects',
        featured: true
      },
      {
        name: 'Resources',
        href: '/resources',
        icon: UserCog,
        description: 'Resource allocation & capacity'
      },
      {
        name: 'Portfolio',
        href: '/portfolio',
        icon: Briefcase,
        description: 'Portfolio management'
      },
      {
        name: 'Scheduling',
        href: '/scheduling',
        icon: Calendar,
        description: 'Schedule and calendar'
      },
      {
        name: 'Workflows',
        href: '/workflows',
        icon: Workflow,
        description: 'Automation & workflows'
      },
    ],
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    color: 'from-green-500 to-emerald-500',
    items: [
      {
        name: 'Overview',
        href: '/analytics/overview',
        icon: BarChart3,
        description: 'Executive dashboard',
        featured: true
      },
      {
        name: 'Service',
        href: '/analytics/tickets',
        icon: Ticket,
        description: 'Ticket metrics & KPIs'
      },
      {
        name: 'Incidents',
        href: '/analytics/incidents',
        icon: AlertCircle,
        description: 'Incident analysis'
      },
      {
        name: 'Projects',
        href: '/analytics/projects',
        icon: FolderKanban,
        description: 'Project performance'
      },
      {
        name: 'Assets',
        href: '/analytics/assets',
        icon: HardDrive,
        description: 'Asset insights'
      },
      {
        name: 'SLA Performance',
        href: '/analytics/sla',
        icon: FileText,
        description: 'SLA compliance'
      },
      {
        name: 'Reports',
        href: '/analytics/reports/library',
        icon: FileText,
        description: 'Custom reports'
      },
    ],
  },
  {
    name: 'Assets',
    icon: HardDrive,
    color: 'from-orange-500 to-amber-500',
    items: [
      {
        name: 'Assets',
        href: '/assets',
        icon: HardDrive,
        description: 'Hardware & software assets',
        featured: true
      },
      {
        name: 'Inventory',
        href: '/inventory',
        icon: Package,
        description: 'Inventory management'
      },
    ],
  },
  {
    name: 'Business',
    icon: DollarSign,
    color: 'from-rose-500 to-red-500',
    items: [
      {
        name: 'Clients',
        href: '/clients',
        icon: Users,
        description: 'Client management',
        featured: true
      },
      {
        name: 'Products',
        href: '/products',
        icon: Package,
        description: 'Product catalog'
      },
      {
        name: 'Quoting',
        href: '/quotes',
        icon: FileText,
        description: 'Create & manage quotes'
      },
      {
        name: 'Billing',
        href: '/billing',
        icon: DollarSign,
        description: 'Invoicing & payments'
      },
    ],
  },
]

export function MegaMenuHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get organization mode from session
  const orgMode = (session?.user as any)?.orgMode || 'internal'
  const isMSP = orgMode === 'msp'

  // Filter sections based on org mode
  const visibleSections = megaMenuSections.filter(section => {
    if (section.name === 'Business') return isMSP
    return true
  })

  // Handle scroll for header transparency effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle menu hover with delay
  const handleMenuEnter = (menuName: string) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current)
    }
    setOpenMenu(menuName)
  }

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setOpenMenu(null)
    }, 150)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  // Track mounted state to avoid hydration mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which logo to show
  const getLogoSrc = () => {
    // During SSR or before mount, always return light logo
    if (!mounted || typeof window === 'undefined') return '/deskwise_light.png'

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
    <>
      {/* Spacer for fixed header */}
      <div className="h-[72px]" />

      {/* Main Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-background/80 backdrop-blur-xl border-b shadow-lg'
            : 'bg-background border-b'
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center h-[72px] gap-2">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>

            {/* Logo & Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 group flex-shrink-0">
              <div
                style={{
                  height: '32px',
                  width: '140px',
                  backgroundImage: `url(${getLogoSrc()})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                }}
                className="transition-transform group-hover:scale-105"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                className={cn(
                  'px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all',
                  pathname === '/dashboard'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* Mega Menu Items */}
              {visibleSections.map((section, index) => {
                // Position last 2 menus from the right to prevent overflow
                const isRightAligned = index >= visibleSections.length - 2

                return (
                  <div
                    key={section.name}
                    className="relative"
                    onMouseEnter={() => handleMenuEnter(section.name)}
                    onMouseLeave={handleMenuLeave}
                  >
                    <button
                      className={cn(
                        'px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all',
                        openMenu === section.name
                          ? 'bg-accent text-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <section.icon className="w-4 h-4" />
                      {section.name}
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform',
                          openMenu === section.name && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Mega Menu Dropdown */}
                    {openMenu === section.name && (
                      <div className={cn(
                        "absolute top-full mt-2 w-[400px] animate-in fade-in slide-in-from-top-2 duration-200",
                        isRightAligned ? "right-0" : "left-0"
                      )}>
                      <div className="bg-popover/95 backdrop-blur-xl border rounded-xl shadow-2xl p-6 overflow-hidden">
                        {/* Gradient Background */}
                        <div className={cn(
                          'absolute top-0 right-0 w-64 h-64 bg-gradient-to-br opacity-10 blur-3xl',
                          section.color
                        )} />

                        {/* Featured Item */}
                        {section.items.find(item => item.featured) && (
                          <div className="mb-6 pb-6 border-b">
                            {(() => {
                              const featured = section.items.find(item => item.featured)!
                              const FeaturedIcon = featured.icon
                              return (
                                <Link
                                  href={featured.href!}
                                  className="group relative block p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:border-primary/40 transition-all overflow-hidden"
                                  onClick={() => setOpenMenu(null)}
                                >
                                  <div className={cn(
                                    'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
                                    section.color
                                  )} />
                                  <div className="relative flex items-start gap-4">
                                    <div className={cn(
                                      'w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-lg',
                                      section.color
                                    )}>
                                      <FeaturedIcon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                          {featured.name}
                                        </h3>
                                        <Sparkles className="w-4 h-4 text-primary" />
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {featured.description}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                  </div>
                                </Link>
                              )
                            })()}
                          </div>
                        )}

                        {/* Grid of Items */}
                        <div className="grid grid-cols-2 gap-2">
                          {section.items.filter(item => !item.featured).map((item) => {
                            const ItemIcon = item.icon
                            return (
                              <Link
                                key={item.name}
                                href={item.href!}
                                className="group relative p-3 rounded-lg hover:bg-accent transition-all"
                                onClick={() => setOpenMenu(null)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <ItemIcon className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                                      {item.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

              {/* Knowledge Base */}
              <Link
                href="/knowledge"
                className={cn(
                  'px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm transition-all',
                  pathname.startsWith('/knowledge')
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <BookOpen className="w-4 h-4" />
                Knowledge
              </Link>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10 hover:text-primary"
                title="Search (⌘K)"
              >
                <Search className="w-5 h-5" />
              </Button>

              {/* Quick Actions */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10 hover:text-primary"
              >
                <Zap className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/10 hover:text-primary"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
              </Button>

              {/* Theme Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                      {session?.user?.firstName?.[0] || 'U'}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.firstName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {session?.user?.role}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{session?.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                          {session?.user?.role}
                        </span>
                        {isMSP && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            MSP
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/settings/profile" className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-[72px] left-0 bottom-0 w-80 bg-background border-r shadow-2xl z-50 lg:hidden overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Dashboard */}
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all',
                  pathname === '/dashboard'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>

              {/* Navigation Sections */}
              {visibleSections.map((section) => (
                <div key={section.name} className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2">
                    <section.icon className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      {section.name}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href!}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all',
                          pathname === item.href || pathname.startsWith(`${item.href}/`)
                            ? 'bg-accent text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                        {item.featured && (
                          <Sparkles className="w-3 h-3 text-primary ml-auto" />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Knowledge Base */}
              <Link
                href="/knowledge"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all',
                  pathname.startsWith('/knowledge')
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <BookOpen className="w-5 h-5" />
                Knowledge
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}
