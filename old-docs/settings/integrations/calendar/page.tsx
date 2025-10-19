'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarCheck } from 'lucide-react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function CalendarIntegrationsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  type ProviderStatus = { updatedAt: string; expiresAt: string } | null;
  type IntegrationStatus = {
    google: boolean;
    microsoft: boolean;
    details?: {
      google: ProviderStatus;
      microsoft: ProviderStatus;
    };
  };
  const [status, setStatus] = useState<IntegrationStatus>({ google: false, microsoft: false });
  const [calLoading, setCalLoading] = useState(false);
  const [calSaving, setCalSaving] = useState(false);
  const [msCalLoading, setMsCalLoading] = useState(false);
  const [msCalSaving, setMsCalSaving] = useState(false);
  const [googleCalendars, setGoogleCalendars] = useState<Array<{ id: string; summary: string; primary?: boolean; accessRole?: string }>>([]);
  const [selectedGoogle, setSelectedGoogle] = useState<string[]>([]);
  const [initialSelectedGoogle, setInitialSelectedGoogle] = useState<string[]>([]);
  const [microsoftCalendars, setMicrosoftCalendars] = useState<Array<{ id: string; summary: string; primary?: boolean }>>([]);
  const [selectedMicrosoft, setSelectedMicrosoft] = useState<string[]>([]);
  const [initialSelectedMicrosoft, setInitialSelectedMicrosoft] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (status.google) {
      loadGoogleCalendarsAndSelection();
    } else {
      setGoogleCalendars([]);
      setSelectedGoogle([]);
      setInitialSelectedGoogle([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.google]);

  useEffect(() => {
    if (status.microsoft) {
      loadMicrosoftCalendarsAndSelection();
    } else {
      setMicrosoftCalendars([]);
      setSelectedMicrosoft([]);
      setInitialSelectedMicrosoft([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.microsoft]);

  const connect = (provider: 'google' | 'microsoft') => {
    // Use a full page navigation to the API route which will 302 to the provider.
    // This avoids CORS issues that occur when using fetch() to follow a cross-origin redirect.
    setLoading(provider);
    window.location.assign(`/api/integrations/${provider}/connect`);
  };

  const disconnectGoogle = async () => {
    try {
      setLoading('google');
      const res = await fetch('/api/integrations/google/disconnect', { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to disconnect Google');
      }
    } catch (e) {
      console.error('Error disconnecting Google', e);
    } finally {
      await refreshStatus();
      setLoading(null);
    }
  };

  const disconnectMicrosoft = async () => {
    try {
      setLoading('microsoft');
      const res = await fetch('/api/integrations/microsoft/disconnect', { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to disconnect Microsoft');
      }
    } catch (e) {
      console.error('Error disconnecting Microsoft', e);
    } finally {
      await refreshStatus();
      setLoading(null);
    }
  };

  const refreshStatus = async () => {
    try {
      const res = await fetch('/api/integrations/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load integration status', error);
    }
  };

  const loadGoogleCalendarsAndSelection = async () => {
    try {
      setCalLoading(true);
      const [calRes, selRes] = await Promise.all([
        fetch('/api/integrations/google/calendars'),
        fetch('/api/integrations/google/calendars/selection'),
      ]);
      const calData = calRes.ok ? await calRes.json() : { items: [] };
      const selData = selRes.ok ? await selRes.json() : { google: { selectedCalendarIds: [] } };
      setGoogleCalendars(Array.isArray(calData.items) ? calData.items : []);
      const selected = Array.isArray(selData?.google?.selectedCalendarIds) ? selData.google.selectedCalendarIds : [];
      setSelectedGoogle(selected);
      setInitialSelectedGoogle(selected);
    } catch (e) {
      console.error('Failed to load calendars/selection', e);
    } finally {
      setCalLoading(false);
    }
  };

  const toggleGoogleCalendar = (id: string, checked: boolean) => {
    setSelectedGoogle((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id); else set.delete(id);
      return Array.from(set);
    });
  };

  const selectAllGoogle = () => {
    setSelectedGoogle(googleCalendars.map((c) => c.id));
  };

  const clearAllGoogle = () => {
    setSelectedGoogle([]);
  };

  const saveGoogleSelection = async () => {
    try {
      setCalSaving(true);
      const res = await fetch('/api/integrations/google/calendars/selection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedCalendarIds: selectedGoogle }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setInitialSelectedGoogle(selectedGoogle);
      toast({ title: 'Saved', description: 'Google calendar selection updated.' });
    } catch (e) {
      console.error('Save selection failed', e);
      toast({ title: 'Error', description: 'Failed to save calendar selection.', variant: 'destructive' });
    } finally {
      setCalSaving(false);
    }
  };

  const googleDirty = useMemo(() => {
    const a = [...selectedGoogle].sort();
    const b = [...initialSelectedGoogle].sort();
    return a.length !== b.length || a.some((v, i) => v !== b[i]);
  }, [selectedGoogle, initialSelectedGoogle]);

  const loadMicrosoftCalendarsAndSelection = async () => {
    try {
      setMsCalLoading(true);
      const [calRes, selRes] = await Promise.all([
        fetch('/api/integrations/microsoft/calendars'),
        fetch('/api/integrations/microsoft/calendars/selection'),
      ]);
      const calData = calRes.ok ? await calRes.json() : { items: [] };
      const selData = selRes.ok ? await selRes.json() : { microsoft: { selectedCalendarIds: [] } };
      setMicrosoftCalendars(Array.isArray(calData.items) ? calData.items : []);
      const selected = Array.isArray(selData?.microsoft?.selectedCalendarIds) ? selData.microsoft.selectedCalendarIds : [];
      setSelectedMicrosoft(selected);
      setInitialSelectedMicrosoft(selected);
    } catch (e) {
      console.error('Failed to load Microsoft calendars/selection', e);
    } finally {
      setMsCalLoading(false);
    }
  };

  const toggleMicrosoftCalendar = (id: string, checked: boolean) => {
    setSelectedMicrosoft((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id); else set.delete(id);
      return Array.from(set);
    });
  };

  const selectAllMicrosoft = () => {
    setSelectedMicrosoft(microsoftCalendars.map((c) => c.id));
  };

  const clearAllMicrosoft = () => {
    setSelectedMicrosoft([]);
  };

  const saveMicrosoftSelection = async () => {
    try {
      setMsCalSaving(true);
      const res = await fetch('/api/integrations/microsoft/calendars/selection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedCalendarIds: selectedMicrosoft }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setInitialSelectedMicrosoft(selectedMicrosoft);
      toast({ title: 'Saved', description: 'Outlook calendar selection updated.' });
    } catch (e) {
      console.error('Save Microsoft selection failed', e);
      toast({ title: 'Error', description: 'Failed to save Outlook calendar selection.', variant: 'destructive' });
    } finally {
      setMsCalSaving(false);
    }
  };

  const microsoftDirty = useMemo(() => {
    const a = [...selectedMicrosoft].sort();
    const b = [...initialSelectedMicrosoft].sort();
    return a.length !== b.length || a.some((v, i) => v !== b[i]);
  }, [selectedMicrosoft, initialSelectedMicrosoft]);

  return (
    <SettingsLayout activeItem="calendar-integration">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Calendar Integrations</h1>
          <Button variant="outline" onClick={refreshStatus}>Refresh</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Google Calendar
              </CardTitle>
              <CardDescription>
                Connect your Google account to sync events and avoid scheduling conflicts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {status.google ? (
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <CalendarCheck className="h-4 w-4" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="w-fit">Not Connected</Badge>
              )}
              {status.details?.google && (
                <div className="text-sm text-muted-foreground">
                  <div>Updated: {new Date(status.details.google.updatedAt).toLocaleString()}</div>
                  <div>Expires: {new Date(status.details.google.expiresAt).toLocaleString()}</div>
                </div>
              )}
              {status.google && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Calendars</Label>
                    <div className="text-xs text-muted-foreground">{calLoading ? 'Loading…' : null}</div>
                  </div>
                  <div className="max-h-56 overflow-auto rounded border p-2 space-y-2 bg-background">
                    {googleCalendars.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No calendars found.</div>
                    ) : (
                      googleCalendars.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id={`gcal-${c.id}`}
                            checked={selectedGoogle.includes(c.id)}
                            onCheckedChange={(v) => toggleGoogleCalendar(c.id, v === true)}
                          />
                          <span className="truncate">{c.summary}</span>
                          {c.primary ? (
                            <Badge variant="outline" className="ml-1">Primary</Badge>
                          ) : null}
                        </label>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllGoogle} disabled={calLoading}>Select all</Button>
                    <Button variant="outline" size="sm" onClick={clearAllGoogle} disabled={calLoading}>Clear</Button>
                    <div className="flex-1" />
                    <Button onClick={saveGoogleSelection} disabled={!googleDirty || calSaving}>
                      {calSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Selected calendars are used for conflict checks in scheduling.</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {status.google ? (
                <>
                  <Button variant="destructive" onClick={disconnectGoogle} disabled={loading === 'google'}>
                    {loading === 'google' ? 'Disconnecting…' : 'Disconnect'}
                  </Button>
                  <Button variant="outline" onClick={() => connect('google')} disabled={loading === 'google'}>
                    Reconnect
                  </Button>
                </>
              ) : (
                <Button onClick={() => connect('google')} disabled={loading === 'google'}>
                  {loading === 'google' ? 'Connecting…' : 'Connect Google'}
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Outlook Calendar
              </CardTitle>
              <CardDescription>
                Connect your Microsoft 365 account to sync Outlook events.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {status.microsoft ? (
                <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                  <CalendarCheck className="h-4 w-4" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="w-fit">Not Connected</Badge>
              )}
              {status.details?.microsoft && (
                <div className="text-sm text-muted-foreground">
                  <div>Updated: {new Date(status.details.microsoft.updatedAt).toLocaleString()}</div>
                  <div>Expires: {new Date(status.details.microsoft.expiresAt).toLocaleString()}</div>
                </div>
              )}
              {status.microsoft && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Calendars</Label>
                    <div className="text-xs text-muted-foreground">{msCalLoading ? 'Loading…' : null}</div>
                  </div>
                  <div className="max-h-56 overflow-auto rounded border p-2 space-y-2 bg-background">
                    {microsoftCalendars.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No calendars found.</div>
                    ) : (
                      microsoftCalendars.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id={`mscal-${c.id}`}
                            checked={selectedMicrosoft.includes(c.id)}
                            onCheckedChange={(v) => toggleMicrosoftCalendar(c.id, v === true)}
                          />
                          <span className="truncate">{c.summary}</span>
                          {c.primary ? (
                            <Badge variant="outline" className="ml-1">Default</Badge>
                          ) : null}
                        </label>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllMicrosoft} disabled={msCalLoading}>Select all</Button>
                    <Button variant="outline" size="sm" onClick={clearAllMicrosoft} disabled={msCalLoading}>Clear</Button>
                    <div className="flex-1" />
                    <Button onClick={saveMicrosoftSelection} disabled={!microsoftDirty || msCalSaving}>
                      {msCalSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Selected calendars are used for conflict checks in scheduling.</div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {status.microsoft ? (
                <>
                  <Button variant="destructive" onClick={disconnectMicrosoft} disabled={loading === 'microsoft'}>
                    {loading === 'microsoft' ? 'Disconnecting…' : 'Disconnect'}
                  </Button>
                  <Button variant="outline" onClick={() => connect('microsoft')} disabled={loading === 'microsoft'}>
                    Reconnect
                  </Button>
                </>
              ) : (
                <Button onClick={() => connect('microsoft')} disabled={loading === 'microsoft'}>
                  {loading === 'microsoft' ? 'Connecting…' : 'Connect Outlook'}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}