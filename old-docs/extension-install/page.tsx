'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Chrome, 
  Settings, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Camera,
  Zap,
  Shield
} from 'lucide-react';

export default function ExtensionInstallPage() {
  const handleDownload = () => {
    // In a real scenario, this would download the extension file
    // For now, we'll just show instructions
    alert('Extension files are located in the /extension/deskwise-recorder directory. Load as unpacked extension in Chrome.');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Deskwise Knowledge Recorder</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Auto-generate step-by-step guides from your browser interactions
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">Auto Screenshots</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically captures and crops screenshots around each click
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold">AI-Powered</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Uses AI to generate natural language descriptions for each step
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">Knowledge Base</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically creates articles in your Deskwise knowledge base
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Installation Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Installation Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Download Extension</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Download the Deskwise Knowledge Recorder extension files
                  </p>
                  <Button onClick={handleDownload} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Extension
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Open Chrome Extensions</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to <code className="bg-muted px-2 py-1 rounded">chrome://extensions/</code> in your Chrome browser
                  </p>
                  <div className="flex items-center gap-2">
                    <Chrome className="h-4 w-4" />
                    <span className="text-sm">Supported: Chrome, Edge, and other Chromium browsers</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Enable Developer Mode</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Toggle the "Developer mode" switch in the top right corner
                  </p>
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">This allows loading unpacked extensions</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Load Extension</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click "Load unpacked" and select the extension folder
                  </p>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-mono">
                      Select: <span className="font-semibold">extension/deskwise-recorder</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Start Recording</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the extension icon in your toolbar to start recording
                  </p>
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    <span className="text-sm">The icon will appear in your browser toolbar</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Guide */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge variant="secondary">1</Badge>
                <div>
                  <h4 className="font-semibold">Start Recording</h4>
                  <p className="text-sm text-muted-foreground">Click the extension icon and press "Start Recording"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="secondary">2</Badge>
                <div>
                  <h4 className="font-semibold">Perform Actions</h4>
                  <p className="text-sm text-muted-foreground">Navigate and click on elements you want to document</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="secondary">3</Badge>
                <div>
                  <h4 className="font-semibold">Stop Recording</h4>
                  <p className="text-sm text-muted-foreground">Click the stop button when you're done</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="secondary">4</Badge>
                <div>
                  <h4 className="font-semibold">View Generated Guide</h4>
                  <p className="text-sm text-muted-foreground">Check the Knowledge Base for your auto-generated guide</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Requirements & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Browser Compatibility</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Chrome 88+</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Edge 88+</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Other Chromium browsers</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Required Permissions</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm font-medium">Active Tab:</span>
                      <span className="text-sm text-muted-foreground ml-2">Access current tab content</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm font-medium">Desktop Capture:</span>
                      <span className="text-sm text-muted-foreground ml-2">Take screenshots</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <span className="text-sm font-medium">Storage:</span>
                      <span className="text-sm text-muted-foreground ml-2">Save recording sessions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Extension not appearing?</strong> Make sure Developer mode is enabled and try reloading the extension.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recording not working?</strong> Ensure Deskwise is running and accessible, then refresh the page before recording.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Guide not generated?</strong> Check the Knowledge Base → Sessions page and verify your AI configuration.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}