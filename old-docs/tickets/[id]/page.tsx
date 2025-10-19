
'use client';

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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { Asset, Ticket, Client, TimeLog } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { analyzeTicket, type AnalyzeTicketOutput } from '@/ai/flows/ticket-insights';
import { summarizeTicket } from '@/ai/flows/ticket-summary';
import { generateSuggestedReply } from '@/ai/flows/suggested-reply';
import { findRelevantArticles, ProactiveKbSearchOutput } from '@/ai/flows/proactive-kb-search';
import {
  BookText,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  HardDrive,
  Mail,
  MoreVertical,
  Paperclip,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Hourglass,
  CheckCircle2,
  XCircle,
  Bot,
  FileText,
  PlusCircle,
  Lightbulb,
  History,
  Flame
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, parseISO, isAfter, isValid } from 'date-fns';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: React.ReactNode, icon?: React.ElementType }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-4 text-sm backdrop-blur-sm bg-white/5 dark:bg-gray-900/5 rounded-lg px-4 mb-3">
      <div className="flex items-center gap-3 text-muted-foreground">
        {Icon && <div className="p-1.5 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>}
        <span className="font-medium">{label}</span>
      </div>
      <div className="font-semibold text-right text-foreground">{value}</div>
    </div>
  );
};

const AssetRow = ({ asset }: { asset: Asset }) => (
  <TableRow>
    <TableCell className="font-medium">{asset.name}</TableCell>
    <TableCell className="hidden sm:table-cell">{asset.type}</TableCell>
    <TableCell>
      <div className={`flex items-center gap-1.5 ${asset.isSecure ? 'text-success' : 'text-warning'}`}>
        {asset.isSecure ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
        <span className="hidden xl:inline">{asset.isSecure ? 'Secured' : 'At Risk'}</span>
      </div>
    </TableCell>
    <TableCell className="text-right">
      <Button variant="ghost" size="icon" asChild>
        <Link href={`/assets/${asset.id}`}><ChevronRight className="h-4 w-4" /></Link>
      </Button>
    </TableCell>
  </TableRow>
);

const SlaTimer = React.memo(({ dueDate, metDate, label }: { dueDate?: string, metDate?: string, label: string }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  const isMet = metDate && dueDate ? !isAfter(parseISO(metDate), parseISO(dueDate)) : false;
  const isBreached = !metDate && dueDate ? isAfter(new Date(), parseISO(dueDate)) : false;

  useEffect(() => {
    if (!dueDate || metDate || isBreached) return;

    const calculateTimeLeft = () => {
      const distance = formatDistanceToNow(parseISO(dueDate), { addSuffix: true });
      setTimeLeft(distance);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [dueDate, metDate, isBreached]);

  const getStatus = () => {
    if (isMet) return { text: 'Met', icon: CheckCircle2, color: 'text-success' };
    if (isBreached) return { text: 'Breached', icon: XCircle, color: 'text-destructive' };
    return { text: timeLeft, icon: Hourglass, color: 'text-warning' };
  };

  const { text, icon: Icon, color } = getStatus();

  return (
    <div className="flex justify-between items-center py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {dueDate ? (
        <div className={`flex items-center gap-1.5 font-medium ${color}`}>
          <Icon className="h-4 w-4" />
          <span>{text}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-xs">Not set</span>
      )}
    </div>
  );
});
SlaTimer.displayName = 'SlaTimer';

const timeLogSchema = z.object({
  hours: z.coerce.number().min(0.1, 'Must be at least 0.1 hours.'),
  description: z.string().min(5, 'Description is required.'),
  isBillable: z.boolean(),
});

function TimeLogDialog({ onLogTime }: { onLogTime: (values: TimeLog) => void }) {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof timeLogSchema>>({
    resolver: zodResolver(timeLogSchema),
    defaultValues: { hours: 1, description: '', isBillable: true },
  });

  function onSubmit(values: z.infer<typeof timeLogSchema>) {
    const newLog: TimeLog = {
      id: `TL-${Date.now()}`,
      technician: 'John Doe', // Assuming current user
      date: new Date().toISOString().split('T')[0],
      ...values,
    };
    onLogTime(newLog);
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Log Time</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Time</DialogTitle>
          <DialogDescription>Add a new time entry for this ticket.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                 <FormField control={form.control} name="hours" render={({ field }) => (
                     <FormItem>
                         <Label>Hours</Label>
                         <Input type="number" step="0.1" {...field} />
                     </FormItem>
                 )} />
                 <FormField control={form.control} name="description" render={({ field }) => (
                     <FormItem>
                         <Label>Work Description</Label>
                         <Textarea {...field} />
                     </FormItem>
                 )} />
                 <FormField control={form.control} name="isBillable" render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                         <div className="space-y-0.5">
                             <FormLabel>Billable</FormLabel>
                         </div>
                         <FormControl>
                             <Switch checked={field.value} onCheckedChange={field.onChange} />
                         </FormControl>
                     </FormItem>
                 )} />
                 <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Entry</Button>
                 </div>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


export default function TicketDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeTicketOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [suggestedArticles, setSuggestedArticles] = useState<ProactiveKbSearchOutput>([]);
  const [isKbLoading, setIsKbLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [associatedAssets, setAssociatedAssets] = useState<Asset[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<Array<{ name: string; color: string; type: string }>>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [orgUsers, setOrgUsers] = useState<Array<{ id: string; firstName?: string; lastName?: string; email: string; profilePictureUrl?: string }>>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  const ticketContext = useMemo(() => {
    if (!currentTicket) return '';
    const activityLog = currentTicket.activity.map(a => `${a.user}: ${a.activity}`).join('\n');
    return `Subject: ${currentTicket.subject}\n\nDescription: ${currentTicket.description}\n\nActivity:\n${activityLog}`;
  }, [currentTicket]);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const response = await fetch(`/api/tickets/${params.id}`);
        if (response.ok) {
          const ticketData = await response.json();
          setCurrentTicket(ticketData);
        } else {
          console.error('Ticket not found');
        }
      } catch (error) {
        console.error('Error fetching ticket:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [params.id]);

  // Load associated client and assets from live APIs
  useEffect(() => {
    if (!currentTicket) return;
    let cancelled = false;
    const t = currentTicket;

    async function loadClient() {
      try {
        setClientLoading(true);
        const res = await fetch('/api/clients');
        if (!res.ok) return;
        const allClients: Client[] = await res.json();
        if (cancelled) return;
        const found = allClients.find(c => c.name === t.client) || null;
        setClient(found);
      } catch (err) {
        console.error('Failed to load client', err);
      } finally {
        if (!cancelled) setClientLoading(false);
      }
    }

    async function loadAssets() {
      try {
        setAssetsLoading(true);
        const ids = t.associatedAssets || [];
        if (ids.length === 0) {
          if (!cancelled) setAssociatedAssets([]);
          return;
        }

        const res = await fetch('/api/assets/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });

        if (!res.ok) {
          toast({ variant: 'destructive', title: 'Failed to load associated assets' });
          return;
        }

        const assets: Asset[] = await res.json();
        // Preserve input order, drop any missing
        const map = new Map<string, Asset>((assets as any[]).map((a: any) => [a.id as string, a]));
        const ordered = ids.map((id) => map.get(id)).filter(Boolean) as Asset[];
        if (!cancelled) setAssociatedAssets(ordered);
      } catch (err) {
        console.error('Failed to load assets', err);
        toast({ variant: 'destructive', title: 'Failed to load assets' });
      } finally {
        if (!cancelled) setAssetsLoading(false);
      }
    }

    loadClient();
    loadAssets();
    return () => { cancelled = true; };
  }, [currentTicket]);

  useEffect(() => {
    if (!currentTicket) return;

    const t = currentTicket;
    async function fetchKbArticles(ticket: Ticket) {
      setIsKbLoading(true);
      try {
        const results = await findRelevantArticles({ subject: ticket.subject, description: ticket.description });
        setSuggestedArticles(results);
      } catch (error) {
        console.error("Proactive KB search failed:", error);
        toast({ variant: 'destructive', title: 'Could not search knowledge base.' });
      } finally {
        setIsKbLoading(false);
      }
    }
    fetchKbArticles(t);
  }, [currentTicket, toast]);

  // Lazy-load defaults and users when dialogs open
  useEffect(() => {
    if (!isStatusDialogOpen || loadingStatuses || availableStatuses.length > 0) return;
    (async () => {
      try {
        setLoadingStatuses(true);
        const res = await fetch('/api/tickets/defaults');
        if (res.ok) {
          const data = await res.json();
          setAvailableStatuses(data.availableStatuses || []);
          if (!selectedStatus && currentTicket?.status) setSelectedStatus(currentTicket.status);
        }
      } catch (e) {
        console.error('Failed to load statuses', e);
        toast({ variant: 'destructive', title: 'Failed to load statuses' });
      } finally {
        setLoadingStatuses(false);
      }
    })();
  }, [isStatusDialogOpen, loadingStatuses, availableStatuses.length, selectedStatus, currentTicket, toast]);

  useEffect(() => {
    if (!isAssignDialogOpen || loadingUsers || orgUsers.length > 0) return;
    (async () => {
      try {
        setLoadingUsers(true);
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setOrgUsers(data.users || []);
          if (!selectedAssignee && currentTicket?.assignee) setSelectedAssignee(currentTicket.assignee);
        }
      } catch (e) {
        console.error('Failed to load users', e);
        toast({ variant: 'destructive', title: 'Failed to load users' });
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [isAssignDialogOpen, loadingUsers, orgUsers.length, selectedAssignee, currentTicket, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-muted/50 rounded animate-pulse"></div>
          <div className="h-8 w-1/3 bg-muted/50 rounded animate-pulse"></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted/50 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map(j => (
                      <div key={j} className="h-4 bg-muted/50 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted/50 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 bg-muted/50 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTicket) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Ticket Not Found</CardTitle>
            <CardDescription>The requested ticket could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/tickets">Back to Tickets</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAnalysis = async () => {
    setIsAnalysisDialogOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await analyzeTicket({ ticketContent: ticketContext });
      setAnalysisResult(result);
    } catch (error) {
      console.error("AI Ticket Analysis failed:", error);
      setAnalysisResult({
        suggestedCategory: 'N/A',
        suggestedTechnician: 'N/A',
        confidenceLevel: 0,
        reasoning: 'Failed to retrieve AI analysis. Please try again later.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helpers for metric cards
  const getSlaMetric = (dueDate?: string, metDate?: string) => {
    if (!dueDate) return { text: 'Not set', color: 'text-muted-foreground' };
    const met = metDate && !isAfter(parseISO(metDate), parseISO(dueDate));
    if (met) return { text: 'Met', color: 'text-green-600' };
    const breached = !metDate && isAfter(new Date(), parseISO(dueDate));
    if (breached) return { text: 'Breached', color: 'text-red-600' };
    return { text: formatDistanceToNow(parseISO(dueDate), { addSuffix: true }), color: 'text-amber-600' };
  };

  const formatSince = (iso?: string) => {
    if (!iso) return '—';
    const d = parseISO(iso);
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '—';
  };

  const getPriorityTint = (p: Ticket['priority']) => {
    switch (p) {
      case 'Critical': return 'bg-destructive/10 border-destructive/30';
      case 'High': return 'bg-warning/10 border-warning/30';
      case 'Medium': return 'bg-warning/50 border-warning/50';
      case 'Low': return 'bg-success/10 border-success/30';
    }
  };

  const getSlaTint = (color: string) => {
    if (color.includes('success')) return 'bg-success/10 border-success/30';
    if (color.includes('destructive')) return 'bg-destructive/10 border-destructive/30';
    if (color.includes('warning')) return 'bg-warning/10 border-warning/30';
    return 'bg-muted/40 border-muted/40';
  };

  const getStatusStyle = (status: Ticket['status']) => {
    const style: React.CSSProperties = { color: 'white', borderColor: 'transparent' };
    switch (status) {
      case 'Open': style.backgroundColor = 'hsl(var(--warning))'; break;
      case 'In Progress': style.backgroundColor = 'hsl(var(--primary))'; break;
      case 'Resolved': style.backgroundColor = 'hsl(var(--success))'; break;
      case 'Closed': style.backgroundColor = 'hsl(var(--muted-foreground))'; break;
      default: style.backgroundColor = '#6b7280';
    }
    return style;
  };
  
  const handleSummarize = async () => {
    setIsSummaryDialogOpen(true);
    setIsSummarizing(true);
    setSummary('');
    try {
        const result = await summarizeTicket({ ticketContext });
        setSummary(result.summary);
    } catch (error) {
        console.error("AI summary failed:", error);
        setSummary('Failed to retrieve AI summary. Please try again later.');
    } finally {
        setIsSummarizing(false);
    }
  };
  
  const handleGenerateReply = async (replyType: 'acknowledgement' | 'more_info' | 'resolution_confirmation') => {
    setIsGeneratingReply(true);
    setComment('Generating reply...');
    try {
      const result = await generateSuggestedReply({ ticketContext, replyType });
      setComment(result.reply);
    } catch (error) {
      console.error("AI reply generation failed:", error);
      setComment('Failed to generate reply.');
      toast({ variant: 'destructive', title: 'Reply Generation Failed' });
    } finally {
      setIsGeneratingReply(false);
    }
  }
  
  const handleLogTime = async (log: TimeLog) => {
    try {
      setIsLoggingTime(true);
      const res = await fetch(`/api/tickets/${params.id}/time-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hours: log.hours,
          description: log.description,
          isBillable: log.isBillable,
        }),
      });
      if (!res.ok) throw new Error('Failed to log time');
      const updated: Ticket = await res.json();
      setCurrentTicket(updated);
      toast({ title: 'Time logged successfully!' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Failed to log time' });
    } finally {
      setIsLoggingTime(false);
    }
  };

  const updateTicketFields = async (updates: Partial<Omit<Ticket, 'id' | 'createdDate'>>) => {
    try {
      const res = await fetch(`/api/tickets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      const updated: Ticket = await res.json();
      setCurrentTicket(updated);
      return true;
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Ticket update failed' });
      return false;
    }
  };

  const formatUserName = (u: { firstName?: string; lastName?: string; email: string }) => {
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return full || u.email;
  };

  const handlePostComment = async () => {
    if (!comment.trim()) return;
    try {
      setIsPostingComment(true);
      const res = await fetch(`/api/tickets/${params.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: comment.trim() }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      const updated: Ticket = await res.json();
      setCurrentTicket(updated);
      setComment('');
      toast({ title: 'Comment added' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Failed to add comment' });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleSubmitStatusChange = async () => {
    if (!selectedStatus || selectedStatus === currentTicket.status) {
      setIsStatusDialogOpen(false);
      return;
    }
    const ok = await updateTicketFields({ status: selectedStatus as Ticket['status'] });
    if (ok) {
      // Log activity (non-blocking)
      fetch(`/api/tickets/${params.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: `Status changed to ${selectedStatus}` }),
      }).catch(() => {});
      toast({ title: 'Status updated' });
    }
    setIsStatusDialogOpen(false);
  };

  const handleSubmitAssignee = async () => {
    if (!selectedAssignee || selectedAssignee === currentTicket.assignee) {
      setIsAssignDialogOpen(false);
      return;
    }
    const ok = await updateTicketFields({ assignee: selectedAssignee });
    if (ok) {
      fetch(`/api/tickets/${params.id}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: `Assigned to ${selectedAssignee}` }),
      }).catch(() => {});
      toast({ title: 'Technician assigned' });
    }
    setIsAssignDialogOpen(false);
  };


  const getStatusVariant = (status: Ticket['status']) => {
    switch (status) {
      case 'Open': return 'default';
      case 'In Progress': return 'secondary';
      case 'Resolved': return 'default';
      case 'Closed': return 'outline';
      default: return 'outline';
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
  
  const getAvatarForUser = (userName: string) => {
      const initials = userName.split(' ').map(n => n[0]).join('');
      if (userName === 'Alice') return "https://placehold.co/40x40/F87171/FFFFFF.png";
      if (userName === 'Bob') return "https://placehold.co/40x40/60A5FA/FFFFFF.png";
      if (userName === 'Charlie') return "https://placehold.co/40x40/34D399/FFFFFF.png";
      return "https://placehold.co/40x40/A3A3A3/FFFFFF.png";
  }

  return (
    <>
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
                <Button asChild variant="outline" size="icon" className="h-9 w-9 backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/10">
                  <Link href="/tickets"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back to tickets</span></Link>
                </Button>
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-bold font-headline text-foreground">{currentTicket.subject}</h1>
              <Badge 
                variant="outline" 
                style={{
                  backgroundColor: currentTicket.status === 'Open' ? 'hsl(var(--warning))' : 
                                  currentTicket.status === 'In Progress' ? 'hsl(var(--primary))' :
                                  currentTicket.status === 'Resolved' ? 'hsl(var(--success))' :
                                  currentTicket.status === 'Closed' ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
                  color: 'white',
                  borderColor: 'transparent'
                }}
                className="capitalize font-medium"
              >
                {currentTicket.status}
              </Badge>
            </div>
            <p className="text-muted-foreground ml-13 text-sm">
              Ticket <span className="font-mono bg-muted/50 px-2 py-1 rounded">{currentTicket.id}</span> opened by <span className="font-medium text-foreground">{currentTicket.activity[0]?.user || 'Unknown'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white">
                <Mail className="mr-2 h-4 w-4" /> Reply
              </Button>
            </motion.div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" className="backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/10">Convert</Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Convert Ticket To</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={`/change-management/new?title=${encodeURIComponent(currentTicket.subject)}&description=${encodeURIComponent(currentTicket.description)}&clientId=${client?.id || ''}`}>
                        <History className="mr-2 h-4 w-4" /> Change Request
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href={`/incidents/new?title=${encodeURIComponent(currentTicket.subject)}&description=${encodeURIComponent(currentTicket.description)}&clientId=${client?.id || ''}`}>
                        <Flame className="mr-2 h-4 w-4" /> Incident
                    </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ticket Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAnalysis}><Sparkles className="mr-2 h-4 w-4" />AI Insights</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsStatusDialogOpen(true)}><ClipboardList className="mr-2 h-4 w-4" />Change Status</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAssignDialogOpen(true)}><User className="mr-2 h-4 w-4" />Assign Technician</DropdownMenuItem>
                 <DropdownMenuItem><Paperclip className="mr-2 h-4 w-4" />Add Attachment</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
        
        {/* Metric Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className={`backdrop-blur-xl border ${getPriorityTint(currentTicket.priority)} dark:border-white/10`}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Priority</div>
              <div className="mt-1"><Badge variant={getPriorityVariant(currentTicket.priority)}>{currentTicket.priority}</Badge></div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl border bg-primary/10 border-primary/30 dark:border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Ticket Age</div>
              <div className="text-sm font-semibold">{formatSince(currentTicket.createdDate)}</div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl border bg-primary/20 border-primary/40 dark:border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Last Activity</div>
              <div className="text-sm font-semibold">{
                currentTicket.activity && currentTicket.activity.length > 0
                  ? formatSince(currentTicket.activity[currentTicket.activity.length-1].timestamp)
                  : formatSince(currentTicket.lastUpdate)
              }</div>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl border bg-success/10 border-success/30 dark:border-white/10">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Time Logged</div>
              <div className="text-sm font-semibold">
                {((currentTicket.timeLogs || []).reduce((sum, log) => sum + (log.hours || 0), 0)).toFixed(1)}h
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 items-start mt-2">
            <div className="lg:col-span-1 space-y-6">
                <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10">
                    <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                    <CardContent className="divide-y divide-border -mt-2">
                        <DetailRow label="Status" value={<Badge variant={getStatusVariant(currentTicket.status)} style={getStatusStyle(currentTicket.status)}>{currentTicket.status}</Badge>} />
                        <DetailRow label="Priority" value={<Badge variant={getPriorityVariant(currentTicket.priority)} className="border-0" style={{ backgroundColor:
                           currentTicket.priority === 'Critical' ? 'hsl(var(--destructive))' :
                           currentTicket.priority === 'High' ? 'hsl(var(--warning))' :
                           currentTicket.priority === 'Medium' ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                           color: 'white'
                        }}>{currentTicket.priority}</Badge>} />
                        <DetailRow label="Client" value={clientLoading ? 'Loading client...' : (client ? (<Link href={`/clients/${client.id}`} className="font-medium text-primary hover:underline">{client.name}</Link>) : currentTicket.client)} />
                        <DetailRow label="Assignee" value={currentTicket.assignee} icon={User} />
                        <DetailRow label="Created" value={currentTicket.createdDate} icon={Clock} />
                    </CardContent>
                </Card>
                <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10">
                    <CardHeader><CardTitle>SLA Status</CardTitle></CardHeader>
                    <CardContent className="divide-y divide-border -mt-2">
                        <SlaTimer label="Time to Respond" dueDate={currentTicket.sla?.responseDue} metDate={currentTicket.sla?.respondedAt} />
                        <SlaTimer label="Time to Resolve" dueDate={currentTicket.sla?.resolutionDue} metDate={currentTicket.sla?.resolvedAt} />
                    </CardContent>
                </Card>
                <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10">
                  <CardHeader><CardTitle>Associated Assets</CardTitle><CardDescription>Hardware linked to this ticket.</CardDescription></CardHeader>
                  <CardContent>
                     {assetsLoading ? (
                        <div className="text-sm text-muted-foreground py-8">Loading assets...</div>
                      ) : associatedAssets.length > 0 ? (
                        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Type</TableHead><TableHead>Security</TableHead><TableHead><span className="sr-only">View</span></TableHead></TableRow></TableHeader><TableBody>{associatedAssets.map(asset => <AssetRow key={asset.id} asset={asset} />)}</TableBody></Table>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-8"><HardDrive className="mx-auto h-8 w-8 mb-2" />No associated assets.</div>
                      )}
                  </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="activity">Activity &amp; Notes</TabsTrigger>
                        <TabsTrigger value="kb">Knowledge Base</TabsTrigger>
                        <TabsTrigger value="timelogs">Time Logs</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="activity" className="space-y-6">
                        <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10">
                            <CardHeader><CardTitle>Full Description</CardTitle></CardHeader>
                            <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{currentTicket.description}</p></CardContent>
                        </Card>
                        <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Activity Feed</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing}><Bot className="mr-2 h-4 w-4" />Summarize</Button>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {currentTicket.activity.map((item, index) => (
                              <div key={index} className="flex gap-4">
                                 <Avatar><AvatarImage src={getAvatarForUser(item.user)} alt={item.user} data-ai-hint="user avatar" /><AvatarFallback>{item.user.charAt(0)}</AvatarFallback></Avatar>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center"><span className="font-semibold text-sm">{item.user}</span><span className="text-xs text-muted-foreground">{item.timestamp}</span></div>
                                  <div className="p-3 mt-1 rounded-md bg-secondary/50 text-foreground text-sm"><p className="whitespace-pre-wrap">{item.activity}</p></div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                          <CardFooter>
                             <div className="w-full flex gap-4">
                                <Avatar><AvatarImage src="https://placehold.co/40x40.png" alt="Current User" data-ai-hint="user avatar" /><AvatarFallback>U</AvatarFallback></Avatar>
                                <div className="w-full space-y-2">
                                    <Textarea placeholder="Add a comment or internal note..." rows={3} value={comment} onChange={e => setComment(e.target.value)} disabled={isGeneratingReply || isPostingComment} />
                                     <div className="flex justify-end items-center gap-2">
                                       <DropdownMenu>
                                         <DropdownMenuTrigger asChild><Button variant="secondary" size="sm" disabled={isGeneratingReply}><Sparkles className="mr-2 h-4 w-4" /> AI Reply</Button></DropdownMenuTrigger>
                                         <DropdownMenuContent>
                                           <DropdownMenuItem onClick={() => handleGenerateReply('acknowledgement')}>Acknowledge Ticket</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleGenerateReply('more_info')}>Request More Info</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleGenerateReply('resolution_confirmation')}>Confirm Resolution</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                         <Button variant="outline" size="sm" onClick={handlePostComment} disabled={!comment.trim() || isPostingComment}>Add Internal Note</Button>
                                         <Button size="sm" onClick={handlePostComment} disabled={!comment.trim() || isPostingComment}>Reply to Client</Button>
                                     </div>
                                 </div>
                              </div>
                           </CardFooter>
                         </Card>
                    </TabsContent>

                    <TabsContent value="kb">
                        <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10">
                            <CardHeader><CardTitle className="flex items-center gap-2"><BookText className="h-5 w-5" />Knowledge Base</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2 text-primary"><Lightbulb className="h-4 w-4" /> Suggested Articles</h3>
                                <div className="space-y-2">
                                  {isKbLoading ? <p className="text-sm text-muted-foreground">Searching for relevant articles...</p>
                                   : suggestedArticles.length > 0 ? (
                                      suggestedArticles.map(article => (
                                        <Link href={`/knowledge-base/${article.id}`} key={article.id} className="block p-3 rounded-md hover:bg-secondary">
                                          <p className="font-medium">{article.title}</p>
                                          <p className="text-sm text-muted-foreground">{article.category}</p>
                                        </Link>
                                      ))
                                  ) : <p className="text-sm text-muted-foreground">No relevant articles found.</p>}
                                </div>
                              </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                     <TabsContent value="timelogs">
                        <Card className="backdrop-blur-xl bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="space-y-1.5">
                                  <CardTitle>Time Logs</CardTitle>
                                  <CardDescription>Time entries recorded for this ticket.</CardDescription>
                                </div>
                                <TimeLogDialog onLogTime={handleLogTime} />
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Technician</TableHead><TableHead>Hours</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Billable</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {currentTicket.timeLogs && currentTicket.timeLogs.length > 0 ? (
                                            currentTicket.timeLogs.map(log => (
                                                <TableRow key={log.id}>
                                                    <TableCell>{log.technician}</TableCell>
                                                    <TableCell>{log.hours.toFixed(1)}</TableCell>
                                                    <TableCell>{log.date}</TableCell>
                                                    <TableCell>{log.description}</TableCell>
                                                    <TableCell>{log.isBillable ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No time logged for this ticket.</TableCell></TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
      
      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
            <DialogDescription>Select a new status for this ticket.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder={loadingStatuses ? 'Loading...' : 'Select status'} />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((s) => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitStatusChange} disabled={loadingStatuses || !selectedStatus}>Update</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Technician Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
            <DialogDescription>Select a technician to assign to this ticket.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Technician</Label>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger>
                <SelectValue placeholder={loadingUsers ? 'Loading...' : 'Select technician'} />
              </SelectTrigger>
              <SelectContent>
                {orgUsers.map((u) => (
                  <SelectItem key={u.id} value={formatUserName(u)}>{formatUserName(u)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAssignee} disabled={loadingUsers || !selectedAssignee}>Assign</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2 font-headline"><Sparkles className="h-6 w-6 text-primary" />AI Ticket Insights</AlertDialogTitle><AlertDialogDescription>{isAnalyzing ? "Gemini is analyzing the ticket... Please wait." : "Here are the insights based on the ticket content."}</AlertDialogDescription></AlertDialogHeader>
            {isAnalyzing ? ( <div className="flex justify-center items-center h-48"><div className="flex items-center gap-2 text-muted-foreground"><div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div></div></div>)
             : analysisResult && (<div className="text-sm space-y-4"><DetailRow label="Suggested Category" value={<Badge variant="secondary">{analysisResult.suggestedCategory}</Badge>} /><DetailRow label="Suggested Technician" value={<Badge variant="secondary">{analysisResult.suggestedTechnician}</Badge>} /><DetailRow label="Confidence" value={`${(analysisResult.confidenceLevel * 100).toFixed(0)}%`} /><div><h3 className="font-semibold mb-2 text-muted-foreground">Reasoning</h3><p className="p-3 bg-secondary/50 rounded-md">{analysisResult.reasoning}</p></div></div>)}
            <AlertDialogFooter><AlertDialogAction onClick={() => setIsAnalysisDialogOpen(false)}>Close</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    <AlertDialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2 font-headline"><FileText className="h-6 w-6 text-primary" />AI Ticket Summary</AlertDialogTitle><AlertDialogDescription>{isSummarizing ? "Gemini is summarizing the ticket..." : "A quick summary of the ticket."}</AlertDialogDescription></AlertDialogHeader>
            {isSummarizing ? ( <div className="flex justify-center items-center h-48"><div className="flex items-center gap-2 text-muted-foreground"><div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div></div></div>)
             : (<div className="text-sm space-y-2"><ul className="list-disc list-inside text-muted-foreground">{summary.split('\n').map((item, i) => item.length > 1 && <li key={i}>{item.replace(/^- /, '')}</li>)}</ul></div>)}
 
         </AlertDialogContent>
     </AlertDialog>
    </>
  );
}
