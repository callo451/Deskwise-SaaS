'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAnalyticsOptions {
  enabled?: boolean
  refetchInterval?: number // Auto-refresh interval in milliseconds
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface UseAnalyticsReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  isRefetching: boolean
}

export function useAnalytics<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn<T> {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isRefetching, setIsRefetching] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(
    async (isRefetch = false) => {
      if (!enabled) return

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()

      try {
        if (isRefetch) {
          setIsRefetching(true)
        } else {
          setLoading(true)
        }
        setError(null)

        // Build query string from params
        const queryParams = new URLSearchParams()
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value))
            }
          })
        }

        const url = queryParams.toString()
          ? `${endpoint}?${queryParams.toString()}`
          : endpoint

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }

        const result = await response.json()
        setData(result)

        if (onSuccess) {
          onSuccess(result)
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            // Request was cancelled, ignore
            return
          }
          setError(err)
          if (onError) {
            onError(err)
          }
        }
      } finally {
        if (isRefetch) {
          setIsRefetching(false)
        } else {
          setLoading(false)
        }
      }
    },
    [endpoint, params, enabled, onSuccess, onError]
  )

  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(true)
      }, refetchInterval)

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [refetchInterval, enabled, fetchData])

  return {
    data,
    loading,
    error,
    refetch,
    isRefetching,
  }
}
