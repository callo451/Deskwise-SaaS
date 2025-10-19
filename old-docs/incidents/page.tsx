
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import type { MajorIncident } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Flame, Siren } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const IncidentRow = ({ incident, onDelete }: { incident: MajorIncident; onDelete: (id: string) => void }) => {
  const getStatusVariant = (status: MajorIncident['status']) => {
    switch (status) {
      case 'Investigating': return 'secondary';
      case 'Identified': return 'default';
      case 'Monitoring': return 'default';
      case 'Resolved': return 'outline';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Link href={`/incidents/${incident.id}`} className="font-medium text-primary hover:underline">
          {incident.displayId ?? incident.id}
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/incidents/${incident.id}`} className="font-medium hover:underline">
          {incident.title}
        </Link>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={getStatusVariant(incident.status)}>{incident.status}</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        {formatDistanceToNow(parseISO(incident.startedAt), { addSuffix: true })}
      </TableCell>
       <TableCell className="hidden sm:table-cell">
        {incident.isPublished ? 
            <Badge className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">Published</Badge> 
            : <Badge variant="outline">Internal</Badge>
        }
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
            <DropdownMenuItem asChild><Link href={`/incidents/${incident.id}`}>View Details</Link></DropdownMenuItem>
            <DropdownMenuItem>Publish Update</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(incident.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<MajorIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [stats, setStats] = useState<{ total: number; open: number; active: number; resolved: number; published: number; criticalIncidents: number; avgResolutionTime: number; byStatus: Record<string, number> } | null>(null);

  // Advanced filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MajorIncident['status']>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'published' | 'internal'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'Low' | 'Medium' | 'High' | 'Critical'>('all');

  useEffect(() => {
    fetchIncidents();
    fetchStats();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/incidents');
      if (response.ok) {
        const data = await response.json();
        setIncidents(data);
      } else {
        console.error('Failed to fetch incidents');
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/incidents/stats');
      if (res.ok) setStats(await res.json());
    } catch (e) {
      // ignore
    }
  };

  const filteredIncidents = useMemo(() => {
    let list = incidents || [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => (i.title?.toLowerCase().includes(q) || i.displayId?.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (visibilityFilter !== 'all') list = list.filter(i => visibilityFilter === 'published' ? i.isPublished : !i.isPublished);
    if (priorityFilter !== 'all') list = list.filter(i => i.priority === priorityFilter);
    return list;
  }, [incidents, search, statusFilter, visibilityFilter, priorityFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;

    try {
      const response = await fetch(`/api/incidents/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIncidents(prev => prev.filter(incident => incident.id !== id));
      } else {
        console.error('Failed to delete incident');
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
    }
  };

  const handleSeedIncidents = async () => {
    try {
      const res = await fetch('/api/incidents/seed', { method: 'POST' });
      if (!res.ok) {
        console.error('Failed to seed incidents');
        toast({ variant: 'destructive', title: 'Failed to seed incidents' });
        return;
      }
      toast({ title: 'Seeded mock incidents' });
      await fetchIncidents();
    } catch (e) {
      console.error('Seed incidents failed', e);
      toast({ variant: 'destructive', title: 'Seed request failed' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><Flame className="h-6 w-6 text-destructive"/>Incident Management</CardTitle>
              <CardDescription>
                Track and manage all major service disruptions and incidents.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {process.env.NODE_ENV !== 'production' && (
                <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={handleSeedIncidents}>
                  Seed Mock Incidents
                </Button>
              )}
              <Link href="/incidents/new">
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  New Incident
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold">{stats?.total ?? '—'}</div></CardContent></Card>
            <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Open</div><div className="text-2xl font-semibold">{stats?.open ?? '—'}</div></CardContent></Card>
            <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Active</div><div className="text-2xl font-semibold">{stats?.active ?? '—'}</div></CardContent></Card>
            <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Resolved</div><div className="text-2xl font-semibold">{stats?.resolved ?? '—'}</div></CardContent></Card>
            <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Published</div><div className="text-2xl font-semibold">{stats?.published ?? '—'}</div></CardContent></Card>
            <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Critical</div><div className="text-2xl font-semibold">{stats?.criticalIncidents ?? '—'}</div></CardContent></Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Search</label>
              <Input placeholder="Search by title or ID" value={search} onChange={(e)=>setSearch(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={(v:any)=>setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Investigating">Investigating</SelectItem>
                  <SelectItem value="Identified">Identified</SelectItem>
                  <SelectItem value="Monitoring">Monitoring</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Visibility</label>
              <Select value={visibilityFilter} onValueChange={(v:any)=>setVisibilityFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Visibility"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={priorityFilter} onValueChange={(v:any)=>setPriorityFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Priority"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator className="mb-4" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="hidden sm:table-cell">Visibility</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading incidents...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredIncidents.length > 0 ? (
                filteredIncidents.map(incident => (
                  <IncidentRow key={incident.id} incident={incident} onDelete={handleDelete} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No incidents found. Create your first incident to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
