'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EscalationButtonProps {
  ticketId: string
  ticketNumber: string
  onEscalated?: () => void
  users?: Array<{ _id: string; firstName: string; lastName: string; email: string }>
}

export function EscalationButton({
  ticketId,
  ticketNumber,
  onEscalated,
  users = [],
}: EscalationButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [escalatedTo, setEscalatedTo] = useState<string>('')
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const handleEscalate = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for escalation',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/tickets/${ticketId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalatedTo: escalatedTo || undefined,
          reason,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Ticket Escalated',
          description: `Ticket ${ticketNumber} has been escalated successfully`,
        })
        setOpen(false)
        setEscalatedTo('')
        setReason('')
        onEscalated?.()
      } else {
        throw new Error(data.error || 'Failed to escalate ticket')
      }
    } catch (error: any) {
      toast({
        title: 'Escalation Failed',
        description: error.message || 'Failed to escalate ticket',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Escalate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escalate Ticket {ticketNumber}</DialogTitle>
          <DialogDescription>
            Escalate this ticket to notify management and optionally reassign to another user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="escalate-to">Escalate To (Optional)</Label>
            <Select value={escalatedTo} onValueChange={setEscalatedTo}>
              <SelectTrigger id="escalate-to">
                <SelectValue placeholder="Select user (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Keep Current Assignment</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Leave empty to escalate without reassignment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Escalation *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this ticket needs escalation..."
              rows={4}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleEscalate} disabled={loading || !reason.trim()}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Escalating...' : 'Escalate Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
