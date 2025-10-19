
'use client';

import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Contract, Asset, TimeLog } from '@/lib/types';
import {
  FileText,
  DollarSign,
  Calendar,
  ChevronLeft,
  Link as LinkIcon,
  ChevronRight,
  HardDrive,
  Clock,
  Loader2,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ContractFormDialog } from '@/components/billing/contract-form-dialog';
import { TimeLogFormDialog } from '@/components/billing/time-log-form-dialog';
import { InvoiceManagement } from '@/components/billing/invoice-management';

const DetailRow = ({ label, value, icon: Icon }: { label: string; value?: React.ReactNode, icon?: React.ElementType }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </div>
      <div className="font-medium text-right">{value}</div>
    </div>
  );
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};



export default function ContractDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTimeLogForm, setShowTimeLogForm] = useState(false);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/billing/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Contract not found');
            return;
          }
          throw new Error('Failed to fetch contract');
        }
        const contractData = await response.json();
        setContract(contractData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch contract');
      } finally {
        setLoading(false);
      }
    };

    const fetchTimeLogs = async () => {
      try {
        const response = await fetch(`/api/billing/${params.id}/time-logs`);
        if (response.ok) {
          const timeLogsData = await response.json();
          setTimeLogs(timeLogsData);
        }
      } catch (err) {
        console.error('Failed to fetch time logs:', err);
      }
    };

    fetchContract();
    fetchTimeLogs();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Contract Not Found</CardTitle>
            <CardDescription>{error || 'The requested contract could not be found.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/billing">Back to Billing</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const handleGenerateInvoice = async () => {
    try {
      const response = await fetch(`/api/billing/${contract.id}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          billingPeriodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          billingPeriodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const invoice = await response.json();
      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoice.invoiceNumber} for ${contract.name} has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateContract = async (contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`/api/billing/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        throw new Error('Failed to update contract');
      }

      const updatedContract = await response.json();
      setContract(updatedContract);
      toast({
        title: "Contract Updated",
        description: "Contract has been successfully updated.",
      });
    } catch (error) {
      console.error('Failed to update contract:', error);
      throw error;
    }
  };

  const handleCreateTimeLog = async (timeLogData: Omit<TimeLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`/api/billing/${contract.id}/time-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeLogData),
      });

      if (!response.ok) {
        throw new Error('Failed to log time');
      }

      const newTimeLog = await response.json();
      setTimeLogs(prev => [newTimeLog, ...prev]);
      toast({
        title: "Time Logged",
        description: "Time entry has been successfully logged.",
      });
    } catch (error) {
      console.error('Failed to log time:', error);
      throw error;
    }
  };

  const getStatusVariant = (status: Contract['status']) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Expired': return 'destructive';
      case 'Pending': return 'secondary';
    }
  };

  return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
               <Button asChild variant="outline" size="icon" className="h-8 w-8">
                  <Link href="/billing"><ChevronLeft className="h-4 w-4" /><span className="sr-only">Back to billing</span></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">{contract.name}</h1>
                <Badge variant={getStatusVariant(contract.status)}>{contract.status}</Badge>
            </div>
            <p className="text-muted-foreground ml-12">
              For <Link href={`/clients/${contract.clientId}`} className="font-medium text-primary hover:underline">{contract.clientName}</Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ContractFormDialog
              contract={contract}
              onSave={handleUpdateContract}
              open={showEditForm}
              onOpenChange={setShowEditForm}
              trigger={<Button variant="outline">Edit Contract</Button>}
            />
            <Button onClick={handleGenerateInvoice}>Generate Invoice</Button>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Contract Details</CardTitle></CardHeader>
                    <CardContent className="divide-y divide-border -mt-2">
                        <DetailRow label="Monthly Recurring Revenue" value={formatCurrency(contract.mrr)} icon={DollarSign} />
                        <DetailRow label="Term Start Date" value={new Date(contract.startDate).toLocaleDateString()} icon={Calendar} />
                        <DetailRow label="Term End Date" value={new Date(contract.endDate).toLocaleDateString()} icon={Calendar} />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/>Recurring Services</CardTitle>
                        <CardDescription>Services included in this contract's monthly recurring revenue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Service</TableHead><TableHead>Qty</TableHead><TableHead>Rate</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {contract.services.map(s => (
                                    <TableRow key={s.id}>
                                        <TableCell>
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-xs text-muted-foreground">{s.description}</div>
                                        </TableCell>
                                        <TableCell>{s.quantity}</TableCell>
                                        <TableCell>{formatCurrency(s.rate)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(s.total)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5"/>Time Logs</CardTitle>
                            <CardDescription>Billable hours and work performed for this contract.</CardDescription>
                        </div>
                        <TimeLogFormDialog
                            contractId={contract.id}
                            onSave={handleCreateTimeLog}
                            open={showTimeLogForm}
                            onOpenChange={setShowTimeLogForm}
                            trigger={
                                <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Log Time
                                </Button>
                            }
                        />
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Technician</TableHead>
                                    <TableHead>Hours</TableHead>
                                    <TableHead className="hidden md:table-cell">Category</TableHead>
                                    <TableHead>Billable</TableHead>
                                    <TableHead>Description</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {timeLogs.length > 0 ? (
                                    timeLogs.map(timeLog => (
                                        <TableRow key={timeLog.id}>
                                            <TableCell>{new Date(timeLog.date).toLocaleDateString()}</TableCell>
                                            <TableCell>{timeLog.technician}</TableCell>
                                            <TableCell>{timeLog.hours}h</TableCell>
                                            <TableCell className="hidden md:table-cell">{(timeLog as any).category ? (<Badge variant="outline">{(timeLog as any).category}</Badge>) : null}</TableCell>
                                            <TableCell>
                                                <Badge variant={timeLog.isBillable ? 'default' : 'secondary'}>
                                                    {timeLog.isBillable ? 'Yes' : 'No'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{timeLog.description}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No time logs recorded yet. Click "Log Time" to add an entry.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                
                <InvoiceManagement 
                    contractId={contract.id} 
                    contractName={contract.name} 
                />
            </div>
        </div>
      </div>
  );
}
