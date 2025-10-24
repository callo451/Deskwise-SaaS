'use client'

import { useSession } from 'next-auth/react'
import { SettingsCard } from '@/components/settings/settings-card'
import { Users, Building2, User, Bell, Package, MapPin, Tag, Sparkles, Globe, MessageSquare, Mail, FileText, Activity, Inbox, Webhook, Settings } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const organizationSettings = [
    {
      title: 'User Management',
      description: 'Manage team members, roles, and permissions across your organization',
      icon: Users,
      href: '/settings/users',
      iconColor: 'text-blue-600',
      hoverColor: 'hover:border-blue-500/50',
      adminOnly: true,
    },
    {
      title: 'Company Settings',
      description: 'Configure organization details, preferences, and branding',
      icon: Building2,
      href: '/settings/company',
      iconColor: 'text-slate-600',
      hoverColor: 'hover:border-slate-500/50',
      adminOnly: true,
    },
  ]

  const serviceSettings = [
    {
      title: 'Service Catalog',
      description: 'Manage service offerings and self-service request templates',
      icon: Package,
      href: '/settings/service-catalog',
      iconColor: 'text-purple-600',
      hoverColor: 'hover:border-purple-500/50',
      adminOnly: true,
    },
    {
      title: 'Canned Responses',
      description: 'Create and manage reusable response templates for faster ticket replies',
      icon: MessageSquare,
      href: '/settings/canned-responses',
      iconColor: 'text-indigo-600',
      hoverColor: 'hover:border-indigo-500/50',
      adminOnly: false,
    },
    {
      title: 'Portal Builder',
      description: 'Design and configure self-service portal pages with advanced settings',
      icon: Globe,
      href: '/admin/portal/pages',
      iconColor: 'text-teal-600',
      hoverColor: 'hover:border-teal-500/50',
      adminOnly: true,
    },
  ]

  const assetSettings = [
    {
      title: 'Asset Categories',
      description: 'Define and organize asset types and classification systems',
      icon: Package,
      href: '/settings/asset-categories',
      iconColor: 'text-gray-600',
      hoverColor: 'hover:border-gray-500/50',
      adminOnly: true,
    },
    {
      title: 'Asset Locations',
      description: 'Manage physical and logical locations for asset tracking',
      icon: MapPin,
      href: '/settings/asset-locations',
      iconColor: 'text-gray-600',
      hoverColor: 'hover:border-gray-500/50',
      adminOnly: true,
    },
    {
      title: 'Asset Settings',
      description: 'Configure asset tag generation, lifecycle, and automation rules',
      icon: Tag,
      href: '/settings/asset-settings',
      iconColor: 'text-gray-600',
      hoverColor: 'hover:border-gray-500/50',
      adminOnly: true,
    },
  ]

  const emailSettings = [
    {
      title: 'Email Integration',
      description: 'Configure SMTP server settings and email delivery provider',
      icon: Mail,
      href: '/settings/email-integration',
      iconColor: 'text-orange-600',
      hoverColor: 'hover:border-orange-500/50',
      adminOnly: true,
    },
    {
      title: 'Inbound Email',
      description: 'Receive emails and automatically create tickets from customer messages',
      icon: Inbox,
      href: '/settings/inbound-email',
      iconColor: 'text-green-600',
      hoverColor: 'hover:border-green-500/50',
      adminOnly: true,
    },
    {
      title: 'Email Templates',
      description: 'Design and customize email notification templates with dynamic content',
      icon: FileText,
      href: '/settings/email-templates',
      iconColor: 'text-purple-600',
      hoverColor: 'hover:border-purple-500/50',
      adminOnly: true,
    },
    {
      title: 'Notification Rules',
      description: 'Configure automated email notifications based on events and conditions',
      icon: Bell,
      href: '/settings/notification-rules',
      iconColor: 'text-blue-600',
      hoverColor: 'hover:border-blue-500/50',
      adminOnly: true,
    },
    {
      title: 'Email Logs',
      description: 'Monitor email delivery status and troubleshoot delivery issues',
      icon: Activity,
      href: '/settings/email-logs',
      iconColor: 'text-gray-600',
      hoverColor: 'hover:border-gray-500/50',
      adminOnly: true,
    },
  ]

  const integrationSettings = [
    {
      title: 'Accounting Integrations',
      description: 'Connect and sync data with Xero, QuickBooks, and MYOB accounting platforms',
      icon: Webhook,
      href: '/settings/integrations',
      iconColor: 'text-blue-600',
      hoverColor: 'hover:border-blue-500/50',
      adminOnly: true,
    },
  ]

  const personalSettings = [
    {
      title: 'Profile',
      description: 'Manage your personal account information and preferences',
      icon: User,
      href: '/settings/profile',
      iconColor: 'text-emerald-600',
      hoverColor: 'hover:border-emerald-500/50',
      adminOnly: false,
    },
    {
      title: 'Notifications',
      description: 'Customize notification preferences and alert settings',
      icon: Bell,
      href: '/settings/notifications',
      iconColor: 'text-amber-600',
      hoverColor: 'hover:border-amber-500/50',
      adminOnly: false,
    },
  ]

  const filterSettings = (settings: typeof organizationSettings) =>
    settings.filter((setting) => !setting.adminOnly || isAdmin)

  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-500/10 rounded-lg">
            <Settings className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-base mt-1">
              Manage your organization and account preferences
            </p>
          </div>
        </div>
      </div>

      {/* Organization Settings Section */}
      {isAdmin && filterSettings(organizationSettings).length > 0 && (
        <section className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h2 className="text-xl font-bold">Organization</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage company-wide settings and team configuration
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {filterSettings(organizationSettings).map((setting) => (
              <SettingsCard
                key={setting.href}
                title={setting.title}
                description={setting.description}
                href={setting.href}
                icon={setting.icon}
                iconColor={setting.iconColor}
                hoverColor={setting.hoverColor}
              />
            ))}
          </div>
        </section>
      )}

      {/* Service Management Section */}
      {isAdmin && filterSettings(serviceSettings).length > 0 && (
        <>
          <Separator className="my-8" />
          <section className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4">
              <h2 className="text-xl font-bold">Service Management</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure service catalog and customer portal settings
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {filterSettings(serviceSettings).map((setting) => (
                <SettingsCard
                  key={setting.href}
                  title={setting.title}
                  description={setting.description}
                  href={setting.href}
                  icon={setting.icon}
                  iconColor={setting.iconColor}
                  hoverColor={setting.hoverColor}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Asset Management Section */}
      {isAdmin && filterSettings(assetSettings).length > 0 && (
        <>
          <Separator className="my-8" />
          <section className="space-y-4">
            <div className="border-l-4 border-gray-500 pl-4">
              <h2 className="text-xl font-bold">Asset Management</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure asset tracking, categorization, and lifecycle
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filterSettings(assetSettings).map((setting) => (
                <SettingsCard
                  key={setting.href}
                  title={setting.title}
                  description={setting.description}
                  href={setting.href}
                  icon={setting.icon}
                  iconColor={setting.iconColor}
                  hoverColor={setting.hoverColor}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Email & Notifications Section */}
      {isAdmin && filterSettings(emailSettings).length > 0 && (
        <>
          <Separator className="my-8" />
          <section className="space-y-4">
            <div className="border-l-4 border-orange-500 pl-4">
              <h2 className="text-xl font-bold">Email & Notifications</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure email integration, templates, and automated notifications
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {filterSettings(emailSettings).map((setting) => (
                <SettingsCard
                  key={setting.href}
                  title={setting.title}
                  description={setting.description}
                  href={setting.href}
                  icon={setting.icon}
                  iconColor={setting.iconColor}
                  hoverColor={setting.hoverColor}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Integrations Section */}
      {isAdmin && filterSettings(integrationSettings).length > 0 && (
        <>
          <Separator className="my-8" />
          <section className="space-y-4">
            <div className="border-l-4 border-teal-500 pl-4">
              <h2 className="text-xl font-bold">Integrations</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Connect external platforms and sync data automatically
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {filterSettings(integrationSettings).map((setting) => (
                <SettingsCard
                  key={setting.href}
                  title={setting.title}
                  description={setting.description}
                  href={setting.href}
                  icon={setting.icon}
                  iconColor={setting.iconColor}
                  hoverColor={setting.hoverColor}
                />
              ))}
            </div>
          </section>
        </>
      )}

      {/* Personal Settings Section */}
      {filterSettings(personalSettings).length > 0 && (
        <>
          <Separator className="my-8" />
          <section className="space-y-4">
            <div className="border-l-4 border-emerald-500 pl-4">
              <h2 className="text-xl font-bold">Personal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your individual account and notification preferences
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {filterSettings(personalSettings).map((setting) => (
                <SettingsCard
                  key={setting.href}
                  title={setting.title}
                  description={setting.description}
                  href={setting.href}
                  icon={setting.icon}
                  iconColor={setting.iconColor}
                  hoverColor={setting.hoverColor}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
