
'use client';

import {
  Card,
  CardContent,
  CardDescription,
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
import type { Asset, Ticket, Contact, Contract, Client } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { generateClientInsights, type ClientInsightsOutput } from '@/ai/flows/client-insights';
import {
    Activity,
    ArrowUpRight,
    AtSign,
    Building,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    HardDrive,
    Lightbulb,
    Loader2,
    Phone,
    PlusCircle,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Ticket as TicketIcon,
    User,
    Users,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EditClientDialog } from '@/components/clients/edit-client-dialog';
import { Input } from '@/components/ui/input';

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: React.ReactNode, icon?: React.ElementType }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start py-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <div className="font-medium text-right">{value}</div>
    </div>
  );
};

const TicketRow = ({ ticket }: { ticket: Ticket }) => {
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
            <TableCell><Link href={`/tickets/${ticket.id}`} className="font-medium text-primary hover:underline">{ticket.id}</Link></TableCell>
            <TableCell>{ticket.subject}</TableCell>
            <TableCell><Badge variant={getPriorityVariant(ticket.priority)}>{ticket.priority}</Badge></TableCell>
            <TableCell>{ticket.status}</TableCell>
            <TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/tickets/${ticket.id}`}><ChevronRight className="h-4 w-4" /></Link></Button></TableCell>
        </TableRow>
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

const ContactRow = ({ contact }: { contact: Contact }) => (
    <TableRow>
      <TableCell className="font-medium">{contact.name}</TableCell>
      <TableCell>{contact.role}</TableCell>
      <TableCell className="hidden sm:table-cell">{contact.email}</TableCell>
       <TableCell className="hidden md:table-cell">
        {contact.canViewOrgTickets && (
          <Badge variant="secondary" className="flex items-center gap-1.5">
            <Eye className="h-3 w-3" />
            Org Tickets
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right"><Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button></TableCell>
    </TableRow>
);

const ContractRow = ({ contract }: { contract: Contract }) => {
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    return (
        <TableRow>
            <TableCell><Link href={`/billing/${contract.id}`} className="font-medium text-primary hover:underline">{contract.name}</Link></TableCell>
            <TableCell><Badge variant={contract.status === 'Active' ? 'default' : 'secondary'}>{contract.status}</Badge></TableCell>
            <TableCell>{formatCurrency(contract.mrr)}</TableCell>
            <TableCell className="text-right"><Button variant="ghost" size="icon" asChild><Link href={`/billing/${contract.id}`}><ChevronRight className="h-4 w-4" /></Link></Button></TableCell>
        </TableRow>
    );
};


export default function ClientDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  
  const [client, setClient] = useState<Client | null>(null);
  const [associatedTickets, setAssociatedTickets] = useState<Ticket[]>([]);
  const [associatedAssets, setAssociatedAssets] = useState<Asset[]>([]);
  const [associatedContacts, setAssociatedContacts] = useState<Contact[]>([]);
  const [associatedContracts, setAssociatedContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [analysisResult, setAnalysisResult] = useState<ClientInsightsOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [quoteMetrics, setQuoteMetrics] = useState<{ quoteCount: number; totalQuoteValue: number; acceptedQuoteValue: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!params.id) return;
      
      setLoading(true);
      try {
        // Fetch client details
        const clientResponse = await fetch(`/api/clients/${params.id}`);
        if (!clientResponse.ok) {
          throw new Error('Client not found');
        }
        const clientData = await clientResponse.json();
        setClient(clientData);

        // Fetch quote metrics (CRM)
        try {
          const qmRes = await fetch(`/api/clients/${params.id}/quote-metrics`);
          if (qmRes.ok) {
            const qm = await qmRes.json();
            setQuoteMetrics(qm);
          }
        } catch (e) {
          console.warn('Failed to fetch quote metrics', e);
        }

        // Note: For now, we'll keep placeholder data for related entities
        // These would need to be implemented similarly when those modules are converted
        setAssociatedTickets([]);
        setAssociatedAssets([]);
        setAssociatedContacts([]);
        setAssociatedContracts([]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch client');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [params.id]);
  
  const clientStats = useMemo(() => {
    if (!client) return null;
    const openTickets = associatedTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const assetsOnline = associatedAssets.filter(a => a.status === 'Online').length;
    const assetsAtRisk = associatedAssets.filter(a => 'isSecure' in a && !a.isSecure).length;
    return { openTickets, assetsOnline, assetsAtRisk };
  }, [client, associatedTickets, associatedAssets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Client Not Found</CardTitle>
            <CardDescription>{error || 'The requested client could not be found.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/clients">Back to Clients</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAnalysis = async () => {
    if (!clientStats) return;
    
    setIsAnalysisDialogOpen(true);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await generateClientInsights({
        clientName: client.name,
        totalTickets: associatedTickets.length,
        openTickets: clientStats.openTickets,
        overdueTickets: 0, // TODO: Calculate from tickets when tickets module is integrated
        totalAssets: associatedAssets.length,
        assetsAtRisk: clientStats.assetsAtRisk,
        ticketSubjects: associatedTickets.slice(0, 10).map(t => t.subject),
      });
      setAnalysisResult(result);
    } catch (error) {
      console.error("AI Client Analysis failed:", error);
      setAnalysisResult({
        healthStatus: 'At Risk',
        summary: 'Failed to retrieve AI analysis. Please try again later.',
        opportunities: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const getStatusVariant = (status: 'Active' | 'Inactive' | 'Onboarding') => {
    switch (status) {
      case 'Active': return 'default';
      case 'Inactive': return 'destructive';
      case 'Onboarding': return 'secondary';
    }
  };

  const getHealthStatusVariant = (status: ClientInsightsOutput['healthStatus']) => {
    switch (status) {
      case 'Healthy': return 'default';
      case 'Needs Attention': return 'secondary';
      case 'At Risk': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
               <Button asChild variant="outline" size="icon" className="h-8 w-8">
                  <Link href="/clients"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back to clients</span></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">{client.name}</h1>
                <Badge variant={getStatusVariant(client.status)}>{client.status}</Badge>
            </div>
            <p className="text-muted-foreground ml-12">
              <span className="font-medium text-foreground">{client.industry}</span> &bull; Member since 2022
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setEditOpen(true)} variant="outline"><FileText className="mr-2 h-4 w-4" /> Edit Client</Button>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> New Ticket</Button>
            <Button variant="outline" onClick={handleAnalysis}><Sparkles className="mr-2 h-4 w-4" />AI Insights</Button>
          </div>
        </div>

        {/* CRM Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open Tickets</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{client.tickets || 0}</div>
              <p className="text-xs text-muted-foreground">Active service workload</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Contacts</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{client.contacts || 0}</div>
              <p className="text-xs text-muted-foreground">People we support</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Quotes</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quoteMetrics?.quoteCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">Total proposals sent</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Accepted Value</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quoteMetrics?.acceptedQuoteValue ?? 0)}</div>
              <p className="text-xs text-muted-foreground">Closed-won quotes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Client Details</CardTitle></CardHeader>
                    <CardContent className="divide-y divide-border -mt-2">
                        <DetailRow label="Client ID" value={<span className="font-mono">{client.id}</span>} icon={Building} />
                        <DetailRow label="Primary Contact" value={
                            <div className="text-right">
                                <div>{client.mainContact.name}</div>
                                <div className="text-xs text-muted-foreground">{client.mainContact.email}</div>
                            </div>
                        } icon={User} />
                        <DetailRow label="Phone" value={<a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>} icon={Phone} />
                        <DetailRow label="Address" value={<p className="whitespace-pre-line">{client.address}</p>} icon={AtSign} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>At a Glance</CardTitle></CardHeader>
                    <CardContent className="divide-y divide-border -mt-2">
                        <DetailRow label="Open Tickets" value={client.tickets || 0} icon={TicketIcon} />
                        <DetailRow label="Total Contacts" value={client.contacts || 0} icon={Users} />
                        <DetailRow label="Total Assets" value={associatedAssets.length} icon={HardDrive} />
                        <DetailRow label="Security Risks" value={clientStats?.assetsAtRisk || 0} icon={ShieldAlert} />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Tabs defaultValue="tickets" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-6">
                        <TabsTrigger value="tickets">Tickets</TabsTrigger>
                        <TabsTrigger value="assets">Assets</TabsTrigger>
                        <TabsTrigger value="contacts">Contacts</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="tickets">
                        <Card>
                            <CardHeader><CardTitle>Service Tickets</CardTitle><CardDescription>All tickets associated with {client.name}.</CardDescription></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Subject</TableHead><TableHead>Priority</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">View</span></TableHead></TableRow></TableHeader>
                                    <TableBody>{associatedTickets.length > 0 ? associatedTickets.map(t => <TicketRow key={t.id} ticket={t} />) : <TableRow><TableCell colSpan={5} className="text-center h-24">No tickets found. Associated data will be available once the related modules are converted to MongoDB.</TableCell></TableRow>}</TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="assets">
                        <Card>
                            <CardHeader><CardTitle>Managed Assets</CardTitle><CardDescription>All assets managed for {client.name}.</CardDescription></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">View</span></TableHead></TableRow></TableHeader>
                                    <TableBody>{associatedAssets.length > 0 ? associatedAssets.map(a => <AssetRow key={a.id} asset={a} />) : <TableRow><TableCell colSpan={4} className="text-center h-24">No assets found. Associated data will be available once the Assets module is converted to MongoDB.</TableCell></TableRow>}</TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="contacts">
                        <Card>
                            <CardHeader><CardTitle>Contacts</CardTitle><CardDescription>All contacts at {client.name}.</CardDescription></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead className="hidden md:table-cell">Permissions</TableHead><TableHead><span className="sr-only">View</span></TableHead></TableRow></TableHeader>
                                    <TableBody>{associatedContacts.length > 0 ? associatedContacts.map(c => <ContactRow key={c.id} contact={c} />) : <TableRow><TableCell colSpan={5} className="text-center h-24">No contacts found. Associated data will be available once the Contacts module is converted to MongoDB.</TableCell></TableRow>}</TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="billing">
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing & Contracts</CardTitle>
                                <CardDescription>Contracts and billing agreements for {client.name}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Contract</TableHead><TableHead>Status</TableHead><TableHead>MRR</TableHead><TableHead><span className="sr-only">View</span></TableHead></TableRow></TableHeader>
                                    <TableBody>{associatedContracts.length > 0 ? associatedContracts.map(c => <ContractRow key={c.id} contract={c} />) : <TableRow><TableCell colSpan={4} className="text-center h-24">No contracts found. Associated data will be available once the Billing module is converted to MongoDB.</TableCell></TableRow>}</TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </div>
      
       <AlertDialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <AlertDialogContent className="max-w-xl">
            <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 font-headline"><Sparkles className="h-6 w-6 text-primary" />AI Client Insights</AlertDialogTitle>
                <AlertDialogDescription>{isAnalyzing ? "Gemini is analyzing the client data..." : `Analysis for ${client.name}.`}</AlertDialogDescription>
            </AlertDialogHeader>
            {isAnalyzing ? ( <div className="flex justify-center items-center h-48"><div className="flex items-center gap-2 text-muted-foreground"><div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div></div></div>)
             : analysisResult && (
                <div className="text-sm space-y-4 max-h-[60vh] overflow-y-auto pr-4 -mr-2">
                    <div>
                        <h3 className="font-semibold mb-2">Overall Health</h3>
                        <Badge 
                          variant={getHealthStatusVariant(analysisResult.healthStatus)}
                          className={analysisResult.healthStatus === 'Healthy' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}
                        >
                            {analysisResult.healthStatus}
                        </Badge>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Summary</h3>
                        <p className="text-muted-foreground">{analysisResult.summary}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Business Opportunities</h3>
                        <ul className="list-disc list-inside space-y-1.5 text-muted-foreground">
                            {analysisResult.opportunities.map((item, index) => <li key={`opp-${index}`}>{item}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            <AlertDialogFooter><AlertDialogAction onClick={() => setIsAnalysisDialogOpen(false)}>Close</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    <EditClientDialog
      open={editOpen}
      onOpenChange={setEditOpen}
      client={client}
      onSuccess={(updated) => setClient(updated)}
    />
    </>
  );
}
