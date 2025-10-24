'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  Lightbulb,
  TrendingUp,
  Tag,
  ExternalLink,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface AISuggestion {
  id: string
  title: string
  content: string
  confidence: 'high' | 'medium' | 'low'
  type: 'resolution' | 'kb_article' | 'similar_ticket'
}

interface AIInsightsPanelProps {
  ticketId: string
  ticketTitle: string
  ticketDescription: string
  ticketCategory: string
}

export function AIInsightsPanel({
  ticketId,
  ticketTitle,
  ticketDescription,
  ticketCategory
}: AIInsightsPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [autoTags, setAutoTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Record<string, 'helpful' | 'not_helpful'>>({})

  useEffect(() => {
    // Simulate AI suggestions loading
    // In production, this would call the Gemini API
    const timer = setTimeout(() => {
      setSuggestions([
        {
          id: '1',
          title: 'Check System Logs',
          content: 'Based on similar tickets, checking system logs often reveals the root cause. Navigate to Event Viewer > Application Logs.',
          confidence: 'high',
          type: 'resolution'
        },
        {
          id: '2',
          title: 'Related KB Article',
          content: 'Password Reset Procedures for Windows 10/11',
          confidence: 'high',
          type: 'kb_article'
        },
        {
          id: '3',
          title: 'Similar Ticket',
          content: 'Ticket #TKT-00142 had similar symptoms and was resolved by restarting the Print Spooler service.',
          confidence: 'medium',
          type: 'similar_ticket'
        }
      ])
      setAutoTags(['Windows', 'Authentication', 'User Account'])
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [ticketId, ticketTitle, ticketDescription])

  const handleFeedback = (suggestionId: string, isHelpful: boolean) => {
    setFeedback(prev => ({
      ...prev,
      [suggestionId]: isHelpful ? 'helpful' : 'not_helpful'
    }))

    // In production, send feedback to backend for ML training
    console.log('AI Feedback:', { suggestionId, isHelpful })
  }

  const handleCopySuggestion = (content: string) => {
    navigator.clipboard.writeText(content)
    // TODO: Add toast notification
  }

  const getConfidenceBadge = (confidence: string) => {
    const config = {
      high: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
      medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
      low: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
    }
    return (
      <Badge variant="outline" className={cn('text-xs', config[confidence as keyof typeof config])}>
        {confidence} confidence
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'resolution':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />
      case 'kb_article':
        return <ExternalLink className="w-4 h-4 text-blue-500" />
      case 'similar_ticket':
        return <TrendingUp className="w-4 h-4 text-purple-500" />
      default:
        return <Sparkles className="w-4 h-4" />
    }
  }

  return (
    <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Insights</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Powered by Gemini 2.0
              </CardDescription>
            </div>
          </div>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-generated Tags */}
        {!loading && autoTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Suggested Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {autoTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-secondary/80"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <Separator />

            {/* AI Suggestions */}
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getTypeIcon(suggestion.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-medium leading-none">{suggestion.title}</h4>
                        {getConfidenceBadge(suggestion.confidence)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {suggestion.content}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopySuggestion(suggestion.content)}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    {suggestion.type === 'kb_article' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        asChild
                      >
                        <Link href="/knowledge-base">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-7 w-7 p-0',
                          feedback[suggestion.id] === 'helpful' && 'bg-green-500/10 text-green-600'
                        )}
                        onClick={() => handleFeedback(suggestion.id, true)}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-7 w-7 p-0',
                          feedback[suggestion.id] === 'not_helpful' && 'bg-red-500/10 text-red-600'
                        )}
                        onClick={() => handleFeedback(suggestion.id, false)}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          AI suggestions are generated based on historical ticket data
        </div>
      </CardContent>
    </Card>
  )
}
