'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Settings, Shield, Users, Eye, EyeOff, Trash2, Edit, ExternalLink, CheckCircle, AlertCircle, Clock, Copy, FileText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientOrganizationMapping } from '@/lib/auth/client-portal-workos-auth';

interface FormData {
  clientId: string;
  domain: string;
  workosOrganizationId: string;
  connectionId: string;
  name: string;
  ssoEnabled: boolean;
  fallbackPassword: boolean;
}

const defaultFormData: FormData = {
  clientId: '',
  domain: '',
  workosOrganizationId: '',
  connectionId: '',
  name: '',
  ssoEnabled: false,
  fallbackPassword: true,
};

export default function ClientSSOSettingsPage() {
  const [organizations, setOrganizations] = useState<ClientOrganizationMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<ClientOrganizationMapping | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardOrg, setWizardOrg] = useState<ClientOrganizationMapping | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/portal-sso');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.data);
      } else {
        console.error('Failed to fetch organizations');
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/portal-sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(prev => [data.data, ...prev]);
        setIsCreateDialogOpen(false);
        setFormData(defaultFormData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create SSO configuration');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Create error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingOrg) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings/portal-sso/${editingOrg._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(prev =>
          prev.map(org => org._id === editingOrg._id ? data.data : org)
        );
        setIsEditDialogOpen(false);
        setEditingOrg(null);
        setFormData(defaultFormData);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update SSO configuration');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Update error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (orgId: string) => {
    if (!confirm('Are you sure you want to delete this SSO configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/portal-sso/${orgId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrganizations(prev => prev.filter(org => org._id !== orgId));
      } else {
        console.error('Failed to delete organization');
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const openEditDialog = (org: ClientOrganizationMapping) => {
    setEditingOrg(org);
    setFormData({
      clientId: org.clientId,
      domain: org.domain,
      workosOrganizationId: org.workosOrganizationId,
      connectionId: org.connectionId || '',
      name: org.name,
      ssoEnabled: org.ssoEnabled,
      fallbackPassword: org.fallbackPassword,
    });
    setError(null);
    setIsEditDialogOpen(true);
  };

  const openConnectionWizard = (org: ClientOrganizationMapping) => {
    setWizardOrg(org);
    setWizardOpen(true);
  };

  const testConnection = async (org: ClientOrganizationMapping) => {
    try {
      const response = await fetch(`/api/settings/portal-sso/${org._id}/test-connection`, {
        method: 'POST',
      });
      const result = await response.json();
      setTestResults(prev => ({ ...prev, [org._id!]: result }));
    } catch (error) {
      console.error('Failed to test connection:', error);
    }
  };

  const getConnectionStatus = (org: ClientOrganizationMapping) => {
    if (!org.ssoEnabled) {
      return {
        variant: 'secondary',
        label: 'SSO Disabled',
        icon: <Clock className="h-3 w-3" />
      };
    }
    
    if (!org.connectionId) {
      return {
        variant: 'destructive',
        label: 'Not Connected',
        icon: <AlertCircle className="h-3 w-3" />
      };
    }

    const testResult = testResults[org._id!];
    if (testResult?.success) {
      return {
        variant: 'default',
        label: 'Connected',
        icon: <CheckCircle className="h-3 w-3" />
      };
    }

    return {
      variant: 'secondary',
      label: 'Unknown',
      icon: <Clock className="h-3 w-3" />
    };
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., TechCorp Inc."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="domain">Email Domain</Label>
          <Input
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            placeholder="e.g., techcorp.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientId">Client ID</Label>
          <Input
            id="clientId"
            value={formData.clientId}
            onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
            placeholder="Internal client identifier"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="workosOrganizationId">WorkOS Organization ID</Label>
          <Input
            id="workosOrganizationId"
            value={formData.workosOrganizationId}
            onChange={(e) => setFormData(prev => ({ ...prev, workosOrganizationId: e.target.value }))}
            placeholder="org_..."
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="connectionId">Connection ID (Optional)</Label>
        <Input
          id="connectionId"
          value={formData.connectionId}
          onChange={(e) => setFormData(prev => ({ ...prev, connectionId: e.target.value }))}
          placeholder="conn_... (optional)"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="ssoEnabled">Enable SSO</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to sign in with their corporate identity provider
            </p>
          </div>
          <Switch
            id="ssoEnabled"
            checked={formData.ssoEnabled}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ssoEnabled: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="fallbackPassword">Password Fallback</Label>
            <p className="text-sm text-muted-foreground">
              Allow password login when SSO is unavailable
            </p>
          </div>
          <Switch
            id="fallbackPassword"
            checked={formData.fallbackPassword}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fallbackPassword: checked }))}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Portal SSO</h1>
          <p className="text-muted-foreground">
            Manage SSO configurations for client portal access
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add SSO Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create SSO Configuration</DialogTitle>
              <DialogDescription>
                Configure SSO settings for a client organization
              </DialogDescription>
            </DialogHeader>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormFields />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setFormData(defaultFormData);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Configuration'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Organizations List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            {searchTerm ? 'No organizations match your search.' : 'No SSO configurations found.'}
          </div>
        ) : (
          filteredOrganizations.map((org) => (
            <Card key={org._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription>{org.domain}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openConnectionWizard(org)}
                      title="Setup SSO Connection"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnection(org)}
                      title="Test Connection"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(org)}
                      title="Edit Configuration"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(org._id!)}
                      title="Delete Configuration"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">SSO Status</span>
                  <Badge variant={org.ssoEnabled ? 'default' : 'secondary'}>
                    {org.ssoEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Password Fallback</span>
                  <Badge variant={org.fallbackPassword ? 'outline' : 'secondary'}>
                    {org.fallbackPassword ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={org.isActive ? 'default' : 'destructive'}>
                    {org.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connection Status</span>
                  <Badge variant={getConnectionStatus(org).variant as any}>
                    <div className="flex items-center space-x-1">
                      {getConnectionStatus(org).icon}
                      <span>{getConnectionStatus(org).label}</span>
                    </div>
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>WorkOS Org: {org.workosOrganizationId}</div>
                  {org.connectionId && (
                    <div>Connection: {org.connectionId}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit SSO Configuration</DialogTitle>
            <DialogDescription>
              Update SSO settings for {editingOrg?.name}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FormFields />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingOrg(null);
                setFormData(defaultFormData);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SSO Connection Setup Wizard */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>SSO Connection Setup Wizard</DialogTitle>
            <DialogDescription>
              Step-by-step guide to configure SSO for {wizardOrg?.name}
            </DialogDescription>
          </DialogHeader>
          <SSOConnectionWizard organization={wizardOrg} onClose={() => setWizardOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// SSO Connection Setup Wizard Component
function SSOConnectionWizard({ organization, onClose }: { organization: ClientOrganizationMapping | null, onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [connectionType, setConnectionType] = useState<'saml' | 'oidc' | null>(null);

  if (!organization) return null;

  const steps = [
    { title: "Choose Protocol", description: "Select SAML or OIDC" },
    { title: "WorkOS Setup", description: "Configure in WorkOS Dashboard" },
    { title: "Client Setup", description: "Guide for client IT admin" },
    { title: "Testing", description: "Verify connection works" }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            <div className="ml-2 text-sm">
              <div className="font-medium">{step.title}</div>
              <div className="text-muted-foreground">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-px w-12 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="border rounded-lg p-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose SSO Protocol</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className={`cursor-pointer transition-colors ${connectionType === 'saml' ? 'border-primary' : ''}`} 
                    onClick={() => setConnectionType('saml')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>SAML 2.0</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Most common enterprise protocol</p>
                    <p>• Works with Okta, Azure AD, OneLogin</p>
                    <p>• XML-based authentication</p>
                    <p>• Best for large enterprises</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`cursor-pointer transition-colors ${connectionType === 'oidc' ? 'border-primary' : ''}`}
                    onClick={() => setConnectionType('oidc')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>OpenID Connect</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Modern OAuth 2.0 based</p>
                    <p>• JSON-based authentication</p>
                    <p>• Simpler than SAML</p>
                    <p>• Good for Google, Auth0</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 1 && connectionType && (
          <WorkOSSetupStep organization={organization} connectionType={connectionType} />
        )}

        {currentStep === 2 && connectionType && (
          <ClientSetupStep organization={organization} connectionType={connectionType} />
        )}

        {currentStep === 3 && (
          <TestingStep organization={organization} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} 
                disabled={currentStep === 0}>
          Previous
        </Button>
        <div className="flex space-x-2">
          {currentStep < steps.length - 1 ? (
            <Button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    disabled={currentStep === 0 && !connectionType}>
              Next
            </Button>
          ) : (
            <Button onClick={onClose}>
              Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// WorkOS Setup Step Component
function WorkOSSetupStep({ organization, connectionType }: { organization: ClientOrganizationMapping, connectionType: 'saml' | 'oidc' }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const workosConfig = {
    saml: {
      entityId: `https://your-app.com/sso/saml/${organization.workosOrganizationId}`,
      acsUrl: `https://auth.workos.com/sso/saml/acs/${organization.workosOrganizationId}`,
      metadataUrl: `https://auth.workos.com/sso/saml/metadata/${organization.workosOrganizationId}`
    },
    oidc: {
      redirectUri: `https://auth.workos.com/sso/oidc/callback/${organization.workosOrganizationId}`,
      issuer: `https://auth.workos.com/sso/oidc/${organization.workosOrganizationId}`
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">WorkOS Dashboard Configuration</h3>
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to configure this connection in your WorkOS dashboard. Follow these steps:
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Step 1: Create Connection in WorkOS</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Go to <a href="https://dashboard.workos.com" target="_blank" rel="noopener noreferrer" 
                className="text-primary hover:underline inline-flex items-center">
                WorkOS Dashboard <ExternalLink className="h-3 w-3 ml-1" />
              </a></li>
            <li>Navigate to SSO → Connections</li>
            <li>Click "Create Connection"</li>
            <li>Select "{connectionType.toUpperCase()}" as the protocol</li>
            <li>Select organization: <code className="bg-background px-1 rounded">{organization.workosOrganizationId}</code></li>
          </ol>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Step 2: WorkOS Configuration Values</h4>
          <div className="space-y-3">
            {connectionType === 'saml' ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SP Entity ID:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-background px-2 py-1 rounded">{workosConfig.saml.entityId}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(workosConfig.saml.entityId, 'entityId')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ACS URL:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-background px-2 py-1 rounded">{workosConfig.saml.acsUrl}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(workosConfig.saml.acsUrl, 'acsUrl')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Redirect URI:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-background px-2 py-1 rounded">{workosConfig.oidc.redirectUri}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(workosConfig.oidc.redirectUri, 'redirectUri')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Step 3: Get Connection ID</h4>
          <p className="text-sm text-muted-foreground">
            After creating the connection, copy the Connection ID from WorkOS and update this configuration.
          </p>
        </div>
      </div>
    </div>
  );
}

// Client Setup Step Component  
function ClientSetupStep({ organization, connectionType }: { organization: ClientOrganizationMapping, connectionType: 'saml' | 'oidc' }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Client IT Administrator Setup</h3>
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Send these instructions to the client's IT administrator at {organization.name}
        </AlertDescription>
      </Alert>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Instructions for {organization.name} IT Team</h4>
        
        {connectionType === 'saml' ? (
          <div className="space-y-3 text-sm">
            <p><strong>Configure SAML in your Identity Provider:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create a new SAML application</li>
              <li>Set Single Sign-On URL: <code className="bg-background px-1 rounded">https://auth.workos.com/sso/saml/acs/{organization.workosOrganizationId}</code></li>
              <li>Set Audience/Entity ID: <code className="bg-background px-1 rounded">https://your-app.com/sso/saml/{organization.workosOrganizationId}</code></li>
              <li>Configure attribute mapping:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Email → email</li>
                  <li>First Name → firstName</li>
                  <li>Last Name → lastName</li>
                </ul>
              </li>
              <li>Assign users to the application</li>
              <li>Download the IdP metadata XML file</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p><strong>Configure OIDC in your Identity Provider:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Create a new OIDC/OAuth application</li>
              <li>Set Redirect URI: <code className="bg-background px-1 rounded">https://auth.workos.com/sso/oidc/callback/{organization.workosOrganizationId}</code></li>
              <li>Configure scopes: openid, email, profile</li>
              <li>Note down:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Client ID</li>
                  <li>Client Secret</li>
                  <li>Discovery Endpoint (/.well-known/openid-configuration)</li>
                </ul>
              </li>
              <li>Assign users to the application</li>
            </ul>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded">
          <p className="text-sm"><strong>Next Steps:</strong></p>
          <p className="text-sm">Once configured, provide us with the {connectionType === 'saml' ? 'metadata XML file or metadata URL' : 'Client ID, Client Secret, and Discovery Endpoint'}.</p>
        </div>
      </div>
    </div>
  );
}

// Testing Step Component
function TestingStep({ organization }: { organization: ClientOrganizationMapping }) {
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    try {
      const response = await fetch(`/api/settings/portal-sso/${organization._id}/test-connection`, {
        method: 'POST',
      });
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: 'Failed to test connection' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Test SSO Connection</h3>
      
      <div className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Connection Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Organization:</span>
              <div className="font-medium">{organization.name}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Domain:</span>
              <div className="font-medium">{organization.domain}</div>
            </div>
            <div>
              <span className="text-muted-foreground">WorkOS Org ID:</span>
              <div className="font-mono text-xs">{organization.workosOrganizationId}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Connection ID:</span>
              <div className="font-mono text-xs">{organization.connectionId || 'Not set'}</div>
            </div>
          </div>
        </div>

        <Button onClick={runTest} disabled={testing} className="w-full">
          {testing ? 'Testing Connection...' : 'Test SSO Connection'}
        </Button>

        {testResult && (
          <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
            <div className="flex items-center space-x-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
              </span>
            </div>
            {testResult.message && (
              <p className="mt-2 text-sm">{testResult.message}</p>
            )}
          </div>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Manual Testing</h4>
          <p className="text-sm text-muted-foreground mb-2">
            You can also test the connection manually:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Go to your client portal login page</li>
            <li>Enter an email with domain: {organization.domain}</li>
            <li>You should be redirected to the client's SSO provider</li>
            <li>Complete authentication and verify you're logged into the portal</li>
          </ol>
        </div>
      </div>
    </div>
  );
}