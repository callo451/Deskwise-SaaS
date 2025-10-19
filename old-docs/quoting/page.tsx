
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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Quote } from '@/lib/types';
import type { QuoteStats } from '@/lib/services/quotes';
import { MoreHorizontal, PlusCircle, ListFilter, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

const QuoteRow = ({ quote, onDelete }: { quote: Quote; onDelete: (id: string) => void }) => {
  const getStatusVariant = (status: Quote['status']) => {
    switch (status) {
      case 'Draft': return 'secondary';
      case 'Sent': return 'default';
      case 'Accepted': return 'outline';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  };
  
  const getStatusStyle = (status: Quote['status']) => {
    if (status === 'Accepted') return { backgroundColor: 'hsl(var(--success))', color: 'hsl(var(--success-foreground))' };
    return {};
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium text-primary hover:underline">{quote.id}</div>
      </TableCell>
      <TableCell>
        <Link href={`/quoting/${quote.id}`} className="font-medium text-primary hover:underline">{quote.subject}</Link>
        <div className="text-sm text-muted-foreground">{quote.clientName}</div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={getStatusVariant(quote.status)} style={getStatusStyle(quote.status)}>{quote.status}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{formatCurrency(quote.total)}</TableCell>
      <TableCell className="hidden md:table-cell">{format(new Date(quote.createdDate), 'PP')}</TableCell>
      <TableCell className="hidden md:table-cell">{format(new Date(quote.expiryDate), 'PP')}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/quoting/${quote.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/quoting/${quote.id}?export=pdf`}>Download PDF</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(quote.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function QuotingPage() {
  const quoteStatuses: Array<Quote['status']> = ['Draft', 'Sent', 'Accepted', 'Rejected'];
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilters(prev =>
      checked ? [...prev, status] : prev.filter(s => s !== status)
    );
  };

  const fetchQuotes = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilters.length > 0) params.set('status', statusFilters.join(','));
      if (search.trim()) params.set('q', search.trim());
      const qs = params.toString();
      const response = await fetch(`/api/quotes${qs ? `?${qs}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      const quotesData = await response.json();
      setQuotes(quotesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quotes');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/quotes/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch quote stats');
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
      await Promise.all([fetchQuotes(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchQuotes();
    }
  }, [statusFilters]);

  // Debounced search
  useEffect(() => {
    if (loading) return;
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => {
      fetchQuotes();
    }, 300);
    setSearchTimer(t);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }

      // Refresh the quotes list
      await Promise.all([fetchQuotes(), fetchStats()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete quote');
    }
  };

  const clearFilters = () => {
    setStatusFilters([]);
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
              <p>Error loading quotes: {error}</p>
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
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalQuotes}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.totalValue.toLocaleString()} total value
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acceptedQuotes}</div>
              <p className="text-xs text-muted-foreground">
                ${stats.acceptedValue.toLocaleString()} value
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.sentQuotes} sent quotes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Quote Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avgQuoteValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                across all quotes
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Quotes</CardTitle>
              <CardDescription>
                Create and manage quotes for your clients.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search subject or client..."
                  className="pl-8 h-8 w-[220px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Filter
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {quoteStatuses.map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={statusFilters.includes(status)}
                      onCheckedChange={checked => handleStatusFilterChange(status, !!checked)}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>Clear Filters</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/quoting/new">
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  New Quote
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Subject / Client</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Total</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Expiry</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No quotes found. Create your first quote to get started.
                  </TableCell>
                </TableRow>
              ) : (
                quotes.map(quote => (
                  <QuoteRow key={quote.id} quote={quote} onDelete={handleDelete} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
