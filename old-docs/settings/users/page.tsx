'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  MoreHorizontal, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Users2, 
  Shield, 
  ExternalLink, 
  Globe, 
  FolderSync, 
  FileText, 
  Building2, 
  AlertCircle,
  Mail,
  UserPlus,
  Settings,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Crown,
  Trash2
} from 'lucide-react';

// Types for WorkOS User Management
interface WorkOSUser {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  status: 'active' | 'inactive' | 'pending';
  role?: {
    slug: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface WorkOSRole {
  id: string;
  name: string;
  description?: string;
  type: 'environment_role' | 'organization_role';
  createdAt: string;
  updatedAt: string;
}

const UserRow = ({ 
  user, 
  membership, 
  onUpdateRole, 
  onRemoveUser, 
  onResendInvitation 
}: { 
  user: WorkOSUser;
  membership: OrganizationMembership;
  onUpdateRole: (userId: string, roleSlug: string) => void;
  onRemoveUser: (userId: string) => void;
  onResendInvitation: (userId: string) => void;
}) => {
  const getStatusVariant = (status: OrganizationMembership['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const initials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user.email[0].toUpperCase();

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.profilePictureUrl} alt={fullName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{fullName}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
            {!user.emailVerified && (
              <Badge variant="outline" className="text-xs mt-1">
                Email not verified
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {membership.role ? (
          <Badge variant="secondary">{membership.role.name}</Badge>
        ) : (
          <span className="text-muted-foreground">No role assigned</span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant={getStatusVariant(membership.status)} className="capitalize">
          {membership.status}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => console.log('Edit user', user.id)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit User
            </DropdownMenuItem>
            {membership.status === 'pending' && (
              <DropdownMenuItem onClick={() => onResendInvitation(user.id)}>
                <Mail className="h-4 w-4 mr-2" />
                Resend Invitation
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive" 
              onClick={() => onRemoveUser(user.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

// WorkOS Role Management Component
const WorkOSRoleCard = ({ 
  role, 
  memberCount, 
  onEditRole, 
  onDeleteRole 
}: { 
  role: WorkOSRole;
  memberCount: number;
  onEditRole: (roleId: string) => void;
  onDeleteRole: (roleId: string) => void;
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {role.name}
            </CardTitle>
            <CardDescription>
              {memberCount} members • {role.type.replace('_', ' ')}
            </CardDescription>
            {role.description && (
              <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditRole(role.id)}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => onDeleteRole(role.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Role Type</span>
            <Badge variant="secondary" className="capitalize">
              {role.type.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Created</span>
            <span className="text-sm text-muted-foreground">
              {new Date(role.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Updated</span>
            <span className="text-sm text-muted-foreground">
              {new Date(role.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// User Invitation Dialog
const InviteUserDialog = ({ 
  open, 
  onOpenChange, 
  onInviteUser 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteUser: (email: string, roleId?: string) => void;
}) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInvite = async () => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      await onInviteUser(email, selectedRole || undefined);
      setEmail('');
      setSelectedRole('');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation to a new user to join your organization.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="role">Role (Optional)</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!email || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// WorkOS Admin Portal Integration Component
const ADMIN_PORTAL_INTENTS = [
  {
    key: 'sso',
    label: 'Single Sign-On',
    description: 'Configure SAML or OpenID Connect authentication',
    icon: Shield,
  },
  {
    key: 'dsync',
    label: 'Directory Sync',
    description: 'Sync users and groups from your identity provider',
    icon: FolderSync,
  },
  {
    key: 'domain_verification',
    label: 'Domain Verification',
    description: 'Verify ownership of your organization domains',
    icon: Globe,
  },
  {
    key: 'audit_logs',
    label: 'Audit Logs',
    description: 'Configure audit log streaming and monitoring',
    icon: FileText,
  },
];

function IdentityManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { organizationId } = useAuth();

  const generatePortalLink = async (intent: string) => {
    if (!organizationId) {
      toast({
        title: 'Setup Required',
        description: 'You need to complete account setup first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-portal/portal-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          intent,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        window.location.href = responseData.link;
      } else {
        throw new Error(responseData.error || 'Failed to generate portal link');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open Admin Portal.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Identity & Access Management
          </CardTitle>
          <CardDescription>
            Configure enterprise authentication, user provisioning, and domain verification through WorkOS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {ADMIN_PORTAL_INTENTS.map((intent) => (
              <Button
                key={intent.key}
                variant="outline"
                className="h-auto p-6 justify-start"
                onClick={() => generatePortalLink(intent.key)}
                disabled={isLoading}
              >
                <div className="flex items-start gap-4 text-left">
                  <intent.icon className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="font-semibold flex items-center gap-2 mb-1">
                      {intent.label}
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {intent.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Enterprise Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Configure SAML 2.0 and OpenID Connect authentication</li>
              <li>• Set up automated user provisioning with SCIM</li>
              <li>• Verify domain ownership for enhanced security</li>
              <li>• Monitor all authentication and user management events</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Permissions Management Component
const PermissionsManagement = () => {
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, fetch permissions from API
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Application Permissions
        </CardTitle>
        <CardDescription>
          Define what different roles can access within the application. These permissions work alongside WorkOS roles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[
            { module: 'Tickets', key: 'tickets' },
            { module: 'Incidents', key: 'incidents' },
            { module: 'Assets', key: 'assets' },
            { module: 'Inventory', key: 'inventory' },
            { module: 'Knowledge Base', key: 'knowledge_base' },
            { module: 'Reports', key: 'reports' },
            { module: 'Settings', key: 'settings' },
          ].map((module) => (
            <div key={module.key} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">{module.module}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['create', 'read', 'update', 'delete'].map((action) => (
                  <div key={action} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm capitalize">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Permission Integration</h4>
              <p className="text-sm text-blue-700 mt-1">
                These application-level permissions work in conjunction with WorkOS roles. 
                Configure role-based access through the Identity tab to fully control user access.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<WorkOSUser[]>([]);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [roles, setRoles] = useState<WorkOSRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { organizationId } = useAuth();

  useEffect(() => {
    if (organizationId) {
      fetchUsers();
      fetchRoles();
    }
  }, [organizationId]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setMemberships(data.memberships || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const handleInviteUser = async (email: string, roleId?: string) => {
    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          roleId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Invitation Sent',
          description: `Invitation sent to ${email}`,
        });
        fetchUsers(); // Refresh the user list
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'User Removed',
          description: 'User has been removed from the organization.',
        });
        fetchUsers();
      } else {
        throw new Error('Failed to remove user');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove user',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/resend-invitation`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: 'Invitation Resent',
          description: 'Invitation has been resent.',
        });
      } else {
        throw new Error('Failed to resend invitation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive',
      });
    }
  };

  const getUserMembership = (userId: string) => {
    return memberships.find(m => m.userId === userId);
  };

  const getRoleMemberCount = (roleId: string) => {
    return memberships.filter(m => m.role?.slug === roleId).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Users & Permissions</h1>
        <p className="text-muted-foreground">
          Manage team members, roles, and access controls through WorkOS enterprise identity management.
        </p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organization Members</CardTitle>
                  <CardDescription>
                    Manage user access and roles through WorkOS User Management.
                  </CardDescription>
                </div>
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setInviteDialogOpen(true)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Invite User</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden sm:table-cell">Role</TableHead>
                      <TableHead className="hidden md:table-cell">Status</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => {
                      const membership = getUserMembership(user.id);
                      return membership ? (
                        <UserRow 
                          key={user.id} 
                          user={user} 
                          membership={membership}
                          onUpdateRole={(userId, roleSlug) => console.log('Update role', userId, roleSlug)}
                          onRemoveUser={handleRemoveUser}
                          onResendInvitation={handleResendInvitation}
                        />
                      ) : null;
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">WorkOS Roles</h2>
              <p className="text-muted-foreground">
                Manage organization roles through WorkOS Role-Based Access Control.
              </p>
            </div>
            <Button size="sm" className="gap-1" onClick={() => {
              toast({
                title: 'Create Role',
                description: 'Use the Identity tab to create roles through WorkOS Admin Portal.',
              });
            }}>
              <PlusCircle className="h-3.5 w-3.5" />
              New Role
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <WorkOSRoleCard 
                key={role.id} 
                role={role}
                memberCount={getRoleMemberCount(role.id)}
                onEditRole={(roleId) => console.log('Edit role', roleId)}
                onDeleteRole={(roleId) => console.log('Delete role', roleId)}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="permissions" className="mt-6">
          <PermissionsManagement />
        </TabsContent>
        
        <TabsContent value="identity" className="mt-6">
          <IdentityManagement />
        </TabsContent>
      </Tabs>

      <InviteUserDialog 
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteUser={handleInviteUser}
      />
    </div>
  );
}