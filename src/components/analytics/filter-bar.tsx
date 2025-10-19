'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, X, Save, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useState } from 'react'
import { FilterState, useFilters } from '@/hooks/use-filters'

interface DateRangePickerProps {
  value?: { from: Date; to: Date; preset?: string }
  onChange: (range: { from: Date; to: Date; preset?: string }) => void
}

function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const presets = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'Last 7 days', value: 'last7days' },
    { label: 'Last 30 days', value: 'last30days' },
    { label: 'This week', value: 'thisWeek' },
    { label: 'This month', value: 'thisMonth' },
    { label: 'Last month', value: 'lastMonth' },
    { label: 'This quarter', value: 'thisQuarter' },
    { label: 'This year', value: 'thisYear' },
  ]

  const handlePreset = (preset: string) => {
    const dates = getPresetDates(preset)
    if (dates) {
      onChange({ ...dates, preset })
      setIsOpen(false)
    }
  }

  const displayText = value
    ? value.preset
      ? presets.find((p) => p.value === value.preset)?.label || 'Custom range'
      : `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d')}`
    : 'Select date range'

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-3 space-y-1">
            <p className="text-sm font-medium mb-2">Quick Select</p>
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => handlePreset(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar (for custom range - simplified) */}
          <div className="p-3">
            <p className="text-sm text-muted-foreground">
              Use quick select or close to enter custom dates
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface FilterBarProps {
  filters: FilterState
  onFilterChange: (key: string, value: any) => void
  onClearFilters: () => void
  departments?: string[]
  statuses?: string[]
  priorities?: string[]
  categories?: string[]
  assignees?: Array<{ id: string; name: string }>
  className?: string
}

export function FilterBar({
  filters,
  onFilterChange,
  onClearFilters,
  departments,
  statuses,
  priorities,
  categories,
  assignees,
  className,
}: FilterBarProps) {
  const hasActiveFilters = Object.keys(filters).length > 0

  const filterCount = Object.values(filters).filter(Boolean).length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Range */}
        <DateRangePicker
          value={filters.dateRange}
          onChange={(range) => onFilterChange('dateRange', range)}
        />

        {/* Department */}
        {departments && (
          <Select
            value={filters.department}
            onValueChange={(value) => onFilterChange('department', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Status */}
        {statuses && (
          <Select
            value={filters.status}
            onValueChange={(value) => onFilterChange('status', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Priority */}
        {priorities && (
          <Select
            value={filters.priority}
            onValueChange={(value) => onFilterChange('priority', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Category */}
        {categories && (
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange('category', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Assignee */}
        {assignees && (
          <Select
            value={filters.assignee}
            onValueChange={(value) => onFilterChange('assignee', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {assignees.map((assignee) => (
                <SelectItem key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear All
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null

            let label = key
            let displayValue = value

            if (key === 'dateRange' && typeof value === 'object') {
              const range = value as any
              label = 'Date'
              displayValue = range.preset
                ? range.preset.replace(/([A-Z])/g, ' $1').trim()
                : `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d')}`
            }

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {label}: {String(displayValue)}
                <button
                  onClick={() => onFilterChange(key, undefined)}
                  className="ml-1 hover:bg-muted rounded-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Helper function to get preset dates
function getPresetDates(preset: string): { from: Date; to: Date } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return { from: today, to: now }

    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return { from: yesterday, to: today }

    case 'last7days':
      const last7 = new Date(today)
      last7.setDate(last7.getDate() - 7)
      return { from: last7, to: now }

    case 'last30days':
      const last30 = new Date(today)
      last30.setDate(last30.getDate() - 30)
      return { from: last30, to: now }

    case 'thisWeek':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      return { from: startOfWeek, to: now }

    case 'thisMonth':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: startOfMonth, to: now }

    case 'lastMonth':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      return { from: lastMonthStart, to: lastMonthEnd }

    case 'thisQuarter':
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
      const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1)
      return { from: startOfQuarter, to: now }

    case 'thisYear':
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return { from: startOfYear, to: now }

    default:
      return null
  }
}
