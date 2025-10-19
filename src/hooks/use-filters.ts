'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export interface FilterState {
  dateRange?: {
    from: Date
    to: Date
    preset?: string
  }
  department?: string
  status?: string
  priority?: string
  assignee?: string
  category?: string
  [key: string]: any
}

interface FilterPreset {
  id: string
  name: string
  filters: FilterState
}

export function useFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Parse initial filters from URL
  const getInitialFilters = useCallback((): FilterState => {
    const filters: FilterState = {}

    // Parse date range
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const preset = searchParams.get('preset')

    if (from && to) {
      filters.dateRange = {
        from: new Date(from),
        to: new Date(to),
        preset: preset || undefined,
      }
    } else if (preset) {
      // Apply preset
      const presetDates = getPresetDates(preset)
      if (presetDates) {
        filters.dateRange = {
          ...presetDates,
          preset,
        }
      }
    }

    // Parse other filters
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignee = searchParams.get('assignee')
    const category = searchParams.get('category')

    if (department) filters.department = department
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (assignee) filters.assignee = assignee
    if (category) filters.category = category

    return filters
  }, [searchParams])

  const [filters, setFilters] = useState<FilterState>(getInitialFilters)
  const [presets, setPresets] = useState<FilterPreset[]>([])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (filters.dateRange) {
      if (filters.dateRange.preset) {
        params.set('preset', filters.dateRange.preset)
      } else {
        params.set('from', filters.dateRange.from.toISOString())
        params.set('to', filters.dateRange.to.toISOString())
      }
    }

    if (filters.department) params.set('department', filters.department)
    if (filters.status) params.set('status', filters.status)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.assignee) params.set('assignee', filters.assignee)
    if (filters.category) params.set('category', filters.category)

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname

    router.replace(url, { scroll: false })
  }, [filters, pathname, router])

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  const savePreset = useCallback((name: string) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
    }

    setPresets((prev) => [...prev, preset])

    // Save to localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analytics-filter-presets')
      const existing = saved ? JSON.parse(saved) : []
      localStorage.setItem(
        'analytics-filter-presets',
        JSON.stringify([...existing, preset])
      )
    }
  }, [filters])

  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setFilters(preset.filters)
    }
  }, [presets])

  const deletePreset = useCallback((presetId: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== presetId))

    // Remove from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analytics-filter-presets')
      if (saved) {
        const existing = JSON.parse(saved)
        const filtered = existing.filter((p: FilterPreset) => p.id !== presetId)
        localStorage.setItem('analytics-filter-presets', JSON.stringify(filtered))
      }
    }
  }, [])

  // Load presets from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('analytics-filter-presets')
      if (saved) {
        setPresets(JSON.parse(saved))
      }
    }
  }, [])

  return {
    filters,
    updateFilter,
    clearFilters,
    savePreset,
    loadPreset,
    deletePreset,
    presets,
  }
}

// Helper function to get preset date ranges
function getPresetDates(
  preset: string
): { from: Date; to: Date } | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return {
        from: today,
        to: now,
      }

    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        from: yesterday,
        to: today,
      }

    case 'last7days':
      const last7 = new Date(today)
      last7.setDate(last7.getDate() - 7)
      return {
        from: last7,
        to: now,
      }

    case 'last30days':
      const last30 = new Date(today)
      last30.setDate(last30.getDate() - 30)
      return {
        from: last30,
        to: now,
      }

    case 'thisWeek':
      const startOfWeek = new Date(today)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      return {
        from: startOfWeek,
        to: now,
      }

    case 'thisMonth':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        from: startOfMonth,
        to: now,
      }

    case 'lastMonth':
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      return {
        from: lastMonthStart,
        to: lastMonthEnd,
      }

    case 'thisQuarter':
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
      const startOfQuarter = new Date(today.getFullYear(), quarterStartMonth, 1)
      return {
        from: startOfQuarter,
        to: now,
      }

    case 'thisYear':
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return {
        from: startOfYear,
        to: now,
      }

    default:
      return null
  }
}
