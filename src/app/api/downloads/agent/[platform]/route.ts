import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Platform mapping to binary file names
const PLATFORM_FILES: Record<string, string> = {
  'windows': 'deskwise-agent-windows-amd64.exe',
  'linux-amd64': 'deskwise-agent-linux-amd64',
  'linux-arm64': 'deskwise-agent-linux-arm64',
  'darwin-amd64': 'deskwise-agent-darwin-amd64',
  'darwin-arm64': 'deskwise-agent-darwin-arm64',
}

// Platform display names for Content-Disposition header
const PLATFORM_DISPLAY_NAMES: Record<string, string> = {
  'windows': 'deskwise-agent-windows-amd64.exe',
  'linux-amd64': 'deskwise-agent-linux-amd64',
  'linux-arm64': 'deskwise-agent-linux-arm64',
  'darwin-amd64': 'deskwise-agent-darwin-amd64',
  'darwin-arm64': 'deskwise-agent-darwin-arm64',
}

/**
 * GET /api/downloads/agent/[platform]
 *
 * Download the Deskwise monitoring agent binary for the specified platform.
 *
 * Supported platforms:
 * - windows: Windows x64
 * - linux-amd64: Linux x64
 * - linux-arm64: Linux ARM64
 * - darwin-amd64: macOS Intel
 * - darwin-arm64: macOS Apple Silicon
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing platform
 * @returns Binary file stream with appropriate headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params

    // Validate platform
    if (!platform || !PLATFORM_FILES[platform]) {
      return NextResponse.json(
        {
          error: 'Invalid platform',
          message: `Platform must be one of: ${Object.keys(PLATFORM_FILES).join(', ')}`
        },
        { status: 400 }
      )
    }

    // Get the binary file name
    const fileName = PLATFORM_FILES[platform]
    const displayName = PLATFORM_DISPLAY_NAMES[platform]

    // Construct the absolute path to the binary
    // The agent/builds directory is in the project root
    const projectRoot = process.cwd()
    const filePath = join(projectRoot, 'agent', 'builds', fileName)

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json(
        {
          error: 'File not found',
          message: `Binary file for platform '${platform}' not found. Please ensure the agent has been built.`
        },
        { status: 404 }
      )
    }

    // Read the binary file
    const fileBuffer = await readFile(filePath)

    // Create response with binary data
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${displayName}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'X-Platform': platform,
      },
    })

    return response
  } catch (error) {
    console.error('Error downloading agent binary:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to download agent binary. Please try again later.'
      },
      { status: 500 }
    )
  }
}

/**
 * HEAD /api/downloads/agent/[platform]
 *
 * Check if the agent binary exists for the specified platform without downloading it.
 * Useful for validation before initiating a download.
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing platform
 * @returns Response with headers but no body
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params

    // Validate platform
    if (!platform || !PLATFORM_FILES[platform]) {
      return new NextResponse(null, { status: 400 })
    }

    // Get the binary file name and path
    const fileName = PLATFORM_FILES[platform]
    const displayName = PLATFORM_DISPLAY_NAMES[platform]
    const projectRoot = process.cwd()
    const filePath = join(projectRoot, 'agent', 'builds', fileName)

    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse(null, { status: 404 })
    }

    // Get file stats for Content-Length
    const { statSync } = require('fs')
    const stats = statSync(filePath)

    // Return headers without body
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${displayName}"`,
        'Content-Length': stats.size.toString(),
        'X-Platform': platform,
      },
    })
  } catch (error) {
    console.error('Error checking agent binary:', error)
    return new NextResponse(null, { status: 500 })
  }
}
