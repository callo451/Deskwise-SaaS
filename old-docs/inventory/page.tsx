
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import type { DashboardStat, ITILAssetKPIs, AdvancedAssetMetrics } from '@/lib/types';
import type { InventoryExtended, InventoryStats } from '@/lib/services/inventory';
import type { InventoryCategorySettingExtended } from '@/lib/services/inventory-settings';
import {
  MoreHorizontal,
  PlusCircle,
  ListFilter,
  File,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  Shield,
  BarChart3,
  Target,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Search,
  Download,
  Edit,
  Trash2,
  CheckSquare,
  Filter,
  RefreshCw,
  TrendingDown,
  Zap,
  Database
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AssetDeploymentDialog } from '@/components/itam/asset-deployment-dialog';

// Enhanced stat card with contextual icons and modern styling
const StatCard = ({ stat, icon: IconComponent, variant = 'default' }: { 
  stat: DashboardStat; 
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'warning' | 'success' | 'info' | 'danger';
}) => {
  const isIncrease = stat.changeType === 'increase';
  const Icon = IconComponent || Activity;
  
  const variantStyles = {
    default: 'bg-background border-border',
    warning: 'bg-warning/5 border-warning/20',
    success: 'bg-success/10 border-success/20',
    info: 'bg-primary/10 border-primary/20',
    danger: 'bg-destructive/5 border-destructive/20'
  };
  
  const iconColors = {
    default: 'text-muted-foreground',
    warning: 'text-warning',
    success: 'text-success',
    info: 'text-primary',
    danger: 'text-destructive'
  };
  
  return (
    <Card className={`${variantStyles[variant]} shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <Icon className={`h-5 w-5 ${iconColors[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground flex items-center mt-1">
          <span
            className={`flex items-center mr-1 ${
              isIncrease ? 'text-success' : 'text-warning'
            }`}
          >
            {isIncrease ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {stat.change}
          </span>
          {stat.description}
        </p>
      </CardContent>
    </Card>
  );
};

// New ITIL KPI Card component for advanced metrics
const ITILKPICard = ({ title, value, target, icon: IconComponent, variant = 'default' }: {
  title: string;
  value: number | string;
  target?: number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}) => {
  const percentage = typeof value === 'number' && target ? (value / target) * 100 : null;
  const isOnTarget = percentage ? percentage >= 90 : true;
  
  const variantStyles = {
    default: 'bg-background border-border',
    warning: 'bg-warning/5 border-warning/20',
    success: 'bg-success/10 border-success/20',
    danger: 'bg-destructive/5 border-destructive/20'
  };
  
  const iconColors = {
    default: 'text-muted-foreground',
    warning: 'text-warning',
    success: 'text-success',
    danger: 'text-destructive'
  };
  
  return (
    <Card className={`${variantStyles[variant]} shadow-sm hover:shadow-lg transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <IconComponent className={`h-5 w-5 ${iconColors[variant]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toFixed(1) : value}
          {typeof value === 'number' && target && '%'}
        </div>
        {target && percentage && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progress to target</span>
              <span>{percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOnTarget ? 'bg-success' : percentage > 50 ? 'bg-warning' : 'bg-destructive'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const InventoryItemRow = ({ item, onDelete, isSelected, onSelect, onDeploy }: { 
  item: InventoryExtended; 
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onDeploy?: (item: InventoryExtended) => void;
}) => {
  const isLowStock = item.quantity <= item.reorderPoint;
  const isOutOfStock = item.quantity === 0;
  
  // Enhanced status indicators
  const getStockStatus = () => {
    if (isOutOfStock) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (isLowStock) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };
  
  const stockStatus = getStockStatus();
  
  return (
    <TableRow className={`
      transition-colors hover:bg-muted/50 
      ${isOutOfStock ? 'bg-destructive/10 border-l-4 border-l-destructive' : ''}
      ${isLowStock && !isOutOfStock ? 'bg-warning/10 border-l-4 border-l-warning' : ''}
      ${isSelected ? 'bg-primary/10' : ''}
    `}>
      {onSelect && (
        <TableCell className="w-12">
          <CheckSquare 
            className={`h-4 w-4 cursor-pointer transition-colors ${
              isSelected ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`}
            onClick={() => onSelect(item.id, !isSelected)}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="space-y-1">
          <Link href={`/inventory/${item.id}`} className="font-medium text-primary hover:underline flex items-center gap-2">
            {item.name}
            {item.unitCost && (
              <span className="text-xs text-muted-foreground">
                ${item.unitCost.toLocaleString()}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{item.sku}</span>
            <Badge variant={stockStatus.variant} className="text-xs">
              {stockStatus.label}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={item.owner === 'MSP' ? 'default' : 'secondary'}>
          {item.owner}
        </Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="outline">{item.category}</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 text-muted-foreground" />
          {item.location}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isOutOfStock ? 'text-destructive' : isLowStock ? 'text-warning' : ''}`}>
            {item.quantity}
          </span>
          {item.reorderPoint && (
            <span className="text-xs text-muted-foreground">
              / {item.reorderPoint}
            </span>
          )}
          {isLowStock && (
            <AlertTriangle className={`h-4 w-4 ${isOutOfStock ? 'text-destructive' : 'text-warning'}`} title="Stock alert" />
          )}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {item.totalValue ? (
          <span className="font-medium">${item.totalValue.toLocaleString()}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions for {item.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/inventory/${item.id}`} className="flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            {item.quantity > 0 && onDeploy && (
              <DropdownMenuItem onClick={() => onDeploy(item)}>
                <Zap className="mr-2 h-4 w-4" />
                Deploy as Asset
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit Item
            </DropdownMenuItem>
            {isLowStock && (
              <DropdownMenuItem>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Reorder Stock
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function InventoryPage() {
  const itemOwners = ['MSP', 'TechCorp', 'GlobalInnovate', 'SecureNet Solutions', 'DataFlow Dynamics'];

  const [items, setItems] = useState<InventoryExtended[]>([]);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [itilKPIs, setItilKPIs] = useState<any>(null);
  const [portfolioHealth, setPortfolioHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [ownerFilters, setOwnerFilters] = useState<string[]>([]);
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'basic' | 'advanced'>('basic');
  const [deploymentDialogOpen, setDeploymentDialogOpen] = useState(false);
  const [selectedDeploymentItem, setSelectedDeploymentItem] = useState<InventoryExtended | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
    fetchStats();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/settings/inventory-settings?type=category');
      if (response.ok) {
        const categoriesData: InventoryCategorySettingExtended[] = await response.json();
        setItemCategories(categoriesData.filter(cat => cat.isActive).map(cat => cat.name));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [categoryFilters, ownerFilters]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      
      if (categoryFilters.length > 0) {
        params.append('category', categoryFilters.join(','));
      }
      
      if (ownerFilters.length > 0) {
        params.append('owner', ownerFilters.join(','));
      }
      
      const response = await fetch(`/api/inventory?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory items');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/inventory/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory statistics');
      }
      
      const data: InventoryStats = await response.json();
      
      // Convert InventoryStats to DashboardStat format with enhanced metrics
      const dashboardStats: DashboardStat[] = [
        {
          title: "Total Assets",
          value: data.totalItems.toString(),
          change: `$${data.totalValue.toLocaleString()}`,
          changeType: "increase",
          description: "portfolio value"
        },
        {
          title: "Stock Alerts",
          value: (data.lowStockItems + data.outOfStockItems).toString(),
          change: data.outOfStockItems > 0 ? `${data.outOfStockItems} critical` : "All stocked",
          changeType: (data.lowStockItems + data.outOfStockItems) > 0 ? "increase" : "decrease",
          description: "items need attention"
        },
        {
          title: "Asset Activity",
          value: data.recentMovements.toString(),
          change: "Last 30 days",
          changeType: "increase",
          description: "stock movements"
        },
        {
          title: "Procurement",
          value: data.pendingOrders.toString(),
          change: "Active orders",
          changeType: data.pendingOrders > 0 ? "increase" : "decrease",
          description: "pending deliveries"
        }
      ];
      
      setStats(dashboardStats);
      
      // Set ITIL KPIs and portfolio health if available
      if (data.itilKPIs) {
        setItilKPIs(data.itilKPIs);
      }
      if (data.portfolioHealth) {
        setPortfolioHealth(data.portfolioHealth);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/inventory/${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete inventory item');
      }
      
      // Refresh the items list
      fetchItems();
      fetchStats();
    } catch (err) {
      console.error('Error deleting inventory item:', err);
    }
  };

  const handleDeployAsset = (item: InventoryExtended) => {
    setSelectedDeploymentItem(item);
    setDeploymentDialogOpen(true);
  };

  const handleDeploymentSuccess = () => {
    // Refresh data after successful deployment
    fetchItems();
    fetchStats();
    toast({
      title: "Asset Deployed Successfully",
      description: "Inventory item has been deployed as an active asset."
    });
  };

  const handleCategoryFilterChange = (category: string, checked: boolean) => {
    setCategoryFilters(prev =>
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };
  
  const handleOwnerFilterChange = (owner: string, checked: boolean) => {
    setOwnerFilters(prev =>
      checked ? [...prev, owner] : prev.filter(o => o !== owner)
    );
  };
  
  const clearFilters = () => {
    setCategoryFilters([]);
    setOwnerFilters([]);
  };

  const handleSeedInventory = async () => {
    try {
      const res = await fetch('/api/inventory/seed', { method: 'POST' });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Failed to seed inventory' });
        return;
      }
      toast({ title: 'Seeded mock inventory' });
      await fetchItems();
      await fetchStats();
    } catch (e) {
      console.error('Seed inventory failed', e);
      toast({ variant: 'destructive', title: 'Seed request failed' });
    }
  };

  // Enhanced filtering and search
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.sku.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.owner.toLowerCase().includes(term)
      );
    }

    // Apply category filters
    if (categoryFilters.length > 0) {
      filtered = filtered.filter(item => categoryFilters.includes(item.category));
    }

    // Apply owner filters
    if (ownerFilters.length > 0) {
      filtered = filtered.filter(item => ownerFilters.includes(item.owner));
    }

    return filtered;
  }, [items, searchTerm, categoryFilters, ownerFilters]);

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleBulkExport = async () => {
    setBulkActionLoading(true);
    try {
      // Simulate export functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: `Exported ${selectedItems.length} items` });
      setSelectedItems([]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export failed' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedItems.length} selected items?`)) return;
    
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedItems.map(id => 
        fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      ));
      toast({ title: `Deleted ${selectedItems.length} items` });
      setSelectedItems([]);
      await fetchItems();
      await fetchStats();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Bulk delete failed' });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Get stat card icons and variants
  const getStatCardProps = (stat: DashboardStat) => {
    switch (stat.title) {
      case 'Total Assets':
        return { icon: Package, variant: 'info' as const };
      case 'Stock Alerts':
        const alertCount = parseInt(stat.value);
        return { 
          icon: AlertTriangle, 
          variant: (alertCount > 0 ? 'warning' : 'success') as const 
        };
      case 'Asset Activity':
        return { icon: TrendingUp, variant: 'default' as const };
      case 'Procurement':
        return { icon: ShoppingCart, variant: 'default' as const };
      default:
        return { icon: Activity, variant: 'default' as const };
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
            <div className="text-center text-muted-foreground">Loading inventory...</div>
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
            <div className="text-center text-destructive">
              <p>Error loading inventory: {error}</p>
              <Button onClick={fetchItems} className="mt-4" size="sm">
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
      {/* Enhanced Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Asset Management</h1>
          <p className="text-muted-foreground">
            ITIL-compliant inventory and asset lifecycle management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'basic' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('basic')}
          >
            Basic View
          </Button>
          <Button
            variant={viewMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('advanced')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            ITIL Dashboard
          </Button>
        </div>
      </div>

      {/* Basic Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => {
          const props = getStatCardProps(stat);
          return (
            <StatCard 
              key={stat.title} 
              stat={stat} 
              icon={props.icon}
              variant={props.variant}
            />
          );
        })}
      </div>

      {/* Advanced ITIL Metrics (only in advanced view) */}
      {viewMode === 'advanced' && itilKPIs && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">ITIL Asset Management KPIs</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ITILKPICard
              title="Asset Utilization"
              value={itilKPIs.assetUtilizationRate}
              target={85}
              icon={Target}
              variant={itilKPIs.assetUtilizationRate >= 85 ? 'success' : 'warning'}
            />
            <ITILKPICard
              title="License Compliance"
              value={itilKPIs.licenseComplianceRate}
              target={100}
              icon={CheckCircle}
              variant={itilKPIs.licenseComplianceRate >= 95 ? 'success' : 'danger'}
            />
            <ITILKPICard
              title="Security Compliance"
              value={itilKPIs.securityComplianceRate}
              target={100}
              icon={Shield}
              variant={itilKPIs.securityComplianceRate >= 95 ? 'success' : 'danger'}
            />
            <ITILKPICard
              title="Audit Readiness"
              value={itilKPIs.auditReadinessScore}
              target={90}
              icon={CheckSquare}
              variant={itilKPIs.auditReadinessScore >= 90 ? 'success' : 'warning'}
            />
            <ITILKPICard
              title="Cost Per Asset"
              value={`$${itilKPIs.costPerAsset?.toFixed(0) || 0}`}
              icon={DollarSign}
              variant="default"
            />
            <ITILKPICard
              title="Avg Lifespan"
              value={`${itilKPIs.averageAssetLifespan} mo`}
              icon={Clock}
              variant="default"
            />
            <ITILKPICard
              title="Procurement Time"
              value={`${itilKPIs.timeToProcurement} days`}
              icon={ShoppingCart}
              variant="default"
            />
            <ITILKPICard
              title="Critical Assets"
              value={`${itilKPIs.criticalAssetPercentage?.toFixed(1) || 0}%`}
              icon={AlertCircle}
              variant={itilKPIs.criticalAssetPercentage > 20 ? 'warning' : 'default'}
            />
          </div>
        </div>
      )}

      {/* Portfolio Health (only in advanced view) */}
      {viewMode === 'advanced' && portfolioHealth && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Portfolio Health Analysis</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ITILKPICard
              title="Modern Assets"
              value={portfolioHealth.modernAssetPercentage}
              target={80}
              icon={Zap}
              variant={portfolioHealth.modernAssetPercentage >= 80 ? 'success' : 'warning'}
            />
            <ITILKPICard
              title="End of Life"
              value={portfolioHealth.endOfLifeAssetCount}
              icon={XCircle}
              variant={portfolioHealth.endOfLifeAssetCount > 0 ? 'danger' : 'success'}
            />
            <ITILKPICard
              title="Single Point Failures"
              value={portfolioHealth.singlePointsOfFailure}
              icon={AlertTriangle}
              variant={portfolioHealth.singlePointsOfFailure > 0 ? 'danger' : 'success'}
            />
            <ITILKPICard
              title="Unsupported Assets"
              value={portfolioHealth.unsupportedAssetCount}
              icon={AlertCircle}
              variant={portfolioHealth.unsupportedAssetCount > 0 ? 'warning' : 'success'}
            />
          </div>
        </div>
      )}
      {/* Enhanced Search and Filtering Bar */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search assets, SKUs, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {(categoryFilters.length + ownerFilters.length) > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                        {categoryFilters.length + ownerFilters.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {itemCategories.map(cat => (
                    <DropdownMenuCheckboxItem 
                      key={cat} 
                      checked={categoryFilters.includes(cat)} 
                      onCheckedChange={checked => handleCategoryFilterChange(cat, !!checked)}
                    >
                      {cat}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Owner</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {itemOwners.map(owner => (
                    <DropdownMenuCheckboxItem 
                      key={owner} 
                      checked={ownerFilters.includes(owner)} 
                      onCheckedChange={checked => handleOwnerFilterChange(owner, !!checked)}
                    >
                      {owner}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters} className="text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Clear Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBulkExport}
                disabled={selectedItems.length === 0 || bulkActionLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Link href="/inventory/new">
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(categoryFilters.length > 0 || ownerFilters.length > 0 || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="gap-1">
                  Search: {searchTerm}
                  <XCircle 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchTerm('')}
                  />
                </Badge>
              )}
              {categoryFilters.map(cat => (
                <Badge key={cat} variant="outline" className="gap-1">
                  Category: {cat}
                  <XCircle 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleCategoryFilterChange(cat, false)}
                  />
                </Badge>
              ))}
              {ownerFilters.map(owner => (
                <Badge key={owner} variant="outline" className="gap-1">
                  Owner: {owner}
                  <XCircle 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleOwnerFilterChange(owner, false)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <div className="px-6 py-3 bg-muted/50 border-b flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
            </span>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBulkExport}
                disabled={bulkActionLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <CheckSquare 
                      className={`h-4 w-4 cursor-pointer ${
                        selectedItems.length === filteredItems.length && filteredItems.length > 0
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }`}
                      onClick={() => handleSelectAll(selectedItems.length !== filteredItems.length)}
                    />
                  </TableHead>
                  <TableHead>Asset Details</TableHead>
                  <TableHead className="hidden sm:table-cell">Owner</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Stock Level</TableHead>
                  <TableHead className="hidden lg:table-cell">Value</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <InventoryItemRow 
                      key={item.id} 
                      item={item}
                      onDelete={handleDeleteItem}
                      isSelected={selectedItems.includes(item.id)}
                      onSelect={handleSelectItem}
                      onDeploy={handleDeployAsset}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {(categoryFilters.length > 0 || ownerFilters.length > 0 || searchTerm)
                            ? "No assets match your current filters."
                            : "No assets found. Add your first asset to get started."
                          }
                        </p>
                        {(categoryFilters.length > 0 || ownerFilters.length > 0 || searchTerm) && (
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Development Tools */}
      {process.env.NODE_ENV !== 'production' && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Development Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="sm" variant="secondary" onClick={handleSeedInventory}>
              Seed Sample Data
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Asset Deployment Dialog */}
      {selectedDeploymentItem && (
        <AssetDeploymentDialog
          open={deploymentDialogOpen}
          onOpenChange={setDeploymentDialogOpen}
          inventoryItem={selectedDeploymentItem}
          onSuccess={handleDeploymentSuccess}
        />
      )}
    </div>
  );
}
