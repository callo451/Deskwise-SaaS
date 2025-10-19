'use client'

import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CSATRating } from '@/lib/types'

interface CSATRatingDisplayProps {
  rating: CSATRating
}

const ratingLabels = {
  1: 'Very Unsatisfied',
  2: 'Unsatisfied',
  3: 'Neutral',
  4: 'Satisfied',
  5: 'Very Satisfied',
}

const ratingColors = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-green-100 text-green-800 border-green-200',
  5: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

export function CSATRatingDisplay({ rating }: CSATRatingDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          Customer Satisfaction Rating
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Stars */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={`w-5 h-5 ${
                  value <= rating.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <Badge
            variant="outline"
            className={ratingColors[rating.rating as keyof typeof ratingColors]}
          >
            {ratingLabels[rating.rating as keyof typeof ratingLabels]}
          </Badge>
        </div>

        {/* Feedback */}
        {rating.feedback && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Feedback:</p>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {rating.feedback}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          Submitted by {rating.submittedByName || 'Unknown'} on{' '}
          {new Date(rating.submittedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </CardContent>
    </Card>
  )
}
