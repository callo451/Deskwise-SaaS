'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Monitor, 
  Terminal, 
  Package, 
  Shield, 
  Activity, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Square,
  MoreHorizontal,
  Filter,
  Search,
  RefreshCw,
  Power,
  Settings,
  FileText,
  Zap,
  Users,
  TrendingUp,
  Database
} from 'lucide-react';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeviceConsoleDrawer } from '@/components/asset-operations/device-console-drawer';
import { PolicyExplainerDialog } from '@/components/asset-operations/policy-explainer-dialog';
import { ApprovalRequestDialog } from '@/components/asset-operations/approval-request-dialog';
import type { Device, DeviceStatus, OSType, DeviceLifecycleState } from '@/lib/types/asset-operations';
import type { OperationalAsset } from '@/lib/services/asset-operations-bridge';
// Bridge operations moved to API routes
import { useAuth } from '@/contexts/auth-context';
import { convertOperationalAssetToDevice } from '@/lib/utils/asset-converters';

// ==================== Types and Interfaces ====================

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  warning: number;
  maintenance: number;
  quarantined: number;
  byOS: Record<OSType, number>;
  byLifecycle: Record<DeviceLifecycleState, number>;
  vulnerabilities: number;
  maintenanceOverdue: number;
  policyCompliance: number;
  // Enhanced operational metrics
  agentsConnected: number;
  agentsOffline: number;
  averageUptime: number;
  securityScore: number;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  capability: string;
  riskLevel: 'low' | 'medium' | 'high';
  requiresApproval: boolean;
  description: string;
}

interface EnrollmentToken {
  token: string;
  name?: string;
  description?: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
  used?: boolean;
}

// ==================== Components ====================

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  onClick 
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) => {
  const variantStyles = {
    default: 'bg-background hover:bg-muted/50',
    success: 'bg-success/10 hover:bg-success/20 dark:bg-success/10 dark:hover:bg-success/15',
    warning: 'bg-warning/10 hover:bg-warning/20 dark:bg-warning/10 dark:hover:bg-warning/15',
    danger: 'bg-destructive/10 hover:bg-destructive/20 dark:bg-destructive/10 dark:hover:bg-destructive/15'
  };

  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive'
  };

  return (
    <Card 
      className={`${variantStyles[variant]} transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColors[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

const DeviceStatusBadge = ({ status }: { status: DeviceStatus }) => {
  const variants = {
    'Online': 'default',
    'Offline': 'destructive', 
    'Warning': 'secondary',
    'Maintenance': 'outline',
    'Quarantined': 'destructive'
  } as const;

  const colors = {
    'Online': 'bg-success/20 text-success dark:bg-success/20 dark:text-success',
    'Offline': 'bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive',
    'Warning': 'bg-warning/20 text-warning dark:bg-warning/20 dark:text-warning',
    'Maintenance': 'bg-primary/20 text-primary dark:bg-primary/20 dark:text-primary',
    'Quarantined': 'bg-destructive/20 text-destructive dark:bg-destructive/20 dark:text-destructive'
  };

  return (
    <Badge className={colors[status]}>
      {status}
    </Badge>
  );
};

const DeviceRow = ({ 
  device, 
  onSelectDevice, 
  onQuickAction 
}: { 
  device: Device;
  onSelectDevice: (device: Device) => void;
  onQuickAction: (device: Device, action: QuickAction) => void;
}) => {
  const isOnline = device.status === 'Online';
  const isVulnerable = device.security.vulnerabilityCount > 0;
  const needsMaintenance = device.lifecycle.maintenanceState === 'Overdue';

  const quickActions: QuickAction[] = [
    {
      id: 'reboot',
      label: 'Reboot',
      icon: Power,
      capability: 'reboot',
      riskLevel: 'high',
      requiresApproval: true,
      description: 'Restart the device'
    },
    {
      id: 'terminal',
      label: 'Open Terminal',
      icon: Terminal,
      capability: 'exec',
      riskLevel: 'medium',
      requiresApproval: false,
      description: 'Open remote command interface'
    },
    {
      id: 'scan',
      label: 'Security Scan',
      icon: Shield,
      capability: 'script',
      riskLevel: 'low',
      requiresApproval: false,
      description: 'Run security vulnerability scan'
    }
  ];

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div 
          className="cursor-pointer"
          onClick={() => onSelectDevice(device)}
        >
          <div className="font-medium text-primary hover:underline">
            {device.hostname}
          </div>
          <div className="text-sm text-muted-foreground">
            {device.network.ipAddress}
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">{device.os}</span>
          <span className="text-xs text-muted-foreground">
            {(() => {
              const version = device.osVersion;
              // Remove OS name from version if it's duplicated
              if (version && version.toLowerCase().includes(device.os.toLowerCase())) {
                return version.replace(new RegExp(device.os, 'gi'), '').trim();
              }
              return version || 'Unknown';
            })()}
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <DeviceStatusBadge status={device.status} />
      </TableCell>
      
      <TableCell className="hidden md:table-cell">
        <div className="text-sm">
          {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
        </div>
      </TableCell>
      
      <TableCell className="hidden lg:table-cell">
        <Badge variant={device.policyVersion === 'latest' ? 'default' : 'secondary'}>
          {device.policyVersion === 'latest' ? 'latest' : device.policyVersion}
        </Badge>
      </TableCell>
      
      <TableCell className="hidden lg:table-cell">
        <div className="flex gap-1">
          {device.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {device.tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{device.tags.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      
      <TableCell className="hidden xl:table-cell">
        <div className="flex items-center gap-2">
          {isVulnerable && (
            <span title={`${device.security.vulnerabilityCount} vulnerabilities`}>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </span>
          )}
          {needsMaintenance && (
            <span title="Maintenance overdue">
              <Clock className="h-4 w-4 text-warning" />
            </span>
          )}
          {device.security.isSecure && !isVulnerable && (
            <span title="Secure">
              <CheckCircle className="h-4 w-4 text-success" />
            </span>
          )}
        </div>
      </TableCell>
      
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {quickActions.map(action => (
              <DropdownMenuItem
                key={action.id}
                onClick={() => onQuickAction(device, action)}
                disabled={!isOnline && action.capability !== 'reboot'}
              >
                <action.icon className="mr-2 h-4 w-4" />
                {action.label}
                {action.requiresApproval && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    Approval
                  </Badge>
                )}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSelectDevice(device)}>
              <FileText className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

// ==================== Main Component ====================

export default function AssetOperationsHubPage() {
  const [operationalAssets, setOperationalAssets] = useState<OperationalAsset[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus[]>([]);
  const [osFilter, setOSFilter] = useState<OSType[]>([]);
  const [agentDevices, setAgentDevices] = useState<Device[]>([]);
  const [agentSearchTerm, setAgentSearchTerm] = useState('');
  const [agentStatusFilter, setAgentStatusFilter] = useState<DeviceStatus[]>([]);
  const [agentOSFilter, setAgentOSFilter] = useState<OSType[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [policyExplainerOpen, setPolicyExplainerOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('devices');
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [tokens, setTokens] = useState<EnrollmentToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [creatingToken, setCreatingToken] = useState(false);

  const { toast } = useToast();
  const { user, organizationId } = useAuth();
  // Bridge operations moved to API routes
  const searchParams = useSearchParams();
  const router = useRouter();

  // ---- Mock Data Loading Functions ----
  const loadMockAssetData = async () => {
    try {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Rich mock operational assets
      const mockOperationalAssets: OperationalAsset[] = [
        {
          id: 'asset-001',
          name: 'CORP-WS-001',
          hostname: 'CORP-WS-001',
          type: 'Workstation',
          status: 'Online',
          os: 'Windows',
          osVersion: '11 Pro',
          client: 'TechCorp Solutions',
          location: 'New York Office - Floor 3',
          network: {
            ipAddress: '192.168.1.45',
            macAddress: '00:1B:44:11:3A:B7',
            subnet: '192.168.1.0/24'
          },
          lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
          security: {
            isSecure: true,
            antivirusStatus: 'Active',
            firewallEnabled: true,
            encryptionStatus: 'Encrypted',
            lastSecurityScan: new Date(Date.now() - 2 * 60 * 60 * 1000),
            vulnerabilityCount: 0,
            complianceScore: 98
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2023, 10, 15).toISOString(),
            maintenanceState: 'None'
          },
          policyVersion: 'latest',
          tags: ['workstation', 'techcorp-solutions', 'critical'],
          financial: {
            currentValue: 850,
            monthlyTCO: 125
          },
          performance: {
            uptime: 99.8
          },
          agent: {
            version: '2.1.4',
            connected: true,
            lastHeartbeat: new Date(Date.now() - 30 * 1000),
            capabilities: ['exec', 'script', 'reboot', 'filesystem']
          }
        },
        {
          id: 'asset-002', 
          name: 'CORP-SRV-001',
          hostname: 'CORP-SRV-001',
          type: 'Server',
          status: 'Online',
          os: 'Windows',
          osVersion: 'Server 2022',
          client: 'TechCorp Solutions',
          location: 'Data Center A - Rack 15',
          network: {
            ipAddress: '10.0.1.100',
            macAddress: '00:1B:44:11:3A:C8',
            subnet: '10.0.1.0/24'
          },
          lastSeen: new Date(Date.now() - 1 * 60 * 1000).toISOString(), // 1 min ago
          security: {
            isSecure: true,
            antivirusStatus: 'Active',
            firewallEnabled: true,
            encryptionStatus: 'Encrypted',
            lastSecurityScan: new Date(Date.now() - 4 * 60 * 60 * 1000),
            vulnerabilityCount: 1,
            complianceScore: 92
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2023, 8, 20).toISOString(),
            maintenanceState: 'Scheduled'
          },
          policyVersion: 'latest',
          tags: ['server', 'critical', 'production'],
          financial: {
            currentValue: 2850,
            monthlyTCO: 450
          },
          performance: {
            uptime: 99.9
          },
          agent: {
            version: '2.1.4',
            connected: true,
            lastHeartbeat: new Date(Date.now() - 15 * 1000),
            capabilities: ['exec', 'script', 'reboot', 'filesystem']
          }
        },
        {
          id: 'asset-003',
          name: 'DIGI-MBP-001', 
          hostname: 'DIGI-MBP-001',
          type: 'Laptop',
          status: 'Online',
          os: 'macOS',
          osVersion: '14.2',
          client: 'Digital Marketing Inc',
          location: 'Remote - Los Angeles',
          network: {
            ipAddress: '192.168.50.23',
            macAddress: '78:4F:43:85:1C:9E',
            subnet: '192.168.50.0/24'
          },
          lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
          security: {
            isSecure: true,
            antivirusStatus: 'Active',
            firewallEnabled: true,
            encryptionStatus: 'Encrypted',
            lastSecurityScan: new Date(Date.now() - 6 * 60 * 60 * 1000),
            vulnerabilityCount: 0,
            complianceScore: 96
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2024, 0, 10).toISOString(),
            maintenanceState: 'None'
          },
          policyVersion: 'latest',
          tags: ['laptop', 'digital-marketing', 'remote'],
          financial: {
            currentValue: 1450,
            monthlyTCO: 200
          },
          performance: {
            uptime: 98.5
          },
          agent: {
            version: '2.1.3',
            connected: true,
            lastHeartbeat: new Date(Date.now() - 45 * 1000),
            capabilities: ['exec', 'script', 'reboot']
          }
        },
        {
          id: 'asset-004',
          name: 'CORP-LNX-001',
          hostname: 'CORP-LNX-001', 
          type: 'Server',
          status: 'Warning',
          os: 'Linux',
          osVersion: 'Ubuntu 22.04 LTS',
          client: 'TechCorp Solutions',
          location: 'Data Center A - Rack 12',
          network: {
            ipAddress: '10.0.1.150',
            macAddress: '00:1B:44:11:3B:D9',
            subnet: '10.0.1.0/24'
          },
          lastSeen: new Date(Date.now() - 3 * 60 * 1000).toISOString(), // 3 mins ago
          security: {
            isSecure: false,
            antivirusStatus: 'Inactive',
            firewallEnabled: true,
            encryptionStatus: 'Unencrypted',
            lastSecurityScan: new Date(Date.now() - 12 * 60 * 60 * 1000),
            vulnerabilityCount: 3,
            complianceScore: 75
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2023, 5, 5).toISOString(),
            maintenanceState: 'Overdue'
          },
          policyVersion: '1.2.0',
          tags: ['server', 'linux', 'development'],
          financial: {
            currentValue: 1200,
            monthlyTCO: 180
          },
          performance: {
            uptime: 95.2
          },
          agent: {
            version: '2.1.2',
            connected: true,
            lastHeartbeat: new Date(Date.now() - 120 * 1000),
            capabilities: ['exec', 'script']
          }
        },
        {
          id: 'asset-005',
          name: 'DIGI-WS-002',
          hostname: 'DIGI-WS-002',
          type: 'Workstation',
          status: 'Offline',
          os: 'Windows',
          osVersion: '11 Pro',
          client: 'Digital Marketing Inc',
          location: 'Chicago Office - Floor 2',
          network: {
            ipAddress: '192.168.2.78',
            macAddress: '00:1B:44:11:3C:EA',
            subnet: '192.168.2.0/24'
          },
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          security: {
            isSecure: true,
            antivirusStatus: 'Active',
            firewallEnabled: true,
            encryptionStatus: 'Encrypted',
            lastSecurityScan: new Date(Date.now() - 8 * 60 * 60 * 1000),
            vulnerabilityCount: 0,
            complianceScore: 94
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2023, 11, 3).toISOString(),
            maintenanceState: 'None'
          },
          policyVersion: 'latest',
          tags: ['workstation', 'digital-marketing'],
          financial: {
            currentValue: 920,
            monthlyTCO: 135
          },
          performance: {
            uptime: 97.8
          },
          agent: undefined // Agent not installed/connected
        },
        {
          id: 'asset-006',
          name: 'CORP-PRINT-001',
          hostname: 'CORP-PRINT-001',
          type: 'Printer',
          status: 'Maintenance',
          os: 'Linux',
          osVersion: 'Embedded 4.2',
          client: 'TechCorp Solutions',
          location: 'New York Office - Floor 2',
          network: {
            ipAddress: '192.168.1.200',
            macAddress: '00:1B:44:11:3D:FB',
            subnet: '192.168.1.0/24'
          },
          lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          security: {
            isSecure: false,
            antivirusStatus: 'N/A',
            firewallEnabled: false,
            encryptionStatus: 'Unencrypted',
            lastSecurityScan: new Date(Date.now() - 24 * 60 * 60 * 1000),
            vulnerabilityCount: 2,
            complianceScore: 60
          },
          lifecycle: {
            state: 'Maintenance',
            deployedDate: new Date(2022, 3, 18).toISOString(),
            maintenanceState: 'In Progress'
          },
          policyVersion: '1.1.0',
          tags: ['printer', 'hardware'],
          financial: {
            currentValue: 450,
            monthlyTCO: 85
          },
          performance: {
            uptime: 88.5
          },
          agent: undefined
        }
      ];
      
      setOperationalAssets(mockOperationalAssets);
      
      // Convert to Device format
      const deviceData = mockOperationalAssets.map((oa: OperationalAsset) => 
        convertOperationalAssetToDevice(oa, organizationId || 'mock-org-001')
      );
      setDevices(deviceData);
      
      // Calculate comprehensive stats
      const mockStats: DeviceStats = {
        total: mockOperationalAssets.length,
        online: mockOperationalAssets.filter(a => a.status === 'Online').length,
        offline: mockOperationalAssets.filter(a => a.status === 'Offline').length, 
        warning: mockOperationalAssets.filter(a => a.status === 'Warning').length,
        maintenance: mockOperationalAssets.filter(a => a.status === 'Maintenance').length,
        quarantined: 0,
        byOS: {
          Windows: mockOperationalAssets.filter(a => a.os?.includes('Windows')).length,
          macOS: mockOperationalAssets.filter(a => a.os?.includes('macOS')).length,
          Linux: mockOperationalAssets.filter(a => a.os?.includes('Linux')).length
        },
        byLifecycle: {
          Planned: 0,
          Ordered: 0,
          Received: 0, 
          Deployed: 0,
          Live: mockOperationalAssets.filter(a => a.lifecycle.state === 'Live').length,
          Maintenance: mockOperationalAssets.filter(a => a.lifecycle.state === 'Maintenance').length,
          Retiring: 0,
          Disposed: 0
        },
        vulnerabilities: mockOperationalAssets.reduce((sum, a) => sum + (a.security?.vulnerabilityCount || 0), 0),
        maintenanceOverdue: mockOperationalAssets.filter(a => a.lifecycle.maintenanceState === 'Overdue').length,
        policyCompliance: Math.round((mockOperationalAssets.filter(a => a.policyVersion === 'latest').length / mockOperationalAssets.length) * 100),
        agentsConnected: mockOperationalAssets.filter(a => a.agent?.connected).length,
        agentsOffline: mockOperationalAssets.filter(a => a.agent && !a.agent.connected).length,
        averageUptime: Math.round(mockOperationalAssets.reduce((sum, a) => sum + (a.performance?.uptime || 0), 0) / mockOperationalAssets.length),
        securityScore: Math.round(mockOperationalAssets.reduce((sum, a) => sum + (a.security?.complianceScore || 0), 0) / mockOperationalAssets.length)
      };
      
      setStats(mockStats);
      
    } catch (error) {
      console.error('Error loading mock asset data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMockAgentDevices = async () => {
    try {
      // Rich mock agent devices (additional devices beyond assets)
      const mockAgentDevices: Device[] = [
        {
          id: 'agent-001',
          hostname: 'CORP-DEV-001',
          name: 'CORP-DEV-001',
          os: 'Windows',
          osVersion: '11 Pro',
          status: 'Online',
          network: {
            ipAddress: '192.168.1.89',
            macAddress: '00:1B:44:11:4A:12',
            subnet: '192.168.1.0/24'
          },
          lastSeen: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          security: {
            isSecure: true,
            antivirusStatus: 'Active',
            firewallEnabled: true,
            encryptionStatus: 'Encrypted',
            lastSecurityScan: new Date(Date.now() - 3 * 60 * 60 * 1000),
            vulnerabilityCount: 0,
            complianceScore: 97
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2024, 1, 1).toISOString(),
            maintenanceState: 'None'
          },
          policyVersion: 'latest',
          tags: ['development', 'workstation'],
          orgId: organizationId || 'mock-org-001'
        },
        {
          id: 'agent-002',
          hostname: 'REMOTE-MBP-005',
          name: 'REMOTE-MBP-005', 
          os: 'macOS',
          osVersion: '14.3',
          status: 'Online',
          network: {
            ipAddress: '192.168.100.45',
            macAddress: '78:4F:43:85:2D:5F',
            subnet: '192.168.100.0/24'
          },
          lastSeen: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
          security: {
            isSecure: true,
            antivirusStatus: 'Active',
            firewallEnabled: true,
            encryptionStatus: 'Encrypted',
            lastSecurityScan: new Date(Date.now() - 5 * 60 * 60 * 1000),
            vulnerabilityCount: 0,
            complianceScore: 95
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2024, 0, 15).toISOString(),
            maintenanceState: 'None'
          },
          policyVersion: 'latest',
          tags: ['laptop', 'remote', 'executive'],
          orgId: organizationId || 'mock-org-001'
        },
        {
          id: 'agent-003',
          hostname: 'LAB-UBUNTU-003',
          name: 'LAB-UBUNTU-003',
          os: 'Linux',
          osVersion: 'Ubuntu 22.04 LTS',
          status: 'Warning',
          network: {
            ipAddress: '10.0.2.45',
            macAddress: '00:1B:44:11:5B:23',
            subnet: '10.0.2.0/24'
          },
          lastSeen: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          security: {
            isSecure: false,
            antivirusStatus: 'Inactive',
            firewallEnabled: true,
            encryptionStatus: 'Encrypted',
            lastSecurityScan: new Date(Date.now() - 18 * 60 * 60 * 1000),
            vulnerabilityCount: 2,
            complianceScore: 78
          },
          lifecycle: {
            state: 'Live',
            deployedDate: new Date(2023, 9, 10).toISOString(),
            maintenanceState: 'Overdue'
          },
          policyVersion: '1.2.0',
          tags: ['lab', 'development', 'linux'],
          orgId: organizationId || 'mock-org-001'
        }
      ];
      
      setAgentDevices(mockAgentDevices);
      
    } catch (error) {
      console.error('Error loading mock agent devices:', error);
    }
  };

  // ---- Enrollment Token & Install Helpers ----
  const fetchTokens = async () => {
    try {
      // Mock enrollment tokens for demo
      const mockTokens: EnrollmentToken[] = [
        {
          token: 'dws_enroll_abc123def456ghi789',
          name: 'Production Enrollment',
          description: 'Primary enrollment token for production devices',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          maxUses: 10,
          usedCount: 3,
          used: false
        },
        {
          token: 'dws_enroll_xyz987uvw654rst321',
          name: 'Lab Environment',
          description: 'Token for development and testing devices',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          maxUses: 5,
          usedCount: 1,
          used: false
        },
        {
          token: 'dws_enroll_quick_install_temp',
          name: 'Quick Install',
          description: 'Generated from Agents tab',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          maxUses: 1,
          usedCount: 0,
          used: false
        }
      ];
      
      setTokens(mockTokens);
      if (!selectedToken && mockTokens.length > 0) {
        setSelectedToken(mockTokens[0].token);
      }
    } catch (e) {
      console.error('Failed to fetch tokens', e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load enrollment tokens' });
    }
  };

  const generateEnrollmentToken = async () => {
    try {
      setCreatingToken(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate mock token
      const newToken: EnrollmentToken = {
        token: `dws_enroll_${Math.random().toString(36).substring(2, 15)}`,
        name: 'Quick Install',
        description: 'Generated from Agents tab',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        maxUses: 1,
        usedCount: 0,
        used: false
      };
      
      setTokens(current => [newToken, ...current]);
      setSelectedToken(newToken.token);
      toast({ title: 'Token created', description: 'One-time enrollment token generated.' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create token' });
    } finally {
      setCreatingToken(false);
    }
  };

  const copyToClipboard = async (text: string, description?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: description || 'Copied to clipboard' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Copy failed', description: 'Unable to copy to clipboard' });
    }
  };

  const buildUnixCommand = () => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://app.deskwise.ai';
    const org = organizationId || 'deskwise-demo-org-001';
    const token = selectedToken || 'enrollment-token';
    return `curl -sSL ${base}/api/agent/install | bash -s -- --org-id="${org}" --token="${token}"`;
  };

  const buildWindowsCommand = () => {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://app.deskwise.ai';
    const org = organizationId || 'deskwise-demo-org-001';
    const token = selectedToken || 'enrollment-token';
    return `iwr -useb ${base}/api/agent/install?platform=windows -OutFile install.ps1; .\\install.ps1 -OrgId "${org}" -Token "${token}"`;
  };

  const downloadBinary = async (os: 'Windows' | 'Linux' | 'macOS', arch: 'x64' | 'arm64') => {
    try {
      const res = await fetch(`/api/agent/upgrade/manifest?os=${encodeURIComponent(os)}&arch=${encodeURIComponent(arch)}`);
      let data: any = null;
      try {
        data = await res.json();
      } catch (_) {
        // ignore JSON parse errors
      }
      if (!res.ok) {
        const detail = data?.error || (data ? JSON.stringify(data) : 'Failed to fetch manifest');
        throw new Error(detail);
      }
      const url: string | undefined = data?.downloadUrl || data?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Manifest missing download URL');
      }
    } catch (e) {
      console.error('Download error', e);
      const description = e instanceof Error ? e.message : 'Could not retrieve agent binary URL';
      toast({ variant: 'destructive', title: 'Download failed', description });
    }
  };

  // Initialize active tab from query parameter if provided
  useEffect(() => {
    const tab = searchParams.get('tab');
    const validTabs = ['devices', 'agents', 'scripts', 'approvals', 'inventory'] as const;
    if (tab && (validTabs as readonly string[]).includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  // Add timeout for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    console.log('User effect triggered:', { user: !!user, organizationId });
    loadMockAssetData();
  }, []);

  // Load mock agent devices
  useEffect(() => {
    loadMockAgentDevices();
  }, []);

  // Load enrollment tokens when download dialog opens
  useEffect(() => {
    if (downloadDialogOpen) {
      void fetchTokens();
    }
  }, [downloadDialogOpen]);

  useEffect(() => {
    if (operationalAssets.length > 0) {
      fetchEnhancedStats();
    } else if (operationalAssets.length === 0 && !loading) {
      // Set default stats when no assets
      setStats({
        total: 0,
        online: 0,
        offline: 0,
        warning: 0,
        maintenance: 0,
        quarantined: 0,
        byOS: { Windows: 0, macOS: 0, Linux: 0 },
        byLifecycle: {
          Planned: 0, Ordered: 0, Received: 0, Deployed: 0,
          Live: 0, Maintenance: 0, Retiring: 0, Disposed: 0
        },
        vulnerabilities: 0,
        maintenanceOverdue: 0,
        policyCompliance: 0,
        agentsConnected: 0,
        agentsOffline: 0,
        averageUptime: 0,
        securityScore: 0
      });
    }
  }, [operationalAssets, loading]);

  // Legacy function - now using mock data
  const fetchOperationalAssets = loadMockAssetData;
  // Legacy function - now using mock data
  const fetchAgentDevices = loadMockAgentDevices;

  

  const fetchEnhancedStats = async () => {
    if (!organizationId) return;
    
    try {
      console.log('Fetching enhanced stats...');
      // Fetch basic stats from existing API
      const response = await fetch('/api/assets/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const basicStats = await response.json();
      console.log('Basic stats:', basicStats);
      
      // Calculate enhanced operational metrics
      const deviceStats: DeviceStats = {
        total: basicStats.totalAssets || 0,
        online: basicStats.onlineAssets || 0,
        offline: basicStats.offlineAssets || 0,
        warning: basicStats.warningAssets || 0,
        maintenance: basicStats.maintenanceDue || 0,
        quarantined: 0,
        byOS: {
          Windows: Math.floor((basicStats.totalAssets || 0) * 0.65),
          macOS: Math.floor((basicStats.totalAssets || 0) * 0.20),
          Linux: Math.floor((basicStats.totalAssets || 0) * 0.15)
        },
        byLifecycle: {
          Planned: 0,
          Ordered: 0,
          Received: 0,
          Deployed: 0,
          Live: basicStats.onlineAssets || 0,
          Maintenance: basicStats.maintenanceDue || 0,
          Retiring: 0,
          Disposed: 0
        },
        vulnerabilities: operationalAssets.reduce((sum, asset) => sum + (asset.security?.vulnerabilityCount || 0), 0),
        maintenanceOverdue: basicStats.maintenanceDue || 0,
        policyCompliance: basicStats.totalAssets > 0 ? Math.round(((basicStats.securedAssets || 0) / basicStats.totalAssets) * 100) : 0,
        // Enhanced operational metrics (simulated for now)
        agentsConnected: operationalAssets.filter(a => a.agent?.connected).length,
        agentsOffline: operationalAssets.filter(a => !a.agent?.connected).length,
        averageUptime: operationalAssets.length > 0 ? Math.round(operationalAssets.reduce((sum, a) => sum + (a.performance?.uptime || 0), 0) / operationalAssets.length) : 95,
        securityScore: operationalAssets.length > 0 ? Math.round(operationalAssets.reduce((sum, a) => sum + (a.security?.complianceScore || 0), 0) / operationalAssets.length) : 85
      };

      console.log('Device stats calculated:', deviceStats);
      setStats(deviceStats);
    } catch (error) {
      console.error('Failed to fetch enhanced stats:', error);
      // Fallback to basic calculation if API fails
      calculateBasicStats();
    }
  };

  const calculateBasicStats = () => {
    if (operationalAssets.length === 0) return;
    
    const total = operationalAssets.length;
    const online = operationalAssets.filter(a => a.status === 'Online').length;
    const offline = operationalAssets.filter(a => a.status === 'Offline').length;
    const warning = operationalAssets.filter(a => a.status === 'Warning').length;
    
    const basicStats: DeviceStats = {
      total,
      online,
      offline,
      warning,
      maintenance: operationalAssets.filter(a => a.lifecycle.maintenanceState === 'Overdue').length,
      quarantined: 0,
      byOS: {
        Windows: operationalAssets.filter(a => a.os?.includes('Windows')).length,
        macOS: operationalAssets.filter(a => a.os?.includes('macOS')).length,
        Linux: operationalAssets.filter(a => a.os?.includes('Linux')).length
      },
      byLifecycle: {
        Planned: operationalAssets.filter(a => a.lifecycle.state === 'Planned').length,
        Ordered: operationalAssets.filter(a => a.lifecycle.state === 'Ordered').length,
        Received: operationalAssets.filter(a => a.lifecycle.state === 'Received').length,
        Deployed: operationalAssets.filter(a => a.lifecycle.state === 'Deployed').length,
        Live: operationalAssets.filter(a => a.lifecycle.state === 'Live').length,
        Maintenance: operationalAssets.filter(a => a.lifecycle.state === 'Maintenance').length,
        Retiring: operationalAssets.filter(a => a.lifecycle.state === 'Retiring').length,
        Disposed: operationalAssets.filter(a => a.lifecycle.state === 'Disposed').length
      },
      vulnerabilities: operationalAssets.reduce((sum, a) => sum + a.security.vulnerabilityCount, 0),
      maintenanceOverdue: operationalAssets.filter(a => a.lifecycle.maintenanceState === 'Overdue').length,
      policyCompliance: operationalAssets.filter(a => a.policyVersion === 'latest').length / total * 100,
      agentsConnected: operationalAssets.filter(a => a.agent?.connected).length,
      agentsOffline: operationalAssets.filter(a => !a.agent?.connected).length,
      averageUptime: operationalAssets.reduce((sum, a) => sum + (a.performance?.uptime || 0), 0) / total,
      securityScore: operationalAssets.reduce((sum, a) => sum + a.security.complianceScore, 0) / total
    };
    
    setStats(basicStats);
  };

  const handleSelectDevice = (device: Device) => {
    // Navigate to Asset Details page; do not open console drawer here
    router.push(`/assets/${device.id}`);
  };

  const openConsoleForDevice = (device: Device) => {
    setSelectedDevice(device);
    setConsoleOpen(true);
  };

  const getOperationalAssetForDevice = (device: Device): OperationalAsset | undefined => {
    return operationalAssets.find(asset => asset.id === device.id);
  };

  const handleQuickAction = (device: Device, action: QuickAction) => {
    // Only open the console drawer explicitly via the 'Open Terminal' action
    if (action.id === 'terminal') {
      openConsoleForDevice(device);
      return;
    }

    if (action.requiresApproval) {
      setSelectedDevice(device);
      setApprovalDialogOpen(true);
    } else {
      // Execute other actions directly
      executeQuickAction(device, action);
    }
  };

  const executeQuickAction = async (device: Device, action: QuickAction) => {
    try {
      // TODO: Implement actual action execution
      toast({
        title: 'Action Executed',
        description: `${action.label} executed on ${device.hostname}`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: `Failed to execute ${action.label} on ${device.hostname}`
      });
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = (device.hostname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (device.network.ipAddress || '').includes(searchTerm);
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(device.status);
    const matchesOS = osFilter.length === 0 || osFilter.includes(device.os);
    
    return matchesSearch && matchesStatus && matchesOS;
  });

  const filteredAgentDevices = agentDevices.filter(device => {
    const matchesSearch = (device.hostname || '').toLowerCase().includes(agentSearchTerm.toLowerCase()) ||
                         (device.network.ipAddress || '').includes(agentSearchTerm);
    const matchesStatus = agentStatusFilter.length === 0 || agentStatusFilter.includes(device.status);
    const matchesOS = agentOSFilter.length === 0 || agentOSFilter.includes(device.os);
    return matchesSearch && matchesStatus && matchesOS;
  });

  console.log('Render state:', { loading, stats: !!stats, assetsLength: operationalAssets.length, organizationId });

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center text-muted-foreground">
          Loading Asset Operations Hub...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Operations Hub</h1>
          <p className="text-muted-foreground">
            Unified device management, script execution, and policy enforcement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPolicyExplainerOpen(true)}>
            <Shield className="h-4 w-4 mr-2" />
            Policy Center
          </Button>
          <Button onClick={async () => { await loadMockAssetData(); await loadMockAgentDevices(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assets"
          value={stats.total}
          subtitle={`${stats.agentsConnected} agents connected`}
          icon={Monitor}
          variant="default"
        />
        
        <MetricCard
          title="Security Score"
          value={`${stats.securityScore}%`}
          subtitle={`${stats.vulnerabilities} vulnerabilities found`}
          icon={Shield}
          variant={stats.securityScore >= 90 ? 'success' : stats.securityScore >= 70 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Uptime Average"
          value={`${stats.averageUptime}%`}
          subtitle="Across all managed assets"
          icon={TrendingUp}
          variant={stats.averageUptime >= 99 ? 'success' : stats.averageUptime >= 95 ? 'warning' : 'danger'}
        />
        
        <MetricCard
          title="Maintenance Due"
          value={stats.maintenanceOverdue}
          subtitle="Devices requiring attention"
          icon={Clock}
          variant={stats.maintenanceOverdue > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="approvals">Approvals & Jobs</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostname</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                    <TableHead className="hidden lg:table-cell">Policy</TableHead>
                    <TableHead className="hidden lg:table-cell">Tags</TableHead>
                    <TableHead className="hidden xl:table-cell">Health</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.length > 0 ? (
                    filteredDevices.map(device => (
                      <DeviceRow
                        key={device.id}
                        device={device}
                        onSelectDevice={handleSelectDevice}
                        onQuickAction={handleQuickAction}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
                        <div className="flex flex-col items-center gap-2">
                          <Monitor className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm || statusFilter.length > 0 || osFilter.length > 0
                              ? "No assets match the current filters."
                              : "No assets found. Assets from your register will appear here with operational capabilities."
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Agents</CardTitle>
                  <CardDescription>
                    Enrolled agent devices with real-time status
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search agents..."
                      value={agentSearchTerm}
                      onChange={(e) => setAgentSearchTerm(e.target.value)}
                      onBlur={fetchAgentDevices}
                      className="pl-9 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(['Online', 'Offline', 'Warning', 'Maintenance', 'Quarantined'] as DeviceStatus[]).map(status => (
                        <DropdownMenuCheckboxItem
                          key={status}
                          checked={agentStatusFilter.includes(status)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...agentStatusFilter, status]
                              : agentStatusFilter.filter(s => s !== status);
                            setAgentStatusFilter(next);
                            setTimeout(fetchAgentDevices, 0);
                          }}
                        >
                          {status}
                        </DropdownMenuCheckboxItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filter by OS</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {(['Windows', 'macOS', 'Linux'] as OSType[]).map(os => (
                        <DropdownMenuCheckboxItem
                          key={os}
                          checked={agentOSFilter.includes(os)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...agentOSFilter, os]
                              : agentOSFilter.filter(o => o !== os);
                            setAgentOSFilter(next);
                            setTimeout(fetchAgentDevices, 0);
                          }}
                        >
                          {os}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    onClick={() => setDownloadDialogOpen(true)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Install / Download Agent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => { await loadMockAssetData(); await loadMockAgentDevices(); }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hostname</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                    <TableHead className="hidden lg:table-cell">Policy</TableHead>
                    <TableHead className="hidden lg:table-cell">Tags</TableHead>
                    <TableHead className="hidden xl:table-cell">Health</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgentDevices.length > 0 ? (
                    filteredAgentDevices.map(device => (
                      <DeviceRow
                        key={device.id}
                        device={device}
                        onSelectDevice={handleSelectDevice}
                        onQuickAction={handleQuickAction}
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
                        <div className="flex flex-col items-center gap-2">
                          <Monitor className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {agentSearchTerm || agentStatusFilter.length > 0 || agentOSFilter.length > 0
                              ? 'No agents match the current filters.'
                              : 'No enrolled agents found yet.'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scripts Tab */}
        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Script Library</CardTitle>
              <CardDescription>
                Manage and execute signed scripts across your device fleet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Terminal className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Script Management</p>
                <p className="text-muted-foreground mb-4">
                  Upload, sign, and execute scripts with full audit trails
                </p>
                <Button>
                  <Zap className="h-4 w-4 mr-2" />
                  Create Script
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals & Jobs Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approvals & Jobs</CardTitle>
              <CardDescription>
                Monitor approval requests and job execution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Approval Workflow</p>
                <p className="text-muted-foreground mb-4">
                  Review and approve high-risk operations with audit trails
                </p>
                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  View Pending
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ITAM Hub - Asset & Inventory Integration</CardTitle>
              <CardDescription>
                Unified view of asset register and inventory with deployment tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
                {/* Asset Register Stats */}
                <div className="text-center">
                  <Monitor className="h-12 w-12 text-primary mx-auto mb-3" />
                  <p className="text-lg font-medium">Asset Register</p>
                  <p className="text-2xl font-bold text-primary">{stats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Tracked Assets</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Register
                  </Button>
                </div>

                {/* Inventory Integration */}
                <div className="text-center">
                  <Package className="h-12 w-12 text-success mx-auto mb-3" />
                  <p className="text-lg font-medium">Inventory Items</p>
                  <p className="text-2xl font-bold text-success">
                    {operationalAssets.filter(a => a.sku).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Linked to Inventory</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <a href="/inventory">
                      View Inventory
                    </a>
                  </Button>
                </div>

                {/* Deployment Status */}
                <div className="text-center">
                  <Database className="h-12 w-12 text-primary/80 mx-auto mb-3" />
                  <p className="text-lg font-medium">Deployment Rate</p>
                  <p className="text-2xl font-bold text-primary/80">
                    {stats.total > 0 ? Math.round((operationalAssets.filter(a => a.lifecycle.state === 'Live').length / stats.total) * 100) : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Assets Deployed</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Reconcile
                  </Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Recent Asset-Inventory Links</h3>
                  <Button size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Link Asset
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {operationalAssets
                    .filter(asset => asset.sku)
                    .slice(0, 5)
                    .map(asset => (
                      <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Linked to inventory: {asset.sku}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-success">
                          Linked
                        </Badge>
                      </div>
                    ))}
                  
                  {operationalAssets.filter(a => a.sku).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No asset-inventory links found</p>
                      <p className="text-sm">Start linking assets to inventory items for better tracking</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs and Drawers */}
      {selectedDevice && (
        <>
          <DeviceConsoleDrawer
            device={selectedDevice!}
            operationalAsset={getOperationalAssetForDevice(selectedDevice!)}
            open={consoleOpen}
            onOpenChange={setConsoleOpen}
          />
          
          <ApprovalRequestDialog
            device={selectedDevice!}
            open={approvalDialogOpen}
            onOpenChange={setApprovalDialogOpen}
          />
        </>
      )}
      
      <PolicyExplainerDialog
        open={policyExplainerOpen}
        onOpenChange={setPolicyExplainerOpen}
      />

      {/* Install / Download Agent Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Install / Download Agent</DialogTitle>
            <DialogDescription>
              Generate a tenant-scoped enrollment token and copy OS-specific install commands. You can also download binaries directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-2">
              <Label>Organization ID</Label>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 rounded bg-muted text-sm">
                  {organizationId || 'deskwise-demo-org-001'}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(organizationId || 'deskwise-demo-org-001', 'Organization ID copied')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Enrollment Token</Label>
              <div className="flex items-center gap-2">
                <select
                  className="w-full border rounded px-2 py-2 bg-background"
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value)}
                >
                  <option value="">Select a token...</option>
                  {tokens.map(t => (
                    <option key={t.token} value={t.token}>
                      {(t.name || 'Token')} — {t.token.substring(0, 12)}...
                    </option>
                  ))}
                </select>
                <Button onClick={generateEnrollmentToken} disabled={creatingToken}>
                  {creatingToken ? 'Generating...' : 'Generate Token'}
                </Button>
                {selectedToken && (
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(selectedToken, 'Enrollment token copied')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Tokens are scoped to your organization and may have limited uses/expiry.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Linux / macOS Command</Label>
                <div className="p-3 bg-muted rounded">
                  <code className="text-xs break-all">{buildUnixCommand()}</code>
                </div>
                <div>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(buildUnixCommand(), 'Unix install command copied')}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Command
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Windows PowerShell Command</Label>
                <div className="p-3 bg-muted rounded">
                  <code className="text-xs break-all">{buildWindowsCommand()}</code>
                </div>
                <div>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(buildWindowsCommand(), 'Windows install command copied')}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Command
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Manual Downloads (latest)</Label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => downloadBinary('Windows', 'x64')}>
                  <Download className="h-4 w-4 mr-2" /> Windows x64
                </Button>
                <Button variant="outline" onClick={() => downloadBinary('Linux', 'x64')}>
                  <Download className="h-4 w-4 mr-2" /> Linux x64
                </Button>
                <Button variant="outline" onClick={() => downloadBinary('macOS', 'arm64')}>
                  <Download className="h-4 w-4 mr-2" /> macOS arm64
                </Button>
                <Button variant="outline" onClick={() => downloadBinary('macOS', 'x64')}>
                  <Download className="h-4 w-4 mr-2" /> macOS x64
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setDownloadDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}