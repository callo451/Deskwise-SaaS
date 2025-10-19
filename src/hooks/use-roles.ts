import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

export interface Role {
  _id: string
  orgId: string
  name: string
  displayName: string
  description: string
  permissions: string[]
  isSystem: boolean
  isActive: boolean
  userCount?: number
  color?: string
  icon?: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CreateRoleInput {
  name: string
  displayName: string
  description: string
  permissions: string[]
  color?: string
  icon?: string
}

export interface UpdateRoleInput {
  displayName?: string
  description?: string
  permissions?: string[]
  color?: string
  icon?: string
  isActive?: boolean
}

export function useRoles() {
  const { data: session } = useSession()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/roles')
      const data = await response.json()

      if (data.success) {
        setRoles(data.data)
      } else {
        setError(data.error || 'Failed to fetch roles')
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch roles',
          variant: 'destructive',
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles'
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

  const createRole = useCallback(async (roleData: CreateRoleInput) => {
    try {
      setLoading(true)

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      })

      const data = await response.json()

      if (data.success) {
        setRoles((prev) => [data.data, ...prev])
        toast({
          title: 'Success',
          description: 'Role created successfully',
        })
        return data.data
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create role',
          variant: 'destructive',
        })
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateRole = useCallback(async (id: string, updates: UpdateRoleInput) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        setRoles((prev) =>
          prev.map((role) => (role._id === id ? data.data : role))
        )
        toast({
          title: 'Success',
          description: 'Role updated successfully',
        })
        return data.data
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update role',
          variant: 'destructive',
        })
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteRole = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/roles/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setRoles((prev) => prev.filter((role) => role._id !== id))
        toast({
          title: 'Success',
          description: 'Role deleted successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete role',
          variant: 'destructive',
        })
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cloneRole = useCallback(async (id: string, newName: string, newDisplayName: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/roles/${id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, displayName: newDisplayName }),
      })

      const data = await response.json()

      if (data.success) {
        setRoles((prev) => [data.data, ...prev])
        toast({
          title: 'Success',
          description: 'Role cloned successfully',
        })
        return data.data
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to clone role',
          variant: 'destructive',
        })
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clone role'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
    cloneRole,
  }
}
