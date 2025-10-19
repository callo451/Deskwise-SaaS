import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'

/**
 * GET /api/integrations/myob/company-files
 * Get list of available MYOB company files
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    // Get integration
    const integration = await MYOBIntegrationService.getIntegration(orgId)

    if (!integration) {
      return NextResponse.json({ error: 'MYOB integration not found' }, { status: 404 })
    }

    // Ensure token is valid
    const accessToken = await MYOBIntegrationService.ensureValidToken(integration)

    // Get company files
    const companyFiles = await MYOBIntegrationService.getCompanyFiles(
      require('crypto')
        .createCipheriv('aes-256-gcm', Buffer.alloc(32), Buffer.alloc(16))
        .update(accessToken, 'utf8', 'hex')
    )

    return NextResponse.json({
      success: true,
      companyFiles,
    })
  } catch (error: any) {
    console.error('Get company files error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get company files' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/integrations/myob/company-files
 * Select a company file for the integration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId
    const body = await req.json()
    const { companyFileId, companyFileName, companyFileUri } = body

    if (!companyFileId || !companyFileName) {
      return NextResponse.json(
        { error: 'Company file ID and name are required' },
        { status: 400 }
      )
    }

    // Update integration with selected company file
    await MYOBIntegrationService.saveIntegration(
      orgId,
      {
        companyFileId,
        companyFileName,
        companyFileUri,
      },
      session.user.userId
    )

    return NextResponse.json({
      success: true,
      message: 'Company file selected successfully',
    })
  } catch (error: any) {
    console.error('Select company file error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to select company file' },
      { status: 500 }
    )
  }
}
