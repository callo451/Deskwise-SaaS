
'use client';

import { useState, useEffect } from 'react';
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
import type { ChangeRequest } from '@/lib/types';
import { MoreHorizontal, PlusCircle, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSidebar } from '@/components/ui/sidebar';

const ChangeRequestRow = ({ change, isInternalITMode, onApprove, onReject, onDelete }: { 
  change: ChangeRequest; 
  isInternalITMode: boolean; 
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const getStatusVariant = (status: ChangeRequest['status']) => {
    switch (status) {
      case 'Pending Approval': return 'secondary';
      case 'Approved': return 'default';
      case 'In Progress': return 'default';
      case 'Completed': return 'outline';
      case 'Rejected':
      case 'Cancelled': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getRiskVariant = (risk: ChangeRequest['riskLevel']) => {
    switch (risk) {
      case 'Low': return 'outline';
      case 'Medium': return 'secondary';
      case 'High': return 'default';
      case 'Critical': return 'destructive';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Link href={`/change-management/${change.id}`} className="font-medium text-primary hover:underline">
          {change.id}
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/change-management/${change.id}`} className="font-medium hover:underline">
          {change.title}
        </Link>
        {!isInternalITMode && (
          <div className="hidden text-sm text-muted-foreground md:inline ml-2">
            - {change.client}
          </div>
        )}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={getStatusVariant(change.status)}>{change.status}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={getRiskVariant(change.riskLevel)}>{change.riskLevel}</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{change.submittedBy}</TableCell>
      <TableCell className="hidden md:table-cell">{format(new Date(change.plannedStartDate), 'PP')}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/change-management/${change.id}`}>View Details</Link></DropdownMenuItem>
            {change.status === 'Pending Approval' && (
              <>
                <DropdownMenuItem onClick={() => onApprove(change.id)}>Approve</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onReject(change.id)}>Reject</DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(change.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function ChangeManagementPage() {
  const { isInternalITMode } = useSidebar();
  const { user } = useAuth();
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [stats, setStats] = useState<null | { total: number; pendingApproval: number; approved: number; inProgress: number; completed: number; rejected: number }>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [impactFilter, setImpactFilter] = useState<string>('');

  // Action modals
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchChangeRequests();
    fetchStats();
  }, [statusFilter, riskFilter, impactFilter]);

  const fetchChangeRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (riskFilter) params.set('riskLevel', riskFilter);
      if (impactFilter) params.set('impact', impactFilter);
      const query = params.toString();
      const response = await fetch(`/api/change-requests${query ? `?${query}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setChangeRequests(data);
      } else {
        console.error('Failed to fetch change requests');
      }
    } catch (error) {
      console.error('Error fetching change requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/change-requests/stats');
      if (res.ok) {
        const data = await res.json();
        setStats({
          total: data.total,
          pendingApproval: data.pendingApproval,
          approved: data.approved,
          inProgress: data.inProgress,
          completed: data.completed,
          rejected: data.rejected,
        });
      }
    } catch (e) {
      console.error('Failed to fetch change stats', e);
    }
  };

  const handleApproveStart = (id: string) => { setSelectedId(id); setReason(''); setApproveOpen(true); };
  const handleApproveConfirm = async () => {
    if (!selectedId) return;
    try {
      const response = await fetch(`/api/change-requests/${selectedId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: user?.id, reason }),
      });
      if (!response.ok) throw new Error('Failed to approve');
      setApproveOpen(false);
      setSelectedId(null);
      setReason('');
      toast({ title: 'Change approved' });
      await Promise.all([fetchChangeRequests(), fetchStats()]);
    } catch (e: any) {
      toast({ title: 'Approval failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handleRejectStart = (id: string) => { setSelectedId(id); setReason(''); setRejectOpen(true); };
  const handleRejectConfirm = async () => {
    if (!selectedId || !reason.trim()) { toast({ title: 'Reason required', variant: 'destructive' }); return; }
    try {
      const response = await fetch(`/api/change-requests/${selectedId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: user?.id, reason }),
      });
      if (!response.ok) throw new Error('Failed to reject');
      setRejectOpen(false);
      setSelectedId(null);
      setReason('');
      toast({ title: 'Change rejected' });
      await Promise.all([fetchChangeRequests(), fetchStats()]);
    } catch (e: any) {
      toast({ title: 'Rejection failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handleDeleteStart = (id: string) => { setSelectedId(id); setDeleteOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!selectedId) return;
    try {
      const response = await fetch(`/api/change-requests/${selectedId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setChangeRequests(prev => prev.filter(change => change.id !== selectedId));
      setDeleteOpen(false);
      setSelectedId(null);
      toast({ title: 'Change deleted' });
      await fetchStats();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const handleSeedChanges = async () => {
    try {
      const res = await fetch('/api/change-requests/seed', { method: 'POST' });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Failed to seed change requests' });
        return;
      }
      toast({ title: 'Seeded mock change requests' });
      await fetchChangeRequests();
    } catch (e) {
      console.error('Seed change requests failed', e);
      toast({ variant: 'destructive', title: 'Seed request failed' });
    }
  };

  // Add filtering logic here in the future
  const filteredChanges = changeRequests;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-semibold">{stats.total}</div></CardContent></Card>
          <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pending</div><div className="text-2xl font-semibold">{stats.pendingApproval}</div></CardContent></Card>
          <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Approved</div><div className="text-2xl font-semibold">{stats.approved}</div></CardContent></Card>
          <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">In Progress</div><div className="text-2xl font-semibold">{stats.inProgress}</div></CardContent></Card>
          <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Completed</div><div className="text-2xl font-semibold">{stats.completed}</div></CardContent></Card>
          <Card className="shadow-none border-muted/50"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Rejected</div><div className="text-2xl font-semibold">{stats.rejected}</div></CardContent></Card>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-6 w-6 text-primary"/>
                Change Management
              </CardTitle>
              <CardDescription>
                Track and manage all IT change requests.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {process.env.NODE_ENV !== 'production' && (
                <Button size="sm" variant="secondary" className="h-7 gap-1" onClick={handleSeedChanges}>
                  Seed Mock Changes
                </Button>
              )}
              <Link href="/change-management/new">
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  New Change Request
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <Select value={statusFilter || undefined} onValueChange={(v)=>setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter || undefined} onValueChange={(v)=>setRiskFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Risk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={impactFilter || undefined} onValueChange={(v)=>setImpactFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Impact" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Impacts</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title {isInternalITMode ? '' : '/ Client'}</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Risk</TableHead>
                <TableHead className="hidden md:table-cell">Submitted By</TableHead>
                <TableHead className="hidden md:table-cell">Planned Start</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>Loading change requests...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredChanges.length > 0 ? (
                filteredChanges.map(change => (
                  <ChangeRequestRow 
                    key={change.id} 
                    change={change} 
                    isInternalITMode={isInternalITMode}
                    onApprove={handleApproveStart}
                    onReject={handleRejectStart}
                    onDelete={handleDeleteStart}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No change requests found. Create your first change request to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Change Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Optionally provide an approval note.</p>
          <Textarea placeholder="Approval note (optional)" value={reason} onChange={(e)=>setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setApproveOpen(false)}>Cancel</Button>
            <Button onClick={handleApproveConfirm}>Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Change Request</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Provide a reason for rejection.</p>
          <Textarea placeholder="Rejection reason" value={reason} onChange={(e)=>setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={()=>setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this change request?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
