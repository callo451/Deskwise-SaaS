"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Client, DashboardStat } from '@/lib/types';
import type { ClientStats } from '@/lib/services/clients';
import { MoreHorizontal, PlusCircle, Activity, ArrowUpRight, ArrowDownRight, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { NewClientDialog } from '@/components/clients/new-client-dialog';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ stat }: { stat: DashboardStat }) => {
  const isIncrease = stat.changeType === 'increase';
  return (
    <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground flex items-center">
          <span
            className={`flex items-center mr-1 ${
              isIncrease ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isIncrease ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {stat.change}
          </span>
          {stat.description}
        </p>
      </CardContent>
    </Card>
  );
};


type RowMetrics = { openTickets: number; assetCount: number; contactCount: number } | undefined;

const ClientRow = ({ client, onDelete, onEdit, metrics }: { client: Client; onDelete: (id: string) => void; onEdit: (client: Client) => void; metrics?: RowMetrics }) => {
  const getStatusVariant = (status: Client['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Inactive':
        return 'destructive';
      case 'Onboarding':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium"><Link href={`/clients/${client.id}`} className="hover:underline">{client.name}</Link></div>
            <div className="text-xs text-muted-foreground">{client.industry}</div>
            {metrics ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="h-5 px-2">OT: {metrics.openTickets}</Badge>
                <Badge variant="secondary" className="h-5 px-2">AS: {metrics.assetCount}</Badge>
                <Badge variant="secondary" className="h-5 px-2">CT: {metrics.contactCount}</Badge>
              </div>
            ) : (
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{client.contacts}</TableCell>
      <TableCell className="hidden sm:table-cell">{client.tickets}</TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/clients/${client.id}`}>View Details</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(client)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(client.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Onboarding'>('All');
  const [isRefetching, setIsRefetching] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, RowMetrics>>({});
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchClients = async (opts?: { q?: string; status?: 'Active' | 'Inactive' | 'Onboarding' }) => {
    try {
      let url = '/api/clients';
      if (opts?.q) {
        url = `/api/clients/search?q=${encodeURIComponent(opts.q)}`;
      } else if (opts?.status) {
        url = `/api/clients/by-status?status=${encodeURIComponent(opts.status)}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const clientsData = await response.json();
      setClients(clientsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/clients/metrics');
      if (!res.ok) return; // non-blocking
      const list: { clientId: string; openTickets: number; assetCount: number; contactCount: number }[] = await res.json();
      const map: Record<string, RowMetrics> = {};
      for (const m of list) {
        map[m.clientId] = { openTickets: m.openTickets, assetCount: m.assetCount, contactCount: m.contactCount };
      }
      setMetrics(map);
    } catch {}
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/clients/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch client stats');
      }
      const statsData = await response.json();
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClients(), fetchStats()]);
      // metrics is best-effort and can happen after list
      fetchMetrics();
      setLoading(false);
    };
    loadData();
  }, []);

  // Debounced search/status refetch
  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setIsRefetching(true);
      await fetchClients({ q: search.trim() || undefined, status: statusFilter === 'All' ? undefined : statusFilter });
      setIsRefetching(false);
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [search, statusFilter]);

  const handleDelete = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      // Refresh the clients list
      await Promise.all([fetchClients(), fetchStats()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete client');
    }
  };

  const handleClientCreated = async () => {
    // Refresh the clients list and stats after successful creation
    await Promise.all([fetchClients(), fetchStats()]);
    fetchMetrics();
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setShowEditDialog(true);
  };

  const handleClientUpdated = async (updated: Client) => {
    // Optimistically update list
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    // Refresh stats in background
    fetchStats();
    fetchMetrics();
  };

  const handleSeedClients = async () => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/clients/seed', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Failed to seed clients');
      }
      // Refresh lists and stats
      await Promise.all([fetchClients(), fetchStats()]);
      fetchMetrics();
      alert('Seeded mock clients successfully.');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to seed clients');
    } finally {
      setIsSeeding(false);
    }
  };

  // Convert stats to dashboard stats format
  const getDashboardStats = (): DashboardStat[] => {
    if (!stats) return [];
    
    return [
      {
        title: "Total Clients",
        value: stats.totalClients.toString(),
        change: "",
        changeType: "increase" as const,
        description: "all clients"
      },
      {
        title: "Active Clients",
        value: stats.activeClients.toString(),
        change: "",
        changeType: "increase" as const,
        description: "currently active"
      },
      {
        title: "Onboarding",
        value: stats.onboardingClients.toString(),
        change: "",
        changeType: "increase" as const,
        description: "in progress"
      },
      {
        title: "Total Tickets",
        value: stats.totalTickets.toString(),
        change: "",
        changeType: "increase" as const,
        description: "across all clients"
      }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading clients: {error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={`sk-${i}`}>
              <CardHeader className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          getDashboardStats().map(stat => (
            <StatCard key={stat.title} stat={stat} />
          ))
        )}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>Manage your client organizations.</CardDescription>
            </div>
            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients..."
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Onboarding">Onboarding</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                className="gap-1"
                onClick={() => setShowNewClientDialog(true)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Client</span>
              </Button>
              {process.env.NODE_ENV !== 'production' && (
                <Button 
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={handleSeedClients}
                  disabled={isSeeding}
                  title="Insert mock clients for this tenant"
                >
                  {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Seed mock clients</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isRefetching && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating…</div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name / Industry</TableHead>
                <TableHead className="hidden sm:table-cell">Contacts</TableHead>
                <TableHead className="hidden sm:table-cell">Open Tickets</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`row-sk-${i}`}>
                    <TableCell>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-10" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No clients found. Create your first client to get started.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map(client => (
                  <ClientRow key={client.id} client={client} onDelete={handleDelete} onEdit={handleEdit} metrics={metrics[client.id]} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Client Dialog */}
      <NewClientDialog
        open={showNewClientDialog}
        onOpenChange={setShowNewClientDialog}
        onSuccess={handleClientCreated}
      />

      {/* Edit Client Dialog */}
      <EditClientDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        client={selectedClient}
        onSuccess={handleClientUpdated}
      />
    </div>
  );
}
