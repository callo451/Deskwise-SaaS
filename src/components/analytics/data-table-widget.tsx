'use client'

import { ChartWidget, ChartEmptyState } from './chart-widget'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { useState } from 'react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  align?: 'left' | 'center' | 'right'
}

interface DataTableWidgetProps {
  title: string
  description?: string
  data: any[]
  columns: Column[]
  showRanking?: boolean
  rankingKey?: string
  loading?: boolean
  error?: Error | null
  insight?: string
  insightType?: 'success' | 'warning' | 'danger' | 'info'
  onExport?: () => void
  onRefresh?: () => void
  pageSize?: number
  className?: string
}

export function DataTableWidget({
  title,
  description,
  data,
  columns,
  showRanking = false,
  rankingKey,
  loading = false,
  error = null,
  insight,
  insightType,
  onExport,
  onRefresh,
  pageSize = 10,
  className,
}: DataTableWidgetProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Sort data
  let sortedData = [...data]
  if (sortKey) {
    sortedData.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  } else if (rankingKey) {
    // Default sort by ranking key
    sortedData.sort((a, b) => b[rankingKey] - a[rankingKey])
  }

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const getRankEmoji = (index: number) => {
    const rank = (currentPage - 1) * pageSize + index + 1
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank.toString()
  }

  return (
    <ChartWidget
      title={title}
      description={description}
      loading={loading}
      error={error}
      insight={insight}
      insightType={insightType}
      onExport={onExport}
      onRefresh={onRefresh}
      className={className}
    >
      {data.length === 0 ? (
        <ChartEmptyState />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {showRanking && (
                    <TableHead className="w-12">#</TableHead>
                  )}
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && sortKey === column.key && (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index}>
                    {showRanking && (
                      <TableCell className="font-medium">
                        {getRankEmoji(index)}
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
                {sortedData.length} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 hover:bg-muted"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </ChartWidget>
  )
}

// Helper component for user avatar cell
export function UserCell({ name, email, avatar }: { name: string; email?: string; avatar?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="w-8 h-8">
        <AvatarImage src={avatar} />
        <AvatarFallback>
          {name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium">{name}</div>
        {email && <div className="text-xs text-muted-foreground">{email}</div>}
      </div>
    </div>
  )
}

// Helper component for status badge cell
export function StatusCell({ status }: { status: string }) {
  const variants: Record<string, any> = {
    open: 'default',
    'in-progress': 'secondary',
    resolved: 'success',
    closed: 'outline',
    high: 'destructive',
    medium: 'warning',
    low: 'secondary',
  }

  return (
    <Badge variant={variants[status.toLowerCase()] || 'default'}>
      {status}
    </Badge>
  )
}
