import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, Tag, Eye } from 'lucide-react';
import Link from 'next/link';
import TiptapViewer from '@/components/knowledge-base/TiptapViewer';

interface SessionStep {
  id: number;
  timestamp: number;
  action: string;
  description: string;
  screenshotUrl?: string;
  element?: {
    tagName: string;
    textContent?: string;
    id?: string;
    className?: string;
  };
  url?: string;
}

interface SessionData {
  id: string;
  title: string;
  content: string;
  steps: SessionStep[];
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  category: string;
  tags: string[];
  viewCount: number;
}

async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/api/knowledge-base/sessions/${sessionId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.session;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const session = await getSession(params.sessionId);

  if (!session) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/knowledge-base" className="hover:text-primary">
              Knowledge Base
            </Link>
            <span>→</span>
            <Link href="/knowledge-base/sessions" className="hover:text-primary">
              Recorded Sessions
            </Link>
            <span>→</span>
            <span>{session.title}</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(session.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(session.createdAt).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Auto-generated
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {session.viewCount} views
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/knowledge-base/${session.id}`}>
                  Edit Article
                </Link>
              </Button>
              <Button asChild>
                <Link href="/knowledge-base/new">
                  Create New Guide
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <div className="mt-1">
                  <Badge variant="secondary">{session.category}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Steps Recorded</label>
                <div className="mt-1 text-lg font-semibold">{session.steps.length}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tags</label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {session.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Generated Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <TiptapViewer content={session.content} />
          </CardContent>
        </Card>

        {/* Recorded Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recorded Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {session.steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{step.action}</h3>
                        <Badge variant="outline" className="text-xs">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{step.description}</p>
                      
                      {step.element && (
                        <div className="bg-muted rounded p-3 mb-3">
                          <h4 className="font-medium text-sm mb-2">Element Details:</h4>
                          <div className="text-xs space-y-1">
                            <div><strong>Tag:</strong> {step.element.tagName}</div>
                            {step.element.textContent && (
                              <div><strong>Text:</strong> {step.element.textContent}</div>
                            )}
                            {step.element.id && (
                              <div><strong>ID:</strong> {step.element.id}</div>
                            )}
                            {step.element.className && (
                              <div><strong>Class:</strong> {step.element.className}</div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {step.url && (
                        <div className="text-xs text-muted-foreground mb-3">
                          <strong>Page:</strong> {step.url}
                        </div>
                      )}
                      
                      {step.screenshotUrl && (
                        <div className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
                          <img 
                            src={step.screenshotUrl} 
                            alt={`Screenshot for step ${index + 1}`}
                            className="max-w-full h-auto rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}