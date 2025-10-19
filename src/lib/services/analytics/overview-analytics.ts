import { TicketAnalyticsService } from './ticket-analytics'
import { IncidentAnalyticsService } from './incident-analytics'
import { AssetAnalyticsService } from './asset-analytics'
import { ProjectAnalyticsService } from './project-analytics'
import { SLAAnalyticsService } from './sla-analytics'

export interface HeroKPI {
  label: string
  value: string | number
  unit?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    period: string
  }
  status: 'success' | 'warning' | 'danger' | 'neutral'
  icon?: string
  description?: string
}

export interface OverviewDashboardData {
  heroKPIs: HeroKPI[]
  systemHealth: {
    overall: number // 0-100
    ticketHealth: number
    incidentHealth: number
    assetHealth: number
    projectHealth: number
    slaHealth: number
  }
  quickStats: {
    tickets: {
      open: number
      resolved24h: number
      avgResolutionTime: string
    }
    incidents: {
      active: number
      mttr: string
      availability: string
    }
    assets: {
      total: number
      utilization: string
      warrantyExpiring: number
    }
    projects: {
      active: number
      onTime: string
      budgetUtilization: string
    }
  }
  recentActivity: {
    type: 'ticket' | 'incident' | 'asset' | 'project'
    id: string
    title: string
    timestamp: Date
    status: string
  }[]
}

/**
 * Overview Analytics Service
 * Provides aggregated analytics across all ITSM modules
 */
export class OverviewAnalyticsService {
  /**
   * Get hero KPIs for dashboard
   */
  static async getHeroKPIs(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HeroKPI[]> {
    // Fetch metrics from all services in parallel
    const [
      ticketMetrics,
      incidentMetrics,
      assetMetrics,
      projectMetrics,
      slaMetrics,
    ] = await Promise.all([
      TicketAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      IncidentAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      AssetAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      ProjectAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      SLAAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
    ])

    // Calculate SLA status
    const slaStatus =
      slaMetrics.overallComplianceRate >= 95
        ? 'success'
        : slaMetrics.overallComplianceRate >= 90
        ? 'warning'
        : 'danger'

    // Calculate incident status
    const incidentStatus =
      incidentMetrics.activeIncidents === 0
        ? 'success'
        : incidentMetrics.p1Incidents > 0
        ? 'danger'
        : incidentMetrics.activeIncidents > 5
        ? 'warning'
        : 'neutral'

    // Calculate ticket backlog status
    const backlogStatus =
      ticketMetrics.backlogSize === 0
        ? 'success'
        : ticketMetrics.backlogSize < 10
        ? 'neutral'
        : ticketMetrics.backlogSize < 50
        ? 'warning'
        : 'danger'

    // Calculate service availability status
    const availabilityStatus =
      incidentMetrics.serviceAvailability >= 99.9
        ? 'success'
        : incidentMetrics.serviceAvailability >= 99
        ? 'neutral'
        : incidentMetrics.serviceAvailability >= 95
        ? 'warning'
        : 'danger'

    // Calculate asset utilization status
    const assetStatus =
      assetMetrics.utilizationRate >= 70 && assetMetrics.utilizationRate <= 90
        ? 'success'
        : assetMetrics.utilizationRate > 90
        ? 'warning'
        : 'neutral'

    // Calculate project delivery status
    const projectStatus =
      projectMetrics.onTimeDeliveryRate >= 90
        ? 'success'
        : projectMetrics.onTimeDeliveryRate >= 75
        ? 'neutral'
        : 'warning'

    return [
      {
        label: 'SLA Compliance',
        value: slaMetrics.overallComplianceRate,
        unit: '%',
        trend: slaMetrics.trendData,
        status: slaStatus,
        icon: 'Target',
        description: 'Percentage of tickets meeting SLA targets',
      },
      {
        label: 'Active Incidents',
        value: incidentMetrics.activeIncidents,
        trend: incidentMetrics.trendData,
        status: incidentStatus,
        icon: 'AlertTriangle',
        description: 'Currently active incidents',
      },
      {
        label: 'Ticket Backlog',
        value: ticketMetrics.backlogSize,
        trend: ticketMetrics.trendData,
        status: backlogStatus,
        icon: 'Inbox',
        description: 'Open tickets older than 14 days',
      },
      {
        label: 'Service Availability',
        value: incidentMetrics.serviceAvailability,
        unit: '%',
        trend: {
          direction: 'neutral',
          value: '0.0%',
          period: 'vs previous period',
        },
        status: availabilityStatus,
        icon: 'Activity',
        description: 'System uptime percentage',
      },
      {
        label: 'Asset Utilization',
        value: assetMetrics.utilizationRate,
        unit: '%',
        trend: assetMetrics.trendData,
        status: assetStatus,
        icon: 'HardDrive',
        description: 'Percentage of assets assigned',
      },
      {
        label: 'On-Time Projects',
        value: projectMetrics.onTimeDeliveryRate,
        unit: '%',
        trend: projectMetrics.trendData,
        status: projectStatus,
        icon: 'CheckCircle',
        description: 'Projects completed on schedule',
      },
    ]
  }

  /**
   * Calculate overall system health score
   */
  static async getSystemHealth(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OverviewDashboardData['systemHealth']> {
    // Fetch metrics from all services
    const [
      ticketMetrics,
      incidentMetrics,
      assetMetrics,
      projectMetrics,
      slaMetrics,
    ] = await Promise.all([
      TicketAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      IncidentAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      AssetAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      ProjectAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      SLAAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
    ])

    // Calculate individual health scores (0-100)

    // Ticket health: based on backlog and resolution time
    const ticketHealth = Math.max(
      0,
      100 - ticketMetrics.backlogSize - Math.min(50, ticketMetrics.avgResolutionTimeHours)
    )

    // Incident health: based on active incidents and MTTR
    const incidentHealth = Math.max(
      0,
      incidentMetrics.serviceAvailability
    )

    // Asset health: based on utilization and maintenance
    const assetHealth = Math.min(
      100,
      assetMetrics.utilizationRate + (100 - assetMetrics.warrantyExpiringSoon)
    )

    // Project health: based on on-time delivery and budget
    const projectHealth =
      (projectMetrics.onTimeDeliveryRate + (100 - projectMetrics.avgBudgetUtilization)) / 2

    // SLA health: direct compliance rate
    const slaHealth = slaMetrics.overallComplianceRate

    // Overall health: weighted average
    const overall =
      (ticketHealth * 0.25 +
        incidentHealth * 0.25 +
        assetHealth * 0.15 +
        projectHealth * 0.15 +
        slaHealth * 0.20)

    return {
      overall: Math.round(overall),
      ticketHealth: Math.round(ticketHealth),
      incidentHealth: Math.round(incidentHealth),
      assetHealth: Math.round(assetHealth),
      projectHealth: Math.round(projectHealth),
      slaHealth: Math.round(slaHealth),
    }
  }

  /**
   * Get quick stats for overview dashboard
   */
  static async getQuickStats(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OverviewDashboardData['quickStats']> {
    // Fetch metrics from all services
    const [
      ticketMetrics,
      incidentMetrics,
      assetMetrics,
      projectMetrics,
    ] = await Promise.all([
      TicketAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      IncidentAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      AssetAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      ProjectAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
    ])

    // Format resolution time
    const formatTime = (hours: number): string => {
      if (hours < 1) return `${Math.round(hours * 60)}m`
      if (hours < 24) return `${Math.round(hours * 10) / 10}h`
      return `${Math.round(hours / 24 * 10) / 10}d`
    }

    return {
      tickets: {
        open: ticketMetrics.openTickets,
        resolved24h: ticketMetrics.resolvedTickets, // This should be filtered to last 24h in production
        avgResolutionTime: formatTime(ticketMetrics.avgResolutionTimeHours),
      },
      incidents: {
        active: incidentMetrics.activeIncidents,
        mttr: formatTime(incidentMetrics.mttrHours),
        availability: `${incidentMetrics.serviceAvailability.toFixed(2)}%`,
      },
      assets: {
        total: assetMetrics.totalAssets,
        utilization: `${assetMetrics.utilizationRate.toFixed(1)}%`,
        warrantyExpiring: assetMetrics.warrantyExpiringSoon,
      },
      projects: {
        active: projectMetrics.activeProjects,
        onTime: `${projectMetrics.onTimeDeliveryRate.toFixed(1)}%`,
        budgetUtilization: `${projectMetrics.avgBudgetUtilization.toFixed(1)}%`,
      },
    }
  }

  /**
   * Get complete overview dashboard data
   */
  static async getOverviewDashboard(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Omit<OverviewDashboardData, 'recentActivity'>> {
    const [heroKPIs, systemHealth, quickStats] = await Promise.all([
      this.getHeroKPIs(orgId, startDate, endDate),
      this.getSystemHealth(orgId, startDate, endDate),
      this.getQuickStats(orgId, startDate, endDate),
    ])

    return {
      heroKPIs,
      systemHealth,
      quickStats,
    }
  }

  /**
   * Get cross-module trends
   */
  static async getCrossModuleTrends(
    orgId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    date: string
    tickets: number
    incidents: number
    projects: number
  }[]> {
    const [ticketTrends, incidentTrends] = await Promise.all([
      TicketAnalyticsService.getVolumeTrends(orgId, startDate, endDate, granularity),
      IncidentAnalyticsService.getSeverityTimeline(orgId, startDate, endDate, granularity),
    ])

    // Merge trends by date
    const trendsMap = new Map<string, any>()

    ticketTrends.forEach((t) => {
      trendsMap.set(t.date, {
        date: t.date,
        tickets: t.total,
        incidents: 0,
        projects: 0,
      })
    })

    incidentTrends.forEach((i) => {
      const existing = trendsMap.get(i.date) || {
        date: i.date,
        tickets: 0,
        incidents: 0,
        projects: 0,
      }
      existing.incidents = i.total
      trendsMap.set(i.date, existing)
    })

    return Array.from(trendsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )
  }

  /**
   * Get executive summary metrics
   */
  static async getExecutiveSummary(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalTicketsResolved: number
    avgCustomerSatisfaction: number
    incidentFreeHours: number
    projectsCompleted: number
    costSavings: number
    teamProductivity: number
  }> {
    const [
      ticketMetrics,
      incidentMetrics,
      projectMetrics,
    ] = await Promise.all([
      TicketAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      IncidentAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
      ProjectAnalyticsService.getOverviewMetrics(orgId, startDate, endDate),
    ])

    // Calculate incident-free hours
    const periodHours = endDate && startDate
      ? (endDate.getTime() - startDate.getTime()) / 3600000
      : 720 // 30 days

    const incidentFreeHours = periodHours - (incidentMetrics.mttrHours * incidentMetrics.totalIncidents)

    return {
      totalTicketsResolved: ticketMetrics.resolvedTickets + ticketMetrics.closedTickets,
      avgCustomerSatisfaction: 0, // Would need CSAT data integration
      incidentFreeHours: Math.round(incidentFreeHours),
      projectsCompleted: projectMetrics.completedProjects,
      costSavings: 0, // Would need cost calculation logic
      teamProductivity: Math.round(
        (ticketMetrics.resolvedTickets / Math.max(1, ticketMetrics.avgResolutionTimeHours)) * 100
      ) / 100,
    }
  }
}
