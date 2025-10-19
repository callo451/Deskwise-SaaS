import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

export interface Permission {
  _id: string
  orgId: string
  module: string
  action: string
  resource?: string
  permissionKey: string
  description: string
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

export interface PermissionsByModule {
  [module: string]: Permission[]
}

export interface UserPermissionOverride {
  permissionKey: string
  granted: boolean
  reason?: string
}

export interface UserEffectivePermissions {
  rolePermissions: string[]
  customPermissions: string[]
  overrides: Array<{
    permissionKey: string
    granted: boolean
    grantedBy: string
    grantedAt: string
    reason?: string
  }>
  effective: string[] // Final list of effective permissions
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/permissions')
      const data = await response.json()

      if (data.success) {
        setPermissions(data.data)

        // Group permissions by module
        const grouped = data.data.reduce((acc: PermissionsByModule, permission: Permission) => {
          if (!acc[permission.module]) {
            acc[permission.module] = []
          }
          acc[permission.module].push(permission)
          return acc
        }, {})

        setPermissionsByModule(grouped)
      } else {
        setError(data.error || 'Failed to fetch permissions')
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch permissions',
          variant: 'destructive',
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const getUserPermissions = useCallback(async (userId: string): Promise<UserEffectivePermissions | null> => {
    try {
      const response = await fetch(`/api/users/${userId}/permissions`)
      const data = await response.json()

      if (data.success) {
        return data.data
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch user permissions',
          variant: 'destructive',
        })
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user permissions'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      return null
    }
  }, [])

  const updateUserPermissions = useCallback(
    async (userId: string, overrides: UserPermissionOverride[]) => {
      try {
        const response = await fetch(`/api/users/${userId}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ overrides }),
        })

        const data = await response.json()

        if (data.success) {
          toast({
            title: 'Success',
            description: 'User permissions updated successfully',
          })
          return data.data
        } else {
          toast({
            title: 'Error',
            description: data.error || 'Failed to update user permissions',
            variant: 'destructive',
          })
          throw new Error(data.error)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update user permissions'
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
        throw err
      }
    },
    []
  )

  const checkPermission = useCallback((userPermissions: string[], permissionKey: string): boolean => {
    return userPermissions.includes(permissionKey)
  }, [])

  const checkAnyPermission = useCallback(
    (userPermissions: string[], permissionKeys: string[]): boolean => {
      return permissionKeys.some((key) => userPermissions.includes(key))
    },
    []
  )

  const checkAllPermissions = useCallback(
    (userPermissions: string[], permissionKeys: string[]): boolean => {
      return permissionKeys.every((key) => userPermissions.includes(key))
    },
    []
  )

  return {
    permissions,
    permissionsByModule,
    loading,
    error,
    fetchPermissions,
    getUserPermissions,
    updateUserPermissions,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
  }
}
