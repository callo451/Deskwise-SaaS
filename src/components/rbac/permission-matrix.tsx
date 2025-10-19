'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RoleBadge } from './role-badge'
import { cn } from '@/lib/utils'
import { Role } from '@/hooks/use-roles'
import { Permission } from '@/hooks/use-permissions'
import { CheckCircle2, Circle, MinusCircle } from 'lucide-react'

interface PermissionMatrixProps {
  roles: Role[]
  permissions: Permission[]
}

interface ModulePermissionCount {
  module: string
  displayName: string
  total: number
  granted: number
}

interface CellDetails {
  role: Role
  module: string
  permissions: Array<{
    permissionKey: string
    description: string
    granted: boolean
  }>
}

export function PermissionMatrix({ roles, permissions }: PermissionMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<CellDetails | null>(null)

  // Get unique modules
  const modules = useMemo(() => {
    const moduleSet = new Set(permissions.map((p) => p.module))
    return Array.from(moduleSet).sort()
  }, [permissions])

  // Calculate permission counts for each role/module combination
  const getModulePermissions = (role: Role, module: string): ModulePermissionCount => {
    const modulePerms = permissions.filter((p) => p.module === module)
    const grantedPerms = modulePerms.filter((p) => role.permissions.includes(p.permissionKey))

    return {
      module,
      displayName: getModuleDisplayName(module),
      total: modulePerms.length,
      granted: grantedPerms.length,
    }
  }

  // Get detailed permissions for a cell
  const getCellDetails = (role: Role, module: string): CellDetails => {
    const modulePerms = permissions.filter((p) => p.module === module)

    return {
      role,
      module,
      permissions: modulePerms.map((p) => ({
        permissionKey: p.permissionKey,
        description: p.description,
        granted: role.permissions.includes(p.permissionKey),
      })),
    }
  }

  // Get cell color based on access level
  const getCellColor = (granted: number, total: number): string => {
    if (granted === 0) return 'bg-gray-100 hover:bg-gray-200'
    if (granted === total) return 'bg-green-100 hover:bg-green-200'
    return 'bg-yellow-100 hover:bg-yellow-200'
  }

  // Get cell icon
  const getCellIcon = (granted: number, total: number) => {
    if (granted === 0) return <Circle className="h-4 w-4 text-gray-400" />
    if (granted === total) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    return <MinusCircle className="h-4 w-4 text-yellow-600" />
  }

  const openCellDetails = (role: Role, module: string) => {
    setSelectedCell(getCellDetails(role, module))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Overview of permissions across all roles and modules. Click a cell to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-3 bg-muted text-left font-semibold sticky left-0 z-10">
                    Role
                  </th>
                  {modules.map((module) => (
                    <th
                      key={module}
                      className="border p-3 bg-muted text-center font-semibold min-w-[120px]"
                    >
                      {getModuleDisplayName(module)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role._id}>
                    <td className="border p-3 bg-background sticky left-0 z-10">
                      <div className="flex items-center gap-2">
                        <RoleBadge
                          role={role.name}
                          displayName={role.displayName}
                          isSystem={role.isSystem}
                          color={role.color}
                          size="sm"
                        />
                      </div>
                    </td>
                    {modules.map((module) => {
                      const modulePerms = getModulePermissions(role, module)
                      const percentage = Math.round(
                        (modulePerms.granted / modulePerms.total) * 100
                      )

                      return (
                        <td
                          key={`${role._id}-${module}`}
                          className={cn(
                            'border p-3 text-center cursor-pointer transition-colors',
                            getCellColor(modulePerms.granted, modulePerms.total)
                          )}
                          onClick={() => openCellDetails(role, module)}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {getCellIcon(modulePerms.granted, modulePerms.total)}
                            <div className="text-sm font-medium">
                              {modulePerms.granted}/{modulePerms.total}
                            </div>
                            {modulePerms.granted > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {percentage}%
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-green-100 border rounded" />
              <span className="text-muted-foreground">Full Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-yellow-100 border rounded" />
              <span className="text-muted-foreground">Partial Access</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-100 border rounded" />
              <span className="text-muted-foreground">No Access</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cell Details Dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCell && (
                <div className="flex items-center gap-2">
                  <RoleBadge
                    role={selectedCell.role.name}
                    displayName={selectedCell.role.displayName}
                    isSystem={selectedCell.role.isSystem}
                    color={selectedCell.role.color}
                  />
                  <span className="text-muted-foreground">-</span>
                  <span>{getModuleDisplayName(selectedCell.module)}</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              Detailed permission breakdown for this role and module
            </DialogDescription>
          </DialogHeader>

          {selectedCell && (
            <div className="space-y-2">
              {selectedCell.permissions.map((perm) => (
                <div
                  key={perm.permissionKey}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-md border',
                    perm.granted
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  )}
                >
                  <div className="mt-0.5">
                    {perm.granted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{perm.permissionKey}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {perm.description}
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium">Summary</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedCell.permissions.filter((p) => p.granted).length} of{' '}
                  {selectedCell.permissions.length} permissions granted (
                  {Math.round(
                    (selectedCell.permissions.filter((p) => p.granted).length /
                      selectedCell.permissions.length) *
                      100
                  )}
                  %)
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper function for module display names
function getModuleDisplayName(module: string): string {
  const displayNames: Record<string, string> = {
    tickets: 'Tickets',
    assets: 'Assets',
    users: 'Users',
    incidents: 'Incidents',
    changes: 'Changes',
    projects: 'Projects',
    kb: 'KB',
    reports: 'Reports',
    settings: 'Settings',
    clients: 'Clients',
    billing: 'Billing',
    scheduling: 'Schedule',
    inventory: 'Inventory',
  }
  return displayNames[module] || module.charAt(0).toUpperCase() + module.slice(1)
}
