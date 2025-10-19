
'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ALL_MODULES, type ModuleId, type ModuleInfo } from '@/lib/types';
import { useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';


export default function ModulesSettingsPage() {
  const { toast } = useToast();
  const { enabledModules, setEnabledModules, isInternalITMode, setIsInternalITMode } = useSidebar();
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmNext, setConfirmNext] = useState<boolean>(isInternalITMode);

  // Update confirmNext when isInternalITMode changes from sidebar context
  useEffect(() => {
    setConfirmNext(isInternalITMode);
  }, [isInternalITMode]);

  const handleToggle = (moduleId: ModuleId) => {
    setEnabledModules(prev => {
      const current = prev ?? {} as Record<ModuleId, boolean>;
      return {
        ...current,
        [moduleId]: !current[moduleId],
      };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/settings/modules', { credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledModules, isInternalITMode }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update the sidebar context with the saved values
        setEnabledModules(data.enabledModules);
        setIsInternalITMode(data.isInternalITMode);
        
        toast({
          title: 'Settings Saved',
          description: 'Your module visibility settings have been updated.',
        });
      } else {
        const data = await res.json();
        throw new Error(data.message ?? 'Failed to save');
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Save failed',
        description: err.message ?? 'Unable to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleModeToggleConfirm = () => {
    setIsInternalITMode(confirmNext);
    setShowConfirm(false);
    toast({
      title: 'Mode Changed',
      description: `Switched to ${confirmNext ? 'Internal IT' : 'MSP'} mode. Save changes to apply.`,
    });
  };

  const handleModeToggleCancel = () => {
    setShowConfirm(false);
    setConfirmNext(isInternalITMode);
  };

  // Show loading if modules haven't been loaded from sidebar context yet
  if (!enabledModules) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">Module Management</h1>
          <p className="text-muted-foreground">
            Enable or disable modules to customize the application for your team.
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

  const visibleModules = ALL_MODULES.filter(module => 
    isInternalITMode ? module.type === 'Core' : true
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Module Management</h1>
        <p className="text-muted-foreground">
          Enable or disable modules to customize the application for your team.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Enabled Modules</CardTitle>
          <CardDescription>
            Toggle modules on or off. Changes will be reflected in the sidebar.
          </CardDescription>
            </div>
            <div className="flex items-center gap-3 border rounded-lg px-3 py-2">
              <Label htmlFor="mode-toggle" className="text-sm">Internal IT mode</Label>
              <Switch id="mode-toggle" checked={isInternalITMode} disabled={isSaving} onCheckedChange={(v) => { const next = !!v; setConfirmNext(next); setShowConfirm(true); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {visibleModules.map((module) => (
                <div key={module.id} className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                    <Label htmlFor={`module-${module.id}`} className="text-base flex items-center gap-2">
                        <module.icon className="h-4 w-4" />
                        {module.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                    <Switch
                        id={`module-${module.id}`}
                        checked={enabledModules[module.id]}
                        onCheckedChange={() => handleToggle(module.id)}
                        disabled={module.id === 'dashboard' || module.id === 'settings'}
                    />
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      {/* Mode Change Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Organization Mode</DialogTitle>
            <DialogDescription>
              {confirmNext ? (
                <>
                  You're switching to <strong>Internal IT mode</strong>. This will hide MSP-specific modules like Clients, Contacts, Quoting, and Billing. 
                  Core ITSM modules will remain available.
                </>
              ) : (
                <>
                  You're switching to <strong>MSP mode</strong>. This will show all modules including client management, billing, and MSP-specific features.
                </>
              )}
              <br /><br />
              You can change this setting anytime. Don't forget to save your changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleModeToggleCancel}>
              Cancel
            </Button>
            <Button onClick={handleModeToggleConfirm}>
              Switch to {confirmNext ? 'Internal IT' : 'MSP'} Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
