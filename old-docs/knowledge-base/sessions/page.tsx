'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Search, Play, Eye, FileText, Download } from 'lucide-react';
import Link from 'next/link';

interface SessionSummary {
  id: string;
  title: string;
  stepCount: number;
  createdAt: string;
  sessionId: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/knowledge-base/recorder');
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInstallExtension = () => {
    // Guide user to install extension
    window.open('/extension-install', '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted rounded w-96 mb-8"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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
            <span>Recorded Sessions</span>
          </div>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Recorded Sessions</h1>
              <p className="text-muted-foreground">
                Auto-generated guides from Chrome/Edge extension recordings
              </p>
            </div>
            
            <Button onClick={handleInstallExtension} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Install Extension
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recorded sessions..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Extension Info */}
        {sessions.length === 0 && (
          <Card className="mb-8 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recorded sessions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Install the Deskwise Chrome/Edge extension to start recording mouse clicks and generating automated guides.
                </p>
                <div className="space-y-2">
                  <Button onClick={handleInstallExtension} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Install Extension
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    The extension will record your clicks and automatically generate step-by-step guides
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{session.title}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {session.stepCount} steps
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(session.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Session ID: {session.sessionId}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      Auto-generated guide with {session.stepCount} recorded steps and screenshots
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/knowledge-base/sessions/${session.sessionId}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Session
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/knowledge-base/${session.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Edit Article
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {sessions.length > 0 && filteredSessions.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or create a new recording session.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Install Extension</h4>
                  <p className="text-sm text-muted-foreground">Install the Deskwise Chrome/Edge extension</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Start Recording</h4>
                  <p className="text-sm text-muted-foreground">Click the extension icon to start recording your interactions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Click & Capture</h4>
                  <p className="text-sm text-muted-foreground">Each click automatically captures a screenshot and records the interaction</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Generate Guide</h4>
                  <p className="text-sm text-muted-foreground">Stop recording and the system automatically generates a comprehensive guide</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}