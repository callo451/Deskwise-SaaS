'use client'

import { useState, useMemo } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Search, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Permission } from '@/hooks/use-permissions'

interface PermissionSelectorProps {
  permissions: Permission[]
  selectedPermissions: string[]
  onPermissionsChange: (permissions: string[]) => void
  disabled?: boolean
  highlightOverrides?: string[] // Permission keys that are overridden
}

interface ModulePermissions {
  module: string
  permissions: Permission[]
  displayName: string
  description?: string
}

export function PermissionSelector({
  permissions,
  selectedPermissions,
  onPermissionsChange,
  disabled = false,
  highlightOverrides = [],
}: PermissionSelectorProps) {
  const [search, setSearch] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Group permissions by module
  const moduleGroups: ModulePermissions[] = useMemo(() => {
    const groups: Record<string, Permission[]> = {}

    permissions.forEach((permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = []
      }
      groups[permission.module].push(permission)
    })

    // Convert to array and add display names
    return Object.entries(groups)
      .map(([module, perms]) => ({
        module,
        permissions: perms.sort((a, b) => a.permissionKey.localeCompare(b.permissionKey)),
        displayName: getModuleDisplayName(module),
        description: getModuleDescription(module),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }, [permissions])

  // Filter modules based on search
  const filteredModules = useMemo(() => {
    if (!search.trim()) return moduleGroups

    const searchLower = search.toLowerCase()
    return moduleGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) =>
            p.permissionKey.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.module.toLowerCase().includes(searchLower)
        ),
      }))
      .filter((group) => group.permissions.length > 0)
  }, [moduleGroups, search])

  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(module)) {
      newExpanded.delete(module)
    } else {
      newExpanded.add(module)
    }
    setExpandedModules(newExpanded)
  }

  const togglePermission = (permissionKey: string) => {
    if (disabled) return

    const newSelected = selectedPermissions.includes(permissionKey)
      ? selectedPermissions.filter((p) => p !== permissionKey)
      : [...selectedPermissions, permissionKey]

    onPermissionsChange(newSelected)
  }

  const selectAllInModule = (modulePerms: Permission[]) => {
    if (disabled) return

    const moduleKeys = modulePerms.map((p) => p.permissionKey)
    const allSelected = moduleKeys.every((key) => selectedPermissions.includes(key))

    if (allSelected) {
      // Deselect all in module
      onPermissionsChange(selectedPermissions.filter((key) => !moduleKeys.includes(key)))
    } else {
      // Select all in module
      const newSelected = [...selectedPermissions]
      moduleKeys.forEach((key) => {
        if (!newSelected.includes(key)) {
          newSelected.push(key)
        }
      })
      onPermissionsChange(newSelected)
    }
  }

  const selectAll = () => {
    if (disabled) return

    const allKeys = permissions.map((p) => p.permissionKey)
    const allSelected = allKeys.length === selectedPermissions.length

    if (allSelected) {
      onPermissionsChange([])
    } else {
      onPermissionsChange(allKeys)
    }
  }

  const getModuleStats = (modulePerms: Permission[]) => {
    const selected = modulePerms.filter((p) => selectedPermissions.includes(p.permissionKey)).length
    const total = modulePerms.length
    return { selected, total }
  }

  // Expand modules with search results
  if (search && filteredModules.length > 0) {
    const modulesToExpand = new Set(filteredModules.map((m) => m.module))
    if (expandedModules.size === 0 || ![...expandedModules].some((m) => modulesToExpand.has(m))) {
      setExpandedModules(modulesToExpand)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={disabled}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={selectAll}
          disabled={disabled}
          className="shrink-0"
        >
          {selectedPermissions.length === permissions.length ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="h-4 w-4 mr-2" />
              Select All
            </>
          )}
        </Button>
      </div>

      {/* Permission count */}
      <div className="text-sm text-muted-foreground">
        {selectedPermissions.length} of {permissions.length} permissions selected
      </div>

      {/* Modules list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {filteredModules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No permissions found</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-blue-600 hover:underline mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredModules.map((group) => {
            const stats = getModuleStats(group.permissions)
            const isExpanded = expandedModules.has(group.module)
            const allSelected = stats.selected === stats.total
            const someSelected = stats.selected > 0 && stats.selected < stats.total

            return (
              <Collapsible
                key={group.module}
                open={isExpanded}
                onOpenChange={() => toggleModule(group.module)}
              >
                <div className="border rounded-lg">
                  <div className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <CollapsibleTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{group.displayName}</h4>
                          <span className="text-xs text-muted-foreground">
                            ({stats.selected}/{stats.total})
                          </span>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => selectAllInModule(group.permissions)}
                      disabled={disabled}
                      className="text-xs"
                    >
                      {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                    </Button>
                  </div>

                  <CollapsibleContent>
                    <div className="border-t p-3 space-y-2 bg-muted/20">
                      {group.permissions.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission.permissionKey)
                        const isOverridden = highlightOverrides.includes(permission.permissionKey)

                        return (
                          <div
                            key={permission.permissionKey}
                            className={cn(
                              'flex items-start gap-3 p-2 rounded-md hover:bg-background transition-colors',
                              isOverridden && 'bg-yellow-50 border border-yellow-200'
                            )}
                          >
                            <Checkbox
                              id={permission.permissionKey}
                              checked={isSelected}
                              onCheckedChange={() => togglePermission(permission.permissionKey)}
                              disabled={disabled}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <Label
                                htmlFor={permission.permissionKey}
                                className={cn(
                                  'font-medium cursor-pointer',
                                  disabled && 'cursor-not-allowed opacity-50'
                                )}
                              >
                                {permission.permissionKey}
                                {isOverridden && (
                                  <span className="ml-2 text-xs text-yellow-700 font-normal">
                                    (Override)
                                  </span>
                                )}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })
        )}
      </div>
    </div>
  )
}

// Helper functions for module display
function getModuleDisplayName(module: string): string {
  const displayNames: Record<string, string> = {
    tickets: 'Tickets',
    assets: 'Assets',
    users: 'Users',
    incidents: 'Incidents',
    changes: 'Change Requests',
    projects: 'Projects',
    kb: 'Knowledge Base',
    reports: 'Reports',
    settings: 'Settings',
    clients: 'Clients',
    billing: 'Billing',
    scheduling: 'Scheduling',
    inventory: 'Inventory',
  }
  return displayNames[module] || module.charAt(0).toUpperCase() + module.slice(1)
}

function getModuleDescription(module: string): string {
  const descriptions: Record<string, string> = {
    tickets: 'Manage support tickets and service requests',
    assets: 'Manage assets and hardware inventory',
    users: 'Manage users, roles, and permissions',
    incidents: 'Manage incidents and service disruptions',
    changes: 'Manage change requests and approvals',
    projects: 'Manage projects and tasks',
    kb: 'Manage knowledge base articles',
    reports: 'View and generate reports',
    settings: 'Configure system settings',
    clients: 'Manage client accounts',
    billing: 'Manage billing and invoicing',
    scheduling: 'Manage schedules and appointments',
    inventory: 'Manage inventory and stock',
  }
  return descriptions[module] || ''
}
