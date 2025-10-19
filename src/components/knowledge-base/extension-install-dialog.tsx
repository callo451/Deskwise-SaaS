'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Download, Chrome, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react'

interface ExtensionInstallDialogProps {
  trigger?: React.ReactNode
}

export function ExtensionInstallDialog({ trigger }: ExtensionInstallDialogProps) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const IS_PRODUCTION = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
  const CHROME_STORE_URL = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
    ? `https://chrome.google.com/webstore/detail/${process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID}`
    : null

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch('/api/downloads/extension')

      if (!response.ok) {
        throw new Error('Failed to download extension')
      }

      // Get the blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'deskwise-recorder-extension.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download extension. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleInstallFromStore = () => {
    if (CHROME_STORE_URL) {
      window.open(CHROME_STORE_URL, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Chrome className="w-4 h-4 mr-2" />
            Install Extension
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Chrome className="w-5 h-5 text-blue-600" />
            Deskwise Knowledge Recorder
          </DialogTitle>
          <DialogDescription>
            Record step-by-step workflows and automatically generate knowledge base articles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Production - Chrome Web Store */}
          {IS_PRODUCTION && CHROME_STORE_URL ? (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Chrome className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Official Chrome Extension
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Install directly from the Chrome Web Store with automatic updates
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleInstallFromStore}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Chrome className="w-4 h-4 mr-2" />
                Add to Chrome
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ) : (
            /* Development - Manual Installation */
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                      Development Version
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      This is an unpacked development extension. Manual installation required.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download Extension (.zip)'}
              </Button>

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <span>Installation Steps</span>
                  <Badge variant="secondary">Chrome</Badge>
                </h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                      1
                    </span>
                    <span>Download and extract the ZIP file to a folder on your computer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                      2
                    </span>
                    <span>
                      Open Chrome and navigate to <code className="bg-muted px-1 py-0.5 rounded text-xs">chrome://extensions</code>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                      3
                    </span>
                    <span>Enable "Developer mode" toggle in the top-right corner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                      4
                    </span>
                    <span>Click "Load unpacked" and select the extracted extension folder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="font-medium">Extension installed! Pin it to your toolbar for easy access.</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Features */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Features</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Automatic screenshot capture</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>Step-by-step recording</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>AI-powered article generation</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>One-click publishing</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
