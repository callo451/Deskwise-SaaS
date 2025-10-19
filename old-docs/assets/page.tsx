export { default } from './hub/page';
/*
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
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
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import type { AssetExtended } from '@/lib/services/assets';
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
  ListFilter,
  Search,
  RefreshCw,
  Power,
  Settings,
  FileText,
  File,
  Zap,
  Users,
  TrendingUp,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  PlusCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DeviceConsoleDrawer } from '@/components/asset-operations/device-console-drawer';
import { PolicyExplainerDialog } from '@/components/asset-operations/policy-explainer-dialog';
import { ApprovalRequestDialog } from '@/components/asset-operations/approval-request-dialog';
import type { Device, DeviceStatus, OSType, DeviceLifecycleState } from '@/lib/types/asset-operations';
import type { OperationalAsset } from '@/lib/services/asset-operations-bridge';
// Bridge operations moved to API routes
import { useAuth } from '@/contexts/auth-context';

// Local type for dashboard stats used by this page
type DashboardStat = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  description: string;
};

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
              isIncrease ? 'text-green-500' : 'text-red-500'
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
              <div className={`flex items-center gap-1.5 ${asset.isSecure ? 'text-green-600' : 'text-amber-600'}`}>
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

function LegacyAssetsPage() {
  // Immediately redirect to the new Asset Operations Hub
  const router = useRouter();
  useEffect(() => {
    router.replace('/assets/hub');
  }, [router]);

  // Minimal UI while redirecting (prevents rendering legacy code below)
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Redirecting to Asset Operations Hub...
        </CardContent>
      </Card>
    </div>
  );
}

export default LegacyAssetsPage;
*/
