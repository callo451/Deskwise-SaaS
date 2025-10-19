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
  LayoutGrid,
  MapPin,
  Truck,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
  Star,
  StarOff,
} from 'lucide-react';
import type { 
  InventoryCategorySettingExtended, 
  InventoryLocationSettingExtended,
  InventorySupplierSettingExtended 
} from '@/lib/services/inventory-settings';

// Types
interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  trackingMethod: 'serial' | 'batch' | 'simple';
  requiresApproval: boolean;
  autoReorderEnabled: boolean;
  defaultReorderPoint?: number;
  defaultReorderQuantity?: number;
  defaultLeadTimeDays?: number;
  costMethod: 'fifo' | 'lifo' | 'average';
  isDefault: boolean;
}

interface LocationFormData {
  name: string;
  description: string;
  type: 'warehouse' | 'office' | 'vehicle' | 'client_site' | 'supplier' | 'other';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  isDefault: boolean;
  allowNegativeStock: boolean;
  requiresApproval: boolean;
}

interface SupplierFormData {
  name: string;
  description: string;
  contactInfo: {
    primaryContact: string;
    email: string;
    phone: string;
    website: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  businessInfo: {
    taxId: string;
    accountNumber: string;
    paymentTerms: string;
    currency: string;
  };
  performance: {
    rating: number;
    onTimeDeliveryRate?: number;
    qualityRating?: number;
    responseTime?: number;
  };
  isPreferred: boolean;
  minimumOrderAmount?: number;
  leadTimeDays?: number;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: InventoryCategorySettingExtended | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isLoading: boolean;
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: InventoryLocationSettingExtended | null;
  onSubmit: (data: LocationFormData) => Promise<void>;
  isLoading: boolean;
}

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: InventorySupplierSettingExtended | null;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  isLoading: boolean;
}

// Dialog Components
function CategoryDialog({ open, onOpenChange, category, onSubmit, isLoading }: CategoryDialogProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'package',
    trackingMethod: 'simple',
    requiresApproval: false,
    autoReorderEnabled: false,
    defaultReorderPoint: 10,
    defaultReorderQuantity: 25,
    defaultLeadTimeDays: 7,
    costMethod: 'fifo',
    isDefault: false,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        color: category.color,
        icon: category.icon || 'package',
        trackingMethod: category.trackingMethod,
        requiresApproval: category.requiresApproval,
        autoReorderEnabled: category.autoReorderEnabled,
        defaultReorderPoint: category.defaultReorderPoint || 10,
        defaultReorderQuantity: category.defaultReorderQuantity || 25,
        defaultLeadTimeDays: category.defaultLeadTimeDays || 7,
        costMethod: category.costMethod,
        isDefault: category.isDefault,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
        icon: 'package',
        trackingMethod: 'simple',
        requiresApproval: false,
        autoReorderEnabled: false,
        defaultReorderPoint: 10,
        defaultReorderQuantity: 25,
        defaultLeadTimeDays: 7,
        costMethod: 'fifo',
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
          <DialogDescription>
            {category ? 'Update the category details.' : 'Add a new inventory category to organize your items.'}
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
            <Label htmlFor="trackingMethod" className="text-right">
              Tracking Method
            </Label>
            <Select value={formData.trackingMethod} onValueChange={(value: 'serial' | 'batch' | 'simple') => setFormData({ ...formData, trackingMethod: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple (quantity only)</SelectItem>
                <SelectItem value="batch">Batch tracking</SelectItem>
                <SelectItem value="serial">Serial number tracking</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="costMethod" className="text-right">
              Cost Method
            </Label>
            <Select value={formData.costMethod} onValueChange={(value: 'fifo' | 'lifo' | 'average') => setFormData({ ...formData, costMethod: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                <SelectItem value="average">Average Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="defaultReorderPoint" className="text-right">
              Reorder Point
            </Label>
            <Input
              id="defaultReorderPoint"
              type="number"
              value={formData.defaultReorderPoint || ''}
              onChange={(e) => setFormData({ ...formData, defaultReorderPoint: Number(e.target.value) })}
              className="col-span-3"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="defaultReorderQuantity" className="text-right">
              Reorder Quantity
            </Label>
            <Input
              id="defaultReorderQuantity"
              type="number"
              value={formData.defaultReorderQuantity || ''}
              onChange={(e) => setFormData({ ...formData, defaultReorderQuantity: Number(e.target.value) })}
              className="col-span-3"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="defaultLeadTimeDays" className="text-right">
              Lead Time (Days)
            </Label>
            <Input
              id="defaultLeadTimeDays"
              type="number"
              value={formData.defaultLeadTimeDays || ''}
              onChange={(e) => setFormData({ ...formData, defaultLeadTimeDays: Number(e.target.value) })}
              className="col-span-3"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="requiresApproval" className="text-right">
              Requires Approval
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="requiresApproval"
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="autoReorderEnabled" className="text-right">
              Auto Reorder
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="autoReorderEnabled"
                type="checkbox"
                checked={formData.autoReorderEnabled}
                onChange={(e) => setFormData({ ...formData, autoReorderEnabled: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
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

function LocationDialog({ open, onOpenChange, location, onSubmit, isLoading }: LocationDialogProps) {
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    description: '',
    type: 'warehouse',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    contact: {
      name: '',
      email: '',
      phone: '',
    },
    isDefault: false,
    allowNegativeStock: false,
    requiresApproval: false,
  });

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        description: location.description || '',
        type: location.type,
        address: location.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
        contact: location.contact || {
          name: '',
          email: '',
          phone: '',
        },
        isDefault: location.isDefault,
        allowNegativeStock: location.allowNegativeStock,
        requiresApproval: location.requiresApproval,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'warehouse',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
        contact: {
          name: '',
          email: '',
          phone: '',
        },
        isDefault: false,
        allowNegativeStock: false,
        requiresApproval: false,
      });
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {location ? 'Edit Location' : 'Create New Location'}
          </DialogTitle>
          <DialogDescription>
            {location ? 'Update the location details.' : 'Add a new inventory location for storage management.'}
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
            <Select value={formData.type} onValueChange={(value: 'warehouse' | 'office' | 'vehicle' | 'client_site' | 'supplier' | 'other') => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="client_site">Client Site</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="street" className="text-right">
              Street Address
            </Label>
            <Input
              id="street"
              value={formData.address.street}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">
              City
            </Label>
            <Input
              id="city"
              value={formData.address.city}
              onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactName" className="text-right">
              Contact Name
            </Label>
            <Input
              id="contactName"
              value={formData.contact.name}
              onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, name: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactEmail" className="text-right">
              Contact Email
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contact.email}
              onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allowNegativeStock" className="text-right">
              Allow Negative Stock
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="allowNegativeStock"
                type="checkbox"
                checked={formData.allowNegativeStock}
                onChange={(e) => setFormData({ ...formData, allowNegativeStock: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="requiresApproval" className="text-right">
              Requires Approval
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="requiresApproval"
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isDefault" className="text-right">
              Default Location
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
              {location ? 'Update' : 'Create'} Location
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SupplierDialog({ open, onOpenChange, supplier, onSubmit, isLoading }: SupplierDialogProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    description: '',
    contactInfo: {
      primaryContact: '',
      email: '',
      phone: '',
      website: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
    businessInfo: {
      taxId: '',
      accountNumber: '',
      paymentTerms: 'Net 30',
      currency: 'USD',
    },
    performance: {
      rating: 3,
      onTimeDeliveryRate: 95,
      qualityRating: 4,
      responseTime: 24,
    },
    isPreferred: false,
    minimumOrderAmount: 0,
    leadTimeDays: 7,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        description: supplier.description || '',
        contactInfo: supplier.contactInfo || {
          primaryContact: '',
          email: '',
          phone: '',
          website: '',
        },
        address: supplier.address || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
        businessInfo: supplier.businessInfo || {
          taxId: '',
          accountNumber: '',
          paymentTerms: 'Net 30',
          currency: 'USD',
        },
        performance: supplier.performance || {
          rating: 3,
          onTimeDeliveryRate: 95,
          qualityRating: 4,
          responseTime: 24,
        },
        isPreferred: supplier.isPreferred,
        minimumOrderAmount: supplier.minimumOrderAmount || 0,
        leadTimeDays: supplier.leadTimeDays || 7,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        contactInfo: {
          primaryContact: '',
          email: '',
          phone: '',
          website: '',
        },
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'US',
        },
        businessInfo: {
          taxId: '',
          accountNumber: '',
          paymentTerms: 'Net 30',
          currency: 'USD',
        },
        performance: {
          rating: 3,
          onTimeDeliveryRate: 95,
          qualityRating: 4,
          responseTime: 24,
        },
        isPreferred: false,
        minimumOrderAmount: 0,
        leadTimeDays: 7,
      });
    }
  }, [supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Edit Supplier' : 'Create New Supplier'}
          </DialogTitle>
          <DialogDescription>
            {supplier ? 'Update the supplier details.' : 'Add a new supplier for inventory procurement.'}
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
            <Label htmlFor="primaryContact" className="text-right">
              Primary Contact
            </Label>
            <Input
              id="primaryContact"
              value={formData.contactInfo.primaryContact}
              onChange={(e) => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, primaryContact: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.contactInfo.email}
              onChange={(e) => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, email: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              value={formData.contactInfo.phone}
              onChange={(e) => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, phone: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="website" className="text-right">
              Website
            </Label>
            <Input
              id="website"
              value={formData.contactInfo.website}
              onChange={(e) => setFormData({ ...formData, contactInfo: { ...formData.contactInfo, website: e.target.value } })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="paymentTerms" className="text-right">
              Payment Terms
            </Label>
            <Select value={formData.businessInfo.paymentTerms} onValueChange={(value) => setFormData({ ...formData, businessInfo: { ...formData.businessInfo, paymentTerms: value } })}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 15">Net 15</SelectItem>
                <SelectItem value="COD">COD</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Prepaid">Prepaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rating" className="text-right">
              Rating (1-5)
            </Label>
            <Input
              id="rating"
              type="number"
              value={formData.performance.rating}
              onChange={(e) => setFormData({ ...formData, performance: { ...formData.performance, rating: Number(e.target.value) } })}
              className="col-span-3"
              min="1"
              max="5"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="leadTimeDays" className="text-right">
              Lead Time (Days)
            </Label>
            <Input
              id="leadTimeDays"
              type="number"
              value={formData.leadTimeDays || ''}
              onChange={(e) => setFormData({ ...formData, leadTimeDays: Number(e.target.value) })}
              className="col-span-3"
              min="0"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minimumOrderAmount" className="text-right">
              Minimum Order ($)
            </Label>
            <Input
              id="minimumOrderAmount"
              type="number"
              value={formData.minimumOrderAmount || ''}
              onChange={(e) => setFormData({ ...formData, minimumOrderAmount: Number(e.target.value) })}
              className="col-span-3"
              min="0"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isPreferred" className="text-right">
              Preferred Supplier
            </Label>
            <div className="col-span-3 flex items-center">
              <input
                id="isPreferred"
                type="checkbox"
                checked={formData.isPreferred}
                onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {supplier ? 'Update' : 'Create'} Supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function InventorySettingsPage() {
  const [categories, setCategories] = useState<InventoryCategorySettingExtended[]>([]);
  const [locations, setLocations] = useState<InventoryLocationSettingExtended[]>([]);
  const [suppliers, setSuppliers] = useState<InventorySupplierSettingExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('categories');

  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; category: InventoryCategorySettingExtended | null }>({
    open: false,
    category: null,
  });
  const [locationDialog, setLocationDialog] = useState<{ open: boolean; location: InventoryLocationSettingExtended | null }>({
    open: false,
    location: null,
  });
  const [supplierDialog, setSupplierDialog] = useState<{ open: boolean; supplier: InventorySupplierSettingExtended | null }>({
    open: false,
    supplier: null,
  });

  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [categoriesRes, locationsRes, suppliersRes] = await Promise.all([
        fetch('/api/settings/inventory-settings?type=category'),
        fetch('/api/settings/inventory-settings?type=location'),
        fetch('/api/settings/inventory-settings?type=supplier'),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(locationsData);
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      const response = await fetch('/api/settings/inventory-settings/initialize', {
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
        ? `/api/settings/inventory-settings/${categoryDialog.category.id}?type=category`
        : '/api/settings/inventory-settings?type=category';
      
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

  const handleLocationSubmit = async (data: LocationFormData) => {
    setIsSubmitting(true);
    try {
      const url = locationDialog.location
        ? `/api/settings/inventory-settings/${locationDialog.location.id}?type=location`
        : '/api/settings/inventory-settings?type=location';
      
      const method = locationDialog.location ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (locationDialog.location) {
          setLocations(locations.map(loc => loc.id === locationDialog.location!.id ? result : loc));
        } else {
          setLocations([...locations, result]);
        }
        setLocationDialog({ open: false, location: null });
        toast({
          title: 'Success',
          description: `Location ${locationDialog.location ? 'updated' : 'created'} successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save location',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupplierSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    try {
      const url = supplierDialog.supplier
        ? `/api/settings/inventory-settings/${supplierDialog.supplier.id}?type=supplier`
        : '/api/settings/inventory-settings?type=supplier';
      
      const method = supplierDialog.supplier ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        if (supplierDialog.supplier) {
          setSuppliers(suppliers.map(supplier => supplier.id === supplierDialog.supplier!.id ? result : supplier));
        } else {
          setSuppliers([...suppliers, result]);
        }
        setSupplierDialog({ open: false, supplier: null });
        toast({
          title: 'Success',
          description: `Supplier ${supplierDialog.supplier ? 'updated' : 'created'} successfully`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to save supplier');
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save supplier',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: 'category' | 'location' | 'supplier') => {
    try {
      const response = await fetch(`/api/settings/inventory-settings/${id}?type=${type}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (type === 'category') {
          setCategories(categories.filter(cat => cat.id !== id));
        } else if (type === 'location') {
          setLocations(locations.filter(loc => loc.id !== id));
        } else if (type === 'supplier') {
          setSuppliers(suppliers.filter(supplier => supplier.id !== id));
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
  }, []);

  const getTotalItems = () => {
    return categories.length + locations.length + suppliers.length;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < rating ? <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" /> : <StarOff key={i} className="h-4 w-4 text-gray-300" />
    ));
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
          <h1 className="text-2xl font-bold">Inventory Management Settings</h1>
          <p className="text-gray-600">Configure inventory categories, locations, and suppliers</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settings</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalItems()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Categories</CardTitle>
                  <CardDescription>
                    Organize your inventory by category with tracking and reorder settings
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
                    <TableHead>Tracking</TableHead>
                    <TableHead>Cost Method</TableHead>
                    <TableHead>Reorder Point</TableHead>
                    <TableHead>Auto Reorder</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                          {category.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.trackingMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.costMethod.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>{category.defaultReorderPoint || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={category.autoReorderEnabled ? 'default' : 'secondary'}>
                          {category.autoReorderEnabled ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
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

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Locations</CardTitle>
                  <CardDescription>
                    Manage storage locations for your inventory
                  </CardDescription>
                </div>
                <Button onClick={() => setLocationDialog({ open: true, location: null })}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Location
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Negative Stock</TableHead>
                    <TableHead>Requires Approval</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">
                        {location.name}
                        {location.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{location.type}</Badge>
                      </TableCell>
                      <TableCell>{location.contact?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={location.allowNegativeStock ? 'destructive' : 'default'}>
                          {location.allowNegativeStock ? 'Allowed' : 'Blocked'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.requiresApproval ? 'default' : 'secondary'}>
                          {location.requiresApproval ? 'Yes' : 'No'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.isActive ? 'default' : 'secondary'}>
                          {location.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => setLocationDialog({ open: true, location })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(location.id, 'location')}
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

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Suppliers</CardTitle>
                  <CardDescription>
                    Manage your supplier relationships and procurement settings
                  </CardDescription>
                </div>
                <Button onClick={() => setSupplierDialog({ open: true, supplier: null })}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {supplier.name}
                          {supplier.isPreferred && <Badge variant="default" className="ml-2">Preferred</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{supplier.contactInfo?.primaryContact}</div>
                          <div className="text-sm text-gray-500">{supplier.contactInfo?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {renderStars(supplier.performance?.rating || 0)}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.leadTimeDays} days</TableCell>
                      <TableCell>
                        <Badge variant="outline">{supplier.businessInfo?.paymentTerms || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                          {supplier.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => setSupplierDialog({ open: true, supplier })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(supplier.id, 'supplier')}
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
      </Tabs>

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog({ ...categoryDialog, open })}
        category={categoryDialog.category}
        onSubmit={handleCategorySubmit}
        isLoading={isSubmitting}
      />
      
      <LocationDialog
        open={locationDialog.open}
        onOpenChange={(open) => setLocationDialog({ ...locationDialog, open })}
        location={locationDialog.location}
        onSubmit={handleLocationSubmit}
        isLoading={isSubmitting}
      />
      
      <SupplierDialog
        open={supplierDialog.open}
        onOpenChange={(open) => setSupplierDialog({ ...supplierDialog, open })}
        supplier={supplierDialog.supplier}
        onSubmit={handleSupplierSubmit}
        isLoading={isSubmitting}
      />
    </div>
  );
}