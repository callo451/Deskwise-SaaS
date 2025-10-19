
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
import type { Contract, DashboardStat } from '@/lib/types';
import type { BillingStats } from '@/lib/services/billing';
import { PlusCircle, Activity, ArrowUpRight, ArrowDownRight, ChevronRight, ListFilter, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { ContractFormDialog } from '@/components/billing/contract-form-dialog';
import { Input } from '@/components/ui/input';

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
              isIncrease ? 'text-success' : 'text-destructive'
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


const ContractRow = ({ contract, onDelete }: { contract: Contract; onDelete: (id: string) => void }) => {
  const getStatusVariant = (status: Contract['status']) => {
    switch (status) {
      case 'Active':
        return 'default';
      case 'Expired':
        return 'destructive';
      case 'Pending':
        return 'secondary';
      default:
        return 'outline';
    }
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
        <Link href={`/billing/${contract.id}`} className="font-medium text-primary hover:underline">{contract.name}</Link>
        <div className="text-sm text-muted-foreground">
          {contract.id}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{contract.clientName}</TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant={getStatusVariant(contract.status)}>{contract.status}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{formatCurrency(contract.mrr)}</TableCell>
      <TableCell className="hidden md:table-cell">{new Date(contract.endDate).toLocaleDateString()}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/billing/${contract.id}`}>View Details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Generate Invoice</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onDelete(contract.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function BillingPage() {
  const contractStatuses: Array<Contract['status']> = ['Active', 'Expired', 'Pending'];
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContractForm, setShowContractForm] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setStatusFilters(prev =>
      checked ? [...prev, status] : prev.filter(s => s !== status)
    );
  };

  const fetchContracts = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilters.length > 0) params.set('status', statusFilters.join(','));
      if (search.trim()) params.set('clientName', search.trim());
      const qs = params.toString();
      const response = await fetch(`/api/billing${qs ? `?${qs}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      const contractsData = await response.json();
      setContracts(contractsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contracts');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/billing/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch billing stats');
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
      await Promise.all([fetchContracts(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchContracts();
    }
  }, [statusFilters]);

  // Debounced search
  useEffect(() => {
    if (loading) return;
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => fetchContracts(), 300);
    setSearchTimer(t);
    return () => clearTimeout(t);
  }, [search]);

  const handleDelete = async (contractId: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) {
      return;
    }

    try {
      const response = await fetch(`/api/billing/${contractId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete contract');
      }

      // Refresh the contracts list
      await Promise.all([fetchContracts(), fetchStats()]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contract');
    }
  };

  const clearFilters = () => {
    setStatusFilters([]);
  };

  const handleCreateContract = async (contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      if (!response.ok) {
        throw new Error('Failed to create contract');
      }

      // Refresh contracts and stats
      await Promise.all([fetchContracts(), fetchStats()]);
    } catch (error) {
      console.error('Failed to create contract:', error);
      throw error;
    }
  };

  // Convert stats to dashboard stats format
  const getDashboardStats = (): DashboardStat[] => {
    if (!stats) return [];
    
    return [
      {
        title: "Total MRR",
        value: `$${stats.totalMRR.toLocaleString()}`,
        change: "",
        changeType: "increase" as const,
        description: "monthly recurring revenue"
      },
      {
        title: "Active Contracts",
        value: stats.activeContracts.toString(),
        change: "",
        changeType: "increase" as const,
        description: "currently active"
      },
      {
        title: "Pending Renewals",
        value: stats.pendingRenewals.toString(),
        change: "",
        changeType: "increase" as const,
        description: "in the next 30 days"
      },
      {
        title: "Total ARR",
        value: `$${stats.totalAnnualValue.toLocaleString()}`,
        change: "",
        changeType: "increase" as const,
        description: "annual recurring revenue"
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
            <div className="text-center text-destructive">
              <p>Error loading contracts: {error}</p>
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
        {getDashboardStats().map(stat => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>Manage recurring billing and service contracts.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search by client..."
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
                  {contractStatuses.map(status => (
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
              <ContractFormDialog
                onSave={handleCreateContract}
                open={showContractForm}
                onOpenChange={setShowContractForm}
                trigger={
                  <Button size="sm" className="gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Contract</span>
                  </Button>
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract / ID</TableHead>
                <TableHead className="hidden sm:table-cell">Client</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">MRR</TableHead>
                <TableHead className="hidden md:table-cell">End Date</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No contracts found. Create your first contract to get started.
                  </TableCell>
                </TableRow>
              ) : (
                contracts.map(contract => (
                  <ContractRow key={contract.id} contract={contract} onDelete={handleDelete} />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
