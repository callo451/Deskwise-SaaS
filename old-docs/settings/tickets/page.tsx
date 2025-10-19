
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
  GanttChartSquare,
  ListTodo,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
} from 'lucide-react';
import type { 
  TicketQueueSettingExtended, 
  TicketStatusSettingExtended,
  TicketPrioritySettingExtended 
} from '@/lib/services/ticket-settings';

// Types
interface QueueFormData {
  name: string;
  description: string;
  emailAddress: string;
  isDefault: boolean;
}

interface StatusFormData {
  name: string;
  color: string;
  type: 'Open' | 'Closed' | 'Pending';
  isDefault: boolean;
  requiresComment: boolean;
  autoCloseAfterDays?: number;
}

interface PriorityFormData {
  name: string;
  color: string;
  level: number;
  responseSlaMinutes: number;
  resolutionSlaMinutes: number;
  isDefault: boolean;
}

interface QueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  queue: TicketQueueSettingExtended | null;
  onSubmit: (data: QueueFormData) => Promise<void>;
  isLoading: boolean;
}

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: TicketStatusSettingExtended | null;
  onSubmit: (data: StatusFormData) => Promise<void>;
  isLoading: boolean;
}

interface PriorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priority: TicketPrioritySettingExtended | null;
  onSubmit: (data: PriorityFormData) => Promise<void>;
  isLoading: boolean;
}

const ColorIndicator = ({ color }: { color: string }) => (
  <span className="flex h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
);

// Helper function to convert hours to minutes
const hoursToMinutes = (hours: number): number => hours * 60;
const daysToMinutes = (days: number): number => days * 24 * 60;
const minutesToHours = (minutes: number): number => Math.floor(minutes / 60);
const minutesToDays = (minutes: number): number => Math.floor(minutes / (24 * 60));

const QueueDialog = ({ open, onOpenChange, queue, onSubmit, isLoading }: QueueDialogProps) => {
  const [formData, setFormData] = useState<QueueFormData>({
    name: '',
    description: '',
    emailAddress: '',
    isDefault: false
  });

  useEffect(() => {
    if (queue) {
      setFormData({
        name: queue.name,
        description: queue.description || '',
        emailAddress: queue.emailAddress || '',
        isDefault: queue.isDefault
      });
    } else {
      setFormData({
        name: '',
        description: '',
        emailAddress: '',
        isDefault: false
      });
    }
  }, [queue, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{queue ? 'Edit Queue' : 'New Queue'}</DialogTitle>
          <DialogDescription>
            {queue ? 'Update the ticket queue.' : 'Create a new ticket queue.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="emailAddress">Email Address (for email-to-ticket)</Label>
              <Input
                id="emailAddress"
                type="email"
                value={formData.emailAddress}
                onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                placeholder="support@company.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isDefault">Default queue for new tickets</Label>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {queue ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const StatusDialog = ({ open, onOpenChange, status, onSubmit, isLoading }: StatusDialogProps) => {
  const [formData, setFormData] = useState<StatusFormData>({
    name: '',
    color: '#3b82f6',
    type: 'Open',
    isDefault: false,
    requiresComment: false,
    autoCloseAfterDays: undefined
  });

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name,
        color: status.color,
        type: status.type,
        isDefault: status.isDefault,
        requiresComment: status.requiresComment || false,
        autoCloseAfterDays: status.autoCloseAfterDays
      });
    } else {
      setFormData({
        name: '',
        color: '#3b82f6',
        type: 'Open',
        isDefault: false,
        requiresComment: false,
        autoCloseAfterDays: undefined
      });
    }
  }, [status, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{status ? 'Edit Status' : 'New Status'}</DialogTitle>
          <DialogDescription>
            {status ? 'Update the ticket status.' : 'Create a new ticket status.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: 'Open' | 'Closed' | 'Pending') => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.type === 'Closed' && (
              <div>
                <Label htmlFor="autoClose">Auto-close after (days)</Label>
                <Input
                  id="autoClose"
                  type="number"
                  value={formData.autoCloseAfterDays || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    autoCloseAfterDays: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  min="1"
                  placeholder="Leave empty for no auto-close"
                />
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isDefault">Default status for new tickets</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requiresComment"
                  checked={formData.requiresComment}
                  onChange={(e) => setFormData({ ...formData, requiresComment: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="requiresComment">Require comment when setting this status</Label>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center gap-2">
                <ColorIndicator color={formData.color} />
                <span>{formData.name || 'Status Name'}</span>
                <Badge variant={formData.type === 'Open' ? 'secondary' : 'default'}>
                  {formData.type}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {status ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PriorityDialog = ({ open, onOpenChange, priority, onSubmit, isLoading }: PriorityDialogProps) => {
  const [formData, setFormData] = useState<PriorityFormData>({
    name: '',
    color: '#3b82f6',
    level: 1,
    responseSlaMinutes: hoursToMinutes(24),
    resolutionSlaMinutes: daysToMinutes(5),
    isDefault: false
  });

  useEffect(() => {
    if (priority) {
      setFormData({
        name: priority.name,
        color: priority.color,
        level: priority.level,
        responseSlaMinutes: priority.responseSlaMinutes,
        resolutionSlaMinutes: priority.resolutionSlaMinutes,
        isDefault: priority.isDefault
      });
    } else {
      setFormData({
        name: '',
        color: '#3b82f6',
        level: 1,
        responseSlaMinutes: hoursToMinutes(24),
        resolutionSlaMinutes: daysToMinutes(5),
        isDefault: false
      });
    }
  }, [priority, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const formatSla = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else if (minutes < 24 * 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / (24 * 60));
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{priority ? 'Edit Priority' : 'New Priority'}</DialogTitle>
          <DialogDescription>
            {priority ? 'Update the ticket priority.' : 'Create a new ticket priority.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="level">Level</Label>
                <Select 
                  value={formData.level.toString()} 
                  onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Low</SelectItem>
                    <SelectItem value="2">2 - Medium</SelectItem>
                    <SelectItem value="3">3 - High</SelectItem>
                    <SelectItem value="4">4 - Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3b82f6"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responseSla">Response SLA (hours)</Label>
                <Input
                  id="responseSla"
                  type="number"
                  value={minutesToHours(formData.responseSlaMinutes)}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    responseSlaMinutes: hoursToMinutes(parseInt(e.target.value) || 0) 
                  })}
                  min="1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="resolutionSla">Resolution SLA (days)</Label>
                <Input
                  id="resolutionSla"
                  type="number"
                  value={minutesToDays(formData.resolutionSlaMinutes)}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    resolutionSlaMinutes: daysToMinutes(parseInt(e.target.value) || 0) 
                  })}
                  min="1"
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isDefault">Default priority for new tickets</Label>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center gap-2 mb-2">
                <ColorIndicator color={formData.color} />
                <span>{formData.name || 'Priority Name'}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Response SLA: {formatSla(formData.responseSlaMinutes)}</div>
                <div>Resolution SLA: {formatSla(formData.resolutionSlaMinutes)}</div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {priority ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function TicketSettingsPage() {
  const { toast } = useToast();
  const [queues, setQueues] = useState<TicketQueueSettingExtended[]>([]);
  const [statuses, setStatuses] = useState<TicketStatusSettingExtended[]>([]);
  const [priorities, setPriorities] = useState<TicketPrioritySettingExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dialog states
  const [queueDialog, setQueueDialog] = useState<{
    open: boolean;
    queue: TicketQueueSettingExtended | null;
  }>({ open: false, queue: null });
  
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    status: TicketStatusSettingExtended | null;
  }>({ open: false, status: null });
  
  const [priorityDialog, setPriorityDialog] = useState<{
    open: boolean;
    priority: TicketPrioritySettingExtended | null;
  }>({ open: false, priority: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/ticket-settings');
      if (response.ok) {
        const data = await response.json();
        setQueues(data.queues || []);
        setStatuses(data.statuses || []);
        setPriorities(data.priorities || []);
      } else {
        throw new Error('Failed to fetch ticket settings');
      }
    } catch (error) {
      console.error('Failed to fetch ticket settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch('/api/settings/ticket-settings/initialize', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Defaults Initialized',
          description: data.message,
        });
        await fetchData();
      } else {
        throw new Error('Failed to initialize defaults');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize default settings.',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleQueueSubmit = async (data: QueueFormData) => {
    try {
      setIsSaving(true);
      const isEdit = !!queueDialog.queue;
      const url = isEdit 
        ? `/api/settings/ticket-settings/${queueDialog.queue!.id}` 
        : '/api/settings/ticket-settings';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'queue', ...data }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        setQueueDialog({ open: false, queue: null });
        await fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save queue');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save queue',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusSubmit = async (data: StatusFormData) => {
    try {
      setIsSaving(true);
      const isEdit = !!statusDialog.status;
      const url = isEdit 
        ? `/api/settings/ticket-settings/${statusDialog.status!.id}` 
        : '/api/settings/ticket-settings';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'status', ...data }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        setStatusDialog({ open: false, status: null });
        await fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save status',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrioritySubmit = async (data: PriorityFormData) => {
    try {
      setIsSaving(true);
      const isEdit = !!priorityDialog.priority;
      const url = isEdit 
        ? `/api/settings/ticket-settings/${priorityDialog.priority!.id}` 
        : '/api/settings/ticket-settings';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'priority', ...data }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        setPriorityDialog({ open: false, priority: null });
        await fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save priority');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save priority',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQueue = async (queue: TicketQueueSettingExtended) => {
    if (!confirm(`Are you sure you want to delete the queue "${queue.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/ticket-settings/${queue.id}?type=queue`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        await fetchData();
      } else {
        throw new Error('Failed to delete queue');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete queue',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStatus = async (status: TicketStatusSettingExtended) => {
    if (!confirm(`Are you sure you want to delete the status "${status.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/ticket-settings/${status.id}?type=status`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        await fetchData();
      } else {
        const error = await response.json();
        if (error.error.includes('Cannot delete')) {
          toast({
            title: 'Cannot Delete',
            description: error.error,
            variant: 'destructive',
          });
        } else {
          throw new Error('Failed to delete status');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete status',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePriority = async (priority: TicketPrioritySettingExtended) => {
    if (!confirm(`Are you sure you want to delete the priority "${priority.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/ticket-settings/${priority.id}?type=priority`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        await fetchData();
      } else {
        const error = await response.json();
        if (error.error.includes('Cannot delete')) {
          toast({
            title: 'Cannot Delete',
            description: error.error,
            variant: 'destructive',
          });
        } else {
          throw new Error('Failed to delete priority');
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete priority',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Ticket Management</h1>
          <p className="text-muted-foreground">
            Configure queues, statuses, priorities, and other ticket-related settings.
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Ticket Management</h1>
          <p className="text-muted-foreground">
            Configure queues, statuses, priorities, and other ticket-related settings.
          </p>
        </div>
        <Button 
          onClick={handleInitializeDefaults}
          disabled={isInitializing}
          variant="outline"
        >
          {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Initialize Defaults
        </Button>
      </div>

      <Tabs defaultValue="queues">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="queues">
            <GanttChartSquare className="mr-2 h-4 w-4" />
            Queues ({queues.length})
          </TabsTrigger>
          <TabsTrigger value="statuses">
            <ListTodo className="mr-2 h-4 w-4" />
            Statuses ({statuses.length})
          </TabsTrigger>
          <TabsTrigger value="priorities">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Priorities ({priorities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queues" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ticket Queues</CardTitle>
                <CardDescription>
                  Manage the queues for routing incoming tickets.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchData}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setQueueDialog({ open: true, queue: null })}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Queue
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {queues.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No ticket queues found. Initialize defaults to get started.
                  </p>
                  <Button onClick={handleInitializeDefaults} disabled={isInitializing}>
                    {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Initialize Default Queues
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Queue Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queues.map((queue) => (
                      <TableRow key={queue.id}>
                        <TableCell className="font-medium">{queue.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{queue.description}</TableCell>
                        <TableCell>
                          {queue.isDefault ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Default
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded ${
                            queue.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {queue.isActive ? 'Active' : 'Inactive'}
                          </span>
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
                              <DropdownMenuItem 
                                onClick={() => setQueueDialog({ open: true, queue })}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteQueue(queue)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ticket Statuses</CardTitle>
                <CardDescription>
                  Create and manage custom ticket statuses.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchData}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setStatusDialog({ open: true, status: null })}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Status
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {statuses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No ticket statuses found. Initialize defaults to get started.
                  </p>
                  <Button onClick={handleInitializeDefaults} disabled={isInitializing}>
                    {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Initialize Default Statuses
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statuses.map((status) => (
                      <TableRow key={status.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <ColorIndicator color={status.color} />
                            <span>{status.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.type === 'Open' ? 'secondary' : 'default'}>
                            {status.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {status.isDefault ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Default
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {status.isSystem ? (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              System
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded ${
                            status.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {status.isActive ? 'Active' : 'Inactive'}
                          </span>
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
                              <DropdownMenuItem 
                                onClick={() => setStatusDialog({ open: true, status })}
                                disabled={status.isSystem}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteStatus(status)}
                                disabled={status.isSystem}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="priorities" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Ticket Priorities</CardTitle>
                <CardDescription>
                  Define priority levels and associated SLAs.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchData}
                  disabled={isLoading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setPriorityDialog({ open: true, priority: null })}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Priority
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {priorities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No ticket priorities found. Initialize defaults to get started.
                  </p>
                  <Button onClick={handleInitializeDefaults} disabled={isInitializing}>
                    {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Initialize Default Priorities
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Priority Name</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Response SLA</TableHead>
                      <TableHead>Resolution SLA</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>System</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priorities.map((priority) => (
                      <TableRow key={priority.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <ColorIndicator color={priority.color} />
                            <span>{priority.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            Level {priority.level}
                          </span>
                        </TableCell>
                        <TableCell>{priority.responseSla}</TableCell>
                        <TableCell>{priority.resolutionSla}</TableCell>
                        <TableCell>
                          {priority.isDefault ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Default
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          {priority.isSystem ? (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              System
                            </span>
                          ) : null}
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
                              <DropdownMenuItem 
                                onClick={() => setPriorityDialog({ open: true, priority })}
                                disabled={priority.isSystem}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeletePriority(priority)}
                                disabled={priority.isSystem}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <QueueDialog
        open={queueDialog.open}
        onOpenChange={(open) => setQueueDialog({ open, queue: queueDialog.queue })}
        queue={queueDialog.queue}
        onSubmit={handleQueueSubmit}
        isLoading={isSaving}
      />
      
      <StatusDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ open, status: statusDialog.status })}
        status={statusDialog.status}
        onSubmit={handleStatusSubmit}
        isLoading={isSaving}
      />
      
      <PriorityDialog
        open={priorityDialog.open}
        onOpenChange={(open) => setPriorityDialog({ open, priority: priorityDialog.priority })}
        priority={priorityDialog.priority}
        onSubmit={handlePrioritySubmit}
        isLoading={isSaving}
      />
    </div>
  );
}
