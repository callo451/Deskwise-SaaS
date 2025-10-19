'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Sparkles, Settings2, Eye, EyeOff, Tag, FolderOpen } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import AdvancedTiptapEditor from '@/components/knowledge-base/AdvancedTiptapEditor'
import { useToast } from '@/hooks/use-toast'

export default function NewArticlePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    visibility: 'internal',
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerateAI = async () => {
    const prompt = window.prompt('What would you like to generate an article about?')
    if (!prompt) return

    setGenerating(true)
    try {
      const response = await fetch('/api/knowledge-base/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: 'article' }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData(prev => ({ ...prev, content: data.data.content }))
        toast({
          title: 'Content Generated',
          description: 'AI content has been generated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate article',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error generating article:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate article',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Article Created',
          description: 'Your article has been created successfully',
        })
        router.push(`/knowledge/${data.data._id}`)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create article',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating article:', error)
      toast({
        title: 'Error',
        description: 'Failed to create article',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Action Bar */}
      <div className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 flex items-center px-6 gap-4 shrink-0">
        <Link href="/knowledge">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-8" />
        <span className="text-sm text-muted-foreground">New Article</span>

        <div className="flex-1" />

        <Button
          type="button"
          variant="outline"
          onClick={handleGenerateAI}
          disabled={generating}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {generating ? 'Generating...' : 'AI Generate'}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="gap-2"
        >
          {loading ? 'Publishing...' : 'Publish Article'}
        </Button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-12">
            {/* Title Input */}
            <div className="mb-8">
              <Input
                id="title"
                placeholder="Article title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
                className="text-5xl font-bold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Editor */}
            <AdvancedTiptapEditor
              content={formData.content}
              onChange={(content) => handleChange('content', content)}
              placeholder="Start writing your article..."
              className="min-h-[calc(100vh-300px)]"
            />
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="w-80 border-l bg-muted/30 overflow-y-auto shrink-0">
          <div className="p-6 space-y-6">
            {/* Settings Header */}
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Article Settings</h2>
            </div>

            <Separator />

            {/* Category Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FolderOpen className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="category" className="cursor-pointer">Category</Label>
              </div>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="How-To">How-To</SelectItem>
                  <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                  <SelectItem value="Policies">Policies</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visibility Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {formData.visibility === 'public' ? (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                )}
                <Label htmlFor="visibility" className="cursor-pointer">Visibility</Label>
              </div>
              <Select value={formData.visibility} onValueChange={(value) => handleChange('visibility', value)}>
                <SelectTrigger id="visibility" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      <span>Internal Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.visibility === 'public'
                  ? 'Visible to everyone including portal users'
                  : 'Only visible to internal team members'
                }
              </p>
            </div>

            {/* Tags Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="tags" className="cursor-pointer">Tags</Label>
              </div>
              <Input
                id="tags"
                placeholder="Add tags (comma separated)"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>

            <Separator />

            {/* Info Card */}
            <Card className="border-primary/20 bg-primary/5">
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">AI Assistant</p>
                    <p className="text-xs text-muted-foreground">
                      Use the AI Generate button to create content based on your prompt
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
