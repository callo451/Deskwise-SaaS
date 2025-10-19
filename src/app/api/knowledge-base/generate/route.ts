import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateArticle, generateTroubleshootingGuide, generateFAQ } from '@/ai/genkit'
import { z } from 'zod'

const generateSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  type: z.enum(['article', 'troubleshooting', 'faq']).optional(),
  context: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = generateSchema.parse(body)

    let content: string

    switch (validatedData.type) {
      case 'troubleshooting':
        content = await generateTroubleshootingGuide(validatedData.prompt)
        break
      case 'faq':
        content = await generateFAQ(validatedData.prompt)
        break
      default:
        content = await generateArticle(validatedData.prompt, validatedData.context)
    }

    return NextResponse.json({
      success: true,
      data: { content },
      message: 'Article generated successfully',
    })
  } catch (error) {
    console.error('Generate article error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate article' },
      { status: 500 }
    )
  }
}
