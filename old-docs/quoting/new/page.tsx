
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, PlusCircle, Trash2, DollarSign, Loader2 } from 'lucide-react';
import type { Client, ServiceCatalogueItem } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const lineItemSchema = z.object({
  serviceId: z.string().min(1),
  name: z.string(),
  description: z.string(),
  type: z.enum(['Fixed', 'Recurring', 'Hourly']),
  quantity: z.coerce.number().min(1),
  price: z.coerce.number().min(0),
});

const quoteSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  clientId: z.string().min(1, 'Please select a client.'),
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected']),
  lineItems: z.array(lineItemSchema).min(1, 'Quote must have at least one line item.'),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
};

export default function NewQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [serviceSearchOpen, setServiceSearchOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceCatalogueItems, setServiceCatalogueItems] = useState<ServiceCatalogueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      subject: '',
      clientId: '',
      status: 'Draft',
      lineItems: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsResponse, servicesResponse] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/service-catalogue')
        ]);

        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData);
        }

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          setServiceCatalogueItems(servicesData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load clients and services. Please refresh the page.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);
  
  // Preselect a service from service catalogue when coming from "Add to Quote"
  useEffect(() => {
    const serviceId = searchParams.get('serviceId');
    if (!serviceId || serviceCatalogueItems.length === 0 || fields.length > 0) return;
    const svc = serviceCatalogueItems.find(s => s.id === serviceId);
    if (svc) {
      append({
        serviceId: svc.id,
        name: svc.name,
        description: svc.description,
        type: svc.type,
        quantity: 1,
        price: svc.price,
      });
    }
  }, [searchParams, serviceCatalogueItems, append, fields.length]);
  
  const watchLineItems = form.watch('lineItems');
  const total = watchLineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const addServiceToQuote = (serviceId: string) => {
    const service = serviceCatalogueItems.find(s => s.id === serviceId);
    if (service) {
      append({
        serviceId: service.id,
        name: service.name,
        description: service.description,
        type: service.type,
        quantity: 1,
        price: service.price,
      });
    }
    setServiceSearchOpen(false);
  }

  const onSubmit = async (data: QuoteFormValues) => {
    setSubmitting(true);
    try {
      // Get client name
      const selectedClient = clients.find(c => c.id === data.clientId);
      if (!selectedClient) {
        throw new Error('Selected client not found');
      }

      const quoteData = {
        ...data,
        clientName: selectedClient.name
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quote');
      }

      const quote = await response.json();
      
      toast({
        title: 'Quote Created',
        description: `Quote "${data.subject}" has been created successfully.`,
      });
      
      router.push('/quoting');
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create quote',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/quoting">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">New Quote</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Quote Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Subject</FormLabel><FormControl><Input placeholder="e.g., Q3 Managed Services Proposal" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="clientId" render={({ field }) => (
                        <FormItem><FormLabel>Client</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger></FormControl><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                    )}/>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Line Items</CardTitle>
                    <CardDescription>Add services to this quote from your service catalogue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-2/5">Service</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <p className="font-medium">{field.name}</p>
                                        <p className="text-xs text-muted-foreground">{field.description}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" {...form.register(`lineItems.${index}.quantity`)} className="w-20"/>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="number" {...form.register(`lineItems.${index}.price`)} className="w-24"/>
                                    </TableCell>
                                    <TableCell>{formatCurrency(watchLineItems[index].quantity * watchLineItems[index].price)}</TableCell>
                                    <TableCell>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {fields.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No line items yet. Add a service to get started.
                        </div>
                    )}
                    <div className="mt-4">
                        <Popover open={serviceSearchOpen} onOpenChange={setServiceSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Service</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search services..." />
                                    <CommandList>
                                        <CommandEmpty>No services found.</CommandEmpty>
                                        <CommandGroup>
                                            {serviceCatalogueItems.map((service) => (
                                                <CommandItem key={service.id} onSelect={() => addServiceToQuote(service.id)}>
                                                    {service.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end bg-secondary/50 p-4 font-semibold text-lg">
                    <div className="flex items-center gap-4">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </CardFooter>
            </Card>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/quoting')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Quote'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
