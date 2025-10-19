'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  MessageSquare,
  TrendingUp,
  Filter,
  X,
} from 'lucide-react'
import {
  useCannedResponses,
  useCannedResponseCategories,
  useCannedResponseStats,
} from '@/hooks/use-canned-responses'
import { CannedResponse } from '@/lib/types'

export default function CannedResponsesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null)
  const [deletingResponse, setDeletingResponse] = useState<CannedResponse | null>(null)

  const {
    cannedResponses,
    loading,
    createCannedResponse,
    updateCannedResponse,
    deleteCannedResponse,
  } = useCannedResponses({
    search: searchTerm,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    isActive: showInactive ? undefined : true,
  })

  const { categories } = useCannedResponseCategories()
  const { stats } = useCannedResponseStats()

  const handleCreate = () => {
    setEditingResponse(null)
    setDialogOpen(true)
  }

  const handleEdit = (response: CannedResponse) => {
    setEditingResponse(response)
    setDialogOpen(true)
  }

  const handleDelete = (response: CannedResponse) => {
    setDeletingResponse(response)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingResponse) return

    const result = await deleteCannedResponse(deletingResponse._id.toString())
    if (result.success) {
      setDeleteDialogOpen(false)
      setDeletingResponse(null)
    }
  }

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content)
    // Could add a toast notification here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Canned Responses</h1>
          <p className="text-muted-foreground">
            Manage reusable response templates for faster ticket replies
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Response
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Responses</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Categories</CardDescription>
              <CardTitle className="text-3xl">{stats.categoryCount}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Uses</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsage}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
            </div>
            {(searchTerm || selectedCategory !== 'all' || showInactive) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                  setShowInactive(false)
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={showInactive ? 'all' : 'active'}
                onValueChange={(value) => setShowInactive(value === 'all')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active only</SelectItem>
                  <SelectItem value="all">All (including inactive)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses List */}
      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
          <CardDescription>
            {cannedResponses.length} response{cannedResponses.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : cannedResponses.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No canned responses found</p>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first response
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {cannedResponses.map((response) => (
                <Card key={response._id.toString()} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{response.name}</h3>
                          <Badge variant="secondary">{response.category}</Badge>
                          {!response.isActive && <Badge variant="destructive">Inactive</Badge>}
                          {response.usageCount > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {response.usageCount} uses
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {response.content}
                        </p>

                        {response.variables.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {response.variables.map((variable) => (
                              <Badge key={variable} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {response.tags && response.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {response.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(response.content)}
                          title="Copy to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(response)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(response)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <CannedResponseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingResponse={editingResponse}
        categories={categories}
        onCreate={createCannedResponse}
        onUpdate={updateCannedResponse}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Canned Response</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingResponse?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface CannedResponseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingResponse: CannedResponse | null
  categories: string[]
  onCreate: (input: any) => Promise<any>
  onUpdate: (id: string, updates: any) => Promise<any>
}

function CannedResponseDialog({
  open,
  onOpenChange,
  editingResponse,
  categories,
  onCreate,
  onUpdate,
}: CannedResponseDialogProps) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens/closes or editingResponse changes
  useState(() => {
    if (editingResponse) {
      setName(editingResponse.name)
      setContent(editingResponse.content)
      setCategory(editingResponse.category)
      setTags(editingResponse.tags?.join(', ') || '')
      setIsActive(editingResponse.isActive)
    } else {
      setName('')
      setContent('')
      setCategory('')
      setTags('')
      setIsActive(true)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const input = {
      name,
      content,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      isActive,
    }

    let result
    if (editingResponse) {
      result = await onUpdate(editingResponse._id.toString(), input)
    } else {
      result = await onCreate(input)
    }

    if (result.success) {
      onOpenChange(false)
    }

    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingResponse ? 'Edit Canned Response' : 'New Canned Response'}
          </DialogTitle>
          <DialogDescription>
            Create a reusable response template. Use {'{{'} and {'}}'} for variables (e.g.,
            {'{{ticketNumber}}'}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Password Reset Instructions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <div className="flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select or type new category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Or type new..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder={`Hello {{requesterName}},\n\nThank you for contacting support regarding {{ticketNumber}}.\n\nTo reset your password, please follow these steps:\n1. ...\n2. ...\n\nBest regards,\n{{technicianName}}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={10}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">
              {content.length}/5000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., password, account, urgent"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {editingResponse && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active (visible in selector)
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingResponse
                ? 'Update Response'
                : 'Create Response'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
