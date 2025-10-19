import { NextRequest, NextResponse } from 'next/server'
import { IncidentService } from '@/lib/services/incidents'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const incidents = await IncidentService.getPublicIncidents(orgId)

    return NextResponse.json({
      success: true,
      data: incidents,
    })
  } catch (error) {
    console.error('Get public incidents error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch public incidents' },
      { status: 500 }
    )
  }
}
