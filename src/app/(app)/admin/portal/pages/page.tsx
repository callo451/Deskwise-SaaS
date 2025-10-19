'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Eye, Trash2, Copy, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface PortalPage {
  _id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  isPublic: boolean
  isHomePage: boolean
  viewCount: number
  updatedAt: string
  publishedAt?: string
}

export default function PortalPagesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [pages, setPages] = useState<PortalPage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/portal/pages')
      const data = await response.json()

      if (data.success) {
        setPages(data.data || [])
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load pages',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
      toast({
        title: 'Error',
        description: 'Failed to load pages',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createPage = async () => {
    try {
      const response = await fetch('/api/portal/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Page',
          slug: `page-${Date.now()}`,
          description: '',
          isPublic: true,
          isHomePage: false,
          blocks: [],
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Page created successfully',
        })
        router.push(`/admin/portal/composer/${data.data._id}`)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create page',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating page:', error)
      toast({
        title: 'Error',
        description: 'Failed to create page',
        variant: 'destructive',
      })
    }
  }

  const deletePage = async (pageId: string, pageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${pageTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/portal/pages/${pageId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Page deleted successfully',
        })
        fetchPages()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete page',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete page',
        variant: 'destructive',
      })
    }
  }

  const filteredPages = pages.filter((page) =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      published: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      archived: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    }

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants] || variants.draft}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portal Pages</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage your self-service portal pages
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Loading pages...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portal Pages</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your self-service portal pages with the visual composer
          </p>
        </div>
        <Button onClick={createPage}>
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages.filter((p) => p.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages.filter((p) => p.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pages.reduce((sum, p) => sum + (p.viewCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pages Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Pages</CardTitle>
              <CardDescription>Manage your portal pages and content</CardDescription>
            </div>
            <div className="w-64">
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No pages found matching your search' : 'No pages yet. Create your first page to get started.'}
              </p>
              {!searchQuery && (
                <Button onClick={createPage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Page
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {page.title}
                        {page.isHomePage && (
                          <Badge variant="outline" className="text-xs">
                            Home
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        /portal/{page.slug}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(page.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {page.isPublic ? (
                          <>
                            <Globe className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-orange-600" />
                            <span className="text-orange-600">Private</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{page.viewCount || 0}</TableCell>
                    <TableCell>
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/portal/composer/${page._id}`}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/portal/${page.slug}`} target="_blank">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deletePage(page._id, page.title)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
