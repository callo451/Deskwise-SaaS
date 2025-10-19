
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ServiceForm } from '@/components/service-catalogue/service-form';
import { useRouter } from 'next/navigation';
import type { ServiceCatalogueItemExtended } from '@/lib/services/service-catalogue';
import { useSearchParams } from 'next/navigation';

export default function NewServiceItemPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [prefill, setPrefill] = useState<Partial<ServiceCatalogueItemExtended> | undefined>(undefined);
  const searchParams = useSearchParams();

  useEffect(() => {
    const copyId = searchParams.get('copy');
    if (!copyId) return;
    // Load existing service to duplicate
    const load = async () => {
      try {
        const res = await fetch(`/api/service-catalogue/${copyId}`);
        if (res.ok) {
          const data = await res.json();
          // Remove identity fields
          const { id, createdAt, updatedAt, popularity, isActive, lastUsedAt, ...rest } = data;
          setPrefill(rest);
        }
      } catch {}
    };
    load();
  }, [searchParams]);

  const handleSubmit = async (data: Omit<ServiceCatalogueItemExtended, 'id' | 'popularity' | 'isActive' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/service-catalogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create service');
      }

      router.push('/service-catalogue');
    } catch (error) {
      console.error('Failed to create service:', error);
      alert(error instanceof Error ? error.message : 'Failed to create service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/service-catalogue');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/service-catalogue">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">
          New Service Item
        </h1>
      </div>

      <ServiceForm
        service={prefill as any}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </div>
  );
}
