import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import archiver from 'archiver'
import { Readable } from 'stream'
import path from 'path'
import fs from 'fs'

/**
 * GET /api/downloads/extension
 * Download the Deskwise Knowledge Recorder Chrome extension
 *
 * Production: Redirect to Chrome Web Store
 * Development: Download extension files as ZIP
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login to download the extension' },
        { status: 401 }
      )
    }

    // Production check - if Chrome Web Store ID exists, redirect there
    const CHROME_STORE_ID = process.env.CHROME_EXTENSION_ID
    const IS_PRODUCTION = process.env.NODE_ENV === 'production' && CHROME_STORE_ID

    if (IS_PRODUCTION) {
      // Redirect to Chrome Web Store
      return NextResponse.redirect(
        `https://chrome.google.com/webstore/detail/${CHROME_STORE_ID}`
      )
    }

    // Development mode - create and download ZIP
    const extensionPath = path.join(process.cwd(), 'extension', 'deskwise-recorder')

    // Check if extension directory exists
    if (!fs.existsSync(extensionPath)) {
      return NextResponse.json(
        { error: 'Extension files not found' },
        { status: 404 }
      )
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Add all files from extension directory
    archive.directory(extensionPath, false)

    // Finalize the archive
    await archive.finalize()

    // Convert archive to buffer
    const chunks: Buffer[] = []
    archive.on('data', (chunk: Buffer) => chunks.push(chunk))

    await new Promise((resolve, reject) => {
      archive.on('end', resolve)
      archive.on('error', reject)
    })

    const buffer = Buffer.concat(chunks)

    // Return ZIP file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="deskwise-recorder-extension.zip"',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error downloading extension:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download extension' },
      { status: 500 }
    )
  }
}
