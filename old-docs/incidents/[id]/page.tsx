
'use client';

import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { MajorIncident, MajorIncidentUpdate } from '@/lib/types';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  Flame,
  ChevronLeft,
  Rss,
  Building,
  CheckCircle,
  Clock,
  Send,
  Globe,
  PlusCircle,
  XCircle,
  Info,
  Edit,
  Save,
  X,
  Trash2,
  FileText
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSidebar } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import TiptapViewer from '@/components/knowledge-base/TiptapViewer';
import { motion } from 'framer-motion';

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: React.ReactNode, icon?: React.ElementType }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex justify-between items-center py-4 text-sm backdrop-blur-sm bg-background/60 border border-border/50 rounded-lg px-4 mb-3"
  >
    <div className="flex items-center gap-3 text-muted-foreground">
      {Icon && <div className="p-1.5 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>}
      <span className="font-medium">{label}</span>
    </div>
    <div className="font-semibold text-right text-foreground">{value}</div>
  </motion.div>
);

const TimelineNode = ({ update, isLast = false, isEditing, onUpdateChange, onUpdateDelete }: { 
    update: MajorIncident['updates'][0], 
    isLast?: boolean,
    isEditing: boolean;
    onUpdateChange: (updateId: string, message: string) => void;
    onUpdateDelete: (updateId: string) => void;
}) => {
    const getStatusInfo = (status: MajorIncident['status']) => {
        switch(status) {
            case 'Investigating': return { color: 'bg-warning', icon: Info };
            case 'Identified': return { color: 'bg-primary', icon: Info };
            case 'Monitoring': return { color: 'bg-primary/80', icon: Info };
            case 'Resolved': return { color: 'bg-success', icon: CheckCircle };
            default: return { color: 'bg-muted-foreground', icon: Info };
        }
    };
    const { color, icon: Icon } = getStatusInfo(update.status);

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 backdrop-blur-sm bg-background/60 border border-border/50 rounded-xl p-4 mb-4"
        >
            <div className="flex flex-col items-center min-w-[2.5rem]">
                <div className={`flex items-center justify-center h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] rounded-full ${color} text-white shadow-lg flex-shrink-0`}>
                    <Icon className="h-5 w-5 min-h-[1.25rem] min-w-[1.25rem] flex-shrink-0" strokeWidth={2} />
                </div>
                {!isLast && <div className="w-px h-full bg-border/30 mt-3" />}
            </div>
            <div className="flex-1 group">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="font-semibold text-foreground text-base">
                            Status: <span className="font-bold text-primary">{update.status}</span>
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                            {format(parseISO(update.timestamp), 'PPpp')}
                        </p>
                    </div>
                    {isEditing && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-destructive/10" onClick={() => onUpdateDelete(update.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </div>
                {isEditing ? (
                  <Textarea value={update.message} onChange={(e) => onUpdateChange(update.id, e.target.value)} className="mt-3 backdrop-blur-sm bg-background/80 border-border/60" />
                ) : (
                  <div className="mt-3 text-sm text-foreground leading-relaxed">
                    {update.message}
                  </div>
                )}
            </div>
        </motion.div>
    )
};


export default function IncidentDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { isInternalITMode } = useSidebar();

  const [incident, setIncident] = useState<MajorIncident | null>(null);
  const [originalIncident, setOriginalIncident] = useState<MajorIncident | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client options loaded from API (production data)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [clientsLoading, setClientsLoading] = useState<boolean>(false);

  const [modifiedUpdates, setModifiedUpdates] = useState<Record<string, string>>({});
  const [deletedUpdateIds, setDeletedUpdateIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState<MajorIncident['status']>('Investigating');
  const [newMessage, setNewMessage] = useState('');
  const [posting, setPosting] = useState(false);
  // Service catalogue names
  const [services, setServices] = useState<string[]>([]);
  const [servicesLoading, setServicesLoading] = useState<boolean>(false);
  const [similarLoading, setSimilarLoading] = useState<boolean>(false);
  const [similar, setSimilar] = useState<{ incidents: Array<{ id: string; title: string; status: string; displayId?: string }>; kb: Array<{ id: string; title: string; category?: string; lastUpdated?: string }> }>({ incidents: [], kb: [] });
  // Assets & diagnostics
  const [assets, setAssets] = useState<Array<{ id: string; name: string; client: string; type: string }>>([]);
  const [assetsLoading, setAssetsLoading] = useState<boolean>(false);
  const [diagPlan, setDiagPlan] = useState<any>(null);
  const [artifacts, setArtifacts] = useState<Array<{ id: string; filename: string; url: string; contentType: string; uploadedAt: string; description?: string }>>([]);
  const [artifactsLoading, setArtifactsLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDesc, setUploadDesc] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'artifacts' | 'suggestions'>('timeline');
  // Postmortem generation state
  const [postmortemOpen, setPostmortemOpen] = useState(false);
  const [pmLoading, setPmLoading] = useState(false);
  const [pmDraft, setPmDraft] = useState<{ title: string; content: string; tags: string[] } | null>(null);
  const [pmError, setPmError] = useState<string | null>(null);
  const [pmPublishing, setPmPublishing] = useState(false);

  useEffect(() => {
    // Load incident and clients in parallel
    fetchIncident();
    fetchClients();
    fetchServices();
    fetchAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function fetchIncident() {
    try {
      setLoading(true);
      const res = await fetch(`/api/incidents/${params.id}`);
      if (!res.ok) throw new Error(`Failed to load incident (${res.status})`);
      const data: MajorIncident = await res.json();
      setIncident(data);
      setOriginalIncident(data);
      setNewStatus(data.status);
      // Warm load similar
      fetchSimilar(params.id);
      // Load artifacts
      fetchArtifacts(params.id);
    } catch (e: any) {
      console.error('Error loading incident:', e);
      setError(e.message || 'Failed to load incident');
    } finally {
      setLoading(false);
    }
  }
  async function fetchAssets() {
    try {
      setAssetsLoading(true);
      const res = await fetch('/api/assets?status=Online');
      if (!res.ok) return;
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []).map((a: any) => ({ id: a.id, name: a.name, client: a.client, type: a.type }));
      setAssets(list);
    } catch (e) {
      console.error('Failed to load assets', e);
    } finally {
      setAssetsLoading(false);
    }
  }

  async function linkAsset(assetId: string | null) {
    if (!incident) return;
    try {
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });
      if (!res.ok) throw new Error('Failed to link asset');
      const upd = await res.json();
      setIncident(upd);
      setOriginalIncident(upd);
      toast({ title: 'Asset linked' });
    } catch (e: any) {
      toast({ title: 'Failed to link asset', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  }

  async function loadDiagnosticsPlan() {
    if (!incident) return;
    try {
      const os = 'windows';
      const res = await fetch(`/api/incidents/${incident.id}/diagnostics?os=${encodeURIComponent(os)}&service=*`);
      if (!res.ok) return;
      const data = await res.json();
      setDiagPlan(data.plan);
    } catch (e) {
      console.error('Failed to load diagnostics plan', e);
    }
  }

  async function fetchArtifacts(id: string) {
    try {
      setArtifactsLoading(true);
      const res = await fetch(`/api/incidents/${id}/artifacts`);
      if (!res.ok) return;
      const data = await res.json();
      setArtifacts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch artifacts', e);
    } finally {
      setArtifactsLoading(false);
    }
  }

  async function handleUploadArtifact() {
    if (!incident || !uploadFile) return;
    setUploading(true);
    try {
      const arrayBuffer = await uploadFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const contentType = uploadFile.type || 'application/octet-stream';
      const dataUrl = `data:${contentType};base64,${base64}`;
      const res = await fetch(`/api/incidents/${incident.id}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadFile.name, contentType, data: dataUrl, description: uploadDesc }),
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchArtifacts(incident.id);
      setUploadFile(null);
      setUploadDesc('');
      toast({ title: 'Artifact uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  async function fetchSimilar(id: string) {
    try {
      setSimilarLoading(true);
      const res = await fetch(`/api/incidents/${id}/similar`);
      if (!res.ok) return;
      const data = await res.json();
      setSimilar({ incidents: data.incidents || [], kb: data.kb || [] });
    } catch (e) {
      console.error('Failed to fetch similar suggestions', e);
    } finally {
      setSimilarLoading(false);
    }
  }

  async function fetchServices() {
    try {
      setServicesLoading(true);
      const res = await fetch('/api/service-catalogue?isActive=true');
      if (!res.ok) return;
      const data = await res.json();
      const names = (Array.isArray(data) ? data : []).map((s: any) => s.name).filter((n: any) => typeof n === 'string');
      // Deduplicate and sort for UX
      setServices(Array.from(new Set(names)).sort());
    } catch (e) {
      console.error('Failed to load services for incident page', e);
    } finally {
      setServicesLoading(false);
    }
  }

  async function fetchClients() {
    try {
      setClientsLoading(true);
      const res = await fetch('/api/clients');
      if (!res.ok) return;
      const data = await res.json();
      const minimal = (Array.isArray(data) ? data : []).map((c: any) => ({ id: c.id, name: c.name }))
        .filter((c: any) => c.id && c.name);
      setClients(minimal);
    } catch (e) {
      console.error('Failed to load clients for incident page', e);
    } finally {
      setClientsLoading(false);
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-semibold">Loading incident...</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Fetching incident details</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-semibold text-destructive">Error</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
        </Card>
      </motion.div>
    );
  }
  if (!incident) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-semibold">Incident Not Found</CardTitle></CardHeader>
        </Card>
      </motion.div>
    );
  }

  const handleSave = async () => {
    if (!incident || !originalIncident) return;
    setSaving(true);
    try {
      const patch: any = {};
      if (incident.title !== originalIncident.title) patch.title = incident.title;
      if (incident.isPublished !== originalIncident.isPublished) patch.isPublished = incident.isPublished;
      if (JSON.stringify(incident.affectedServices) !== JSON.stringify(originalIncident.affectedServices)) patch.affectedServices = incident.affectedServices;
      if (JSON.stringify(incident.affectedClients) !== JSON.stringify(originalIncident.affectedClients)) patch.affectedClients = incident.affectedClients;

      const ops: Promise<Response>[] = [];
      if (Object.keys(patch).length > 0) {
        ops.push(fetch(`/api/incidents/${incident.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }));
      }
      for (const [updateId, message] of Object.entries(modifiedUpdates)) {
        ops.push(fetch(`/api/incidents/${incident.id}/updates/${updateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        }));
      }
      for (const updateId of deletedUpdateIds) {
        ops.push(fetch(`/api/incidents/${incident.id}/updates/${updateId}`, { method: 'DELETE' }));
      }

      const results = await Promise.all(ops);
      if (results.some(r => !r.ok)) throw new Error('Failed to save some changes');

      await fetchIncident();
      setIsEditing(false);
      setModifiedUpdates({});
      setDeletedUpdateIds([]);
      toast({
        title: 'Incident Saved',
        description: `Changes to "${incident.title}" have been saved.`,
      });
    } catch (e: any) {
      console.error('Error saving incident:', e);
      toast({ title: 'Failed to save', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIncident(originalIncident);
    setIsEditing(false);
    setModifiedUpdates({});
    setDeletedUpdateIds([]);
  };

  const handleUpdateChange = (updateId: string, message: string) => {
    setIncident(prev => prev ? { ...prev, updates: prev.updates.map(u => u.id === updateId ? { ...u, message } : u)} : prev);
    setModifiedUpdates(prev => ({ ...prev, [updateId]: message }));
  };

  const handleUpdateDelete = (updateId: string) => {
    setIncident(prev => prev ? { ...prev, updates: prev.updates.filter(u => u.id !== updateId) } : prev);
    setDeletedUpdateIds(prev => [...prev, updateId]);
    setModifiedUpdates(prev => {
      const { [updateId]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const getStatusVariant = (status: MajorIncident['status']) => {
    switch (status) {
      case 'Investigating': return 'secondary';
      case 'Identified': return 'default';
      case 'Monitoring': return 'default';
      case 'Resolved': return 'outline';
    }
  };

  const getStatusColor = (status: MajorIncident['status']) => {
     switch (status) {
      case 'Investigating': return 'text-warning';
      case 'Identified': return 'text-primary';
      case 'Monitoring': return 'text-primary/80';
      case 'Resolved': return 'text-success';
      default: return 'text-gray-500';
    }
  };

  const handlePostUpdate = async () => {
    if (!incident) return;
    if (!newMessage || !newStatus) {
      toast({ title: 'Missing fields', description: 'Status and message are required', variant: 'destructive' });
      return;
    }
    setPosting(true);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, message: newMessage }),
      });
      if (!res.ok) throw new Error('Failed to post update');
      const created: MajorIncidentUpdate = await res.json();
      setIncident(prev => prev ? { ...prev, status: newStatus, updates: [...prev.updates, created] } : prev);
      setOriginalIncident(prev => prev ? { ...prev, status: newStatus, updates: [...prev.updates, created] } : prev);
      setNewMessage('');
      toast({ title: 'Update posted', description: 'Your update has been published.' });
    } catch (e: any) {
      console.error('Post update error:', e);
      toast({ title: 'Failed to post update', description: e.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };
  
  const allServices = services.length > 0 ? services : ['Email Hosting', 'Microsoft 365', 'Internet', 'VPN', 'Internal Network', 'Deskwise Application'];
  const affectedClients = incident.affectedClients.includes('All')
    ? [{ id: 'All', name: 'All Clients' }]
    : incident.affectedClients
        .map(id => clients.find(c => c.id === id))
        .filter(Boolean) as { id: string; name: string }[];

  return (
    <div className="space-y-6">
      {/* Integrated Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6"
      >
        <div>
          <div className="flex items-center gap-4 mb-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button asChild variant="outline" size="icon" className="h-9 w-9 backdrop-blur-xl border-border/50 hover:bg-accent">
                <Link href="/incidents"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
              </Button>
            </motion.div>
            {isEditing ? (
              <Input 
                value={incident.title} 
                onChange={(e) => setIncident({
                  ...incident,
                  title: e.target.value
                })} 
                className="text-2xl h-12 font-bold font-headline backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border-white/20 focus:border-primary/50" 
              />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">{incident.title}</h1>
            )}
            <Badge 
              variant="outline" 
              style={{
                backgroundColor: incident.status === 'Investigating' ? '#eab308' : 
                                incident.status === 'Identified' ? '#3b82f6' :
                                incident.status === 'Monitoring' ? '#8b5cf6' :
                                incident.status === 'Resolved' ? '#10b981' : '#6b7280',
                color: 'white',
                borderColor: 'transparent'
              }}
              className="capitalize font-medium"
            >
              <Flame className="h-3 w-3 mr-1.5" />
              {incident.status}
            </Badge>
          </div>
          <p className="text-muted-foreground ml-13 text-sm">
            Incident <span className="font-mono bg-muted/50 px-2 py-1 rounded">{incident.displayId ?? incident.id}</span> started {formatDistanceToNow(parseISO(incident.startedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
            {isEditing ? (
                <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" onClick={handleCancel} disabled={saving} className="backdrop-blur-xl border-border/50 hover:bg-accent">
                        <X className="mr-2 h-4 w-4" />Cancel
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white">
                        <Save className="mr-2 h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </motion.div>
                </>
            ) : (
                <div className="flex gap-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" onClick={() => setPostmortemOpen(true)} className="backdrop-blur-xl border-border/50 hover:bg-accent">
                      <FileText className="mr-2 h-4 w-4" /> Postmortem
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white">
                      <Edit className="mr-2 h-4 w-4" />Edit Incident
                    </Button>
                  </motion.div>
                </div>
            )}
        </div>
      </motion.div>

      {/* Quick metrics with glassmorphic styling and colors */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        <Card className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-warning/80 dark:text-warning font-medium">Status</div>
            <div className="text-2xl font-bold text-warning dark:text-warning">{incident.status}</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-primary/80 dark:text-primary font-medium">Duration</div>
            <div className="text-2xl font-bold text-primary dark:text-primary">
              {incident.resolvedAt ? `${Math.max(1, Math.round((new Date(incident.resolvedAt).getTime()-new Date(incident.startedAt).getTime())/3600000))}h` : 'Ongoing'}
            </div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-primary/60 dark:text-primary/80 font-medium">Updates</div>
            <div className="text-2xl font-bold text-primary/80 dark:text-primary/80">{incident.updates.length}</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 rounded-2xl">
          <CardContent className="p-4">
            <div className="text-xs text-success/80 dark:text-success font-medium">Services</div>
            <div className="text-2xl font-bold text-success dark:text-success">{incident.affectedServices.length}</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20 border border-slate-500/20 rounded-2xl hidden md:block">
          <CardContent className="p-4">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">Visibility</div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{incident.isPublished ? 'Public' : 'Internal'}</div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid lg:grid-cols-3 gap-6 items-start"
      >
        <div className="lg:col-span-1 space-y-6">
          <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
            <CardHeader><CardTitle className="text-lg font-semibold">Incident Details</CardTitle></CardHeader>
            <CardContent className="space-y-2 -mt-2">
              <DetailRow label="Started At" value={format(parseISO(incident.startedAt), 'PPpp')} icon={Clock} />
              <DetailRow label="Resolved At" value={incident.resolvedAt ? format(parseISO(incident.resolvedAt), 'PPpp') : 'Ongoing'} icon={CheckCircle} />
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center py-4 text-sm backdrop-blur-sm bg-background/60 border border-border/50 rounded-lg px-4 mb-3"
              >
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Visibility</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">{incident.isPublished ? "Published" : "Internal"}</span>
                  {isEditing && <Switch id="visibility" checked={incident.isPublished} onCheckedChange={(checked) => setIncident({...incident, isPublished: checked})} />}
                </div>
              </motion.div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
            <CardHeader><CardTitle className="text-lg font-semibold">Linked Asset & Diagnostics</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Linked Asset</Label>
                <div className="flex items-center gap-2">
                  <Select value={incident.assetId ?? 'none'} onValueChange={(v)=>linkAsset(v === 'none' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder={assetsLoading ? 'Loading assets...' : 'Select asset'} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {assets.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name} ({a.type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {incident.assetId && (
                    <Link className="text-sm text-primary hover:underline" href={`/assets/${incident.assetId}`}>View Asset</Link>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Diagnostics Plan</Label>
                  <Button size="sm" variant="outline" onClick={loadDiagnosticsPlan}>Load Plan</Button>
                </div>
                {diagPlan ? (
                  <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-64">{JSON.stringify(diagPlan, null, 2)}</pre>
                ) : (
                  <div className="text-sm text-muted-foreground">Load a starter diagnostics plan, then run commands on the asset agent and upload artifacts below.</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
            <CardHeader><CardTitle className="text-lg font-semibold">Impact Assessment</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Affected Services</Label>
                {isEditing ? (
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10">
                                <div className="flex gap-1 flex-wrap">
                                    {incident.affectedServices.length > 0 ? incident.affectedServices.map(s => <Badge variant="secondary" key={s}>{s}</Badge>) : "Select services..."}
                                </div>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search services..." />
                                <CommandList>
                                    <CommandEmpty>No services found.</CommandEmpty>
                                    <CommandGroup>
                                        {allServices.map((service) => (
                                            <CommandItem key={service} onSelect={() => {
                                                const newSelection = incident.affectedServices.includes(service) ? incident.affectedServices.filter(s => s !== service) : [...incident.affectedServices, service];
                                                setIncident({...incident, affectedServices: newSelection});
                                            }}><CheckCircle className={cn("mr-2 h-4 w-4", incident.affectedServices.includes(service) ? "opacity-100" : "opacity-0")} />{service}</CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {incident.affectedServices.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                )}
              </div>
              {!isInternalITMode && (
                <div>
                  <Label>Affected Clients</Label>
                   {isEditing ? (
                       <Popover>
                          <PopoverTrigger asChild>
                              <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10">
                                  <div className="flex gap-1 flex-wrap">
                                      {affectedClients.length > 0 ? affectedClients.map(c => <Badge variant="outline" key={c.id}>{c.name}</Badge>) : "Select clients..."}
                                  </div>
                              </Button>
                          </PopoverTrigger>
                           <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              <Command>
                                  <CommandInput placeholder="Search clients..." />
                                  <CommandList>
                                      <CommandEmpty>No clients found.</CommandEmpty>
                                      <CommandGroup>
                                           <CommandItem onSelect={() => setIncident({ ...incident, affectedClients: ['All'] })}>
                                             <CheckCircle className={cn('mr-2 h-4 w-4', incident.affectedClients.includes('All') ? 'opacity-100' : 'opacity-0')} />
                                             All Clients
                                           </CommandItem>
                                          {clients.map((client) => (
                                            <CommandItem
                                              key={client.id}
                                              onSelect={() => {
                                                const currentSelection = incident.affectedClients.filter(c => c !== 'All');
                                                const newSelection = currentSelection.includes(client.id)
                                                  ? currentSelection.filter(id => id !== client.id)
                                                  : [...currentSelection, client.id];
                                                setIncident({ ...incident, affectedClients: newSelection });
                                              }}
                                            >
                                              <CheckCircle className={cn('mr-2 h-4 w-4', incident.affectedClients.includes(client.id) ? 'opacity-100' : 'opacity-0')} />
                                              {client.name}
                                            </CommandItem>
                                          ))}
                                      </CommandGroup>
                                  </CommandList>
                              </Command>
                          </PopoverContent>
                      </Popover>
                  ) : (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {affectedClients.map(c => <Badge key={c!.id} variant="outline">{c!.name}</Badge>)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Incident Workflow</CardTitle>
              <CardDescription>Post updates, review artifacts, and see suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v:any)=>setActiveTab(v)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium">New Status</label>
                      <Select value={newStatus} onValueChange={(v) => setNewStatus(v as MajorIncident['status'])}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Investigating">Investigating</SelectItem>
                          <SelectItem value="Identified">Identified</SelectItem>
                          <SelectItem value="Monitoring">Monitoring</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea placeholder="Type your update message here..." rows={4} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                    <div className="flex justify-end">
                      <Button onClick={handlePostUpdate} disabled={posting || !newMessage}><Send className="mr-2 h-4 w-4" /> {posting ? 'Posting...' : 'Post Update'}</Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    {incident.updates.length > 0 ? (
                      incident.updates.map((update, index) => (
                        <TimelineNode
                          key={update.id}
                          update={update}
                          isLast={index === incident.updates.length - 1}
                          isEditing={isEditing}
                          onUpdateChange={handleUpdateChange}
                          onUpdateDelete={handleUpdateDelete}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No updates yet.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="artifacts" className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <Input type="file" onChange={(e)=>setUploadFile(e.target.files?.[0] || null)} />
                      <Input placeholder="Description (optional)" value={uploadDesc} onChange={(e)=>setUploadDesc(e.target.value)} />
                      <Button disabled={!uploadFile || uploading} onClick={handleUploadArtifact}>{uploading ? 'Uploading...' : 'Upload'}</Button>
                    </div>
                  </div>
                  {artifactsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading artifacts…</div>
                  ) : artifacts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No artifacts yet. Upload a diagnostics bundle or attachment.</div>
                  ) : (
                    <ul className="space-y-2">
                      {artifacts.map(a => (
                        <li key={a.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{a.contentType?.split('/')[1] || 'file'}</Badge>
                            <div>
                              <div className="font-medium text-sm">{a.filename}</div>
                              <div className="text-xs text-muted-foreground">{a.description || ''}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a className="text-sm text-primary hover:underline" href={a.url}>Download</a>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                  {similarLoading ? (
                    <div className="text-sm text-muted-foreground">Finding similar items…</div>
                  ) : (
                    <>
                      {similar.incidents.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold mb-2">Similar Incidents</div>
                          <ul className="space-y-2">
                            {similar.incidents.slice(0,3).map((si) => (
                              <li key={si.id}>
                                <button
                                  className="text-left text-sm hover:underline"
                                  onClick={async () => {
                                    await fetch(`/api/incidents/${si.id}`);
                                    router.push(`/incidents/${si.id}`);
                                  }}
                                >
                                  {si.displayId ? `${si.displayId} • ` : ''}{si.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {similar.kb.length > 0 && (
                        <div>
                          <div className="text-sm font-semibold mt-4 mb-2">Known Fixes (KB)</div>
                          <ul className="space-y-2">
                            {similar.kb.slice(0,3).map((kb) => (
                              <li key={kb.id}>
                                <a className="text-sm hover:underline" href={`/knowledge-base/${kb.id}`}>
                                  {kb.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {similar.incidents.length === 0 && similar.kb.length === 0 && (
                        <div className="text-sm text-muted-foreground">No suggestions found.</div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <Dialog open={postmortemOpen} onOpenChange={setPostmortemOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Generate Postmortem Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[65vh] pr-1">
            {!pmDraft && !pmLoading && (
              <div className="flex justify-end">
                <Button onClick={async ()=>{
                  if (!incident) return;
                  setPmLoading(true);
                  setPmError(null);
                  try {
                    const res = await fetch(`/api/incidents/${incident.id}/postmortem/generate`, { method: 'POST' });
                    if (!res.ok) throw new Error(`Generate failed (${res.status})`);
                    const data = await res.json();
                    setPmDraft(data);
                  } catch (e: any) {
                    setPmError(e.message || 'Failed to generate draft');
                  } finally {
                    setPmLoading(false);
                  }
                }}>{pmLoading ? 'Generating…' : 'Generate Draft'}</Button>
              </div>
            )}
            {pmError && <div className="text-sm text-destructive">{pmError}</div>}
            {pmLoading && <div className="text-sm text-muted-foreground">Generating draft…</div>}
            {pmDraft && (
              <div className="space-y-3">
                <div className="text-lg font-semibold">{pmDraft.title}</div>
                <div className="overflow-y-auto max-h-[55vh]">
                  <TiptapViewer content={pmDraft.content} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={()=>{ setPmDraft(null); setPostmortemOpen(false); }}>Close</Button>
            <Button disabled={!pmDraft || pmPublishing} onClick={async ()=>{
              if (!incident || !pmDraft) return;
              setPmPublishing(true);
              try {
                const res = await fetch(`/api/incidents/${incident.id}/postmortem/publish`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(pmDraft),
                });
                if (!res.ok) throw new Error(`Publish failed (${res.status})`);
                const { article } = await res.json();
                toast({ title: 'Postmortem published', description: 'Draft saved to Knowledge Base.' });
                setPmDraft(null);
                setPostmortemOpen(false);
                // Navigate to article in new tab
                window.open(`/knowledge-base/${article.id}`, '_blank');
              } catch (e: any) {
                toast({ title: 'Failed to publish', description: e.message || 'Unknown error', variant: 'destructive' });
              } finally {
                setPmPublishing(false);
              }
            }}>{pmPublishing ? 'Publishing…' : 'Publish to KB'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
