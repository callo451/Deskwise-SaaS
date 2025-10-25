'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useToast } from '@/hooks/use-toast'
import { History, RotateCcw, Loader2, Download, Trash2, AlertCircle } from 'lucide-react'
import { BrandingVersion } from '@/lib/types'
import { EmptyState } from '@/components/settings/empty-state'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BrandingHistoryProps {
  onRollback: () => Promise<void>
}

/**
 * Branding History Component
 *
 * Displays version history of branding changes with:
 * - Version number
 * - Modified by (user name)
 * - Modified date
 * - Change description
 * - Rollback functionality
 * - Export/download capability
 */
export function BrandingHistory({ onRollback }: BrandingHistoryProps) {
  const [versions, setVersions] = useState<BrandingVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [rollbackVersion, setRollbackVersion] = useState<BrandingVersion | null>(null)
  const [exportingVersion, setExportingVersion] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch version history
  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/branding/history')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch history')
      }

      setVersions(data.data || [])
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to fetch history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Handle rollback
  const handleRollback = async () => {
    if (!rollbackVersion) return

    try {
      const response = await fetch('/api/branding/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: rollbackVersion.version }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to rollback')
      }

      toast({
        title: 'Rollback Successful',
        description: `Branding has been restored to version ${rollbackVersion.version}.`,
      })

      await onRollback()
      await fetchHistory()
      setRollbackVersion(null)

      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      toast({
        title: 'Rollback Failed',
        description: err instanceof Error ? err.message : 'Failed to rollback',
        variant: 'destructive',
      })
    }
  }

  // Handle export
  const handleExport = async (version: BrandingVersion) => {
    setExportingVersion(version._id)
    try {
      const response = await fetch(`/api/branding/export?version=${version.version}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to export')
      }

      // Download JSON file
      const jsonStr = JSON.stringify(data.data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `branding-v${version.version}-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Successful',
        description: `Version ${version.version} has been exported.`,
      })
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: err instanceof Error ? err.message : 'Failed to export',
        variant: 'destructive',
      })
    } finally {
      setExportingVersion(null)
    }
  }

  // Format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown'
    const d = new Date(date)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-pink-600" />
                Version History
              </CardTitle>
              <CardDescription>
                Track all changes to your branding configuration and rollback to previous versions
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Warning Alert */}
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Rolling back to a previous version will restore all branding settings from that version. This action creates a new version with the restored settings.
            </AlertDescription>
          </Alert>

          {/* Version History Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : versions.length === 0 ? (
            <EmptyState
              icon={History}
              title="No Version History"
              description="Version history will appear here as you make changes to your branding."
            />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Modified By</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version._id}>
                      <TableCell className="font-semibold">
                        v{version.version}
                      </TableCell>
                      <TableCell>{version.modifiedByName || 'Unknown'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(version.createdAt)}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm truncate">
                          {version.changeDescription || 'No description'}
                        </p>
                      </TableCell>
                      <TableCell>
                        {version.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExport(version)}
                            disabled={exportingVersion === version._id}
                            title="Export this version"
                          >
                            {exportingVersion === version._id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </Button>
                          {!version.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRollbackVersion(version)}
                              title="Rollback to this version"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Stats */}
          {versions.length > 0 && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Versions</p>
                <p className="text-2xl font-bold">{versions.length}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Version</p>
                <p className="text-2xl font-bold">
                  v{versions.find((v) => v.isActive)?.version || versions[0]?.version || 1}
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Last Modified</p>
                <p className="text-base font-semibold">
                  {formatDate(versions[0]?.createdAt)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rollback Confirmation Dialog */}
      <AlertDialog open={!!rollbackVersion} onOpenChange={() => setRollbackVersion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rollback</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to rollback to version {rollbackVersion?.version}?
              <br />
              <br />
              <strong>This will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Restore all branding settings from version {rollbackVersion?.version}</li>
                <li>Create a new version with the restored settings</li>
                <li>Reload the page to apply changes</li>
              </ul>
              <br />
              <strong>Modified by:</strong> {rollbackVersion?.modifiedByName || 'Unknown'}
              <br />
              <strong>Date:</strong> {formatDate(rollbackVersion?.createdAt)}
              {rollbackVersion?.changeDescription && (
                <>
                  <br />
                  <strong>Description:</strong> {rollbackVersion.changeDescription}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRollback}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Rollback to v{rollbackVersion?.version}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
