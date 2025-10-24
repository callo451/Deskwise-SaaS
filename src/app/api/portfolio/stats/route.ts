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

    // Fetch all projects for the organization
    const projects = await db.collection('projects')
      .find({ orgId })
      .toArray()

    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length

    // Budget calculations
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    const actualSpend = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0)

    // Fetch health data for all projects
    const projectsWithHealth = await Promise.all(
      projects.map(async (project) => {
        try {
          const health = await db.collection('project_health')
            .findOne({ projectId: project._id.toString(), orgId })
          return {
            ...project,
            healthStatus: health?.overall?.health || 'unknown'
          }
        } catch {
          return { ...project, healthStatus: 'unknown' }
        }
      })
    )

    // Health distribution
    const greenProjects = projectsWithHealth.filter(p => p.healthStatus === 'green').length
    const amberProjects = projectsWithHealth.filter(p => p.healthStatus === 'amber').length
    const redProjects = projectsWithHealth.filter(p => p.healthStatus === 'red').length

    // Average progress calculation
    const averageProgress = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalBudget,
        actualSpend,
        healthDistribution: {
          green: greenProjects,
          amber: amberProjects,
          red: redProjects
        },
        averageProgress
      }
    })
  } catch (error) {
    console.error('Error fetching portfolio stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio stats' },
      { status: 500 }
    )
  }
}
