
'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PlusCircle, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';

interface SLATarget {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  response_time_minutes: number;
  resolution_time_minutes: number;
}

interface SLAPolicy {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
  targets: SLATarget[];
}

const SlaPolicyRow = ({ policy, onDelete }: { policy: SLAPolicy; onDelete: (id: string) => void }) => {
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = minutes / 60;
    if (hours < 24) return `${hours} hours`;
    return `${hours / 24} days`;
  };

  const criticalResponse = policy.targets.find(t => t.priority === 'Critical')?.response_time_minutes;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="font-medium">{policy.name}</div>
          {policy.isDefault && (
            <Shield className="h-4 w-4 text-primary" title="Default Policy" />
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {policy.description}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {criticalResponse ? formatMinutes(criticalResponse) : 'N/A'}
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
            <DropdownMenuItem>Edit</DropdownMenuItem>
            {!policy.isDefault && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(policy.id)}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function SlaManagementPage() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/sla-policies');
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      } else {
        throw new Error('Failed to fetch policies');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load SLA policies',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sla-policies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPolicies(prev => prev.filter(p => p.id !== id));
        toast({
          title: 'Success',
          description: 'SLA policy deleted successfully',
        });
      } else {
        throw new Error('Failed to delete policy');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete SLA policy',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">SLA Management</h1>
        <p className="text-muted-foreground">
          Define and manage Service Level Agreements for your clients.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SLA Policies</CardTitle>
              <CardDescription>
                Configure response and resolution time targets for different priority levels.
              </CardDescription>
            </div>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Policy</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No SLA policies found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first SLA policy to define service level agreements.
              </p>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Policy
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy</TableHead>
                  <TableHead className="hidden sm:table-cell">Critical Response Time</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map(policy => (
                  <SlaPolicyRow key={policy.id} policy={policy} onDelete={handleDelete} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
