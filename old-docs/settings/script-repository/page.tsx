'use client';

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
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { scripts } from '@/lib/placeholder-data';
import type { Script } from '@/lib/types';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const ScriptRow = ({ script }: { script: Script }) => {
  const getLanguageVariant = (language: Script['language']) => {
    switch (language) {
      case 'PowerShell':
        return 'default';
      case 'Bash':
        return 'secondary';
      case 'Python':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <Link href={`/settings/script-repository/${script.id}`} className="font-medium text-primary hover:underline">{script.name}</Link>
        <div className="hidden text-sm text-muted-foreground md:inline ml-2">
          - {script.description}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        <Badge variant={getLanguageVariant(script.language)}>{script.language}</Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{script.createdBy}</TableCell>
      <TableCell className="hidden md:table-cell">{script.lastModified}</TableCell>
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
            <DropdownMenuItem asChild>
                <Link href={`/settings/script-repository/${script.id}`}>View/Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Run</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function ScriptRepositoryPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Script Repository</CardTitle>
            <CardDescription>Manage and generate scripts for automation.</CardDescription>
          </div>
          <Link href="/settings/script-repository/new">
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Script</span>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name / Description</TableHead>
              <TableHead className="hidden sm:table-cell">Language</TableHead>
              <TableHead className="hidden md:table-cell">Created By</TableHead>
              <TableHead className="hidden md:table-cell">Last Modified</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scripts && scripts.length > 0 ? (
              scripts.map(script => (
                <ScriptRow key={script.id} script={script} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No scripts available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
