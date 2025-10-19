import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    // Test MongoDB connection
    const client = await clientPromise
    const db = client.db('deskwise')

    // Ping the database
    await db.command({ ping: 1 })

    return NextResponse.json({
      success: true,
      message: 'Deskwise ITSM Platform is running',
      database: 'Connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Health check failed',
        database: 'Disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
