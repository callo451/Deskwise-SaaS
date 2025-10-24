'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User,
  Calendar,
  Tag,
  FolderOpen,
  Paperclip,
  Link as LinkIcon,
  Building,
  Clock,
  Edit,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { InlineEdit } from '@/components/tickets/inline-edit'
import { UnifiedTicket } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TicketDetailsCardProps {
  ticket: UnifiedTicket
  onDescriptionSave: (description: string) => Promise<void>
  onAssigneeChange: (userId: string) => Promise<void>
  onCategoryChange?: (category: string) => Promise<void>
  onTagsChange?: (tags: string[]) => Promise<void>
  users?: Array<{ _id: string; name: string; email: string }>
  categories?: string[]
  className?: string
}

export function TicketDetailsCard({
  ticket,
  onDescriptionSave,
  onAssigneeChange,
  onCategoryChange,
  onTagsChange,
  users = [],
  categories = [],
  className,
}: TicketDetailsCardProps) {
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)

  const handleAssigneeSelect = async (userId: string) => {
    await onAssigneeChange(userId)
  }

  const handleCategorySelect = async (category: string) => {
    if (onCategoryChange) {
      await onCategoryChange(category)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && onTagsChange) {
      const newTags = [...(ticket.tags || []), tagInput.trim()]
      onTagsChange(newTags)
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    if (onTagsChange) {
      const newTags = (ticket.tags || []).filter(tag => tag !== tagToRemove)
      onTagsChange(newTags)
    }
  }

  return (
    <Card className={cn('border-2 shadow-lg', className)}>
      <CardHeader
        className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-xl">Ticket Details</CardTitle>
              <CardDescription className="text-base">Core information and description</CardDescription>
            </div>
          </div>
          <button
            className="shrink-0 p-1 hover:bg-accent rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-6">
        {/* Description - Full Width */}
        <div className="bg-gradient-to-br from-accent/50 to-accent/20 p-4 rounded-lg border-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Description</span>
          </div>
          <div className="pl-2">
            <InlineEdit
              value={ticket.description || ''}
              onSave={onDescriptionSave}
              multiline
              placeholder="Add a description..."
              displayClassName="whitespace-pre-wrap text-sm leading-relaxed"
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Key Fields - 3 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* Assigned To */}
          <div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-500/10 rounded-md">
                <User className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm font-semibold">Assigned To</span>
            </div>
            <div className="pl-2">
            {users.length > 0 ? (
              <Select value={ticket.assignedTo || 'unassigned'} onValueChange={handleAssigneeSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm">
                {ticket.assignedToName || (
                  <span className="text-muted-foreground italic">Unassigned</span>
                )}
              </div>
            )}
            </div>
          </div>

          {/* Requester */}
          <div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-500/10 rounded-md">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm font-semibold">Requester</span>
            </div>
            <div className="pl-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                {ticket.requesterName?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-sm font-semibold">{ticket.requesterName || 'Unknown'}</div>
                <div className="text-xs text-muted-foreground">{ticket.requesterId}</div>
              </div>
            </div>
            </div>
          </div>

          {/* Category */}
          <div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-teal-500/10 rounded-md">
                <FolderOpen className="h-4 w-4 text-teal-600" />
              </div>
              <span className="text-sm font-semibold">Category</span>
            </div>
            <div className="pl-2">
            {categories.length > 0 && onCategoryChange ? (
              <Select value={ticket.category} onValueChange={handleCategorySelect}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary">{ticket.category}</Badge>
            )}
            </div>
          </div>

          {/* Client */}
          {ticket.clientId && (
            <div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-500/10 rounded-md">
                  <Building className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm font-semibold">Client</span>
              </div>
              <div className="pl-2">
                <Link href={`/clients/${ticket.clientId}`} className="text-sm text-primary hover:underline font-medium">
                  {ticket.clientName || ticket.clientId}
                </Link>
              </div>
            </div>
          )}

          {/* Created */}
          <div className="p-4 rounded-lg border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-500/10 rounded-md">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm font-semibold">Created</span>
            </div>
            <div className="pl-2">
              <div className="text-sm font-semibold text-foreground">
                {format(new Date(ticket.createdAt), 'PPp')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="p-4 rounded-lg border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-orange-500/10 rounded-md">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-semibold">Last Updated</span>
            </div>
            <div className="pl-2">
              <div className="text-sm font-semibold text-foreground">
                {format(new Date(ticket.updatedAt), 'PPp')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Resolved At (if exists) */}
          {ticket.resolvedAt && (
            <div className="p-4 rounded-lg border-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-green-500/10 rounded-md">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400">Resolved</span>
              </div>
              <div className="pl-2">
                <div className="text-sm font-semibold text-green-800 dark:text-green-300">
                  {format(new Date(ticket.resolvedAt), 'PPp')}
                </div>
                <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                  {formatDistanceToNow(new Date(ticket.resolvedAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          )}

          {/* Closed At (if exists) */}
          {ticket.closedAt && (
            <div className="p-4 rounded-lg border-2 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-gray-500/10 rounded-md">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-400">Closed</span>
              </div>
              <div className="pl-2">
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                  {format(new Date(ticket.closedAt), 'PPp')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(ticket.closedAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Tags - Full Width */}
        <div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-md">
                <Tag className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-sm font-semibold">Tags</span>
            </div>
            {onTagsChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTags(!isEditingTags)}
              >
                {isEditingTags ? 'Done' : 'Edit'}
              </Button>
            )}
          </div>
          <div className="pl-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {ticket.tags && ticket.tags.length > 0 ? (
                ticket.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 px-3 py-1 text-xs font-medium">
                    {tag}
                    {isEditingTags && onTagsChange && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">No tags</span>
              )}
            </div>
            {isEditingTags && onTagsChange && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 px-3 py-1 text-sm border rounded-md"
                />
                <Button size="sm" onClick={handleAddTag} disabled={!tagInput.trim()}>
                  Add
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Linked Assets - Full Width */}
        {ticket.linkedAssets && ticket.linkedAssets.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-cyan-500/10 rounded-md">
                  <LinkIcon className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="text-sm font-semibold">Linked Assets</span>
                <Badge variant="secondary" className="text-xs">
                  {ticket.linkedAssets.length}
                </Badge>
              </div>
              <div className="pl-2 flex flex-wrap gap-2">
                {ticket.linkedAssets.map((assetId) => (
                  <Link
                    key={assetId}
                    href={`/assets/${assetId}`}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-primary hover:underline bg-primary/5 rounded-md border hover:bg-primary/10 transition-colors"
                  >
                    <LinkIcon className="h-3 w-3" />
                    {assetId}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Time Tracking */}
        {ticket.totalTimeSpent !== undefined && ticket.totalTimeSpent > 0 && (
          <>
            <Separator className="my-6" />
            <div className="p-6 rounded-lg border-2 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/20 rounded-md">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <span className="text-base font-semibold">Time Spent</span>
              </div>
              <div className="pl-2">
                <div className="text-3xl font-bold text-primary mb-1">
                  {Math.floor(ticket.totalTimeSpent / 60)}h {ticket.totalTimeSpent % 60}m
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Total time logged on this ticket
                </div>
              </div>
            </div>
          </>
        )}
        </CardContent>
      )}
    </Card>
  )
}
