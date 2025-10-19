import { useState, useEffect } from 'react'
import { CannedResponse } from '@/lib/types'

interface UseCannedResponsesOptions {
  category?: string
  search?: string
  isActive?: boolean
  autoFetch?: boolean
}

export function useCannedResponses(options: UseCannedResponsesOptions = {}) {
  const { category, search, isActive, autoFetch = true } = options

  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCannedResponses = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (search) params.append('search', search)
      if (isActive !== undefined) params.append('isActive', String(isActive))

      const response = await fetch(`/api/canned-responses?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setCannedResponses(data.data)
      } else {
        setError(data.error || 'Failed to fetch canned responses')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const createCannedResponse = async (input: {
    name: string
    content: string
    category: string
    tags?: string[]
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/canned-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (data.success) {
        setCannedResponses((prev) => [...prev, data.data])
        return { success: true, data: data.data }
      } else {
        setError(data.error || 'Failed to create canned response')
        return { success: false, error: data.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const updateCannedResponse = async (
    id: string,
    updates: {
      name?: string
      content?: string
      category?: string
      tags?: string[]
      isActive?: boolean
    }
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/canned-responses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        setCannedResponses((prev) =>
          prev.map((cr) => (cr._id.toString() === id ? data.data : cr))
        )
        return { success: true, data: data.data }
      } else {
        setError(data.error || 'Failed to update canned response')
        return { success: false, error: data.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const deleteCannedResponse = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/canned-responses/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setCannedResponses((prev) =>
          prev.filter((cr) => cr._id.toString() !== id)
        )
        return { success: true }
      } else {
        setError(data.error || 'Failed to delete canned response')
        return { success: false, error: data.error }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const useCannedResponse = async (
    id: string,
    variables: Record<string, string | number | undefined>
  ) => {
    try {
      const response = await fetch(`/api/canned-responses/${id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables }),
      })

      const data = await response.json()

      if (data.success) {
        return { success: true, content: data.data.content }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchCannedResponses()
    }
  }, [category, search, isActive, autoFetch])

  return {
    cannedResponses,
    loading,
    error,
    fetchCannedResponses,
    createCannedResponse,
    updateCannedResponse,
    deleteCannedResponse,
    useCannedResponse,
  }
}

export function useCannedResponseCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/canned-responses/categories')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories, loading, fetchCategories }
}

export function useCannedResponseStats() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/canned-responses/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, fetchStats }
}
