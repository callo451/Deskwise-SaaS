
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import type { ServiceCatalogueItemExtended } from '@/lib/services/service-catalogue';
import { MoreHorizontal, PlusCircle, ListFilter, Loader2, RefreshCw, Database, Search, Upload } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ServiceStatsDashboard } from '@/components/service-catalogue/service-stats-dashboard';

const ServiceItemRow = ({
  item,
  onDelete,
  onRestore,
}: {
  item: ServiceCatalogueItemExtended;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
}) => {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'Recurring': return 'default';
      case 'Fixed': return 'secondary';
      case 'Hourly': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <TableRow className={!item.isActive ? 'opacity-50' : ''}>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-2">
            {item.name}
            {!item.isActive && <Badge variant="destructive" className="text-xs">Deleted</Badge>}
          </div>
          {item.tags && item.tags.length > 0 && (
            <div className="flex gap-1">
              {item.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
              ))}
              {item.tags.length > 3 && <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">{item.description}</div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant="secondary">{item.category}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={getTypeVariant(item.type)}>{item.type}</Badge>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <div className="space-y-1">
          <div>{formatCurrency(item.price)}</div>
          {item.setupFee && item.setupFee > 0 && (
            <div className="text-xs text-muted-foreground">
              +{formatCurrency(item.setupFee)} setup
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <div className="text-sm text-muted-foreground">
          {item.popularity} uses
        </div>
      </TableCell>
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
              <Link href={`/service-catalogue/${item.id}`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/service-catalogue/new?copy=${item.id}`}>Duplicate</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/quoting/new?serviceId=${item.id}`}>Add to Quote</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {item.isActive ? (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onRestore(item.id)}>
                Restore
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function ServiceCataloguePage() {
  const [services, setServices] = useState<ServiceCatalogueItemExtended[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const { toast } = useToast();
  
  const serviceTypes = ['Fixed', 'Recurring', 'Hourly'];
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchServices();
    fetchCategories();
    fetchTags();
  }, [showDeleted, debouncedSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ isActive: (!showDeleted).toString() });
      if (debouncedSearch) params.set('search', debouncedSearch);
      
      const response = await fetch(`/api/service-catalogue?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      const servicesData = await response.json();
      setServices(servicesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/service-catalogue/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/service-catalogue/tags');
      if (response.ok) {
        const tagsData = await response.json();
        setTags(tagsData);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  };

  const seedServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/service-catalogue/seed', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to seed services');
      }
      
      await fetchServices();
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed services');
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      // Soft confirmation UX via toast with undo would be better, but proceed for now
      const response = await fetch(`/api/service-catalogue/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }
      toast({ title: 'Service archived', description: 'The service has been moved to deleted.' });
      await fetchServices();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete service', variant: 'destructive' });
    }
  };

  const handleRestore = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/service-catalogue/${serviceId}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore service');
      }
      toast({ title: 'Service restored', description: 'The service is active again.' });
      await fetchServices();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to restore service', variant: 'destructive' });
    }
  };

  const handleCategoryFilterChange = (category: string, checked: boolean) => {
    setCategoryFilters(prev =>
      checked ? [...prev, category] : prev.filter(c => c !== category)
    );
  };

  const handleTypeFilterChange = (type: string, checked: boolean) => {
    setTypeFilters(prev =>
      checked ? [...prev, type] : prev.filter(t => t !== type)
    );
  };

  const handleTagFilterChange = (tag: string, checked: boolean) => {
    setTagFilters(prev =>
      checked ? [...prev, tag] : prev.filter(t => t !== tag)
    );
  };

  const clearFilters = () => {
    setCategoryFilters([]);
    setTypeFilters([]);
    setTagFilters([]);
  };

  const filteredItems = useMemo(() => {
    return services.filter(item => {
      const categoryMatch = categoryFilters.length === 0 || categoryFilters.includes(item.category);
      const typeMatch = typeFilters.length === 0 || typeFilters.includes(item.type);
      const tagMatch = tagFilters.length === 0 || (item.tags || []).some(t => tagFilters.includes(t));
      return categoryMatch && typeMatch && tagMatch;
    });
  }, [services, categoryFilters, typeFilters, tagFilters]);

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
              <p>Error loading services: {error}</p>
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
      {/* Insights Dashboard */}
      <ServiceStatsDashboard />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Service Catalogue
                <Badge variant="outline">{filteredItems.length} services</Badge>
              </CardTitle>
              <CardDescription>
                Manage your standardized service offerings.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  className="pl-8 h-7 w-[200px] md:w-[260px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
                className="h-7"
              >
                {showDeleted ? 'Show Active' : 'Show Deleted'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchServices}
                className="h-7"
                disabled={loading}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1"
                onClick={() => {
                  // Simple CSV export of current filtered items
                  const headers = ['Name','Description','Category','Type','Price','Setup Fee','Tags'];
                  const rows = filteredItems.map(i => [
                    i.name,
                    (i.description || '').replaceAll('\n',' '),
                    i.category,
                    i.type,
                    i.price,
                    i.setupFee ?? '',
                    (i.tags || []).join('|')
                  ]);
                  const csv = [headers, ...rows].map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v}"` : v).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'service-catalogue.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Upload className="h-3.5 w-3.5" />
                Export
              </Button>
              {services.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={seedServices}
                  className="h-7 gap-1"
                  disabled={loading}
                >
                  <Database className="h-3.5 w-3.5" />
                  Seed Services
                </Button>
              )}
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
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map(cat => (
                    <DropdownMenuCheckboxItem
                      key={cat}
                      checked={categoryFilters.includes(cat)}
                      onCheckedChange={checked => handleCategoryFilterChange(cat, !!checked)}
                    >
                      {cat}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {serviceTypes.map(type => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={typeFilters.includes(type)}
                      onCheckedChange={checked => handleTypeFilterChange(type, !!checked)}
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tags.map(tag => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={tagFilters.includes(tag)}
                      onCheckedChange={checked => handleTagFilterChange(tag, !!checked)}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>Clear Filters</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/service-catalogue/new">
                <Button size="sm" className="gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  New Service
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Popularity</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {services.length === 0 
                      ? (
                        <div className="space-y-3">
                          <p>No services found.</p>
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="outline" size="sm" onClick={seedServices} disabled={loading}>
                              <Database className="h-3.5 w-3.5 mr-1" /> Seed Services
                            </Button>
                            <Link href="/service-catalogue/new">
                              <Button size="sm">
                                <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Service
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        'No services match the current filters. Try adjusting your filters or clearing them.'
                      )
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                  <ServiceItemRow 
                    key={item.id} 
                    item={item} 
                    onDelete={handleDelete}
                    onRestore={handleRestore}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
