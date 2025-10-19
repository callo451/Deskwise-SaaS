'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import { ChevronLeft, Sparkles } from 'lucide-react';
import { generateScript } from '@/ai/flows/script-generation';
import { scripts } from '@/lib/placeholder-data';
import type { Script } from '@/lib/types';
import Link from 'next/link';

const scriptFormSchema = z.object({
  name: z.string().min(5, 'Script name must be at least 5 characters.'),
  description: z.string().optional(),
  language: z.enum(['PowerShell', 'Bash', 'Python']),
  prompt: z.string().optional(),
});

type ScriptFormValues = z.infer<typeof scriptFormSchema>;

export default function EditScriptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [script, setScript] = useState<Script | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const form = useForm<ScriptFormValues>({
    resolver: zodResolver(scriptFormSchema),
    defaultValues: {
      name: '',
      description: '',
      language: 'PowerShell',
      prompt: '',
    },
  });
  
  useEffect(() => {
    const foundScript = scripts.find(s => s.id === params.id);
    if (foundScript) {
        setScript(foundScript);
        form.reset({
            name: foundScript.name,
            description: foundScript.description,
            language: foundScript.language,
            prompt: '',
        });
        setGeneratedCode(foundScript.code);
    }
  }, [params.id, form]);

  const handleGenerateScript = async () => {
    const { prompt, language } = form.getValues();
    if (!prompt || !language) {
      form.setError('prompt', { message: 'Please provide a prompt and select a language.' });
      return;
    }

    setIsGenerating(true);
    setGeneratedCode('// Generating new script...');
    try {
      const result = await generateScript({ prompt, language });
      setGeneratedCode(result.script);
      toast({
        title: 'Script Generated!',
        description: `The code has been replaced with the new AI-generated script.`,
      });
    } catch (error) {
      console.error('AI Script Generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'The AI failed to generate the script. Please try again.',
      });
      setGeneratedCode(script?.code || '// Generation failed. Previous code restored.');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = (data: ScriptFormValues) => {
    console.log({ ...data, code: generatedCode }); // In a real app, you'd save this
    toast({
      title: 'Script Saved!',
      description: `Script "${data.name}" has been updated successfully.`,
    });
    router.push('/settings/script-repository');
  };

  if (!script) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Script Not Found</CardTitle>
            <CardDescription>The requested script could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/script-repository">
              <Button>Back to Script Repository</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Edit Script</h1>
          <p className="text-muted-foreground">Editing &quot;{script.name}&quot;</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Script Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Script Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Clear Temp Files" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="What does this script do?" {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-primary">Generate</CardTitle>
                  <CardDescription>Describe a script to generate and replace the existing code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PowerShell">PowerShell</SelectItem>
                            <SelectItem value="Bash">Bash</SelectItem>
                            <SelectItem value="Python">Python</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., A PowerShell script to clear the DNS cache and restart the DNS client service."
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardContent>
                  <Button type="button" onClick={handleGenerateScript} disabled={isGenerating} className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate & Replace Code'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Code Editor</CardTitle>
                  <CardDescription>The generated script will appear here. You can edit it directly.</CardDescription>
                </CardHeader>
                <CardContent className="h-full flex flex-col">
                  {isGenerating ? (
                      <div className="flex-1 flex justify-center items-center h-full rounded-md border border-dashed">
                          <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                              <div className="h-2 w-2 bg-primary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                              <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                          </div>
                      </div>
                  ) : (
                    <Textarea
                      value={generatedCode}
                      onChange={(e) => setGeneratedCode(e.target.value)}
                      placeholder="Your generated script will appear here..."
                      className="flex-1 font-mono text-sm bg-muted/50 dark:bg-zinc-900/50 resize-none h-[500px]"
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Save Script</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
