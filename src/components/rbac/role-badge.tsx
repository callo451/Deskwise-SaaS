import { Badge } from '@/components/ui/badge'
import { Shield, UserCog, Users, Crown, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleBadgeProps {
  role: string
  displayName?: string
  isSystem?: boolean
  color?: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RoleBadge({
  role,
  displayName,
  isSystem = false,
  color,
  icon,
  size = 'md',
  className,
}: RoleBadgeProps) {
  // Default configurations for system roles
  const systemRoleConfig: Record<
    string,
    { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; color: string }
  > = {
    admin: {
      variant: 'destructive',
      icon: Shield,
      color: 'text-red-600 bg-red-50 border-red-200',
    },
    technician: {
      variant: 'default',
      icon: UserCog,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    user: {
      variant: 'secondary',
      icon: Users,
      color: 'text-gray-600 bg-gray-50 border-gray-200',
    },
  }

  // Get icon component
  const getIcon = () => {
    if (icon) {
      // Custom icon (would need icon mapping logic here)
      return Settings
    }

    if (isSystem && systemRoleConfig[role]) {
      return systemRoleConfig[role].icon
    }

    // Default icon for custom roles
    return Crown
  }

  const Icon = getIcon()

  // Size configurations
  const sizeConfig = {
    sm: {
      badge: 'text-xs px-2 py-0.5',
      icon: 'h-3 w-3',
    },
    md: {
      badge: 'text-sm px-2.5 py-1',
      icon: 'h-3.5 w-3.5',
    },
    lg: {
      badge: 'text-base px-3 py-1.5',
      icon: 'h-4 w-4',
    },
  }

  // Determine badge styling
  const getBadgeClass = () => {
    // Use custom color if provided
    if (color) {
      return cn('border', color, sizeConfig[size].badge)
    }

    // Use system role config
    if (isSystem && systemRoleConfig[role]) {
      return cn('border', systemRoleConfig[role].color, sizeConfig[size].badge)
    }

    // Default for custom roles
    return cn(
      'text-purple-600 bg-purple-50 border-purple-200 border',
      sizeConfig[size].badge
    )
  }

  return (
    <Badge
      variant="outline"
      className={cn('gap-1 font-medium', getBadgeClass(), className)}
    >
      <Icon className={sizeConfig[size].icon} />
      {displayName || role}
    </Badge>
  )
}
