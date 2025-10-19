
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Asset, ChangeRequest, Ticket } from '@/lib/types';
import { ChevronLeft, User, FileText, Activity, AlertTriangle, Shield, Calendar, HardDrive, Ticket as TicketIcon, ChevronRight, CheckCircle2, XCircle, Clock, Target, Zap, GitBranch, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSidebar } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { MarkdownEditor } from '@/components/ui/markdown-editor';

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: React.ReactNode, icon?: React.ElementType }) => {
  if (!value) return null;
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex justify-between items-center py-4 text-sm backdrop-blur-sm bg-white/5 dark:bg-gray-900/5 rounded-lg px-4 mb-3"
    >
      <div className="flex items-center gap-3 text-muted-foreground">
        {Icon && <div className="p-1.5 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>}
        <span className="font-medium">{label}</span>
      </div>
      <div className="font-semibold text-right text-foreground">{value}</div>
    </motion.div>
  );
};

const AssetRow = ({ asset }: { asset: Asset }) => (
    <TableRow>
        <TableCell><Link href={`/assets/${asset.id}`} className="font-medium text-primary hover:underline">{asset.name}</Link></TableCell>
        <TableCell>{asset.type}</TableCell>
        <TableCell>{asset.status}</TableCell>
        <TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/assets/${asset.id}`}><ChevronRight className="h-4 w-4" /></Link></Button></TableCell>
    </TableRow>
);

const TicketRow = ({ ticket }: { ticket: Ticket }) => (
    <TableRow>
        <TableCell><Link href={`/tickets/${ticket.id}`} className="font-medium text-primary hover:underline">{ticket.id}</Link></TableCell>
        <TableCell>{ticket.subject}</TableCell>
        <TableCell>{ticket.status}</TableCell>
        <TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/tickets/${ticket.id}`}><ChevronRight className="h-4 w-4" /></Link></Button></TableCell>
    </TableRow>
);

export default function ChangeRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isInternalITMode } = useSidebar();
  const { user } = useAuth();
  const { toast } = useToast();
  const [change, setChange] = useState<ChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [associatedAssets, setAssociatedAssets] = useState<Asset[]>([]);
  const [associatedTickets, setAssociatedTickets] = useState<Ticket[]>([]);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [audit, setAudit] = useState<Array<{ id: string; timestamp: string; type: string; userId: string; message?: string; changes?: Array<{ field: string; from: any; to: any }> }>>([]);
  const editForm = useForm<{ 
    title: string; 
    description: string; 
    riskLevel: ChangeRequest['riskLevel']; 
    impact: ChangeRequest['impact']; 
    plannedStartDate: string; 
    plannedEndDate: string;
    changePlan: string;
    rollbackPlan: string;
  }>({
    defaultValues: {
      title: '',
      description: '',
      riskLevel: 'Low',
      impact: 'Low',
      plannedStartDate: '',
      plannedEndDate: '',
      changePlan: '',
      rollbackPlan: '',
    },
  });

  useEffect(() => {
    fetchChange();
    fetchAudit();
  }, [params.id]);

  const fetchChange = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/change-requests/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setChange(data);
        // Load associations in parallel (best-effort)
        const assetIds: string[] = Array.isArray(data.associatedAssets) ? data.associatedAssets : [];
        const ticketIds: string[] = Array.isArray(data.associatedTickets) ? data.associatedTickets : [];
        if (assetIds.length > 0) {
          Promise.all(
            assetIds.map((id: string) => fetch(`/api/assets/${id}`).then(r => r.ok ? r.json() : null))
          ).then(list => setAssociatedAssets(list.filter(Boolean)));
        } else {
          setAssociatedAssets([]);
        }
        if (ticketIds.length > 0) {
          Promise.all(
            ticketIds.map((id: string) => fetch(`/api/tickets/${id}`).then(r => r.ok ? r.json() : null))
          ).then(list => setAssociatedTickets(list.filter(Boolean)));
        } else {
          setAssociatedTickets([]);
        }
      } else if (response.status === 404) {
        setChange(null);
      } else {
        console.error('Failed to fetch change request');
      }
    } catch (error) {
      console.error('Error fetching change request:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-semibold">Loading change request...</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">Fetching change details</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (!change) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl">
          <CardHeader><CardTitle className="text-lg font-semibold">Change Request Not Found</CardTitle></CardHeader>
        </Card>
      </motion.div>
    );
  }
  
  const clientName = change.client;
  
  const getStatusColor = (status: ChangeRequest['status']) => {
    switch (status) {
      case 'Pending Approval': return 'bg-yellow-500 text-white border-0 shadow-sm';
      case 'Approved': return 'bg-green-500 text-white border-0 shadow-sm';
      case 'In Progress': return 'bg-blue-500 text-white border-0 shadow-sm';
      case 'Completed': return 'bg-emerald-500 text-white border-0 shadow-sm';
      case 'Rejected': return 'bg-red-500 text-white border-0 shadow-sm';
      case 'Cancelled': return 'bg-gray-500 text-white border-0 shadow-sm';
      default: return 'bg-gray-500 text-white border-0 shadow-sm';
    }
  };

  const getRiskColor = (risk: ChangeRequest['riskLevel']) => {
    switch (risk) {
      case 'Low': return 'bg-green-500 text-white border-0 shadow-sm';
      case 'Medium': return 'bg-yellow-500 text-white border-0 shadow-sm';
      case 'High': return 'bg-orange-500 text-white border-0 shadow-sm';
      case 'Critical': return 'bg-red-500 text-white border-0 shadow-sm';
      default: return 'bg-gray-500 text-white border-0 shadow-sm';
    }
  };
  
  const getImpactColor = (impact: ChangeRequest['impact']) => {
    switch (impact) {
      case 'Low': return 'bg-green-500 text-white border-0 shadow-sm';
      case 'Medium': return 'bg-yellow-500 text-white border-0 shadow-sm';
      case 'High': return 'bg-red-500 text-white border-0 shadow-sm';
      default: return 'bg-gray-500 text-white border-0 shadow-sm';
    }
  };

  const approveChange = async () => {
    if (!change) return;
    try {
      const res = await fetch(`/api/change-requests/${change.id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvedBy: user?.id, reason })
      });
      if (!res.ok) throw new Error('Failed to approve');
      toast({ title: 'Change approved' });
      setApproveOpen(false);
      setReason('');
      await fetchChange();
    } catch (e: any) {
      toast({ title: 'Approval failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  const rejectChange = async () => {
    if (!change) return;
    if (!reason.trim()) { toast({ title: 'Reason required', variant: 'destructive' }); return; }
    try {
      const res = await fetch(`/api/change-requests/${change.id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rejectedBy: user?.id, reason })
      });
      if (!res.ok) throw new Error('Failed to reject');
      toast({ title: 'Change rejected' });
      setRejectOpen(false);
      setReason('');
      await fetchChange();
    } catch (e: any) {
      toast({ title: 'Rejection failed', description: e.message || 'Unknown error', variant: 'destructive' });
    }
  };

  async function fetchAudit() {
    try {
      const res = await fetch(`/api/change-requests/${params.id}/audit`);
      if (!res.ok) return;
      const data = await res.json();
      setAudit(Array.isArray(data) ? data : []);
    } catch (e) {
      // swallow
    }
  }


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
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
               <Button asChild variant="outline" size="icon" className="h-9 w-9 backdrop-blur-xl border-white/20 hover:bg-white/10">
                 <Link href="/change-management"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back</span></Link>
               </Button>
             </motion.div>
             <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">{change.title}</h1>
             <Badge 
               variant="outline" 
               style={{
                 backgroundColor: change.status === 'Pending Approval' ? '#eab308' : 
                                 change.status === 'Approved' ? '#22c55e' :
                                 change.status === 'In Progress' ? '#3b82f6' :
                                 change.status === 'Completed' ? '#10b981' :
                                 change.status === 'Rejected' ? '#ef4444' : '#6b7280',
                 color: 'white',
                 borderColor: 'transparent'
               }}
               className="capitalize font-medium"
             >
               {change.status}
             </Badge>
           </div>
           <p className="text-muted-foreground ml-13 text-sm">
             Change Request <span className="font-mono bg-muted/50 px-2 py-1 rounded">#{change.id}</span> • Risk: {change.riskLevel} • Impact: {change.impact}
           </p>
         </div>
         <div className="flex items-center gap-2">
           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
             <Button 
               variant="outline" 
               onClick={() => {
                 if (!change) return;
                 editForm.reset({
                   title: change.title,
                   description: change.description,
                   riskLevel: change.riskLevel,
                   impact: change.impact,
                   plannedStartDate: change.plannedStartDate,
                   plannedEndDate: change.plannedEndDate,
                   changePlan: change.changePlan,
                   rollbackPlan: change.rollbackPlan,
                 });
                 setEditOpen(true);
               }}
               className="backdrop-blur-xl border-white/20 hover:bg-white/10"
             >
               <Settings2 className="w-4 h-4 mr-2" />
               Edit Change
             </Button>
           </motion.div>
           {change.status === 'Pending Approval' && (
             <>
               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                 <Button 
                   onClick={()=>{ setReason(''); setApproveOpen(true); }}
                   className="bg-green-500 hover:bg-green-600 text-white"
                 >
                   <CheckCircle2 className="w-4 h-4 mr-2" />
                   Approve
                 </Button>
               </motion.div>
               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                 <Button 
                   variant="destructive" 
                   onClick={()=>{ setReason(''); setRejectOpen(true); }}
                   className="bg-red-500 hover:bg-red-600 text-white"
                 >
                   <XCircle className="w-4 h-4 mr-2" />
                   Reject
                 </Button>
               </motion.div>
             </>
           )}
         </div>
       </motion.div>

       {/* Quick metrics with glassmorphic styling and colors */}
       <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.2, duration: 0.6 }}
         className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8"
       >
         <Card className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 rounded-2xl">
           <CardContent className="p-4">
             <div className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">Status</div>
             <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{change.status}</div>
           </CardContent>
         </Card>
         <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 rounded-2xl">
           <CardContent className="p-4">
             <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Risk Level</div>
             <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{change.riskLevel}</div>
           </CardContent>
         </Card>
         <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 rounded-2xl">
           <CardContent className="p-4">
             <div className="text-xs text-purple-700 dark:text-purple-300 font-medium">Impact</div>
             <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{change.impact}</div>
           </CardContent>
         </Card>
         <Card className="backdrop-blur-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 rounded-2xl">
           <CardContent className="p-4">
             <div className="text-xs text-green-700 dark:text-green-300 font-medium">Duration</div>
             <div className="text-2xl font-bold text-green-800 dark:text-green-200">
               {Math.ceil((new Date(change.plannedEndDate).getTime() - new Date(change.plannedStartDate).getTime()) / (1000 * 60 * 60 * 24))}d
             </div>
           </CardContent>
         </Card>
         <Card className="backdrop-blur-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20 border border-slate-500/20 rounded-2xl hidden md:block">
           <CardContent className="p-4">
             <div className="text-xs text-slate-700 dark:text-slate-300 font-medium">Approval</div>
             <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
               {change.requiresApproval ? 'Required' : 'None'}
             </div>
           </CardContent>
         </Card>
       </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Change Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 dark:border-white/3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Change Details</h2>
                </div>
              </div>
              <div className="p-6 space-y-2 -mt-2">
                <DetailRow label="Status" icon={Activity} value={<Badge className={cn("backdrop-blur-sm !important", getStatusColor(change.status))} style={{backgroundColor: change.status === 'Pending Approval' ? '#eab308' : change.status === 'Approved' ? '#22c55e' : change.status === 'In Progress' ? '#3b82f6' : change.status === 'Completed' ? '#10b981' : change.status === 'Rejected' ? '#ef4444' : '#6b7280', color: 'white'}}>{change.status}</Badge>} />
                {!isInternalITMode && <DetailRow label="Client" icon={User} value={clientName} />}
                <DetailRow label="Risk Level" icon={AlertTriangle} value={<Badge className={cn("backdrop-blur-sm")} style={{backgroundColor: change.riskLevel === 'Low' ? '#22c55e' : change.riskLevel === 'Medium' ? '#eab308' : change.riskLevel === 'High' ? '#f97316' : '#ef4444', color: 'white'}}>{change.riskLevel}</Badge>} />
                <DetailRow label="Impact" icon={Shield} value={<Badge className={cn("backdrop-blur-sm")} style={{backgroundColor: change.impact === 'Low' ? '#22c55e' : change.impact === 'Medium' ? '#eab308' : '#ef4444', color: 'white'}}>{change.impact}</Badge>} />
                <DetailRow label="Planned Start" icon={Calendar} value={format(new Date(change.plannedStartDate), 'PPpp')} />
                <DetailRow label="Planned End" icon={Calendar} value={format(new Date(change.plannedEndDate), 'PPpp')} />
                <DetailRow label="Submitted By" icon={User} value={change.submittedBy} />
                {change.approvedBy && <DetailRow label="Approved By" icon={CheckCircle2} value={`${change.approvedBy} on ${format(new Date(change.approvedAt!), 'PPpp')}`} />}
                {change.rejectedBy && <DetailRow label="Rejected By" icon={XCircle} value={`${change.rejectedBy} on ${format(new Date(change.rejectedAt!), 'PPpp')}`} />}
                {typeof change.riskScore === 'number' && <DetailRow label="Risk Score" icon={AlertTriangle} value={change.riskScore} />}
                {change.approvalWorkflow && <DetailRow label="Workflow" icon={GitBranch} value={change.approvalWorkflow} />}
              </div>
            </motion.div>

            {/* Associated Assets */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 dark:border-white/3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Associated Assets</h2>
                  <Badge variant="secondary" className="ml-auto backdrop-blur-sm">
                    {associatedAssets.length}
                  </Badge>
                </div>
              </div>
              <div className="overflow-hidden">
                {associatedAssets.length > 0 ? (
                  <div className="divide-y divide-white/10 dark:divide-white/5">
                    {associatedAssets.map((asset, index) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Link href={`/assets/${asset.id}`} className="font-medium text-primary hover:underline">
                              {asset.name}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">
                              {asset.type} • {asset.status}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/assets/${asset.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No associated assets</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Associated Tickets */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 dark:border-white/3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Associated Tickets</h2>
                  <Badge variant="secondary" className="ml-auto backdrop-blur-sm">
                    {associatedTickets.length}
                  </Badge>
                </div>
              </div>
              <div className="overflow-hidden">
                {associatedTickets.length > 0 ? (
                  <div className="divide-y divide-white/10 dark:divide-white/5">
                    {associatedTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="p-4 hover:bg-white/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Link href={`/tickets/${ticket.id}`} className="font-medium text-primary hover:underline">
                              {ticket.subject}
                            </Link>
                            <p className="text-sm text-muted-foreground mt-1">
                              #{ticket.id} • {ticket.status}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/tickets/${ticket.id}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No associated tickets</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
          
          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Change Details Consolidated */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 dark:border-white/3">
                <h2 className="text-lg font-semibold">Change Documentation</h2>
              </div>
              <div className="p-6 space-y-8">
                {/* Description Section */}
                <div>
                  <h3 className="text-base font-semibold mb-3 text-foreground">Description</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed">
                    <p className="whitespace-pre-wrap">{change.description}</p>
                  </div>
                </div>

                {/* Implementation Plan Section */}
                <div>
                  <h3 className="text-base font-semibold mb-3 text-foreground">Implementation Plan</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_ul]:ml-4 [&_ol]:ml-4 [&_li]:my-1">
                    <ReactMarkdown>{change.changePlan}</ReactMarkdown>
                  </div>
                </div>

                {/* Rollback Plan Section */}
                <div>
                  <h3 className="text-base font-semibold mb-3 text-foreground">Rollback Plan</h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_ul]:ml-4 [&_ol]:ml-4 [&_li]:my-1">
                    <ReactMarkdown>{change.rollbackPlan}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Change Timeline - Moved to Bottom */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border border-white/10 dark:border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Change Timeline</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchAudit} className="backdrop-blur-sm">Refresh</Button>
              </div>
              <div className="p-6">
{audit.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No audit entries yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {audit.map((entry, idx) => {
                      // Helper function to get user-friendly field names
                      const getFieldDisplayName = (fieldName: string) => {
                        const fieldMap: Record<string, string> = {
                          'title': 'Title',
                          'description': 'Description',
                          'riskLevel': 'Risk Level',
                          'impact': 'Impact',
                          'plannedStartDate': 'Planned Start Date',
                          'plannedEndDate': 'Planned End Date',
                          'changePlan': 'Implementation Plan',
                          'rollbackPlan': 'Rollback Plan',
                          'status': 'Status',
                          'priority': 'Priority',
                          'category': 'Category',
                          'submittedBy': 'Submitted By',
                          'approvedBy': 'Approved By',
                          'rejectedBy': 'Rejected By'
                        };
                        return fieldMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                      };

                      // Helper function to render content with markdown support
                      const renderContent = (content: string, isMarkdown: boolean = false) => {
                        if (!content) return <span className="text-muted-foreground italic">Empty</span>;
                        
                        if (isMarkdown && (content.includes('##') || content.includes('*') || content.includes('-') || content.includes('`'))) {
                          return (
                            <div className="prose prose-xs dark:prose-invert max-w-none [&_h1]:text-sm [&_h1]:font-semibold [&_h1]:mb-1 [&_h1]:mt-2 first:[&_h1]:mt-0 [&_h2]:text-xs [&_h2]:font-medium [&_h2]:mb-1 [&_h2]:mt-1 [&_h3]:text-xs [&_h3]:font-medium [&_h3]:mb-1 [&_h3]:mt-1 [&_ul]:text-xs [&_ol]:text-xs [&_li]:my-0 [&_p]:text-xs [&_p]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-2 [&_blockquote]:text-muted-foreground [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-muted/30 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:text-xs [&_hr]:border-border/50 [&_hr]:my-2">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content.length > 200 ? content.substring(0, 200) + '...' : content}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                        
                        return (
                          <span className="text-xs">
                            {content.length > 200 ? content.substring(0, 200) + '...' : content}
                          </span>
                        );
                      };

                      return (
                        <motion.div 
                          key={entry.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex gap-4 backdrop-blur-sm bg-white/5 dark:bg-gray-900/5 rounded-xl p-4 mb-4"
                        >
                          <div className="flex flex-col items-center min-w-[2.5rem]">
                            <div className="flex items-center justify-center h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] rounded-full bg-primary text-white shadow-lg flex-shrink-0">
                              <Activity className="h-5 w-5 min-h-[1.25rem] min-w-[1.25rem] flex-shrink-0" strokeWidth={2} />
                            </div>
                            {idx < audit.length - 1 && <div className="w-px h-full bg-border/30 mt-3" />}
                          </div>
                          <div className="flex-1 group">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground text-base capitalize">
                                  {entry.type.replace('_', ' ')}
                                </p>
                                <p className="text-xs text-muted-foreground font-medium">
                                  {new Date(entry.timestamp).toLocaleString()} • {entry.userId}
                                </p>
                              </div>
                            </div>
                            {entry.message && (
                              <div className="mt-3 text-sm text-foreground leading-relaxed">
                                {entry.message}
                              </div>
                            )}
                            
                            {entry.changes && entry.changes.length > 0 && (
                              <div className="space-y-3">
                                {entry.changes.map((change, i) => {
                                  const isMarkdownField = ['changePlan', 'rollbackPlan', 'description'].includes(change.field);
                                  return (
                                    <div key={i} className="bg-white/3 dark:bg-white/3 rounded-lg p-3 border border-white/5 dark:border-white/3">
                                      <div className="text-xs font-semibold text-foreground mb-2">
                                        {getFieldDisplayName(change.field)}
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <div className="text-xs font-medium text-red-500 mb-1">Before</div>
                                          <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-xs">
                                            {renderContent(String(change.from), isMarkdownField)}
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-medium text-green-500 mb-1">After</div>
                                          <div className="bg-green-500/10 border border-green-500/20 rounded p-2 text-xs">
                                            {renderContent(String(change.to), isMarkdownField)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Approve Dialog */}
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-white/10 shadow-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                Approve Change Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optionally provide an approval note to document the decision.
              </p>
              <Textarea 
                placeholder="Approval note (optional)" 
                value={reason} 
                onChange={(e)=>setReason(e.target.value)}
                className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-white/30"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="ghost" 
                onClick={()=>setApproveOpen(false)}
                className="backdrop-blur-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={approveChange}
                className="backdrop-blur-sm bg-green-500/90 hover:bg-green-500 text-white border-0"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-white/10 shadow-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Settings2 className="h-5 w-5" />
                </div>
                Edit Change Request
              </DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form className="space-y-4" onSubmit={editForm.handleSubmit(async (values) => {
                if (!change) return;
                try {
                  const res = await fetch(`/api/change-requests/${change.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: values.title,
                      description: values.description,
                      riskLevel: values.riskLevel,
                      impact: values.impact,
                      plannedStartDate: values.plannedStartDate,
                      plannedEndDate: values.plannedEndDate,
                      changePlan: values.changePlan,
                      rollbackPlan: values.rollbackPlan,
                    })
                  });
                  if (!res.ok) throw new Error('Failed to update');
                  toast({ title: 'Change updated' });
                  setEditOpen(false);
                  await fetchChange();
                } catch (e: any) {
                  toast({ title: 'Update failed', description: e.message || 'Unknown error', variant: 'destructive' });
                }
              })}>
                <div className="overflow-y-auto max-h-[62vh] pr-1 space-y-4">
                  <FormField control={editForm.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={editForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea rows={3} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField control={editForm.control} name="riskLevel" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Level</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select risk" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={editForm.control} name="impact" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select impact" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField control={editForm.control} name="plannedStartDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned Start</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" value={field.value ? field.value.slice(0,16) : ''} onChange={(e)=>field.onChange(e.target.value)} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={editForm.control} name="plannedEndDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Planned End</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" value={field.value ? field.value.slice(0,16) : ''} onChange={(e)=>field.onChange(e.target.value)} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <div className="space-y-4">
                    <FormField control={editForm.control} name="changePlan" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Implementation Plan</FormLabel>
                        <FormControl>
                          <MarkdownEditor value={field.value || ''} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={editForm.control} name="rollbackPlan" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rollback Plan</FormLabel>
                        <FormControl>
                          <MarkdownEditor value={field.value || ''} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={()=>setEditOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-white/10 shadow-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <XCircle className="h-5 w-5" />
                </div>
                Reject Change Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Please provide a clear reason for rejecting this change request.
              </p>
              <Textarea 
                placeholder="Rejection reason (required)" 
                value={reason} 
                onChange={(e)=>setReason(e.target.value)}
                className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-white/30"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="ghost" 
                onClick={()=>setRejectOpen(false)}
                className="backdrop-blur-sm"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={rejectChange}
                className="backdrop-blur-sm bg-red-500/90 hover:bg-red-500 text-white border-0"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Change
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </motion.div>
  );
}
