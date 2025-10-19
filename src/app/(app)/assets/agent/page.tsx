'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Download, Server, Copy, Check, Plus, Key, AlertCircle, Trash2, RefreshCw } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

interface Asset {
  _id: string
  name: string
  assetTag: string
}

interface EnrollmentToken {
  _id: string
  token: string
  assetId: string
  createdAt: string
  expiresAt: string
  status: 'pending' | 'used' | 'expired' | 'revoked'
  usedAt?: string
  notes?: string
}

export default function AgentDownloadPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState('')
  const [tokens, setTokens] = useState<EnrollmentToken[]>([])
  const [copied, setCopied] = useState('')
  const [loading, setLoading] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [expiresInHours, setExpiresInHours] = useState('24')
  const [notes, setNotes] = useState('')

  // Fetch assets for dropdown
  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(response => {
        // Handle API response format: { success: true, data: [...] }
        if (response.success && Array.isArray(response.data)) {
          setAssets(response.data)
        } else if (Array.isArray(response)) {
          // Fallback for direct array response
          setAssets(response)
        } else {
          console.error('Assets API did not return expected format:', response)
          setAssets([])
        }
      })
      .catch(err => {
        console.error('Error fetching assets:', err)
        setAssets([])
      })
  }, [])

  // Fetch enrollment tokens
  const fetchTokens = () => {
    setLoading(true)
    fetch('/api/enrollment-tokens?status=pending')
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array
        if (Array.isArray(data)) {
          setTokens(data)
        } else {
          console.error('Tokens API did not return an array:', data)
          setTokens([])
        }
      })
      .catch(err => {
        console.error('Error fetching tokens:', err)
        setTokens([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTokens()
  }, [])

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const generateToken = async () => {
    setLoading(true)
    try {
      const body: any = {
        expiresInHours: parseInt(expiresInHours),
        notes
      }

      // Only include assetId if one is selected
      if (selectedAsset) {
        body.assetId = selectedAsset
      }

      const response = await fetch('/api/enrollment-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        setIsGenerateDialogOpen(false)
        setSelectedAsset('') // Reset to auto-create
        setNotes('')
        fetchTokens()
      } else {
        alert('Failed to generate token')
      }
    } catch (err) {
      console.error('Error generating token:', err)
      alert('Error generating token')
    } finally {
      setLoading(false)
    }
  }

  const revokeToken = async (tokenId: string) => {
    if (!confirm('Are you sure you want to revoke this token?')) return

    setLoading(true)
    try {
      await fetch(`/api/enrollment-tokens/${tokenId}/revoke`, {
        method: 'POST'
      })
      fetchTokens()
    } catch (err) {
      console.error('Error revoking token:', err)
    } finally {
      setLoading(false)
    }
  }

  const getInstallCommand = (token: string, platform: 'windows' | 'linux' | 'mac') => {
    const baseUrl = 'http://localhost:9002'

    const commands = {
      windows: `# Download the agent
Invoke-WebRequest -Uri "${baseUrl}/api/downloads/agent/windows" -OutFile "deskwise-agent.exe"

# Run with enrollment token
.\\deskwise-agent.exe -server "${baseUrl}" -enrollment-token "${token}"

# Agent will enroll automatically and save credentials locally`,

      linux: `# Download the agent
wget ${baseUrl}/api/downloads/agent/linux-amd64 -O deskwise-agent
chmod +x deskwise-agent

# Run with enrollment token
./deskwise-agent -server "${baseUrl}" -enrollment-token "${token}"

# Agent will enroll automatically and save credentials locally`,

      mac: `# Download the agent (Apple Silicon)
wget ${baseUrl}/api/downloads/agent/darwin-arm64 -O deskwise-agent

# Or for Intel Macs
# wget ${baseUrl}/api/downloads/agent/darwin-amd64 -O deskwise-agent

chmod +x deskwise-agent

# Run with enrollment token
./deskwise-agent -server "${baseUrl}" -enrollment-token "${token}"

# Agent will enroll automatically and save credentials locally`
    }

    return commands[platform]
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Agent</h1>
          <p className="text-muted-foreground">Download and install the Deskwise monitoring agent</p>
        </div>
        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Generate Enrollment Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Enrollment Token</DialogTitle>
              <DialogDescription>
                Create a one-time token to enroll a new monitoring agent. The agent will automatically create a new asset during enrollment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="asset">Link to Existing Asset (Optional)</Label>
                <Select value={selectedAsset || 'auto'} onValueChange={(val) => setSelectedAsset(val === 'auto' ? '' : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auto-create new asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-create new asset</SelectItem>
                    {assets.map(asset => (
                      <SelectItem key={asset._id} value={asset._id}>
                        {asset.name} ({asset.assetTag})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Leave as auto-create to automatically create a new asset with the hostname during enrollment
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Expires In</Label>
                <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="72">3 days</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Production server #1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={generateToken} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Token'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Enrollment Tokens */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Active Enrollment Tokens
            </CardTitle>
            <CardDescription>One-time tokens for agent enrollment</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchTokens} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No active enrollment tokens</p>
              <p className="text-xs mt-1">Generate a token to enroll a new monitoring agent</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map(token => {
                  const asset = assets.find(a => a._id === token.assetId)
                  return (
                    <TableRow key={token._id}>
                      <TableCell>
                        {asset ? (
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-xs text-muted-foreground">{asset.assetTag}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {token.token.substring(0, 16)}...
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleCopyText(token.token, token._id)}
                          >
                            {copied === token._id ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(token.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(token.expiresAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {token.notes || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => revokeToken(token._id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Instructions</CardTitle>
          <CardDescription>
            Select a token above, then copy the installation command for your platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="flex items-center gap-3 p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                Generate an enrollment token first to see installation commands
              </div>
            </div>
          ) : (
            <Tabs defaultValue="windows" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="windows">
                  <Server className="w-4 h-4 mr-2" />
                  Windows
                </TabsTrigger>
                <TabsTrigger value="linux">
                  <Server className="w-4 h-4 mr-2" />
                  Linux
                </TabsTrigger>
                <TabsTrigger value="mac">
                  <Server className="w-4 h-4 mr-2" />
                  macOS
                </TabsTrigger>
              </TabsList>

              {tokens.slice(0, 1).map(token => (
                <div key={token._id}>
                  <TabsContent value="windows" className="space-y-3">
                    <div className="relative">
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                        {getInstallCommand(token.token, 'windows')}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyText(getInstallCommand(token.token, 'windows'), 'windows')}
                      >
                        {copied === 'windows' ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <a href="/api/downloads/agent/windows">
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        Download Windows Agent
                      </Button>
                    </a>
                  </TabsContent>

                  <TabsContent value="linux" className="space-y-3">
                    <div className="relative">
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                        {getInstallCommand(token.token, 'linux')}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyText(getInstallCommand(token.token, 'linux'), 'linux')}
                      >
                        {copied === 'linux' ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a href="/api/downloads/agent/linux-amd64">
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Linux (AMD64)
                        </Button>
                      </a>
                      <a href="/api/downloads/agent/linux-arm64">
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download Linux (ARM64)
                        </Button>
                      </a>
                    </div>
                  </TabsContent>

                  <TabsContent value="mac" className="space-y-3">
                    <div className="relative">
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
                        {getInstallCommand(token.token, 'mac')}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyText(getInstallCommand(token.token, 'mac'), 'mac')}
                      >
                        {copied === 'mac' ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a href="/api/downloads/agent/darwin-amd64">
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download macOS (Intel)
                        </Button>
                      </a>
                      <a href="/api/downloads/agent/darwin-arm64">
                        <Button variant="outline" className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download macOS (Apple Silicon)
                        </Button>
                      </a>
                    </div>
                  </TabsContent>
                </div>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Enrollment Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div>
              <div className="font-medium">Generate Token</div>
              <div className="text-muted-foreground">Create a one-time enrollment token (no asset selection needed)</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div>
              <div className="font-medium">Install & Run Agent</div>
              <div className="text-muted-foreground">Download and run agent with the enrollment token</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              3
            </div>
            <div>
              <div className="font-medium">Auto-Create Asset</div>
              <div className="text-muted-foreground">Agent automatically creates asset with hostname and system info</div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              4
            </div>
            <div>
              <div className="font-medium">Start Monitoring</div>
              <div className="text-muted-foreground">Agent begins collecting and sending performance data automatically</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
