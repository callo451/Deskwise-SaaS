
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSidebar } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const incidentSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters.'),
  clientId: z.string().optional(),
  status: z.enum(['Investigating', 'Identified', 'Monitoring', 'Resolved']),
  initialUpdate: z.string().min(10, 'An initial update message is required.'),
  affectedServices: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

export default function NewIncidentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isInternalITMode } = useSidebar();
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (!res.ok) return;
        const data = await res.json();
        const minimal = (Array.isArray(data) ? data : []).map((c: any) => ({ id: c.id, name: c.name }))
          .filter((c: any) => c.id && c.name);
        setClients(minimal);
      } catch (e) {
        console.error('Failed to load clients', e);
      }
    };
    const loadServices = async () => {
      try {
        const res = await fetch('/api/service-catalogue?isActive=true');
        if (!res.ok) return;
        const data = await res.json();
        const names = (Array.isArray(data) ? data : []).map((s: any) => s.name).filter((n: any) => typeof n === 'string');
        setServices(Array.from(new Set(names)).sort());
      } catch (e) {
        console.error('Failed to load services', e);
      }
    };
    if (!isInternalITMode) {
      loadClients();
    }
    loadServices();
  }, [isInternalITMode]);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: searchParams.get('title') || '',
      clientId: searchParams.get('clientId') || 'all',
      status: 'Investigating',
      initialUpdate: searchParams.get('description') || '',
      affectedServices: [],
      isPublished: false,
    },
  });

  const onSubmit = async (data: IncidentFormValues) => {
    try {
      const incidentData = {
        title: data.title,
        status: data.status,
        affectedServices: data.affectedServices ?? [],
        affectedClients: data.clientId && data.clientId !== 'all' ? [data.clientId] : ['All'],
        isPublished: !!data.isPublished,
        startedAt: new Date().toISOString(),
        initialUpdate: {
          message: data.initialUpdate,
        },
      };

      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      if (response.ok) {
        const createdIncident = await response.json();
        toast({
          title: 'Incident Declared',
          description: `Incident "${data.title}" has been created successfully.`,
        });
        router.push(`/incidents/${createdIncident.id}`);
      } else {
        throw new Error('Failed to create incident');
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      toast({
        title: 'Error',
        description: 'Failed to create incident. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <a href="/incidents"><ChevronLeft className="h-4 w-4" /></a>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Declare New Incident</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
              <CardDescription>Describe the service disruption and its impact.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Email Service Disruption for All Clients" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                          <SelectItem value="Investigating">Investigating</SelectItem>
                          <SelectItem value="Identified">Identified</SelectItem>
                          <SelectItem value="Monitoring">Monitoring</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent></Select>
                      <FormMessage />
                    </FormItem>
                )} />
                {!isInternalITMode && (
                  <FormField control={form.control} name="clientId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Affected Client (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All Clients" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Clients</SelectItem>
                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />
                )}
              </div>

              <FormField
                control={form.control}
                name="affectedServices"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Affected Services</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-auto min-h-10">
                          <div className="flex gap-1 flex-wrap">
                            {field.value && field.value.length > 0
                              ? field.value.map(svc => <Badge variant="secondary" key={svc}>{svc}</Badge>)
                              : 'Select services...'}
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search services..." />
                          <CommandList>
                            <CommandEmpty>No services found.</CommandEmpty>
                            <CommandGroup>
                              {(services.length > 0 ? services : ['Email Hosting','Microsoft 365','Internet','VPN','Internal Network','Deskwise Application']).map(service => (
                                <CommandItem key={service} onSelect={() => {
                                  const current = Array.isArray(field.value) ? field.value : [];
                                  const next = current.includes(service)
                                    ? current.filter((s: string) => s !== service)
                                    : [...current, service];
                                  field.onChange(next);
                                }}>
                                  <CheckCircle className={cn('mr-2 h-4 w-4', Array.isArray(field.value) && field.value.includes(service) ? 'opacity-100' : 'opacity-0')} />
                                  {service}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between py-1">
                      <Label htmlFor="visibility" className="text-sm">Visibility</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{field.value ? 'Published' : 'Internal'}</span>
                        <Switch id="visibility" checked={!!field.value} onCheckedChange={field.onChange} />
                      </div>
                    </div>
                    <FormDescription>
                      When published, this incident appears on the client status page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialUpdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Update Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide an initial update for the timeline and status page." {...field} rows={5} />
                    </FormControl>
                    <FormDescription>
                        This will be the first entry in the incident timeline.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Declare Incident</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
