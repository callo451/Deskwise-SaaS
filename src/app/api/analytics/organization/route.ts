import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId
    const client = await clientPromise
    const db = client.db('deskwise')

    // Aggregate portfolio-level statistics
    const projects = await db.collection('projects')
      .find({ orgId })
      .toArray()

    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const planningProjects = projects.filter(p => p.status === 'planning').length
    const onHoldProjects = projects.filter(p => p.status === 'on_hold').length

    // Budget calculations
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0)

    // Health calculations
    const projectsWithHealth = await Promise.all(
      projects.map(async (project) => {
        try {
          // Try to get health metrics for each project
          const health = await db.collection('project_health')
            .findOne({ projectId: project._id.toString(), orgId })
          return {
            ...project,
            health: health?.overall?.score || 0,
            healthStatus: health?.overall?.health || 'unknown'
          }
        } catch {
          return { ...project, health: 0, healthStatus: 'unknown' }
        }
      })
    )

    const avgHealthScore = projectsWithHealth.length > 0
      ? Math.round(projectsWithHealth.reduce((sum, p) => sum + p.health, 0) / projectsWithHealth.length)
      : 0

    const onTrackProjects = projectsWithHealth.filter(p => p.healthStatus === 'green').length
    const atRiskProjects = projectsWithHealth.filter(p => p.healthStatus === 'amber').length
    const offTrackProjects = projectsWithHealth.filter(p => p.healthStatus === 'red').length

    // Progress calculations
    const avgCompletionRate = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0

    // Team member calculations (unique team members across all projects)
    const allTeamMembers = new Set()
    projects.forEach(p => {
      if (p.teamMembers && Array.isArray(p.teamMembers)) {
        p.teamMembers.forEach(member => allTeamMembers.add(member))
      }
    })
    const totalTeamMembers = allTeamMembers.size

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        planningProjects,
        onHoldProjects,
        totalBudget,
        totalActualCost,
        budgetVariance: totalBudget > 0 ? ((totalActualCost - totalBudget) / totalBudget) * 100 : 0,
        avgHealthScore,
        onTrackProjects,
        atRiskProjects,
        offTrackProjects,
        totalTeamMembers,
        avgCompletionRate,
        statusBreakdown: {
          planning: planningProjects,
          active: activeProjects,
          on_hold: onHoldProjects,
          completed: completedProjects
        },
        healthDistribution: {
          green: onTrackProjects,
          amber: atRiskProjects,
          red: offTrackProjects
        }
      }
    })
  } catch (error) {
    console.error('Error fetching organization analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
