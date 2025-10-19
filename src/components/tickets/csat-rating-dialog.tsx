'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface CSATRatingDialogProps {
  ticketId: string
  ticketNumber: string
  isOpen: boolean
  onClose: () => void
  onSubmit?: () => void
}

const ratingLabels = {
  1: 'Very Unsatisfied',
  2: 'Unsatisfied',
  3: 'Neutral',
  4: 'Satisfied',
  5: 'Very Satisfied',
}

const ratingEmojis = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😊',
}

export function CSATRatingDialog({
  ticketId,
  ticketNumber,
  isOpen,
  onClose,
  onSubmit,
}: CSATRatingDialogProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!rating) {
      toast({
        title: 'Rating Required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/tickets/${ticketId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating')
      }

      toast({
        title: 'Thank You!',
        description: 'Your feedback has been submitted successfully.',
      })

      onSubmit?.()
      onClose()
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit rating',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  const displayRating = hoveredRating || rating || 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How was your experience?</DialogTitle>
          <DialogDescription>
            Help us improve by rating your experience with ticket #{ticketNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating Selector */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoveredRating(value)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
                  aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      value <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Rating Label and Emoji */}
            {displayRating > 0 && (
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl">{ratingEmojis[displayRating as keyof typeof ratingEmojis]}</div>
                <p className="text-sm font-medium text-muted-foreground">
                  {ratingLabels[displayRating as keyof typeof ratingLabels]}
                </p>
              </div>
            )}
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <Label htmlFor="feedback">
              Additional Feedback <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us more about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!rating || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
