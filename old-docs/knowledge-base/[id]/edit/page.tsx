
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Users } from 'lucide-react';
import type { KnowledgeBaseArticle, UserGroup } from '@/lib/types';
import AdvancedTiptapEditor from '@/components/knowledge-base/AdvancedTiptapEditor';
import ScreenshotEditor from '@/components/knowledge-base/ScreenshotEditor';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, Image, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  type: z.enum(['Internal', 'Public']),
  content: z.string().min(20, 'Content must be at least 20 characters.'),
  visibleTo: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

export default function EditKnowledgeBaseArticlePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [article, setArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [screenshots, setScreenshots] = useState<Array<{
    id: string;
    url: string;
    originalUrl: string;
    annotations: any[];
  }>>([]);
  const [editingScreenshot, setEditingScreenshot] = useState<string | null>(null);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      category: '',
      type: 'Internal',
      content: '',
      visibleTo: [],
      tags: [],
    },
  });

  useEffect(() => {
    fetchArticle();
    fetchCategories();
  }, [params.id]);

  const extractScreenshots = (content: string) => {
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const screenshotMatches = [];
    let match;
    
    while ((match = imgRegex.exec(content)) !== null) {
      const [fullMatch, altText, url] = match;
      if (url.includes('/api/knowledge-base/recorder/screenshot/')) {
        screenshotMatches.push({
          id: url.split('/').pop() || Date.now().toString(),
          url: url,
          originalUrl: url,
          annotations: [],
          altText: altText
        });
      }
    }
    
    return screenshotMatches;
  };

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/knowledge-base/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
        form.reset({
          title: data.title,
          category: data.category,
          type: data.type,
          content: data.content,
          visibleTo: data.visibleTo || [],
          tags: data.tags || [],
        });
        
        // Extract screenshots from content
        const extractedScreenshots = extractScreenshots(data.content);
        setScreenshots(extractedScreenshots);
      } else {
        console.error('Failed to fetch article');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/knowledge-base/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.map((cat: any) => cat.name));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const uploadBase64Image = async (base64DataUrl: string, screenshotId: string) => {
    try {
      const response = await fetch('/api/knowledge-base/recorder/upload-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataUrl: base64DataUrl,
          originalScreenshotId: screenshotId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload screenshot');
      }

      const data = await response.json();
      return data.screenshotUrl; // Returns the new API URL
    } catch (error) {
      console.error('Error uploading screenshot:', error);
      throw error;
    }
  };

  const handleScreenshotSave = async (screenshotId: string, editedImageUrl: string, annotations: any[]) => {
    try {
      let finalImageUrl = editedImageUrl;
      
      // If the edited image is a base64 data URL, upload it to get an API URL
      if (editedImageUrl.startsWith('data:image/')) {
        console.log('📤 Uploading base64 image to server...');
        finalImageUrl = await uploadBase64Image(editedImageUrl, screenshotId);
        console.log('✅ Base64 image uploaded, new URL:', finalImageUrl);
      }

      // Update the screenshot in state
      setScreenshots(prev => prev.map(screenshot => 
        screenshot.id === screenshotId 
          ? { ...screenshot, url: finalImageUrl, annotations }
          : screenshot
      ));

      // Update the article content to use the new screenshot URL
      const currentContent = form.getValues('content');
      const oldScreenshot = screenshots.find(s => s.id === screenshotId);
      
      if (oldScreenshot) {
        const updatedContent = currentContent.replace(
          new RegExp(`!\\[([^\\]]*)\\]\\(${oldScreenshot.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'),
          `![${oldScreenshot.altText || 'Screenshot'}](${finalImageUrl})`
        );
        form.setValue('content', updatedContent);
      }

      setEditingScreenshot(null);
      
      toast({
        title: 'Screenshot Updated',
        description: 'Screenshot has been successfully updated with your annotations.',
      });
    } catch (error) {
      console.error('Error saving screenshot:', error);
      toast({
        title: 'Error',
        description: 'Failed to save screenshot changes',
        variant: 'destructive',
      });
    }
  };


  const onSubmit = async (data: ArticleFormValues) => {
    if (!article) return;
    
    try {
      setSaving(true);
      const response = await fetch(`/api/knowledge-base/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: 'Article Updated!',
          description: `Article "${data.title}" has been updated successfully.`,
        });
        router.push(`/knowledge-base/${article.id}`);
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update article',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: 'Error',
        description: 'Failed to update article',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Loading article...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!article) {
     return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Article Not Found</CardTitle>
            <CardDescription>The requested article could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/knowledge-base">
              <Button>Back to Knowledge Base</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // For now, we'll use empty array since we don't have user groups implemented yet
  const selectedGroups: any[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Edit Article</h1>
          <p className="text-muted-foreground">Editing &quot;{article.title}&quot;</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Article Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., How to Reset a Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                          <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select article type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Internal">Internal</SelectItem>
                            <SelectItem value="Public">Public</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter tags separated by commas"
                            value={field.value?.join(', ') || ''}
                            onChange={(e) => {
                              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                              field.onChange(tags);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter tags separated by commas to help organize and search articles.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="content" className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        Content
                      </TabsTrigger>
                      <TabsTrigger value="screenshots" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Screenshots ({screenshots.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="mt-6">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <AdvancedTiptapEditor
                                content={field.value}
                                onChange={field.onChange}
                                placeholder="Edit your article content here..."
                                className="min-h-[500px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="screenshots" className="mt-6">
                      {editingScreenshot ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Edit Screenshot</h3>
                            <Button 
                              type="button"
                              variant="outline" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingScreenshot(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          
                          {screenshots.find(s => s.id === editingScreenshot) && (
                            <ScreenshotEditor
                              imageUrl={screenshots.find(s => s.id === editingScreenshot)!.originalUrl}
                              onSave={(editedImageUrl, annotations) => 
                                handleScreenshotSave(editingScreenshot, editedImageUrl, annotations)
                              }
                              initialAnnotations={screenshots.find(s => s.id === editingScreenshot)!.annotations}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {screenshots.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p>No screenshots found in this article.</p>
                              <p className="text-sm">Screenshots from auto-generated articles will appear here.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {screenshots.map((screenshot) => (
                                <Card key={screenshot.id} className="overflow-hidden">
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      <div className="relative">
                                        <img 
                                          src={screenshot.url} 
                                          alt={screenshot.altText || 'Screenshot'} 
                                          className="w-full h-48 object-cover rounded-md border"
                                        />
                                        {screenshot.annotations.length > 0 && (
                                          <Badge 
                                            className="absolute top-2 right-2 bg-blue-500"
                                            variant="secondary"
                                          >
                                            {screenshot.annotations.length} annotations
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="flex justify-between items-center">
                                        <div className="text-sm text-muted-foreground">
                                          Screenshot {screenshot.id}
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setEditingScreenshot(screenshot.id);
                                          }}
                                          className="flex items-center gap-2"
                                        >
                                          <Edit3 className="h-4 w-4" />
                                          Edit
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
