'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { QuoteToContractDialog } from '@/components/billing/quote-to-contract-dialog';
import type { Quote, Contract } from '@/lib/types';
import { Download, ChevronLeft, CheckCircle2, Send, FileSignature, Loader2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const subtotal = useMemo(() => (quote ? quote.lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0) : 0), [quote]);
  const tax = useMemo(() => subtotal * 0.08, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!params.id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/quotes/${params.id}`);
        if (!res.ok) throw new Error('Quote not found');
        const data = await res.json();
        setQuote(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch quote');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [params.id]);

  useEffect(() => {
    // Auto-export PDF when navigated from list with export=pdf
    if (searchParams?.get('export') === 'pdf' && quote) {
      handleExportPDF();
    }
  }, [searchParams, quote]);

  const handleUpdateStatus = async (newStatus: Quote['status']) => {
    if (!quote) return;
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setQuote(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    if (!confirm('Delete this quote?')) return;
    try {
      const res = await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/quoting');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete quote');
    }
  };

  const handleExportPDF = async () => {
    const node = document.getElementById('quote-pdf');
    if (!node) return;
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let y = 40;
    pdf.addImage(imgData, 'PNG', 40, y, imgWidth, imgHeight);
    pdf.save(`Quote-${quote?.id}.pdf`);
  };

  const getStatusVariant = (status: Quote['status']) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Sent': return 'default';
      case 'Accepted': return 'outline';
      case 'Rejected': return 'destructive';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Quote Not Found</CardTitle>
            <CardDescription>{error || 'The requested quote could not be found.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/quoting">Back to Quotes</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon"><Link href="/quoting"><ChevronLeft className="h-4 w-4" /></Link></Button>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Quote {quote.id}</h1>
        <Badge variant={getStatusVariant(quote.status)}>{quote.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card id="quote-pdf" className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{quote.subject}</span>
                <span className="text-sm text-muted-foreground">Expiry: {new Date(quote.expiryDate).toLocaleDateString()}</span>
              </CardTitle>
              <CardDescription>Client: {quote.clientName}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quote.lineItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{item.type}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.price)}</TableCell>
                      <TableCell>{formatCurrency(item.quantity * item.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between font-semibold text-lg pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage quote lifecycle and billing handoff.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleExportPDF}><FileDown className="h-4 w-4 mr-2" />Export PDF</Button>
                <Button variant="outline" onClick={() => handleUpdateStatus('Sent')}><Send className="h-4 w-4 mr-2" />Mark Sent</Button>
                <Button variant="outline" onClick={() => handleUpdateStatus('Accepted')}><CheckCircle2 className="h-4 w-4 mr-2" />Mark Accepted</Button>
                <Button variant="outline" onClick={() => handleUpdateStatus('Rejected')}>Mark Rejected</Button>
              </div>
              <Separator />
              <QuoteToContractDialog
                quote={quote}
                onConvert={async (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>) => {
                  setIsConverting(true);
                  try {
                    const res = await fetch('/api/billing', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contract),
                    });
                    if (!res.ok) throw new Error('Failed to create contract');
                    await handleUpdateStatus('Accepted');
                    router.push('/billing');
                  } catch (e) {
                    alert(e instanceof Error ? e.message : 'Failed to create contract');
                  } finally {
                    setIsConverting(false);
                  }
                }}
                trigger={<Button className="w-full"><FileSignature className="h-4 w-4 mr-2" />Convert to Contract</Button>}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild><Link href="/quoting">Back</Link></Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
