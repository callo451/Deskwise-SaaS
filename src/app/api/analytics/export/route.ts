import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TicketAnalyticsService } from '@/lib/services/analytics/ticket-analytics'
import { IncidentAnalyticsService } from '@/lib/services/analytics/incident-analytics'
import { AssetAnalyticsService } from '@/lib/services/analytics/asset-analytics'
import { ProjectAnalyticsService } from '@/lib/services/analytics/project-analytics'
import { SLAAnalyticsService } from '@/lib/services/analytics/sla-analytics'
import { ExportService, ExportFormat } from '@/lib/services/reports/export-service'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'

/**
 * POST /api/analytics/export
 * Export analytics data in various formats (CSV, Excel, PDF)
 *
 * Body Parameters:
 * - module: 'tickets' | 'incidents' | 'assets' | 'projects' | 'sla'
 * - format: 'csv' | 'excel' | 'pdf'
 * - startDate (optional): ISO date string
 * - endDate (optional): ISO date string
 * - filename (optional): Custom filename
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions - exporting requires reports.export permission
    const hasPermission = await requirePermission(session, 'reports.export')

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('reports.export') },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { module, format, startDate, endDate, filename } = body

    // Validate required parameters
    if (!module || !format) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: module and format',
        },
        { status: 400 }
      )
    }

    if (!['tickets', 'incidents', 'assets', 'projects', 'sla'].includes(module)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid module. Must be: tickets, incidents, assets, projects, or sla',
        },
        { status: 400 }
      )
    }

    if (!['csv', 'excel', 'pdf'].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid format. Must be: csv, excel, or pdf',
        },
        { status: 400 }
      )
    }

    const orgId = session.user.orgId

    // Parse dates if provided
    let start: Date | undefined
    let end: Date | undefined

    if (startDate) {
      start = new Date(startDate)
    }

    if (endDate) {
      end = new Date(endDate)
    }

    // Fetch analytics data based on module
    let analyticsData: any

    switch (module) {
      case 'tickets':
        analyticsData = await TicketAnalyticsService.getOverviewMetrics(
          orgId,
          start,
          end
        )
        break

      case 'incidents':
        analyticsData = await IncidentAnalyticsService.getOverviewMetrics(
          orgId,
          start,
          end
        )
        break

      case 'assets':
        analyticsData = await AssetAnalyticsService.getOverviewMetrics(
          orgId,
          start,
          end
        )
        break

      case 'projects':
        analyticsData = await ProjectAnalyticsService.getOverviewMetrics(
          orgId,
          start,
          end
        )
        break

      case 'sla':
        analyticsData = await SLAAnalyticsService.getOverviewMetrics(
          orgId,
          start,
          end
        )
        break
    }

    // Format data for export
    const { data, columns } = ExportService.formatAnalyticsData(
      analyticsData,
      module
    )

    // Generate export
    const exportResult = await ExportService.export(data, columns, {
      format: format as ExportFormat,
      filename:
        filename ||
        `${module}-analytics-${new Date().toISOString().split('T')[0]}.${format}`,
      title: `${module.charAt(0).toUpperCase() + module.slice(1)} Analytics Report`,
      includeHeaders: true,
    })

    // For CSV, return as text
    if (format === 'csv') {
      return new NextResponse(exportResult.data as string, {
        status: 200,
        headers: {
          'Content-Type': exportResult.mimeType,
          'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
        },
      })
    }

    // For Excel and PDF, return as binary
    return new NextResponse(exportResult.data as Buffer, {
      status: 200,
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
        'Content-Length': (exportResult.data as Buffer).length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error exporting analytics data:', error)

    // Handle specific errors
    if (error.message?.includes('not implemented')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 501 } // Not Implemented
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export analytics data',
      },
      { status: 500 }
    )
  }
}
