'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Image } from 'lucide-react'
import { useExport, ExportFormat } from '@/hooks/use-export'

interface ExportMenuProps {
  data: any
  filename?: string
  title?: string
  headers?: string[]
  formats?: ExportFormat[]
  onExport?: (format: ExportFormat) => void
}

export function ExportMenu({
  data,
  filename = 'export',
  title,
  headers,
  formats = ['pdf', 'excel', 'csv', 'png'],
  onExport,
}: ExportMenuProps) {
  const { exportData, exporting, exportFormat } = useExport()

  const handleExport = async (format: ExportFormat) => {
    if (onExport) {
      onExport(format)
    } else {
      await exportData(format, data, { filename, title, headers })
    }
  }

  const formatIcons = {
    pdf: FileText,
    excel: FileSpreadsheet,
    csv: FileText,
    png: Image,
  }

  const formatLabels = {
    pdf: 'Export as PDF',
    excel: 'Export as Excel',
    csv: 'Export as CSV',
    png: 'Export as Image',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {formats.map((format) => {
          const Icon = formatIcons[format]
          const isExporting = exporting && exportFormat === format

          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
            >
              <Icon className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : formatLabels[format]}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
