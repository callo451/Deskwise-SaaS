'use client';

import { useState, useEffect } from 'react';
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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DashboardStat } from '@/lib/types';
import type { AssetExtended, AssetStats } from '@/lib/services/assets';
import {
  MoreHorizontal,
  PlusCircle,
  ListFilter,
  File,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Link from 'next/link';
import { useSidebar } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

const StatCard = ({ stat }: { stat: DashboardStat }) => {
  const isIncrease = stat.changeType === 'increase';
  return (
    <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground flex items-center">
          <span
            className={`flex items-center mr-1 ${
              isIncrease ? 'text-success' : 'text-destructive'
            }`}
          >
            {isIncrease ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {stat.change}
          </span>
          {stat.description}
        </p>
      </CardContent>
    </Card>
  );
};

const AssetRow = ({ asset, isInternalITMode, onDelete }: { asset: AssetExtended, isInternalITMode: boolean, onDelete: (id: string) => void }) => {
  const getStatusVariant = (status: AssetExtended['status']) => {
    switch (status) {
      case 'Online':
        return 'default';
      case 'Offline':
        return 'destructive';
      case 'Warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/assets/${asset.id}`}
          className="font-medium text-primary hover:underline"
        >
          {asset.name}
        </Link>
        <div className="hidden text-sm text-muted-foreground md:inline">
          {asset.id}
        </div>
      </TableCell>
      {!isInternalITMode && <TableCell className="hidden sm:table-cell">{asset.client}</TableCell>}
      <TableCell className="hidden sm:table-cell">{asset.type}</TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge
          variant={getStatusVariant(asset.status)}
          className="capitalize"
          style={
            asset.status === 'Online'
              ? {
                  backgroundColor: 'hsl(var(--success))',
                  color: 'hsl(var(--success-foreground))',
                }
              : {}
          }
        >
          {asset.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className={`flex items-center gap-1.5 ${asset.isSecure ? 'text-success' : 'text-warning'}`}>
                  {asset.isSecure ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                  <span className="hidden xl:inline">{asset.isSecure ? 'Secured' : 'At Risk'}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{asset.isSecure ? 'Antivirus is active and up-to-date.' : 'Security software not detected or out-of-date.'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="hidden md:table-cell">{asset.lastSeen}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/assets/${asset.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Remote Session</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(asset.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function LegacyAssetsPage() {
  const { isInternalITMode } = useSidebar();
  const { toast } = useToast();
  const assetTypes: Array<AssetExtended['type']> = ['Server', 'Workstation', 'Network', 'Printer'];
  const assetStatuses: Array<AssetExtended['status']> = ['Online', 'Offline', 'Warning'];
  const assetSecurityStatuses: string[] = ['Secured', 'At Risk'];

  const [assets, setAssets] = useState<AssetExtended[]>([]);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [securityFilters, setSecurityFilters] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [typeFilters, statusFilters, securityFilters]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (typeFilters.length > 0) {
        params.append('type', typeFilters.join(','));
      }
      
      if (statusFilters.length > 0) {
        params.append('status', statusFilters.join(','));
      }
      
      if (securityFilters.length > 0) {
        if (securityFilters.includes('Secured')) {
          params.append('isSecure', 'true');
        } else if (securityFilters.includes('At Risk')) {
          params.append('isSecure', 'false');
        }
      }
      
      const response = await fetch(`/api/assets?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/assets/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch asset statistics');
      }
      
      const data: AssetStats = await response.json();
      
      // Convert AssetStats to DashboardStat format
      const dashboardStats: DashboardStat[] = [
        {
          title: "Total Assets",
          value: data.totalAssets.toString(),
          change: `${data.onlineAssets} online`,
          changeType: "increase",
          description: "in your network"
        },
        {
          title: "Security Risk",
          value: data.atRiskAssets.toString(),
          change: `${Math.round((data.securedAssets / data.totalAssets) * 100)}% secured`,
          changeType: data.atRiskAssets > 0 ? "decrease" : "increase",
          description: "assets at risk"
        },
        {
          title: "Maintenance Due",
          value: data.maintenanceDue.toString(),
          change: "Schedule now",
          changeType: "decrease",
          description: "assets need attention"
        },
        {
          title: "Avg CPU Usage",
          value: `${data.avgCpuUsage}%`,
          change: data.avgCpuUsage > 80 ? "High" : "Normal",
          changeType: data.avgCpuUsage > 80 ? "increase" : "decrease",
          description: "across all assets"
        }
      ];
      
      setStats(dashboardStats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete asset');
      }
      
      // Refresh the assets list
      fetchAssets();
      fetchStats();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const handleTypeFilterChange = (type: string, checked: boolean) => {
    setTypeFilters(prev =>
      checked ? [...prev, type] : prev.filter(t => t !== type)
    );
  };

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilters(prev =>
      checked ? [...prev, status] : prev.filter(s => s !== status)
    );
  };

  const handleSecurityFilterChange = (securityStatus: string, checked: boolean) => {
    setSecurityFilters(prev =>
      checked ? [...prev, securityStatus] : prev.filter(s => s !== securityStatus)
    );
  };

  const clearFilters = () => {
    setTypeFilters([]);
    setStatusFilters([]);
    setSecurityFilters([]);
  };

  const handleSeedAssets = async () => {
    try {
      const res = await fetch('/api/assets/seed', { method: 'POST' });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Failed to seed assets' });
        return;
      }
      toast({ title: 'Seeded mock assets' });
      await fetchAssets();
      await fetchStats();
    } catch (e) {
      console.error('Seed assets failed', e);
      toast({ variant: 'destructive', title: 'Seed request failed' });
    }
  };

  const onClickImport = () => fileInputRef.current?.click();
  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/assets/import', { method: 'POST', body: form });
      if (!res.ok) throw new Error('Import failed');
      const data = await res.json();
      toast({ title: `Imported ${data.imported}, updated ${data.updated}` });
      await fetchAssets();
      await fetchStats();
    } catch (err) {
      console.error('Import error', err);
      toast({ variant: 'destructive', title: 'Import failed' });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading assets...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading assets: {error}</p>
              <Button onClick={fetchAssets} className="mt-4" size="sm">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Migration Notice */}
      <Card className="border-primary bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Legacy Assets View - Migration Notice
          </CardTitle>
          <CardDescription>
            You are viewing the legacy assets register. The new unified Asset Operations Hub provides enhanced features including real-time device control, script execution, and policy management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/assets">
            <Button className="mr-2">
              <Activity className="h-4 w-4 mr-2" />
              Go to Asset Operations Hub
            </Button>
          </Link>
          <Button variant="outline" onClick={() => toast({ title: "Legacy view", description: "You're viewing the legacy assets page. Consider upgrading to the new hub." })}>
            Continue with Legacy View
          </Button>
        </CardContent>
      </Card>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Devices</CardTitle>
              <CardDescription>
                Manage and monitor all client assets.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {process.env.NODE_ENV !== 'production' && (
                <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={handleSeedAssets}>
                  Seed Mock Assets
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Filter
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {assetTypes.map(type => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={typeFilters.includes(type)}
                      onCheckedChange={checked =>
                        handleTypeFilterChange(type, !!checked)
                      }
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                  {assetStatuses.map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={statusFilters.includes(status)}
                      onCheckedChange={checked =>
                        handleStatusFilterChange(status, !!checked)
                      }
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Security</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                  {assetSecurityStatuses.map(secStatus => (
                    <DropdownMenuCheckboxItem
                      key={secStatus}
                      checked={securityFilters.includes(secStatus)}
                      onCheckedChange={checked =>
                        handleSecurityFilterChange(secStatus, !!checked)
                      }
                    >
                      {secStatus}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>Clear Filters</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1"
                asChild
                title="Export CSV"
              >
                <a href="/api/assets/export?format=csv">
                  <File className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                </a>
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={onImportFile} />
              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={onClickImport} disabled={importing}>
                {importing ? 'Importing…' : 'Import CSV'}
              </Button>
              <Link href="/assets/new">
                <Button size="sm" className="h-7 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    New Asset
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / ID</TableHead>
                {!isInternalITMode && <TableHead className="hidden sm:table-cell">Client</TableHead>}
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden lg:table-cell">Security</TableHead>
                <TableHead className="hidden md:table-cell">Last Seen</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length > 0 ? (
                assets.map(asset => (
                  <AssetRow 
                    key={asset.id} 
                    asset={asset} 
                    isInternalITMode={isInternalITMode}
                    onDelete={handleDeleteAsset}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={isInternalITMode ? 6 : 7} className="text-center h-24">
                    {typeFilters.length > 0 || statusFilters.length > 0 || securityFilters.length > 0
                      ? "No assets match the current filters."
                      : "No assets found. Add your first asset to get started."
                    }
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}