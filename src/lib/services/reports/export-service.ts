/**
 * Export Service
 * Provides data export functionality for analytics and reports
 * Supports CSV, Excel (XLSX), and PDF formats
 */

export type ExportFormat = 'csv' | 'excel' | 'pdf'

export interface ExportOptions {
  format: ExportFormat
  filename?: string
  title?: string
  includeHeaders?: boolean
  dateFormat?: string
}

export interface ExportColumn {
  key: string
  label: string
  type?: 'string' | 'number' | 'date' | 'boolean'
  format?: (value: any) => string
}

/**
 * Export Service
 * Note: This is a basic implementation that generates CSV data.
 * For Excel and PDF export, you would need to install additional packages:
 * - Excel: npm install exceljs
 * - PDF: npm install jspdf jspdf-autotable
 */
export class ExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV(
    data: any[],
    columns: ExportColumn[],
    options: Partial<ExportOptions> = {}
  ): string {
    const { includeHeaders = true } = options

    let csv = ''

    // Add headers
    if (includeHeaders) {
      csv += columns.map((col) => this.escapeCSV(col.label)).join(',') + '\n'
    }

    // Add data rows
    data.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col.key]

        // Apply custom formatter if provided
        if (col.format && value !== null && value !== undefined) {
          return this.escapeCSV(col.format(value))
        }

        // Default formatting by type
        if (value === null || value === undefined) {
          return ''
        }

        if (col.type === 'date' && value instanceof Date) {
          return this.escapeCSV(value.toISOString())
        }

        if (col.type === 'number') {
          return String(value)
        }

        return this.escapeCSV(String(value))
      })

      csv += values.join(',') + '\n'
    })

    return csv
  }

  /**
   * Export data to Excel format (placeholder)
   * To implement: install 'exceljs' package and use it here
   */
  static async exportToExcel(
    data: any[],
    columns: ExportColumn[],
    options: Partial<ExportOptions> = {}
  ): Promise<Buffer> {
    // Placeholder implementation
    // In production, you would use exceljs:
    //
    // const ExcelJS = require('exceljs');
    // const workbook = new ExcelJS.Workbook();
    // const worksheet = workbook.addWorksheet('Report');
    //
    // // Add headers
    // worksheet.columns = columns.map(col => ({
    //   header: col.label,
    //   key: col.key,
    //   width: 15
    // }));
    //
    // // Add data
    // data.forEach(row => worksheet.addRow(row));
    //
    // // Generate buffer
    // return await workbook.xlsx.writeBuffer();

    throw new Error('Excel export not implemented. Install exceljs package.')
  }

  /**
   * Export data to PDF format (placeholder)
   * To implement: install 'jspdf' and 'jspdf-autotable' packages
   */
  static async exportToPDF(
    data: any[],
    columns: ExportColumn[],
    options: Partial<ExportOptions> = {}
  ): Promise<Buffer> {
    // Placeholder implementation
    // In production, you would use jspdf and jspdf-autotable:
    //
    // const { jsPDF } = require('jspdf');
    // require('jspdf-autotable');
    //
    // const doc = new jsPDF();
    //
    // // Add title
    // if (options.title) {
    //   doc.text(options.title, 14, 15);
    // }
    //
    // // Add table
    // doc.autoTable({
    //   head: [columns.map(col => col.label)],
    //   body: data.map(row => columns.map(col => row[col.key])),
    //   startY: options.title ? 25 : 15,
    // });
    //
    // // Generate buffer
    // return Buffer.from(doc.output('arraybuffer'));

    throw new Error('PDF export not implemented. Install jspdf and jspdf-autotable packages.')
  }

  /**
   * Main export method - routes to appropriate format handler
   */
  static async export(
    data: any[],
    columns: ExportColumn[],
    options: ExportOptions
  ): Promise<{ data: string | Buffer; mimeType: string; filename: string }> {
    const filename =
      options.filename ||
      `export-${new Date().toISOString().split('T')[0]}.${options.format}`

    let exportData: string | Buffer
    let mimeType: string

    switch (options.format) {
      case 'csv':
        exportData = this.exportToCSV(data, columns, options)
        mimeType = 'text/csv'
        break

      case 'excel':
        exportData = await this.exportToExcel(data, columns, options)
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break

      case 'pdf':
        exportData = await this.exportToPDF(data, columns, options)
        mimeType = 'application/pdf'
        break

      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }

    return {
      data: exportData,
      mimeType,
      filename,
    }
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Format analytics data for export
   */
  static formatAnalyticsData(
    metrics: any,
    type: 'tickets' | 'incidents' | 'assets' | 'projects' | 'sla'
  ): { data: any[]; columns: ExportColumn[] } {
    let data: any[] = []
    let columns: ExportColumn[] = []

    switch (type) {
      case 'tickets':
        data = [
          {
            metric: 'Total Tickets',
            value: metrics.totalTickets,
          },
          {
            metric: 'Open Tickets',
            value: metrics.openTickets,
          },
          {
            metric: 'Resolved Tickets',
            value: metrics.resolvedTickets,
          },
          {
            metric: 'Avg Resolution Time (hours)',
            value: metrics.avgResolutionTimeHours,
          },
          {
            metric: 'SLA Compliance Rate (%)',
            value: metrics.slaComplianceRate,
          },
          {
            metric: 'Backlog Size',
            value: metrics.backlogSize,
          },
        ]
        columns = [
          { key: 'metric', label: 'Metric', type: 'string' },
          { key: 'value', label: 'Value', type: 'number' },
        ]
        break

      case 'incidents':
        data = [
          {
            metric: 'Active Incidents',
            value: metrics.activeIncidents,
          },
          {
            metric: 'Total Incidents',
            value: metrics.totalIncidents,
          },
          {
            metric: 'MTTR (hours)',
            value: metrics.mttrHours,
          },
          {
            metric: 'MTBF (hours)',
            value: metrics.mtbfHours,
          },
          {
            metric: 'Service Availability (%)',
            value: metrics.serviceAvailability,
          },
        ]
        columns = [
          { key: 'metric', label: 'Metric', type: 'string' },
          { key: 'value', label: 'Value', type: 'number' },
        ]
        break

      case 'assets':
        data = [
          {
            metric: 'Total Assets',
            value: metrics.totalAssets,
          },
          {
            metric: 'Active Assets',
            value: metrics.activeAssets,
          },
          {
            metric: 'Utilization Rate (%)',
            value: metrics.utilizationRate,
          },
          {
            metric: 'Total Asset Value',
            value: metrics.totalAssetValue,
          },
          {
            metric: 'Warranty Expiring Soon',
            value: metrics.warrantyExpiringSoon,
          },
        ]
        columns = [
          { key: 'metric', label: 'Metric', type: 'string' },
          { key: 'value', label: 'Value', type: 'number' },
        ]
        break

      case 'projects':
        data = [
          {
            metric: 'Total Projects',
            value: metrics.totalProjects,
          },
          {
            metric: 'Active Projects',
            value: metrics.activeProjects,
          },
          {
            metric: 'On-Time Delivery Rate (%)',
            value: metrics.onTimeDeliveryRate,
          },
          {
            metric: 'Avg Budget Utilization (%)',
            value: metrics.avgBudgetUtilization,
          },
          {
            metric: 'Total Budget',
            value: metrics.totalBudget,
          },
        ]
        columns = [
          { key: 'metric', label: 'Metric', type: 'string' },
          { key: 'value', label: 'Value', type: 'number' },
        ]
        break

      case 'sla':
        data = [
          {
            metric: 'Overall Compliance Rate (%)',
            value: metrics.overallComplianceRate,
          },
          {
            metric: 'Total Tickets with SLA',
            value: metrics.totalTicketsWithSLA,
          },
          {
            metric: 'SLA Met',
            value: metrics.slaMetTickets,
          },
          {
            metric: 'SLA Breached',
            value: metrics.slaBreachedTickets,
          },
          {
            metric: 'Critical Breaches',
            value: metrics.criticalBreaches,
          },
        ]
        columns = [
          { key: 'metric', label: 'Metric', type: 'string' },
          { key: 'value', label: 'Value', type: 'number' },
        ]
        break
    }

    return { data, columns }
  }
}
