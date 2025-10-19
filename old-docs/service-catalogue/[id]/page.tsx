
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ArchiveRestore, Trash2 } from 'lucide-react';
import { ServiceForm } from '@/components/service-catalogue/service-form';
import { useRouter, useParams } from 'next/navigation';
import type { ServiceCatalogueItemExtended } from '@/lib/services/service-catalogue';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function EditServiceItemPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(true);
  const [service, setService] = useState<ServiceCatalogueItemExtended | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/service-catalogue/${id}`);
        if (!res.ok) throw new Error('Failed to load service');
        const data = await res.json();
        setService(data);
      } catch (e) {
        toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to load service', variant: 'destructive' });
      } finally {
        setLoadingService(false);
      }
    };
    if (id) load();
  }, [id, toast]);

  const handleSubmit = async (
    data: Omit<ServiceCatalogueItemExtended, 'id' | 'popularity' | 'isActive' | 'createdAt' | 'updatedAt'>
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/service-catalogue/${id}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update service');
      }

      toast({ title: 'Saved', description: 'Service updated successfully.' });
      router.push('/service-catalogue');
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to update service', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveOrRestore = async () => {
    if (!service) return;
    setIsLoading(true);
    try {
      if (service.isActive) {
        const res = await fetch(`/api/service-catalogue/${service.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to archive service');
        toast({ title: 'Archived', description: 'Service archived.' });
      } else {
        const res = await fetch(`/api/service-catalogue/${service.id}/restore`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to restore service');
        toast({ title: 'Restored', description: 'Service restored.' });
      }
      router.refresh();
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Operation failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/service-catalogue');
  };

  if (loadingService) {
    return (
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/service-catalogue">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Loading...</h1>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/service-catalogue">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Service not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon">
            <Link href="/service-catalogue">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline">
              Edit Service
            </h1>
            <div className="mt-1">
              {service.isActive ? (
                <Badge variant="secondary">Active</Badge>
              ) : (
                <Badge variant="destructive">Archived</Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant={service.isActive ? 'outline' : 'default'} onClick={handleArchiveOrRestore} disabled={isLoading}>
          {service.isActive ? (
            <>
              <Trash2 className="h-4 w-4 mr-2" /> Archive
            </>
          ) : (
            <>
              <ArchiveRestore className="h-4 w-4 mr-2" /> Restore
            </>
          )}
        </Button>
      </div>

      <ServiceForm
        service={service}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
