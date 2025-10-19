'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  PlusCircle,
  Package,
  Activity,
  Wrench,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  Download,
  Computer,
  Copy,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { 
  AssetCategorySettingExtended, 
  AssetStatusSettingExtended,
  AssetMaintenanceScheduleSettingExtended 
} from '@/lib/services/asset-settings';

// Types
interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  depreciationRate?: number;
  defaultWarrantyMonths?: number;
  isDefault: boolean;
}

interface StatusFormData {
  name: string;
  color: string;
  type: 'Active' | 'Inactive' | 'Maintenance' | 'Retired';
  isDefault: boolean;
  requiresComment: boolean;
}

interface MaintenanceFormData {
  name: string;
  description: string;
  type: 'Preventive' | 'Corrective' | 'Predictive';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually' | 'Custom';
  customFrequencyDays?: number;
  estimatedDuration: number;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  isDefault: boolean;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: AssetCategorySettingExtended | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isLoading: boolean;
}

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: AssetStatusSettingExtended | null;
  onSubmit: (data: StatusFormData) => Promise<void>;
  isLoading: boolean;
}

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance: AssetMaintenanceScheduleSettingExtended | null;
  onSubmit: (data: MaintenanceFormData) => Promise<void>;
  isLoading: boolean;
}

// Dialog Components
function CategoryDialog({ open, onOpenChange, category, onSubmit, isLoading }: CategoryDialogProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'package',
    depreciationRate: 25,
    defaultWarrantyMonths: 12,
    isDefault: false,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon || 'package',
        depreciationRate: category.depreciationRate || 25,
        defaultWarrantyMonths: category.defaultWarrantyMonths || 12,
        isDefault: category.isDefault,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        icon: 'package',
        depreciationRate: 25,
        defaultWarrantyMonths: 12,
        isDefault: false,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
          <DialogDescription>
            {category ? 'Update the category details.' : 'Add a new asset category to organize your assets.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-8"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icon
            </Label>
            <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="package">Package</SelectItem>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="printer">Printer</SelectItem>
                <SelectItem value="smartphone">Smartphone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="depreciationRate" className="text-right">
              Depreciation Rate (%)
            </Label>
            <Input
              id="depreciationRate"
              type="number"
              value={formData.depreciationRate || ''}
              onChange={(e) => setFormData({ ...formData, depreciationRate: Number(e.target.value) })}
              className="col-span-3"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="defaultWarrantyMonths" className="text-right">
              Default Warranty (Months)
            </Label>
            <Input
              id="defaultWarrantyMonths"
              type="number"
              value={formData.defaultWarrantyMonths || ''}
              onChange={(e) => setFormData({ ...formData, defaultWarrantyMonths: Number(e.target.value) })}
              className="col-span-3"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isDefault" className="text-right">
              Default Category
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="isDefault"
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {category ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusDialog({ open, onOpenChange, status, onSubmit, isLoading }: StatusDialogProps) {
  const [formData, setFormData] = useState<StatusFormData>({
    name: '',
    color: '#22c55e',
    type: 'Active',
    isDefault: false,
    requiresComment: false,
  });

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name,
        color: status.color,
        type: status.type,
        isDefault: status.isDefault,
        requiresComment: status.requiresComment || false,
      });
    } else {
      setFormData({
        name: '',
        color: '#22c55e',
        type: 'Active',
        isDefault: false,
        requiresComment: false,
      });
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {status ? 'Edit Status' : 'Create New Status'}
          </DialogTitle>
          <DialogDescription>
            {status ? 'Update the status details.' : 'Add a new asset status to track asset states.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-8"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={formData.type} onValueChange={(value: 'Active' | 'Inactive' | 'Maintenance' | 'Retired') => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isDefault" className="text-right">
              Default Status
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="isDefault"
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="requiresComment" className="text-right">
              Requires Comment
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="requiresComment"
                type="checkbox"
                checked={formData.requiresComment}
                onChange={(e) => setFormData({ ...formData, requiresComment: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {status ? 'Update' : 'Create'} Status
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MaintenanceDialog({ open, onOpenChange, maintenance, onSubmit, isLoading }: MaintenanceDialogProps) {
  const [formData, setFormData] = useState<MaintenanceFormData>({
    name: '',
    description: '',
    type: 'Preventive',
    frequency: 'Monthly',
    customFrequencyDays: undefined,
    estimatedDuration: 60,
    priority: 'Medium',
    isDefault: false,
  });

  useEffect(() => {
    if (maintenance) {
      setFormData({
        name: maintenance.name,
        description: maintenance.description || '',
        type: maintenance.type,
        frequency: maintenance.frequency,
        customFrequencyDays: maintenance.customFrequencyDays,
        estimatedDuration: maintenance.estimatedDuration,
        priority: maintenance.priority,
        isDefault: maintenance.isDefault,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'Preventive',
        frequency: 'Monthly',
        customFrequencyDays: undefined,
        estimatedDuration: 60,
        priority: 'Medium',
        isDefault: false,
      });
    }
  }, [maintenance]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {maintenance ? 'Edit Maintenance Schedule' : 'Create New Maintenance Schedule'}
          </DialogTitle>
          <DialogDescription>
            {maintenance ? 'Update the maintenance schedule details.' : 'Add a new maintenance schedule for asset upkeep.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={formData.type} onValueChange={(value: 'Preventive' | 'Corrective' | 'Predictive') => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Preventive">Preventive</SelectItem>
                <SelectItem value="Corrective">Corrective</SelectItem>
                <SelectItem value="Predictive">Predictive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="frequency" className="text-right">
              Frequency
            </Label>
            <Select value={formData.frequency} onValueChange={(value: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually' | 'Custom') => setFormData({ ...formData, frequency: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Annually">Annually</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.frequency === 'Custom' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customFrequencyDays" className="text-right">
                Custom Days
              </Label>
              <Input
                id="customFrequencyDays"
                type="number"
                value={formData.customFrequencyDays || ''}
                onChange={(e) => setFormData({ ...formData, customFrequencyDays: Number(e.target.value) })}
                className="col-span-3"
                min="1"
              />
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="estimatedDuration" className="text-right">
              Duration (mins)
            </Label>
            <Input
              id="estimatedDuration"
              type="number"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
              className="col-span-3"
              min="1"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">
              Priority
            </Label>
            <Select value={formData.priority} onValueChange={(value: 'Low' | 'Medium' | 'High' | 'Critical') => setFormData({ ...formData, priority: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isDefault" className="text-right">
              Default Schedule
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="isDefault"
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {maintenance ? 'Update' : 'Create'} Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function AssetSettingsPage() {
  const [categories, setCategories] = useState<AssetCategorySettingExtended[]>([]);
  const [statuses, setStatuses] = useState<AssetStatusSettingExtended[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<AssetMaintenanceScheduleSettingExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');
  const [agents, setAgents] = useState<any[]>([]);

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category: AssetCategorySettingExtended | null }>({
    open: false,
    category: null,
  });
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; status: AssetStatusSettingExtended | null }>({
    open: false,
    status: null,
  });
  const [maintenanceDialog, setMaintenanceDialog] = useState<{ open: boolean; maintenance: AssetMaintenanceScheduleSettingExtended | null }>({
    open: false,
    maintenance: null,
  });

  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, statusesRes, maintenanceRes] = await Promise.all([
        fetch('/api/settings/asset-settings?type=category'),
        fetch('/api/settings/asset-settings?type=status'),
        fetch('/api/settings/asset-settings?type=maintenance'),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (statusesRes.ok) {
        const statusesData = await statusesRes.json();
        setStatuses(statusesData);
      }

      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json();
        setMaintenanceSchedules(maintenanceData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load asset settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgentData = async () => {
    // Fetch agents list from new API
    try {
      const agentsRes = await fetch('/api/agents');
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents || []);
      }
    } catch (error) {
      console.error('Error fetching agents list:', error);
      setAgents([]);
    }
  };

  const initializeDefaults = async () => {
    try {
      const response = await fetch('/api/settings/asset-settings/initialize', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: data.message,
        });
        await fetchData();
      } else {
        throw new Error('Failed to initialize defaults');
      }
    } catch (error) {
      console.error('Error initializing defaults:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize default settings',
        variant: 'destructive',
      });
    }
  };

  const handleCategorySubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      const url = categoryDialog.category
        ? `/api/settings/asset-settings/${categoryDialog.category.id}?type=category`
        : '/api/settings/asset-settings?type=category';
      
      const method = categoryDialog.category ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (categoryDialog.category) {
          setCategories(categories.map(cat => cat.id === categoryDialog.category!.id ? result : cat));
        } else {
          setCategories([...categories, result]);
        }
        setCategoryDialog({ open: false, category: null });
        toast({
          title: 'Success',
          description: `Category ${categoryDialog.category ? 'updated' : 'created'} successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusSubmit = async (data: StatusFormData) => {
    setIsSubmitting(true);
    try {
      const url = statusDialog.status
        ? `/api/settings/asset-settings/${statusDialog.status.id}?type=status`
        : '/api/settings/asset-settings?type=status';
      
      const method = statusDialog.status ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (statusDialog.status) {
          setStatuses(statuses.map(status => status.id === statusDialog.status!.id ? result : status));
        } else {
          setStatuses([...statuses, result]);
        }
        setStatusDialog({ open: false, status: null });
        toast({
          title: 'Success',
          description: `Status ${statusDialog.status ? 'updated' : 'created'} successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save status');
      }
    } catch (error) {
      console.error('Error saving status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaintenanceSubmit = async (data: MaintenanceFormData) => {
    setIsSubmitting(true);
    try {
      const url = maintenanceDialog.maintenance
        ? `/api/settings/asset-settings/${maintenanceDialog.maintenance.id}?type=maintenance`
        : '/api/settings/asset-settings?type=maintenance';
      
      const method = maintenanceDialog.maintenance ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (maintenanceDialog.maintenance) {
          setMaintenanceSchedules(maintenanceSchedules.map(schedule => schedule.id === maintenanceDialog.maintenance!.id ? result : schedule));
        } else {
          setMaintenanceSchedules([...maintenanceSchedules, result]);
        }
        setMaintenanceDialog({ open: false, maintenance: null });
        toast({
          title: 'Success',
          description: `Maintenance schedule ${maintenanceDialog.maintenance ? 'updated' : 'created'} successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save maintenance schedule');
      }
    } catch (error) {
      console.error('Error saving maintenance schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save maintenance schedule',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: 'category' | 'status' | 'maintenance') => {
    try {
      const response = await fetch(`/api/settings/asset-settings/${id}?type=${type}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (type === 'category') {
          setCategories(categories.filter(cat => cat.id !== id));
        } else if (type === 'status') {
          setStatuses(statuses.filter(status => status.id !== id));
        } else if (type === 'maintenance') {
          setMaintenanceSchedules(maintenanceSchedules.filter(schedule => schedule.id !== id));
        }
        toast({
          title: 'Success',
          description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.details || `Failed to delete ${type}`);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to delete ${type}`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchData();
    fetchAgentData();
  }, []);

  useEffect(() => {
    if (activeTab === 'agents') {
      fetchAgentData();
    }
  }, [activeTab]);

  const getTotalItems = () => {
    return categories.length + statuses.length + maintenanceSchedules.length;
  };


  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Management Settings</h1>
          <p className="text-gray-600">Configure asset categories, statuses, and maintenance schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={initializeDefaults}>
            Initialize Defaults
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settings</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalItems()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statuses</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statuses.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="agents">Modern Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Categories</CardTitle>
                  <CardDescription>
                    Organize your assets by category for better management
                  </CardDescription>
                </div>
                <Button onClick={() => setCategoryDialog({ open: true, category: null })}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Depreciation</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.name}
                        {category.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                      </TableCell>
                      <TableCell>{category.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.color}
                        </div>
                      </TableCell>
                      <TableCell>{category.depreciationRate}%</TableCell>
                      <TableCell>{category.defaultWarrantyMonths} months</TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setCategoryDialog({ open: true, category })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(category.id, 'category')}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Statuses</CardTitle>
                  <CardDescription>
                    Define the different states an asset can be in
                  </CardDescription>
                </div>
                <Button onClick={() => setStatusDialog({ open: true, status: null })}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Status
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requires Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell className="font-medium">
                        {status.name}
                        {status.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                        {status.isSystem && <Badge variant="outline" className="ml-2">System</Badge>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.color}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{status.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.requiresComment ? 'default' : 'secondary'}>
                          {status.requiresComment ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.isActive ? 'default' : 'secondary'}>
                          {status.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem 
                              onClick={() => setStatusDialog({ open: true, status })}
                              disabled={status.isSystem}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(status.id, 'status')}
                              className="text-red-600"
                              disabled={status.isSystem}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Maintenance Schedules</CardTitle>
                  <CardDescription>
                    Configure maintenance schedules for your assets
                  </CardDescription>
                </div>
                <Button onClick={() => setMaintenanceDialog({ open: true, maintenance: null })}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {schedule.name}
                        {schedule.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{schedule.type}</Badge>
                      </TableCell>
                      <TableCell>{schedule.frequency}</TableCell>
                      <TableCell>{schedule.estimatedDuration} mins</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            schedule.priority === 'Critical' ? 'destructive' :
                            schedule.priority === 'High' ? 'default' :
                            'secondary'
                          }
                        >
                          {schedule.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setMaintenanceDialog({ open: true, maintenance: schedule })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(schedule.id, 'maintenance')}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Computer className="h-5 w-5" />
                  Modern Agent System
                </CardTitle>
                <CardDescription>
                  Cross-platform agent deployment with runtime enrollment (Windows, Linux, macOS)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">🚀 New Modern Agent System</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    The legacy MSI-based system has been replaced with a modern, cross-platform agent architecture.
                  </p>
                  <Button 
                    onClick={() => window.open('/agents', '_blank')}
                    className="w-full"
                  >
                    Open Agent Management Dashboard
                  </Button>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Key Improvements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Cross-platform support (Windows, Linux, macOS)</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>One-command installation</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Secure runtime enrollment with tokens</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Auto-update capability</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Real-time health monitoring</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Quick Installation</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Windows PowerShell</Label>
                      <div className="mt-1 p-3 bg-gray-900 text-green-400 rounded text-xs font-mono overflow-x-auto">
                        iwr -useb {typeof window !== 'undefined' ? window.location.origin : ''}/api/agent/install?platform=windows | iex
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Linux / macOS</Label>
                      <div className="mt-1 p-3 bg-gray-900 text-green-400 rounded text-xs font-mono overflow-x-auto">
                        curl -sSL {typeof window !== 'undefined' ? window.location.origin : ''}/api/agent/install | bash
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You'll need an enrollment token from the Agent Dashboard to complete installation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Agent Statistics</CardTitle>
                <CardDescription>
                  Overview of deployed agents in your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {agents.filter(a => a.status === 'online').length}
                      </div>
                      <div className="text-sm text-green-600">Online Agents</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {agents.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Agents</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Recent Activity</Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {agents.slice(0, 5).map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <span className="font-mono">{agent.name || agent.hostname}</span>
                          <div className="flex items-center gap-1">
                            {agent.status === 'online' ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : agent.status === 'offline' ? (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                            )}
                            <span className="text-xs">{agent.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open('/agents', '_blank')}
                      className="w-full"
                    >
                      View All Agents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security & Authentication</CardTitle>
                <CardDescription>
                  Modern security features for agent authentication and communication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {agents.filter(a => a.status === 'online').length}
                    </div>
                    <div className="text-sm text-blue-600">Authenticated Agents</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      100%
                    </div>
                    <div className="text-sm text-green-600">Secure Communications</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Security Features</Label>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>TLS 1.3 Encryption</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>API Key Authentication</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Ephemeral Enrollment Tokens</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>Organization-Scoped Access</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
                      <RefreshCw className="h-3 w-3 text-blue-500" />
                      <span>Certificate Pinning (Coming Soon)</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/agents', '_blank')}
                    className="w-full"
                  >
                    Manage Agent Security
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Registered Agents</CardTitle>
              <CardDescription>
                Monitor cross-platform agents collecting asset data (Windows, Linux, macOS)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <Computer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                  <p className="text-gray-600 mb-4">
                    Install agents on your devices to start collecting asset data automatically.
                  </p>
                  <Button onClick={() => window.open('/agents', '_blank')}>
                    Open Agent Dashboard
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Agent ID</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.slice(0, 10).map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name || agent.hostname}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="capitalize">{agent.platform}</span>
                            <span className="text-xs text-gray-500">({agent.architecture})</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{agent.id}</TableCell>
                        <TableCell>{agent.version}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={agent.status === 'online' ? 'default' : agent.status === 'offline' ? 'destructive' : 'secondary'}
                          >
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(agent.lastSeen)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open('/agents', '_blank')}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {agents.length > 10 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('/agents', '_blank')}
                  >
                    View All {agents.length} Agents
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog({ ...categoryDialog, open })}
        category={categoryDialog.category}
        onSubmit={handleCategorySubmit}
        isLoading={isSubmitting}
      />
      
      <StatusDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}
        status={statusDialog.status}
        onSubmit={handleStatusSubmit}
        isLoading={isSubmitting}
      />
      
      <MaintenanceDialog
        open={maintenanceDialog.open}
        onOpenChange={(open) => setMaintenanceDialog({ ...maintenanceDialog, open })}
        maintenance={maintenanceDialog.maintenance}
        onSubmit={handleMaintenanceSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}