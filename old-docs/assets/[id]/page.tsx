
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import type { Asset, Ticket, AssetHealthAnalysis } from '@/lib/types';
import type { AssetExtended } from '@/lib/services/assets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { checkAssetHealth, type AssetHealthCheckOutput } from '@/ai/flows/asset-health-check';
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Cpu,
  FileClock,
  HardDrive,
  Info,
  MemoryStick,
  Power,
  RefreshCw,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import Link from 'next/link';
import React from 'react';
import { useParams } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { DeviceConsoleDrawer } from '@/components/asset-operations/device-console-drawer';
import { convertOperationalAssetToDevice } from '@/lib/utils/asset-converters';
import type { Device } from '@/lib/types/asset-operations';

const monitoringData = {
  cpu: [
    { time: '10:00', usage: 30 }, { time: '10:05', usage: 45 }, { time: '10:10', usage: 50 },
    { time: '10:15', usage: 48 }, { time: '10:20', usage: 60 }, { time: '10:25', usage: 85 },
    { time: '10:30', usage: 55 },
  ],
  memory: [
    { time: '10:00', usage: 40 }, { time: '10:05', usage: 42 }, { time: '10:10', usage: 41 },
    { time: '10:15', usage: 45 }, { time: '10:20', usage: 47 }, { time: '10:25', usage: 48 },
    { time: '10:30', usage: 46 },
  ],
};

const chartConfig = {
  usage: {
    label: 'Usage (%)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const ResourceProgress = ({
  icon: Icon,
  title,
  used,
  total,
  unit,
}: {
  icon: React.ElementType;
  title: string;
  used: number;
  total: number;
  unit: string;
}) => {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span>{title}</span>
      </div>
      <Progress value={percentage} aria-label={`${title} usage`} />
      <div className="text-xs text-muted-foreground text-right">
        {used.toFixed(1)} {unit} / {total.toFixed(1)} {unit}
      </div>
    </div>
  );
};

const TicketRow = ({ ticket }: { ticket: Ticket }) => {
    const getStatusVariant = (status: Ticket['status']) => {
      switch (status) {
        case 'Open': return 'default';
        case 'In Progress': return 'secondary';
        case 'Resolved': return 'default'; 
        case 'Closed': return 'outline';
        default: return 'default';
      }
    };
  
    const getPriorityVariant = (priority: Ticket['priority']) => {
      switch (priority) {
        case 'Critical': return 'destructive';
        case 'High': return 'default';
        case 'Medium': return 'secondary';
        case 'Low': return 'outline';
      }
    };

    return (
      <TableRow>
        <TableCell className="font-medium">{ticket.id}</TableCell>
        <TableCell>{ticket.subject}</TableCell>
        <TableCell>
          <Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusVariant(ticket.status)}
           style={
            ticket.status === 'Resolved'
              ? {
                  backgroundColor: 'hsl(var(--success))',
                  color: 'hsl(var(--success-foreground))',
                }
              : {}
          }>{ticket.status}</Badge>
        </TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/tickets/${ticket.id}`}><ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </TableCell>
      </TableRow>
    );
};

const DetailRow = ({ label, value }: { label: string; value?: React.ReactNode }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="font-medium text-sm text-right">{value}</div>
    </div>
  );
};


export default function AssetDetailsPage() {
  const params = useParams<{ id: string }>();
  const { isInternalITMode } = useSidebar();
  const { organizationId } = useAuth();
  
  const [asset, setAsset] = useState<AssetExtended | null>(null);
  const [associatedTickets, setAssociatedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AssetHealthCheckOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [operationalAsset, setOperationalAsset] = useState<any | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [opLoading, setOpLoading] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAsset();
    }
  }, [params.id]);

  useEffect(() => {
    if (asset) {
      setNotes(asset.notes || '');
      fetchAssociatedTickets();
    }
  }, [asset]);

  // Fetch OperationalAsset (via API) and convert to Device for console drawer
  useEffect(() => {
    const fetchOperational = async () => {
      if (!organizationId || !params.id) return;
      try {
        setOpLoading(true);
        setOpError(null);
        const res = await fetch(`/api/assets/${params.id}/operational`);
        if (!res.ok) {
          if (res.status === 404) {
            setOpError('Operational asset not found');
          } else {
            throw new Error('Failed to load operational asset');
          }
          return;
        }
        const op = await res.json();
        setOperationalAsset(op);
        setDevice(convertOperationalAssetToDevice(op, organizationId));
      } catch (e) {
        setOpError(e instanceof Error ? e.message : 'Failed to load operational asset');
      } finally {
        setOpLoading(false);
      }
    };
    fetchOperational();
  }, [organizationId, params.id]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assets/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Asset not found');
        } else {
          throw new Error('Failed to fetch asset');
        }
        return;
      }
      const data = await response.json();
      setAsset(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssociatedTickets = async () => {
    if (!asset?.associatedTickets?.length) {
      setAssociatedTickets([]);
      return;
    }
    
    try {
      // Fetch tickets by IDs - this would need a ticket API endpoint that accepts multiple IDs
      const ticketPromises = asset.associatedTickets.map(async (ticketId) => {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (response.ok) {
          return response.json();
        }
        return null;
      });
      
      const tickets = await Promise.all(ticketPromises);
      setAssociatedTickets(tickets.filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch associated tickets:', err);
    }
  };

  const saveNotes = async () => {
    if (!asset) return;
    
    try {
      setSavingNotes(true);
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notes');
      }
      
      const updatedAsset = await response.json();
      setAsset(updatedAsset);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const createTicketFromAsset = async () => {
    if (!asset) return;
    try {
      setCreatingTicket(true);
      const res = await fetch(`/api/assets/${asset.id}/tickets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: `Issue with ${asset.name}` }),
      });
      if (!res.ok) throw new Error('Failed to create ticket');
      const { ticket } = await res.json();
      await fetchAssociatedTickets();
      window.location.href = `/tickets/${ticket.id}`;
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingTicket(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">Loading asset details...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Asset Not Found</CardTitle>
            <CardDescription>{error || 'The requested asset could not be found.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/assets">
              <Button>Back to Assets</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleHealthCheck = async () => {
    if (!asset) return;
    setIsAnalysisDialogOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const ramTotal = asset?.ram?.total ?? 0;
      const ramUsed = asset?.ram?.used ?? 0;
      const diskTotal = asset?.disk?.total ?? 0;
      const diskUsed = asset?.disk?.used ?? 0;
      const ramUsage = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;
      const diskUsage = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;

      const result = await checkAssetHealth({
        name: asset.name,
        status: (asset as any)?.status ?? 'Offline',
        isSecure: Boolean((asset as any)?.isSecure),
        cpuUsage: (asset as any)?.cpu?.usage ?? 0,
        ramUsage,
        diskUsage,
        activityLogs: (asset as any)?.activityLogs ?? [],
      });
      setAnalysisResult(result);
    } catch (error) {
      console.error("AI Health Check failed:", error);
      // You could add a toast notification here for the user
      setAnalysisResult({
        overallStatus: 'Critical',
        analysis: ['Failed to retrieve AI analysis.'],
        recommendations: ['Please try again later. If the issue persists, contact support.'],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const getStatusColor = (status: AssetExtended['status']) => {
    switch (status) {
      case 'Online': return 'text-green-500';
      case 'Offline': return 'text-red-500';
      case 'Warning': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: AssetExtended['status']) => {
    const className = "h-4 w-4";
    switch (status) {
      case 'Online': return <Power className={className} />;
      case 'Offline': return <Power className={className} />;
      case 'Warning': return <AlertTriangle className={className} />;
      default: return <Info className={className} />;
    }
  };

  const getAnalysisStatusVariant = (status: AssetHealthCheckOutput['overallStatus']) => {
    switch (status) {
      case 'Healthy': return 'default';
      case 'Needs Attention': return 'secondary';
      case 'Critical': return 'destructive';
      default: return 'outline';
    }
  };

  // Safe derived values for header rendering
  const safeStatus = ((asset as any)?.status ?? 'Offline') as AssetExtended['status']
  const safeIsSecure = Boolean((asset as any)?.isSecure)
  const safeLastSeen = (() => {
    const ls: any = (asset as any)?.lastSeen
    if (!ls) return '—'
    try { return new Date(ls).toLocaleString() } catch { return String(ls) }
  })()

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">{asset.name || 'Unnamed Asset'}</h1>
            <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className={`flex items-center gap-1 ${getStatusColor(safeStatus as any)}`}>
                {getStatusIcon(safeStatus as any)}
                {safeStatus}
              </span>
              <span className='text-muted-foreground/50'>&bull;</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`flex items-center gap-1 ${safeIsSecure ? 'text-green-600' : 'text-amber-600'}`}>
                      {safeIsSecure ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      {safeIsSecure ? 'Secured' : 'At Risk'}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{asset.isSecure ? 'Antivirus is active and up-to-date.' : 'Security software not detected or out-of-date.'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className='text-muted-foreground/50'>&bull;</span>
              <span>Last seen: {safeLastSeen}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Remote Session
            </Button>
            <Button variant="secondary" onClick={createTicketFromAsset} disabled={creatingTicket}>
              {creatingTicket ? 'Creating…' : 'Create Ticket'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>RMM Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleHealthCheck} disabled={isAnalyzing}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>AI Health Check</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsConsoleOpen(true)} disabled={!device || opLoading || !!opError}>
                  <Terminal className="mr-2 h-4 w-4" />
                  <span>{opLoading ? 'Preparing Console…' : opError ? 'Console Unavailable' : 'Run Script'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Reboot Device</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Details</CardTitle>
                <CardDescription>Key properties</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="divide-y">
                  <DetailRow
                    label="Asset ID"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-xs">{asset.id}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigator.clipboard?.writeText(asset.id)}
                          aria-label="Copy Asset ID"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </span>
                    }
                  />
                  <DetailRow label="Type" value={(asset as any)?.type || '—'} />
                  <DetailRow label="Client" value={(asset as any)?.client || '—'} />
                  <DetailRow label="Location" value={(asset as any)?.location || '—'} />
                  <DetailRow label="Assigned To" value={(asset as any)?.assignedTo || '—'} />
                  <DetailRow label="OS" value={(asset as any)?.os || '—'} />
                  <DetailRow label="IP Address" value={(asset as any)?.ip || '—'} />
                  <DetailRow label="MAC Address" value={(asset as any)?.mac || '—'} />
                  <DetailRow label="Serial Number" value={(asset as any)?.serialNumber || '—'} />
                  <DetailRow
                    label="Purchase Date"
                    value={asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : undefined}
                  />
                  <DetailRow
                    label="Warranty Expiration"
                    value={asset.warrantyExpiration ? new Date(asset.warrantyExpiration).toLocaleDateString() : undefined}
                  />
                  <DetailRow label="Manufacturer" value={(asset as any)?.manufacturer || '—'} />
                  <DetailRow label="Model" value={(asset as any)?.model || '—'} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Real-time snapshot</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid sm:grid-cols-3 gap-6">
                <ResourceProgress icon={Cpu} title="CPU" used={(asset as any)?.cpu?.usage ?? 0} total={100} unit="%" />
                <ResourceProgress icon={MemoryStick} title="Memory" used={asset?.ram?.used ?? 0} total={asset?.ram?.total ?? 0} unit="GB" />
                <ResourceProgress icon={HardDrive} title="Disk" used={asset?.disk?.used ?? 0} total={asset?.disk?.total ?? 0} unit="GB" />
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Monitoring</CardTitle>
                    <CardDescription>Recent usage trends</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="h-48">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monitoringData.cpu}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <RechartsTooltip content={<ChartTooltipContent />} />
                              <Line type="monotone" dataKey="usage" stroke="var(--color-usage)" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                      <div className="h-48">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monitoringData.memory}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <RechartsTooltip content={<ChartTooltipContent />} />
                              <Line type="monotone" dataKey="usage" stroke="var(--color-usage)" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {asset.activityLogs?.length ? (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Activity Logs</CardTitle>
                      <CardDescription>Recent events on this asset</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead className="text-right">User</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {asset.activityLogs.map((log: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}</TableCell>
                              <TableCell>{log.message || log.action || '—'}</TableCell>
                              <TableCell className="text-right">{log.user || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>

              <TabsContent value="tickets">
                <Card>
                  <CardHeader>
                    <CardTitle>Associated Tickets</CardTitle>
                    <CardDescription>{associatedTickets.length} linked</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {associatedTickets.length ? (
                          associatedTickets.map((t) => <TicketRow key={t.id} ticket={t} />)
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No tickets linked.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription>Internal notes about this asset</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes..."
                      rows={8}
                    />
                    <div className="flex justify-end">
                      <Button onClick={saveNotes} disabled={savingNotes}>
                        {savingNotes ? 'Saving…' : 'Save Notes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {/* Device Console Drawer */}
        {device && (
          <DeviceConsoleDrawer
            device={device}
            operationalAsset={operationalAsset ?? undefined}
            open={isConsoleOpen}
            onOpenChange={setIsConsoleOpen}
          />
        )}

        {/* AI Health Check Dialog */}
        <AlertDialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
          <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 font-headline">
                <Sparkles className="h-6 w-6 text-primary" />
                AI Health Check
              </AlertDialogTitle>
              <AlertDialogDescription>
                We analyze key telemetry to assess device health and provide actionable recommendations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {isAnalyzing ? (
              <div className="flex justify-center items-center h-48">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
            ) : analysisResult && (
              <div className="text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-4 -mr-2">
                <div>
                  <h3 className="font-semibold mb-2">Overall Status</h3>
                  <Badge
                    variant={getAnalysisStatusVariant(analysisResult.overallStatus)}
                    className={analysisResult.overallStatus === 'Healthy' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                  >
                    {analysisResult.overallStatus}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Analysis</h3>
                  <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                    {analysisResult.analysis.map((item, index) => (
                      <li key={`analysis-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="space-y-3">
                    {analysisResult.recommendations.map((item, index) => (
                      <li key={`rec-${index}`} className="flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                        <Button asChild variant="secondary" size="sm" className="shrink-0">
                          <Link href={`/tickets/new?subject=${encodeURIComponent(`Issue with ${asset.name}`)}&description=${encodeURIComponent(item)}`}>
                            Create Ticket
                          </Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsAnalysisDialogOpen(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
