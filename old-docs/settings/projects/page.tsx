
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  PlusCircle,
  ListChecks,
  FileText,
  Loader2,
  RefreshCw,
  Edit,
  Trash2,
} from 'lucide-react';
import type { 
  ProjectStatusSettingExtended, 
  ProjectTemplateExtended 
} from '@/lib/services/project-settings';

// Types
interface StatusFormData {
  name: string;
  color: string;
  isDefault: boolean;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  estimatedDuration?: number;
  estimatedBudget?: number;
}

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ProjectStatusSettingExtended | null;
  onSubmit: (data: StatusFormData) => Promise<void>;
  isLoading: boolean;
}

interface TemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ProjectTemplateExtended | null;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  isLoading: boolean;
}

const ColorIndicator = ({ color }: { color: string }) => (
  <span className="flex h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
);

const StatusDialog = ({ open, onOpenChange, status, onSubmit, isLoading }: StatusDialogProps) => {
  const [formData, setFormData] = useState<StatusFormData>({
    name: '',
    color: '#3b82f6',
    isDefault: false
  });

  useEffect(() => {
    if (status) {
      setFormData({
        name: status.name,
        color: status.color,
        isDefault: status.isDefault
      });
    } else {
      setFormData({
        name: '',
        color: '#3b82f6',
        isDefault: false
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
            {status ? 'Update the project status.' : 'Create a new project status.'}
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isDefault">Default status for new projects</Label>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="flex items-center gap-2">
                <ColorIndicator color={formData.color} />
                <span>{formData.name || 'Status Name'}</span>
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

const TemplateDialog = ({ open, onOpenChange, template, onSubmit, isLoading }: TemplateDialogProps) => {
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: '',
    estimatedDuration: undefined,
    estimatedBudget: undefined
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category || '',
        estimatedDuration: template.estimatedDuration,
        estimatedBudget: template.estimatedBudget
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        estimatedDuration: undefined,
        estimatedBudget: undefined
      });
    }
  }, [template, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? 'Edit Template' : 'New Template'}</DialogTitle>
          <DialogDescription>
            {template ? 'Update the project template.' : 'Create a new project template.'}
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
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Client Management, Migrations"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (days)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    estimatedDuration: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="estimatedBudget">Estimated Budget ($)</Label>
                <Input
                  id="estimatedBudget"
                  type="number"
                  value={formData.estimatedBudget || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    estimatedBudget: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {template ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function ProjectSettingsPage() {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<ProjectStatusSettingExtended[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplateExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dialog states
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    status: ProjectStatusSettingExtended | null;
  }>({ open: false, status: null });
  
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    template: ProjectTemplateExtended | null;
  }>({ open: false, template: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings/project-settings');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data.statuses || []);
        setTemplates(data.templates || []);
      } else {
        throw new Error('Failed to fetch project settings');
      }
    } catch (error) {
      console.error('Failed to fetch project settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setIsInitializing(true);
      const response = await fetch('/api/settings/project-settings/initialize', {
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

  const handleStatusSubmit = async (data: StatusFormData) => {
    try {
      setIsSaving(true);
      const isEdit = !!statusDialog.status;
      const url = isEdit 
        ? `/api/settings/project-settings/${statusDialog.status!.id}` 
        : '/api/settings/project-settings';
      
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

  const handleTemplateSubmit = async (data: TemplateFormData) => {
    try {
      setIsSaving(true);
      const isEdit = !!templateDialog.template;
      const url = isEdit 
        ? `/api/settings/project-settings/${templateDialog.template!.id}` 
        : '/api/settings/project-settings';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'template', ...data }),
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: result.message,
        });
        setTemplateDialog({ open: false, template: null });
        await fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStatus = async (status: ProjectStatusSettingExtended) => {
    if (!confirm(`Are you sure you want to delete the status "${status.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/project-settings/${status.id}?type=status`,
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
        throw new Error('Failed to delete status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (template: ProjectTemplateExtended) => {
    if (!confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/settings/project-settings/${template.id}?type=template`,
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
        throw new Error('Failed to delete template');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Project Management</h1>
          <p className="text-muted-foreground">
            Configure project statuses and manage project templates.
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
          <h1 className="text-3xl font-bold font-headline">Project Management</h1>
          <p className="text-muted-foreground">
            Configure project statuses and manage project templates.
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

      <Tabs defaultValue="statuses">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="statuses">
            <ListChecks className="mr-2 h-4 w-4" />
            Statuses ({statuses.length})
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="mr-2 h-4 w-4" />
            Templates ({templates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="statuses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Statuses</CardTitle>
                <CardDescription>
                  Manage the lifecycle statuses for your projects.
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
                    No project statuses found. Initialize defaults to get started.
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
                      <TableHead>Default</TableHead>
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
                          {status.isDefault ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Default
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
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteStatus(status)}
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

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Templates</CardTitle>
                <CardDescription>
                  Create and manage templates for recurring project types.
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
                  onClick={() => setTemplateDialog({ open: true, template: null })}
                >
                  <PlusCircle className="h-4 w-4" />
                  New Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No project templates found. Initialize defaults to get started.
                  </p>
                  <Button onClick={handleInitializeDefaults} disabled={isInitializing}>
                    {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Initialize Default Templates
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          {template.category && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {template.category}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{template.description}</TableCell>
                        <TableCell>{template.taskCount}</TableCell>
                        <TableCell>
                          {template.estimatedDuration ? `${template.estimatedDuration} days` : '-'}
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
                                onClick={() => setTemplateDialog({ open: true, template })}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteTemplate(template)}
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
      
      <StatusDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ open, status: statusDialog.status })}
        status={statusDialog.status}
        onSubmit={handleStatusSubmit}
        isLoading={isSaving}
      />
      
      <TemplateDialog
        open={templateDialog.open}
        onOpenChange={(open) => setTemplateDialog({ open, template: templateDialog.template })}
        template={templateDialog.template}
        onSubmit={handleTemplateSubmit}
        isLoading={isSaving}
      />
    </div>
  );
}
