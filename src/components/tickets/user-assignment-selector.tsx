'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { User, UserCircle, Search, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignableUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'technician'
  avatar?: string
  workload: {
    openTickets: number
    totalTickets: number
  }
}

interface UserAssignmentSelectorProps {
  currentAssignee?: string
  currentAssigneeName?: string
  ticketId: string
  onAssignmentChange?: () => void
  variant?: 'default' | 'compact'
  disabled?: boolean
}

export function UserAssignmentSelector({
  currentAssignee,
  currentAssigneeName,
  ticketId,
  onAssignmentChange,
  variant = 'default',
  disabled = false,
}: UserAssignmentSelectorProps) {
  const [users, setUsers] = useState<AssignableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      fetchAssignableUsers()
    }
  }, [open])

  const fetchAssignableUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/assignable')
      const data = await response.json()

      if (data.success) {
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Error fetching assignable users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (userId: string | null) => {
    try {
      setAssigning(true)
      const response = await fetch(`/api/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId }),
      })

      const data = await response.json()

      if (data.success) {
        setOpen(false)
        onAssignmentChange?.()
      } else {
        alert(data.error || 'Failed to assign ticket')
      }
    } catch (error) {
      console.error('Error assigning ticket:', error)
      alert('Failed to assign ticket')
    } finally {
      setAssigning(false)
    }
  }

  const filteredUsers = users.filter(
    user =>
      search === '' ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  )

  // Group by role
  const admins = filteredUsers.filter(u => u.role === 'admin')
  const technicians = filteredUsers.filter(u => u.role === 'technician')

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="secondary" className="text-xs">
        Admin
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        Tech
      </Badge>
    )
  }

  const getWorkloadIndicator = (openTickets: number) => {
    if (openTickets === 0) {
      return <span className="text-xs text-green-600 dark:text-green-400">Available</span>
    } else if (openTickets <= 5) {
      return <span className="text-xs text-blue-600 dark:text-blue-400">{openTickets} tickets</span>
    } else if (openTickets <= 10) {
      return <span className="text-xs text-orange-600 dark:text-orange-400">{openTickets} tickets</span>
    } else {
      return <span className="text-xs text-red-600 dark:text-red-400">{openTickets} tickets</span>
    }
  }

  if (variant === 'compact') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled || assigning}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-left justify-start font-normal"
          >
            {assigning ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : currentAssignee ? (
              <User className="w-3 h-3 mr-1" />
            ) : (
              <UserCircle className="w-3 h-3 mr-1 text-muted-foreground" />
            )}
            <span className="text-sm">
              {currentAssigneeName || 'Unassigned'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel>Assign to</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Search */}
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-7"
              />
            </div>
          </div>

          {/* Unassign option */}
          {currentAssignee && (
            <>
              <DropdownMenuItem
                onClick={() => handleAssign(null)}
                disabled={assigning}
              >
                <UserCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Unassign</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {/* Admins */}
              {admins.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Administrators
                  </DropdownMenuLabel>
                  {admins.map(user => (
                    <DropdownMenuItem
                      key={user._id}
                      onClick={() => handleAssign(user._id)}
                      disabled={assigning}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">
                              {user.firstName} {user.lastName}
                            </span>
                            {currentAssignee === user._id && (
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        {getRoleBadge(user.role)}
                        {getWorkloadIndicator(user.workload.openTickets)}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {/* Technicians */}
              {technicians.length > 0 && (
                <>
                  {admins.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Technicians
                  </DropdownMenuLabel>
                  {technicians.map(user => (
                    <DropdownMenuItem
                      key={user._id}
                      onClick={() => handleAssign(user._id)}
                      disabled={assigning}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">
                              {user.firstName} {user.lastName}
                            </span>
                            {currentAssignee === user._id && (
                              <CheckCircle2 className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        {getRoleBadge(user.role)}
                        {getWorkloadIndicator(user.workload.openTickets)}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              {filteredUsers.length === 0 && !loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default variant (full button)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled || assigning}>
        <Button variant="outline" className="w-full justify-start">
          {assigning ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : currentAssignee ? (
            <>
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold mr-2">
                {currentAssigneeName?.split(' ')[0]?.[0]}
                {currentAssigneeName?.split(' ')[1]?.[0]}
              </div>
              <span>{currentAssigneeName}</span>
            </>
          ) : (
            <>
              <UserCircle className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Assign to user...</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-96">
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Search */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Unassign option */}
        {currentAssignee && (
          <>
            <DropdownMenuItem
              onClick={() => handleAssign(null)}
              disabled={assigning}
            >
              <UserCircle className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>Unassign</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {/* Admins */}
            {admins.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Administrators
                </DropdownMenuLabel>
                {admins.map(user => (
                  <DropdownMenuItem
                    key={user._id}
                    onClick={() => handleAssign(user._id)}
                    disabled={assigning}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          {currentAssignee === user._id && (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3">
                      {getRoleBadge(user.role)}
                      {getWorkloadIndicator(user.workload.openTickets)}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {/* Technicians */}
            {technicians.length > 0 && (
              <>
                {admins.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Technicians
                </DropdownMenuLabel>
                {technicians.map(user => (
                  <DropdownMenuItem
                    key={user._id}
                    onClick={() => handleAssign(user._id)}
                    disabled={assigning}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </span>
                          {currentAssignee === user._id && (
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-3">
                      {getRoleBadge(user.role)}
                      {getWorkloadIndicator(user.workload.openTickets)}
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {filteredUsers.length === 0 && !loading && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
