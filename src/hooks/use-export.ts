'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'png'

interface ExportOptions {
  filename?: string
  title?: string
  headers?: string[]
}

export function useExport() {
  const [exporting, setExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null)

  const exportData = useCallback(
    async (
      format: ExportFormat,
      data: any,
      options: ExportOptions = {}
    ) => {
      setExporting(true)
      setExportFormat(format)

      try {
        const response = await fetch('/api/analytics/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format,
            data,
            options,
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || 'Export failed')
        }

        // Get the blob from response
        const blob = await response.blob()

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Set filename with extension
        const extension = format === 'excel' ? 'xlsx' : format
        const filename = options.filename || `export_${Date.now()}`
        link.download = `${filename}.${extension}`

        // Trigger download
        document.body.appendChild(link)
        link.click()

        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast.success(`Export completed successfully`)
      } catch (error) {
        console.error('Export error:', error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to export data'
        )
        throw error
      } finally {
        setExporting(false)
        setExportFormat(null)
      }
    },
    []
  )

  const exportChart = useCallback(
    async (
      chartElement: HTMLElement,
      filename: string = 'chart'
    ) => {
      setExporting(true)
      setExportFormat('png')

      try {
        // Use html2canvas for chart export
        const html2canvas = (await import('html2canvas')).default

        const canvas = await html2canvas(chartElement, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
        })

        // Convert to blob
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to create image')
          }

          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${filename}.png`

          document.body.appendChild(link)
          link.click()

          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          toast.success('Chart exported successfully')
        })
      } catch (error) {
        console.error('Chart export error:', error)
        toast.error('Failed to export chart')
        throw error
      } finally {
        setExporting(false)
        setExportFormat(null)
      }
    },
    []
  )

  return {
    exportData,
    exportChart,
    exporting,
    exportFormat,
  }
}
