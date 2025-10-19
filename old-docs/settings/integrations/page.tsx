'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plug, 
  Server, 
  Cloud, 
  Mail, 
  MessageSquare, 
  Shield, 
  Database,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Settings,
  Save
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'rmm' | 'communication' | 'security' | 'productivity' | 'monitoring';
  icon: React.ComponentType<any>;
  isEnabled: boolean;
  isConfigured: boolean;
  apiKey?: string;
  webhookUrl?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  setupComplexity: 'easy' | 'medium' | 'complex';
  features: string[];
}

const availableIntegrations: Omit<Integration, 'isEnabled' | 'isConfigured' | 'status' | 'lastSync'>[] = [
  {
    id: 'connectwise-automate',
    name: 'ConnectWise Automate',
    description: 'Remote monitoring and management platform',
    category: 'rmm',
    icon: Server,
    setupComplexity: 'medium',
    features: ['Asset Discovery', 'Remote Access', 'Patch Management', 'Monitoring'],
    webhookUrl: 'https://api.connectwise.com/v2025.1/company/automation',
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Office productivity and email integration',
    category: 'productivity',
    icon: Cloud,
    setupComplexity: 'easy',
    features: ['Email Integration', 'Calendar Sync', 'User Management'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and notifications',
    category: 'communication',
    icon: MessageSquare,
    setupComplexity: 'easy',
    features: ['Ticket Notifications', 'Team Alerts', 'Channel Integration'],
  },
  {
    id: 'azure-ad',
    name: 'Azure Active Directory',
    description: 'Enterprise identity and access management',
    category: 'security',
    icon: Shield,
    setupComplexity: 'complex',
    features: ['Single Sign-On', 'User Provisioning', 'MFA Integration'],
  },
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Infrastructure monitoring and analytics',
    category: 'monitoring',
    icon: Database,
    setupComplexity: 'medium',
    features: ['Infrastructure Monitoring', 'APM', 'Log Management'],
  },
];

const categories = [
  { id: 'all', name: 'All Integrations', icon: Plug },
  { id: 'rmm', name: 'RMM Tools', icon: Server },
  { id: 'communication', name: 'Communication', icon: MessageSquare },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'productivity', name: 'Productivity', icon: Cloud },
  { id: 'monitoring', name: 'Monitoring', icon: Database },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setIsLoading(true);
      // For now, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockIntegrations = availableIntegrations.map(integration => ({
        ...integration,
        isEnabled: Math.random() > 0.7,
        isConfigured: Math.random() > 0.5,
        status: (['connected', 'disconnected', 'error'] as const)[Math.floor(Math.random() * 3)],
        lastSync: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      }));
      
      setIntegrations(mockIntegrations);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIntegration = async (id: string, enabled: boolean) => {
    try {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { ...integration, isEnabled: enabled }
            : integration
        )
      );
      
      toast({
        title: 'Success',
        description: `Integration ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update integration',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateApiKey = async (id: string, apiKey: string) => {
    try {
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === id 
            ? { ...integration, apiKey, isConfigured: !!apiKey }
            : integration
        )
      );
      
      toast({
        title: 'Success',
        description: 'API key updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update API key',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-gray-600 bg-gray-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'syncing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'complex': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredIntegrations = activeCategory === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.category === activeCategory);

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const enabledCount = integrations.filter(i => i.isEnabled).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your tools and services to streamline workflows.
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your tools and services to streamline workflows.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{enabledCount}</p>
                <p className="text-sm text-muted-foreground">Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{integrations.length}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-6">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeCategory} className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredIntegrations.map(integration => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <integration.icon className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={integration.isEnabled}
                      onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status and Complexity */}
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                    <Badge className={getComplexityColor(integration.setupComplexity)}>
                      {integration.setupComplexity} setup
                    </Badge>
                  </div>

                  {/* Features */}
                  <div>
                    <Label className="text-sm font-medium">Features</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {integration.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Configuration */}
                  {integration.isEnabled && (
                    <div className="space-y-3 pt-3 border-t">
                      <div>
                        <Label htmlFor={`${integration.id}-api-key`}>API Key</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id={`${integration.id}-api-key`}
                            type={showApiKeys[integration.id] ? 'text' : 'password'}
                            placeholder="Enter API key..."
                            value={integration.apiKey || ''}
                            onChange={(e) => handleUpdateApiKey(integration.id, e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowApiKeys(prev => ({
                              ...prev,
                              [integration.id]: !prev[integration.id]
                            }))}
                          >
                            {showApiKeys[integration.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {integration.webhookUrl && (
                        <div>
                          <Label>Webhook URL</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={integration.webhookUrl}
                              readOnly
                              className="text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(integration.webhookUrl!)}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      )}

                      {integration.lastSync && (
                        <div className="text-sm text-muted-foreground">
                          Last sync: {new Date(integration.lastSync).toLocaleString()}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Documentation
                        </Button>
                        <Button size="sm" variant="outline">
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredIntegrations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Plug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No integrations found</h3>
            <p className="text-sm text-muted-foreground">
              No integrations available in this category.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}