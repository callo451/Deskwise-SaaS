
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Ticket,
  History,
  HardDrive,
  BookOpen,
  Flame,
  KanbanSquare,
  Loader2,
  RefreshCw,
  Play,
  Settings,
} from 'lucide-react';
import { NumberingSchemeExtended, ModuleType } from '@/lib/services/numbering-schemes';
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
import { Badge } from '@/components/ui/badge';

const modules = [
  { id: 'tickets' as ModuleType, name: 'Tickets', icon: Ticket, description: 'Service requests and support tickets' },
  { id: 'changes' as ModuleType, name: 'Changes', icon: History, description: 'Change management requests' },
  { id: 'assets' as ModuleType, name: 'Assets', icon: HardDrive, description: 'Hardware and software assets' },
  { id: 'articles' as ModuleType, name: 'Knowledge Base', icon: BookOpen, description: 'Knowledge base articles' },
  { id: 'incidents' as ModuleType, name: 'Incidents', icon: Flame, description: 'Major incidents and outages' },
  { id: 'projects' as ModuleType, name: 'Projects', icon: KanbanSquare, description: 'Project management' },
];

interface SchemeFormData {
  moduleType: ModuleType;
  prefix: string;
  suffix: string;
  paddingLength: number;
  startNumber: number;
}

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheme: NumberingSchemeExtended | null;
  onConfirm: (newStartNumber: number) => void;
}

const ResetDialog = ({ open, onOpenChange, scheme, onConfirm }: ResetDialogProps) => {
  const [newStartNumber, setNewStartNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(newStartNumber);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset Numbering Counter</DialogTitle>
          <DialogDescription>
            Reset the numbering counter for {scheme?.moduleType}. This will affect all new IDs generated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="startNumber">New Start Number</Label>
            <Input
              id="startNumber"
              type="number"
              value={newStartNumber}
              onChange={(e) => setNewStartNumber(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
          {scheme && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <div className="font-mono text-sm">
                {scheme.prefix}{newStartNumber.toString().padStart(scheme.paddingLength, '0')}{scheme.suffix}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reset Counter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function NumberingSettingsPage() {
  const { toast } = useToast();
  const [schemes, setSchemes] = useState<NumberingSchemeExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [editingSchemes, setEditingSchemes] = useState<Record<string, SchemeFormData>>({});
  const [previewIds, setPreviewIds] = useState<Record<string, string>>({});
  const [resetDialog, setResetDialog] = useState<{ open: boolean; scheme: NumberingSchemeExtended | null }>({ open: false, scheme: null });

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/numbering-schemes');
      if (response.ok) {
        const data = await response.json();
        setSchemes(data.schemes || []);
        
        // Initialize editing schemes
        const editing: Record<string, SchemeFormData> = {};
        (data.schemes || []).forEach((scheme: NumberingSchemeExtended) => {
          editing[scheme.moduleType] = {
            moduleType: scheme.moduleType,
            prefix: scheme.prefix,
            suffix: scheme.suffix,
            paddingLength: scheme.paddingLength,
            startNumber: scheme.startNumber,
          };
        });
        setEditingSchemes(editing);
        
        // Generate preview IDs
        if (data.schemes && data.schemes.length > 0) {
          await generatePreviews(data.schemes);
        }
      } else {
        throw new Error('Failed to fetch schemes');
      }
    } catch (error) {
      console.error('Failed to fetch numbering schemes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load numbering schemes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreviews = async (schemeList: NumberingSchemeExtended[]) => {
    const previews: Record<string, string> = {};
    
    for (const scheme of schemeList) {
      const editing = editingSchemes[scheme.moduleType];
      if (editing) {
        try {
          const response = await fetch('/api/numbering-schemes/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              moduleType: scheme.moduleType,
              prefix: editing.prefix,
              suffix: editing.suffix,
              paddingLength: editing.paddingLength,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            previews[scheme.moduleType] = data.previewId;
          }
        } catch (error) {
          console.error('Failed to generate preview for', scheme.moduleType, error);
        }
      }
    }
    
    setPreviewIds(previews);
  };

  const handleSchemeChange = async (moduleType: ModuleType, field: keyof SchemeFormData, value: string | number) => {
    const updatedSchemes = {
      ...editingSchemes,
      [moduleType]: {
        ...editingSchemes[moduleType],
        [field]: value,
      },
    };
    setEditingSchemes(updatedSchemes);
    
    // Generate preview for this scheme
    const scheme = updatedSchemes[moduleType];
    if (scheme) {
      try {
        const response = await fetch('/api/numbering-schemes/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleType,
            prefix: scheme.prefix,
            suffix: scheme.suffix,
            paddingLength: scheme.paddingLength,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setPreviewIds(prev => ({ ...prev, [moduleType]: data.previewId }));
        }
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update each scheme
      for (const [moduleType, schemeData] of Object.entries(editingSchemes)) {
        const response = await fetch(`/api/numbering-schemes/${moduleType}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prefix: schemeData.prefix,
            suffix: schemeData.suffix,
            paddingLength: schemeData.paddingLength,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update ${moduleType} scheme`);
        }
      }
      
      toast({
        title: 'Settings Saved',
        description: 'Your numbering schemes have been updated.',
      });
      
      // Refresh schemes
      await fetchSchemes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save numbering schemes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setIsInitializing(true);
      
      const response = await fetch('/api/numbering-schemes/initialize', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Defaults Initialized',
          description: data.message,
        });
        await fetchSchemes();
      } else {
        throw new Error('Failed to initialize defaults');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize default schemes.',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleResetCounter = async (scheme: NumberingSchemeExtended) => {
    setResetDialog({ open: true, scheme });
  };

  const confirmResetCounter = async (newStartNumber: number) => {
    if (!resetDialog.scheme) return;
    
    try {
      const response = await fetch(`/api/numbering-schemes/${resetDialog.scheme.moduleType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startNumber: newStartNumber,
          currentNumber: newStartNumber,
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'Counter Reset',
          description: `Counter for ${resetDialog.scheme.moduleType} has been reset to ${newStartNumber}.`,
        });
        await fetchSchemes();
      } else {
        throw new Error('Failed to reset counter');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset counter.',
        variant: 'destructive',
      });
    }
  };

  const getSchemeForModule = (moduleType: ModuleType) => {
    return schemes.find(s => s.moduleType === moduleType);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Numbering Schemes</h1>
          <p className="text-muted-foreground">
            Customize the prefixes and suffixes for IDs across different modules.
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
          <h1 className="text-3xl font-bold font-headline">Numbering Schemes</h1>
          <p className="text-muted-foreground">
            Customize the prefixes and suffixes for IDs across different modules.
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

      <Card>
        <CardHeader>
          <CardTitle>Module ID Formats</CardTitle>
          <CardDescription>
            Define the format for auto-generated IDs. The system will add a unique number between the prefix and suffix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {schemes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No numbering schemes found. Initialize default schemes to get started.
              </p>
              <Button onClick={handleInitializeDefaults} disabled={isInitializing}>
                {isInitializing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Initialize Default Schemes
              </Button>
            </div>
          ) : (
            modules.map(module => {
              const scheme = getSchemeForModule(module.id);
              const editing = editingSchemes[module.id];
              const preview = previewIds[module.id];
              const Icon = module.icon;
            
            return (
              <div key={module.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">{module.name}</h3>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {scheme && (
                      <Badge variant="outline" className="font-mono text-xs">
                        Current: {scheme.currentNumber}
                      </Badge>
                    )}
                    {scheme && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetCounter(scheme)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`${module.id}-prefix`}>Prefix</Label>
                    <Input
                      id={`${module.id}-prefix`}
                      value={editing?.prefix || ''}
                      onChange={e => handleSchemeChange(module.id, 'prefix', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${module.id}-suffix`}>Suffix</Label>
                    <Input
                      id={`${module.id}-suffix`}
                      value={editing?.suffix || ''}
                      onChange={e => handleSchemeChange(module.id, 'suffix', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${module.id}-padding`}>Padding</Label>
                    <Select
                      value={editing?.paddingLength?.toString() || '5'}
                      onValueChange={(value) => handleSchemeChange(module.id, 'paddingLength', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 digits (001)</SelectItem>
                        <SelectItem value="4">4 digits (0001)</SelectItem>
                        <SelectItem value="5">5 digits (00001)</SelectItem>
                        <SelectItem value="6">6 digits (000001)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="h-10 flex items-center px-3 rounded-md border border-input bg-secondary text-muted-foreground">
                      <span className="font-mono text-sm">
                        {preview || (editing ? `${editing.prefix}${'0'.repeat(editing.paddingLength)}${editing.suffix}` : 'Loading...')}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="h-10 flex items-center">
                      <Badge variant={scheme?.isActive ? 'default' : 'secondary'}>
                        {scheme?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {scheme && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Start Number:</span>
                        <div className="font-mono">{scheme.startNumber}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current Number:</span>
                        <div className="font-mono">{scheme.currentNumber}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next ID:</span>
                        <div className="font-mono">{scheme.nextId}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Generated:</span>
                        <div className="font-mono">{scheme.currentNumber - scheme.startNumber}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
      
      <ResetDialog 
        open={resetDialog.open}
        onOpenChange={(open) => setResetDialog({ open, scheme: resetDialog.scheme })}
        scheme={resetDialog.scheme}
        onConfirm={confirmResetCounter}
      />
    </div>
  );
}
