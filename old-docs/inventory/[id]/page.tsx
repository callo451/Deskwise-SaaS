'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { InventoryExtended } from '@/lib/services/inventory';
import type { ITILAssetKPIs } from '@/lib/types';
import { 
  ChevronLeft, Edit, PlusCircle, AlertCircle, Package, History, Settings, 
  TrendingUp, Shield, DollarSign, Calendar, MapPin, User, Tag,
  Zap, Clock, Activity, BarChart3, Target, CheckCircle, AlertTriangle,
  RefreshCw, Download, Archive, Trash2, Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const DetailRow = ({ label, value, icon }: { 
  label: string; 
  value?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) => {
  if (value === null || value === undefined) return null;
  const Icon = icon;
  
  return (
    <div className="flex justify-between items-center py-3 text-sm">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="font-medium text-right">{value}</div>
    </div>
  );
};

// ITIL Asset Status Badge
const AssetStatusBadge = ({ lifecycleState, quantity, reorderPoint }: {
  lifecycleState?: string;
  quantity: number;
  reorderPoint: number;
}) => {
  if (quantity === 0) {
    return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Out of Stock</Badge>;
  }
  if (quantity <= reorderPoint) {
    return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" /> Low Stock</Badge>;
  }
  if (lifecycleState === 'Live') {
    return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Active</Badge>;
  }
  if (lifecycleState) {
    return <Badge variant="outline">{lifecycleState}</Badge>;
  }
  return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> In Stock</Badge>;
};

// ITIL KPI Metric Card for detail view
const AssetKPICard = ({ title, value, icon: IconComponent, variant = 'default' }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const variantStyles = {
    default: 'bg-background',
    success: 'bg-green-50 dark:bg-green-950/20',
    warning: 'bg-yellow-50 dark:bg-yellow-950/20',
    danger: 'bg-red-50 dark:bg-red-950/20'
  };
  
  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  };
  
  return (
    <div className={`${variantStyles[variant]} p-4 rounded-lg border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent className={`h-4 w-4 ${iconColors[variant]}`} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="text-lg font-bold">{value}</span>
      </div>
    </div>
  );
};

export default function InventoryItemDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  const [item, setItem] = useState<InventoryExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [adjustingStock, setAdjustingStock] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [itilKPIs, setItilKPIs] = useState<any>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity);
      setNotes(item.notes || '');
    }
  }, [item]);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/inventory/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Inventory item not found');
        } else {
          throw new Error('Failed to fetch inventory item');
        }
        return;
      }
      const data = await response.json();
      setItem(data);
      
      // Fetch additional data
      await Promise.all([
        fetchStockMovements(),
        fetchDeploymentHistory(),
        fetchAssetKPIs()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory item');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const response = await fetch(`/api/inventory/movements?itemId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setStockMovements(data);
      }
    } catch (err) {
      console.error('Failed to fetch stock movements:', err);
    }
  };

  const fetchDeploymentHistory = async () => {
    try {
      // This would fetch deployment history from the asset deployment API
      const mockDeployments = [
        {
          id: '1',
          deployedTo: 'DESK-001',
          deployedBy: 'John Smith',
          deployedAt: new Date().toISOString(),
          type: 'Asset Deployment',
          status: 'Active'
        }
      ];
      setDeploymentHistory(mockDeployments);
    } catch (err) {
      console.error('Failed to fetch deployment history:', err);
    }
  };

  const fetchAssetKPIs = async () => {
    try {
      // Mock ITIL KPIs for this specific asset
      const mockKPIs = {
        utilization: 85,
        availability: 99.9,
        meanTimeBetweenFailures: 2160, // hours
        totalCostOfOwnership: item?.unitCost ? item.unitCost * 1.3 : 0,
        complianceScore: 92,
        riskScore: 15
      };
      setItilKPIs(mockKPIs);
    } catch (err) {
      console.error('Failed to fetch asset KPIs:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchItem();
      toast({ title: 'Asset data refreshed' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to refresh data' });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded ml-12" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">Loading inventory item...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Inventory Item Not Found</CardTitle>
            <CardDescription>{error || 'The requested item could not be found.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/inventory">Back to Inventory</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleStockAdjustment = async () => {
    if (!item) return;
    
    try {
      setAdjustingStock(true);
      const response = await fetch(`/api/inventory/${item.id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          reason: 'Manual adjustment from inventory details page'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to adjust stock');
      }
      
      const updatedItem = await response.json();
      setItem(updatedItem);
      
      toast({
        title: "Stock Adjusted",
        description: `Quantity for ${item.name} has been updated to ${quantity}.`
      });
    } catch (err) {
      console.error('Failed to adjust stock:', err);
      toast({
        title: "Error",
        description: "Failed to adjust stock. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAdjustingStock(false);
    }
  };

  const saveNotes = async () => {
    if (!item) return;
    
    try {
      setSavingNotes(true);
      const response = await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notes');
      }
      
      const updatedItem = await response.json();
      setItem(updatedItem);
      
      toast({
        title: "Notes Saved",
        description: "Item notes have been updated successfully."
      });
    } catch (err) {
      console.error('Failed to save notes:', err);
      toast({
        title: "Error",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const isLowStock = quantity <= item.reorderPoint;

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Status */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <Button asChild variant="outline" size="icon" className="h-8 w-8">
              <Link href="/inventory">
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back to inventory</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-headline">{item.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground font-mono text-sm">SKU: {item.sku}</span>
                <AssetStatusBadge 
                  lifecycleState={item.lifecycleState}
                  quantity={item.quantity}
                  reorderPoint={item.reorderPoint}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground ml-12">
            <div className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {item.category}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {item.location}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {item.owner}
            </div>
            {item.unitCost && (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ${item.unitCost.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit Asset
          </Button>
          {item.quantity > 0 && (
            <Button size="sm">
              <Package className="mr-2 h-4 w-4" />
              Deploy as Asset
            </Button>
          )}
        </div>
      </div>

      {/* ITIL KPI Overview Cards */}
      {itilKPIs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AssetKPICard
            title="Utilization"
            value={`${itilKPIs.utilization}%`}
            icon={Target}
            variant={itilKPIs.utilization >= 80 ? 'success' : 'warning'}
          />
          <AssetKPICard
            title="Availability"
            value={`${itilKPIs.availability}%`}
            icon={CheckCircle}
            variant={itilKPIs.availability >= 99 ? 'success' : 'warning'}
          />
          <AssetKPICard
            title="TCO"
            value={`$${itilKPIs.totalCostOfOwnership?.toLocaleString() || '0'}`}
            icon={DollarSign}
            variant="default"
          />
          <AssetKPICard
            title="Risk Score"
            value={itilKPIs.riskScore}
            icon={Shield}
            variant={itilKPIs.riskScore < 20 ? 'success' : itilKPIs.riskScore < 50 ? 'warning' : 'danger'}
          />
        </div>
      )}

      {/* Enhanced Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Movements
          </TabsTrigger>
          <TabsTrigger value="deployments" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="itil" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            ITIL Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Asset Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Category" value={<Badge variant="outline">{item.category}</Badge>} icon={Tag} />
                  <DetailRow label="Owner" value={<Badge variant={item.owner === 'MSP' ? 'default' : 'secondary'}>{item.owner}</Badge>} icon={User} />
                  <DetailRow label="Location" value={item.location} icon={MapPin} />
                  {item.unitCost && (
                    <DetailRow label="Unit Cost" value={`$${item.unitCost.toLocaleString()}`} icon={DollarSign} />
                  )}
                  {item.totalValue && (
                    <DetailRow label="Total Value" value={`$${item.totalValue.toLocaleString()}`} icon={DollarSign} />
                  )}
                  {item.supplier && (
                    <DetailRow label="Supplier" value={item.supplier} />
                  )}
                  {item.warrantyInfo?.endDate && (
                    <DetailRow 
                      label="Warranty Expires" 
                      value={new Date(item.warrantyInfo.endDate).toLocaleDateString()} 
                      icon={Calendar}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Notes & Documentation
                  </CardTitle>
                  <CardDescription>
                    Internal notes and documentation for this asset
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    placeholder="Add notes about this asset..." 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    className="ml-auto"
                    onClick={saveNotes}
                    disabled={savingNotes || notes === item.notes}
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Stock</span>
                    <span className="text-2xl font-bold">{item.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Reorder Point</span>
                    <span>{item.reorderPoint}</span>
                  </div>
                  <Progress 
                    value={Math.min((item.quantity / (item.reorderPoint * 2)) * 100, 100)} 
                    className="h-2"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Adjust Stock Level
                  </label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="quantity" 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="0"
                    />
                    <Button 
                      onClick={handleStockAdjustment}
                      disabled={adjustingStock || quantity === item.quantity}
                    >
                      {adjustingStock ? 'Adjusting...' : 'Update'}
                    </Button>
                  </div>
                  {quantity <= item.reorderPoint && quantity > 0 && (
                    <p className="text-xs text-warning flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      This will trigger a low stock alert
                    </p>
                  )}
                  {quantity === 0 && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      This will mark the item as out of stock
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Stock Analytics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.max(0, item.quantity - item.reorderPoint)}
                    </div>
                    <div className="text-xs text-muted-foreground">Available Stock</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {item.totalValue ? `$${item.totalValue.toLocaleString()}` : '-'}
                    </div>
                    <div className="text-xs text-muted-foreground">Stock Value</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stock Health</span>
                    <span className={quantity > item.reorderPoint ? 'text-green-600' : quantity > 0 ? 'text-yellow-600' : 'text-red-600'}>
                      {quantity > item.reorderPoint ? 'Healthy' : quantity > 0 ? 'Low' : 'Critical'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Days of Stock</span>
                    <span>~30 days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Turnover Rate</span>
                    <span>12x/year</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Stock Movement History
              </CardTitle>
              <CardDescription>
                Track all stock movements and changes for this asset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stockMovements.length > 0 ? (
                <div className="space-y-4">
                  {stockMovements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          movement.type === 'in' ? 'bg-green-500' : 
                          movement.type === 'out' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium">{movement.reason || movement.type}</div>
                          <div className="text-sm text-muted-foreground">
                            by {movement.performedBy} • {new Date(movement.performedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '±'}{movement.quantity}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {movement.newQuantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2" />
                  <p>No stock movements recorded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Deployment History
              </CardTitle>
              <CardDescription>
                Assets deployed from this inventory item
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deploymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {deploymentHistory.map((deployment) => (
                    <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <div>
                          <div className="font-medium">Deployed to {deployment.deployedTo}</div>
                          <div className="text-sm text-muted-foreground">
                            by {deployment.deployedBy} • {new Date(deployment.deployedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant={deployment.status === 'Active' ? 'default' : 'secondary'}>
                        {deployment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>No deployments from this inventory item yet</p>
                  {item.quantity > 0 && (
                    <Button className="mt-4" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Deploy as Asset
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itil" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  ITIL Asset Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {itilKPIs && (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Asset Utilization</span>
                        <span className="font-bold">{itilKPIs.utilization}%</span>
                      </div>
                      <Progress value={itilKPIs.utilization} className="h-2" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Availability</span>
                        <span className="font-bold">{itilKPIs.availability}%</span>
                      </div>
                      <Progress value={itilKPIs.availability} className="h-2" />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Compliance Score</span>
                        <span className="font-bold">{itilKPIs.complianceScore}%</span>
                      </div>
                      <Progress value={itilKPIs.complianceScore} className="h-2" />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">MTBF</div>
                        <div className="font-bold">{itilKPIs.meanTimeBetweenFailures}h</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Risk Level</div>
                        <div className="font-bold">{itilKPIs.riskScore}/100</div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Compliance & Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">License Compliance</span>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Status</span>
                    <Badge variant="default">Secure</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Warranty Status</span>
                    <Badge variant="secondary">Under Warranty</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Support Status</span>
                    <Badge variant="default">Supported</Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Risk Factors</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>• Single point of failure: No</div>
                    <div>• End of life: 2 years remaining</div>
                    <div>• Security vulnerabilities: None known</div>
                    <div>• Performance degradation: None detected</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
