'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Search, MoreVertical, Trash2, Users, Shield, Edit, Key, Settings as SettingsIcon, Copy, Loader2, Plus, Eye } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SettingsHeader } from '@/components/settings/settings-header'
import { EmptyState } from '@/components/settings/empty-state'
import { RoleBadge } from '@/components/rbac/role-badge'
import { PermissionSelector } from '@/components/rbac/permission-selector'
import { PermissionMatrix } from '@/components/rbac/permission-matrix'
import { useRoles, CreateRoleInput } from '@/hooks/use-roles'
import { usePermissions, UserEffectivePermissions } from '@/hooks/use-permissions'
import { toast } from '@/hooks/use-toast'

interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'technician' | 'user'
  roleId?: string
  title?: string
  department?: string
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // User Management State
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isManagePermissionsOpen, setIsManagePermissionsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [tempPassword, setTempPassword] = useState('')

  // Role Management State
  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false)
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false)
  const [isCloneRoleDialogOpen, setIsCloneRoleDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null)

  // Form State
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '', // RBAC role ID
    title: '',
    department: '',
  })

  const [editUserData, setEditUserData] = useState({
    firstName: '',
    lastName: '',
    roleId: '', // RBAC role ID
    title: '',
    department: '',
    isActive: true,
  })

  const [newRole, setNewRole] = useState<CreateRoleInput>({
    name: '',
    displayName: '',
    description: '',
    permissions: [],
  })

  const [userPermissions, setUserPermissions] = useState<UserEffectivePermissions | null>(null)
  const [permissionOverrides, setPermissionOverrides] = useState<string[]>([])

  // Hooks
  const { roles, loading: rolesLoading, fetchRoles, createRole, updateRole, deleteRole, cloneRole } = useRoles()
  const { permissions, permissionsByModule, loading: permissionsLoading, fetchPermissions, getUserPermissions, updateUserPermissions } = usePermissions()

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    fetchUsers()
    if (isAdmin) {
      fetchRoles()
      fetchPermissions()
    }
  }, [search, isAdmin])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)

      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (data.success) {
        setTempPassword(data.data.temporaryPassword)
        setUsers([data.data.user, ...users])
        setNewUser({
          email: '',
          firstName: '',
          lastName: '',
          roleId: '',
          title: '',
          department: '',
        })
        toast({
          title: 'Success',
          description: 'User created successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create user',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    setLoading(true)

    try {
      const response = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserData),
      })

      const data = await response.json()

      if (data.success) {
        setUsers(users.map((u) => (u._id === selectedUser._id ? data.data : u)))
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        toast({
          title: 'Success',
          description: 'User updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update user',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users/${userToDelete._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        fetchUsers()
        toast({
          title: 'Success',
          description: 'User deactivated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete user',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      })
    } finally {
      setUserToDelete(null)
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      const data = await response.json()

      if (data.success) {
        setUsers(users.map((u) => (u._id === user._id ? data.data : u)))
        toast({
          title: 'Success',
          description: `User ${data.data.isActive ? 'activated' : 'deactivated'} successfully`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      })
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditUserData({
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId || '',
      title: user.title || '',
      department: user.department || '',
      isActive: user.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const openManagePermissions = async (user: User) => {
    setSelectedUser(user)
    const perms = await getUserPermissions(user._id)
    if (perms) {
      setUserPermissions(perms)
      setPermissionOverrides(perms.overrides.map((o) => o.permissionKey))
    }
    setIsManagePermissionsOpen(true)
  }

  const handleSaveUserPermissions = async () => {
    if (!selectedUser || !userPermissions) return

    try {
      const overrides = permissions
        .filter((p) => permissionOverrides.includes(p.permissionKey))
        .map((p) => ({
          permissionKey: p.permissionKey,
          granted: !userPermissions.rolePermissions.includes(p.permissionKey),
        }))

      await updateUserPermissions(selectedUser._id, overrides)
      setIsManagePermissionsOpen(false)
      setSelectedUser(null)
    } catch (error) {
      // Error already handled in hook
    }
  }

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false)
    setTempPassword('')
  }

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createRole(newRole)
      setIsCreateRoleDialogOpen(false)
      setNewRole({
        name: '',
        displayName: '',
        description: '',
        permissions: [],
      })
    } catch (error) {
      // Error already handled in hook
    }
  }

  const handleCloneRole = async (roleId: string) => {
    const role = roles.find((r) => r._id === roleId)
    if (!role) return

    setNewRole({
      name: `${role.name}_copy`,
      displayName: `${role.displayName} (Copy)`,
      description: role.description,
      permissions: role.permissions,
    })
    setIsCloneRoleDialogOpen(true)
  }

  const handleDeleteRole = async () => {
    if (!roleToDelete) return

    try {
      await deleteRole(roleToDelete)
      setRoleToDelete(null)
    } catch (error) {
      // Error already handled in hook
    }
  }

  const getRoleBadge = (role: string) => {
    const config = {
      admin: { variant: 'destructive' as const, icon: Shield },
      technician: { variant: 'default' as const, icon: SettingsIcon },
      user: { variant: 'secondary' as const, icon: Users },
    }
    const { variant, icon: Icon } = config[role as keyof typeof config]
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {role}
      </Badge>
    )
  }

  const roleStats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    technicians: users.filter((u) => u.role === 'technician').length,
    active: users.filter((u) => u.isActive).length,
  }

  const roleStatsForRoles = {
    total: roles.length,
    system: roles.filter((r) => r.isSystem).length,
    custom: roles.filter((r) => !r.isSystem).length,
    active: roles.filter((r) => r.isActive).length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="User Management"
        description="Manage team members, roles, and permissions across your organization"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Users className="h-6 w-6 text-blue-600" />}
        actions={
          isAdmin && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {tempPassword ? 'User Created' : 'Create New User'}
                  </DialogTitle>
                  <DialogDescription>
                    {tempPassword
                      ? 'Share this temporary password with the user'
                      : 'Add a new user to your organization'}
                  </DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-medium mb-2 text-blue-900">Temporary Password:</p>
                      <code className="text-lg font-mono bg-white px-3 py-2 rounded border block text-blue-700">
                        {tempPassword}
                      </code>
                      <p className="text-xs text-blue-700 mt-2">
                        The user will be prompted to change this password on first login.
                      </p>
                    </div>
                    <Button onClick={closeCreateDialog} className="w-full">
                      Done
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={newUser.firstName}
                          onChange={(e) =>
                            setNewUser({ ...newUser, firstName: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={newUser.lastName}
                          onChange={(e) =>
                            setNewUser({ ...newUser, lastName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={newUser.roleId}
                        onValueChange={(value: string) =>
                          setNewUser({ ...newUser, roleId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles
                            .filter((r) => r.isActive)
                            .map((role) => (
                              <SelectItem key={role._id} value={role._id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: role.color || '#64748b' }}
                                  />
                                  {role.displayName}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {newUser.roleId && roles.find((r) => r._id === newUser.roleId)?.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title (Optional)</Label>
                        <Input
                          id="title"
                          value={newUser.title}
                          onChange={(e) =>
                            setNewUser({ ...newUser, title: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department (Optional)</Label>
                        <Input
                          id="department"
                          value={newUser.department}
                          onChange={(e) =>
                            setNewUser({ ...newUser, department: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create User'}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          )
        }
      />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              Roles & Permissions
            </TabsTrigger>
          )}
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardDescription className="text-blue-700">Total Users</CardDescription>
                <CardTitle className="text-3xl text-blue-900">{roleStats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Administrators</CardDescription>
                <CardTitle className="text-3xl">{roleStats.admins}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Technicians</CardDescription>
                <CardTitle className="text-3xl">{roleStats.technicians}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Users</CardDescription>
                <CardTitle className="text-3xl">{roleStats.active}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : users.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No users found"
                  description={
                    search
                      ? 'Try adjusting your search terms'
                      : 'Get started by adding your first team member'
                  }
                  action={
                    !search && isAdmin
                      ? {
                          label: 'Add User',
                          onClick: () => setIsCreateDialogOpen(true),
                        }
                      : undefined
                  }
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      {isAdmin && <TableHead className="w-[70px]"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.roleId && roles.length > 0 ? (
                            <RoleBadge
                              role={roles.find((r) => r._id === user.roleId)?.name || user.role}
                              displayName={roles.find((r) => r._id === user.roleId)?.displayName || user.role}
                              isSystem={roles.find((r) => r._id === user.roleId)?.isSystem || false}
                              color={roles.find((r) => r._id === user.roleId)?.color}
                            />
                          ) : (
                            getRoleBadge(user.role)
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.title || '—'}
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openManagePermissions(user)}>
                                  <Shield className="w-4 h-4 mr-2" />
                                  Manage Permissions
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                                  <Key className="w-4 h-4 mr-2" />
                                  {user.isActive ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setUserToDelete(user)}
                                  className="text-destructive"
                                  disabled={user._id === session?.user?.id}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        {isAdmin && (
          <TabsContent value="roles" className="space-y-6">
            {/* Role Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-3">
                  <CardDescription className="text-purple-700">Total Roles</CardDescription>
                  <CardTitle className="text-3xl text-purple-900">
                    {roleStatsForRoles.total}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>System Roles</CardDescription>
                  <CardTitle className="text-3xl">{roleStatsForRoles.system}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Custom Roles</CardDescription>
                  <CardTitle className="text-3xl">{roleStatsForRoles.custom}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Roles</CardDescription>
                  <CardTitle className="text-3xl">{roleStatsForRoles.active}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Roles Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roles</CardTitle>
                    <CardDescription>
                      Manage roles and their permissions
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsCreateRoleDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : roles.length === 0 ? (
                  <EmptyState
                    icon={Shield}
                    title="No roles found"
                    description="Create custom roles to manage permissions"
                    action={{
                      label: 'Create Role',
                      onClick: () => setIsCreateRoleDialogOpen(true),
                    }}
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role._id}>
                          <TableCell>
                            <RoleBadge
                              role={role.name}
                              displayName={role.displayName}
                              isSystem={role.isSystem}
                              color={role.color}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-md">
                            {role.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {role.permissions.length} permissions
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {role.isSystem ? (
                              <Badge variant="secondary">System</Badge>
                            ) : (
                              <Badge variant="outline">Custom</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {role.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Permissions
                                </DropdownMenuItem>
                                {!role.isSystem && (
                                  <>
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Role
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCloneRole(role._id)}>
                                      <Copy className="w-4 h-4 mr-2" />
                                      Clone Role
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => setRoleToDelete(role._id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Permission Matrix */}
            {!permissionsLoading && permissions.length > 0 && roles.length > 0 && (
              <PermissionMatrix roles={roles} permissions={permissions} />
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and role assignment
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editUserData.firstName}
                  onChange={(e) =>
                    setEditUserData({ ...editUserData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editUserData.lastName}
                  onChange={(e) =>
                    setEditUserData({ ...editUserData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={editUserData.roleId}
                onValueChange={(value: string) =>
                  setEditUserData({ ...editUserData, roleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((r) => r.isActive)
                    .map((role) => (
                      <SelectItem key={role._id} value={role._id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: role.color || '#64748b' }}
                          />
                          {role.displayName}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {editUserData.roleId && roles.find((r) => r._id === editUserData.roleId)?.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={editUserData.title}
                  onChange={(e) =>
                    setEditUserData({ ...editUserData, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={editUserData.department}
                  onChange={(e) =>
                    setEditUserData({ ...editUserData, department: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="editStatus">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Enable or disable user access
                </p>
              </div>
              <Switch
                id="editStatus"
                checked={editUserData.isActive}
                onCheckedChange={(checked) =>
                  setEditUserData({ ...editUserData, isActive: checked })
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isManagePermissionsOpen} onOpenChange={setIsManagePermissionsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Grant or revoke permissions for {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>

          {userPermissions && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium">Current Role</div>
                {getRoleBadge(selectedUser?.role || 'user')}
                <div className="text-sm text-muted-foreground mt-2">
                  Base permissions: {userPermissions.rolePermissions.length} permissions from role
                </div>
              </div>

              <PermissionSelector
                permissions={permissions}
                selectedPermissions={permissionOverrides}
                onPermissionsChange={setPermissionOverrides}
                highlightOverrides={userPermissions.overrides.map((o) => o.permissionKey)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManagePermissionsOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveUserPermissions}>
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a custom role with specific permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRole} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name (Internal)</Label>
                <Input
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., senior_technician"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Internal identifier (lowercase, no spaces)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleDisplayName">Display Name</Label>
                <Input
                  id="roleDisplayName"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                  placeholder="e.g., Senior Technician"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the purpose and responsibilities of this role"
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <PermissionSelector
                permissions={permissions}
                selectedPermissions={newRole.permissions}
                onPermissionsChange={(perms) => setNewRole({ ...newRole, permissions: perms })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rolesLoading}>
                {rolesLoading ? 'Creating...' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Clone Role Dialog */}
      <Dialog open={isCloneRoleDialogOpen} onOpenChange={setIsCloneRoleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clone Role</DialogTitle>
            <DialogDescription>
              Create a copy of an existing role with the same permissions
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRole} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cloneRoleName">Role Name (Internal)</Label>
                <Input
                  id="cloneRoleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloneRoleDisplayName">Display Name</Label>
                <Input
                  id="cloneRoleDisplayName"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cloneRoleDescription">Description</Label>
                <Textarea
                  id="cloneRoleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions ({newRole.permissions.length} selected)</Label>
              <PermissionSelector
                permissions={permissions}
                selectedPermissions={newRole.permissions}
                onPermissionsChange={(perms) => setNewRole({ ...newRole, permissions: perms })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCloneRoleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={rolesLoading}>
                {rolesLoading ? 'Creating...' : 'Clone Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate {userToDelete?.firstName} {userToDelete?.lastName}. They will no
              longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Deactivate User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Role Confirmation */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
              Users assigned to this role will be reassigned to the default user role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive hover:bg-destructive/90">
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
