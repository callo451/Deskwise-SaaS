'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft, Activity, HardDrive, Cpu, MemoryStick, Network, Download, Trash2,
  MapPin, User, Building2, Calendar, DollarSign, Package, QrCode,
  Barcode as BarcodeIcon, Printer, Monitor, MoreVertical, Edit, Wrench,
  Server, Wifi, Tag
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { RemoteSessionModal } from '@/components/remote-control/RemoteSessionModal'
import { formatRelativeTime, formatDate } from '@/lib/utils'
import Barcode from 'react-barcode'
import { QRCodeSVG } from 'qrcode.react'

interface Asset {
  _id: string
  assetTag: string
  name: string
  category: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  status: 'active' | 'maintenance' | 'retired' | 'disposed'
  assignedTo?: string
  clientId?: string
  location?: string
  purchaseDate?: string
  warrantyExpiry?: string
  purchaseCost?: number
  specifications?: Record<string, string>
  maintenanceSchedule?: string
  lastMaintenanceDate?: string
  lastSeen?: string
  createdAt: string
  updatedAt: string
  systemInfo?: {
    osName?: string
    osVersion?: string
    osBuild?: string
    kernelVersion?: string
    kernelArch?: string
    platform?: string
    platformFamily?: string
    platformVersion?: string
    virtualizationSystem?: string
    virtualizationRole?: string
  }
  hardwareInfo?: {
    manufacturer?: string
    model?: string
    serialNumber?: string
    uuid?: string
    biosVersion?: string
    biosVendor?: string
    biosDate?: string
    cpuModel?: string
    cpuCores?: number
    cpuThreads?: number
    totalMemoryGB?: number
    totalDiskGB?: number
  }
  networkInfo?: {
    primaryMac?: string
    macAddresses?: string[]
    ipAddresses?: string[]
    primaryIp?: string
    fqdn?: string
  }
  capabilities?: {
    remoteControl?: boolean
    screenCapture?: boolean
    inputInjection?: boolean
    webrtcSupported?: boolean
    platform?: string
    agentVersion?: string
  }
}

interface PerformanceData {
  timestamp: string
  performanceData: {
    cpu: {
      usage: number
      temperature?: number
      frequency?: number
    }
    memory: {
      usagePercent: number
      usedBytes: number
      totalBytes: number
      availableBytes: number
    }
    disk: Array<{
      name: string
      usagePercent: number
      totalBytes: number
      usedBytes: number
      freeBytes: number
    }>
    network: {
      totalUsage: number
      interfaces: Array<{
        name: string
        bytesRecvPerSec: number
        bytesSentPerSec: number
      }>
    }
    system: {
      uptime: number
      processCount: number
      threadCount: number
    }
  }
}

export default function AssetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [remoteModalOpen, setRemoteModalOpen] = useState(false)
  const [timeWindow, setTimeWindow] = useState('1hour')
  const [labelType, setLabelType] = useState<'barcode' | 'qrcode'>('barcode')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (params.id) {
      fetchAsset()
      fetchPerformanceData()

      // Poll for performance data every 60 seconds
      const interval = setInterval(fetchPerformanceData, 60000)
      return () => clearInterval(interval)
    }
  }, [params.id, timeWindow])

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setAsset(data.data)
      }
    } catch (error) {
      console.error('Error fetching asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch(`/api/agent/performance?assetId=${params.id}&timeWindow=${timeWindow}&limit=60`, {
        headers: {
          'Authorization': 'Bearer dev-agent-key',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPerformanceData(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/assets/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/assets')
      } else {
        console.error('Failed to delete asset')
        setDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      setDeleting(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>
      case 'maintenance':
        return <Badge variant="secondary" className="bg-yellow-600">Maintenance</Badge>
      case 'retired':
        return <Badge variant="outline">Retired</Badge>
      case 'disposed':
        return <Badge variant="outline">Disposed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMonitoringStatus = () => {
    if (!asset?.lastSeen) {
      return { badge: <Badge variant="outline">No Agent</Badge>, text: 'Monitoring agent not installed' }
    }

    const lastSeenDate = new Date(asset.lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60

    if (diffMinutes < 5) {
      return { badge: <Badge variant="default" className="bg-green-600">●  Online</Badge>, text: 'Receiving live data' }
    } else if (diffMinutes < 30) {
      return { badge: <Badge variant="secondary">Recent</Badge>, text: `Last seen ${formatRelativeTime(asset.lastSeen)}` }
    } else {
      return { badge: <Badge variant="outline" className="text-orange-600">●  Offline</Badge>, text: `Last seen ${formatRelativeTime(asset.lastSeen)}` }
    }
  }

  const handlePrintLabel = () => {
    if (!asset) return

    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    if (labelType === 'barcode') {
      // For barcode, use JsBarcode library
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Asset Label - ${asset.assetTag}</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              @page { size: 4in 2in; margin: 0; }
              @media print { body { margin: 0; padding: 0; } }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              .label-container { width: 4in; height: 2in; border: 2px dashed #ccc; padding: 0.25in; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: white; }
              .label-header { text-align: center; margin-bottom: 0.1in; }
              .label-title { font-size: 10pt; font-weight: bold; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .label-subtitle { font-size: 8pt; color: #666; margin: 2px 0 0 0; }
              .barcode-container { display: flex; justify-content: center; align-items: center; flex: 1; }
              .barcode-container svg { max-width: 100%; max-height: 0.8in; }
              .label-footer { text-align: center; font-size: 7pt; color: #666; border-top: 1px solid #eee; padding-top: 0.05in; margin-top: 0.05in; }
            </style>
          </head>
          <body>
            <div class="label-container">
              <div class="label-header">
                <p class="label-title">${asset.name}</p>
                ${asset.location || asset.category ? `<p class="label-subtitle">${[asset.location, asset.category].filter(Boolean).join(' • ')}</p>` : ''}
              </div>
              <div class="barcode-container">
                <svg id="barcode"></svg>
              </div>
              <div class="label-footer">Asset Tag: ${asset.assetTag}</div>
            </div>
            <script>
              window.onload = function() {
                JsBarcode("#barcode", "${asset.assetTag}", {
                  format: "CODE128",
                  width: 2,
                  height: 60,
                  displayValue: true,
                  fontSize: 14,
                  margin: 10
                });
                setTimeout(function() {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                }, 500);
              };
            </script>
          </body>
        </html>
      `)
    } else {
      // For QR code, generate inline SVG
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Asset Label - ${asset.assetTag}</title>
            <style>
              @page { size: 4in 2in; margin: 0; }
              @media print { body { margin: 0; padding: 0; } }
              body { font-family: Arial, sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              .label-container { width: 4in; height: 2in; border: 2px dashed #ccc; padding: 0.25in; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: white; }
              .label-header { text-align: center; margin-bottom: 0.1in; }
              .label-title { font-size: 10pt; font-weight: bold; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .label-subtitle { font-size: 8pt; color: #666; margin: 2px 0 0 0; }
              .barcode-container { display: flex; justify-content: center; align-items: center; flex: 1; flex-direction: column; }
              .label-footer { text-align: center; font-size: 7pt; color: #666; border-top: 1px solid #eee; padding-top: 0.05in; margin-top: 0.05in; }
            </style>
          </head>
          <body>
            <div class="label-container">
              <div class="label-header">
                <p class="label-title">${asset.name}</p>
                ${asset.location || asset.category ? `<p class="label-subtitle">${[asset.location, asset.category].filter(Boolean).join(' • ')}</p>` : ''}
              </div>
              <div class="barcode-container">
                <div style="background: white; padding: 10px;">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <rect width="120" height="120" fill="white"/>
                    <text x="60" y="60" text-anchor="middle" font-size="8">QR: ${asset.assetTag}</text>
                  </svg>
                </div>
                <p style="font-family: monospace; font-weight: bold; font-size: 12px; margin: 8px 0 0 0;">${asset.assetTag}</p>
              </div>
              <div class="label-footer">Asset Tag: ${asset.assetTag}</div>
            </div>
            <script>
              setTimeout(function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              }, 500);
            </script>
          </body>
        </html>
      `)
    }

    printWindow.document.close()
  }

  const handleDownloadLabel = () => {
    if (!asset) return
    const barcodeElement = document.getElementById('asset-barcode-svg')
    if (!barcodeElement) return

    const svg = barcodeElement.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement('a')
    downloadLink.href = svgUrl
    downloadLink.download = `asset-label-${labelType}-${asset.assetTag}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(svgUrl)
  }

  const generateQRCodeSVG = (text: string) => {
    return `<rect width="120" height="120" fill="white"/><text x="60" y="60" text-anchor="middle" font-size="10">QR: ${text}</text>`
  }

  const latestPerformance = performanceData[0]?.performanceData

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading asset...</p>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Asset Not Found</h2>
        <Link href="/assets">
          <Button>Back to Assets</Button>
        </Link>
      </div>
    )
  }

  const monitoringStatus = getMonitoringStatus()

  return (
    <div className="space-y-6">
      {/* Compact Header with Hero Card */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/assets">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
              {getStatusBadge(asset.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {asset.manufacturer && asset.model ? `${asset.manufacturer} ${asset.model}` : asset.category}
            </p>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="lg">
                <MoreVertical className="w-4 h-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {asset.capabilities?.remoteControl && (
                <>
                  <DropdownMenuItem onClick={() => setRemoteModalOpen(true)}>
                    <Monitor className="w-4 h-4 mr-2" />
                    Remote Control
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => router.push(`/dashboard/assets/${asset._id}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Asset
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handlePrintLabel()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Hero Stats Card - Always Visible */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  Asset Tag
                </div>
                <p className="text-2xl font-bold font-mono">{asset.assetTag}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-4 h-4" />
                  Monitoring
                </div>
                <div className="pt-1">{monitoringStatus.badge}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="text-lg font-medium">{asset.location || <span className="text-sm italic text-muted-foreground">Not Set</span>}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Last Seen
                </div>
                <p className="text-lg font-medium">{asset.lastSeen ? formatRelativeTime(asset.lastSeen) : 'Never'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="labels">Labels</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Asset Management
                </CardTitle>
                <CardDescription>Location, assignment, and ownership</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.assignedTo || <span className="italic">Unassigned</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Client</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.clientId || <span className="italic">Internal</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Summary
                </CardTitle>
                <CardDescription>Cost and warranty information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Purchase Cost</p>
                    <p className="text-xl font-bold">
                      {asset.purchaseCost ? `$${asset.purchaseCost.toFixed(2)}` : <span className="text-sm italic text-muted-foreground">Not Set</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Warranty Expiry</p>
                    <p className="text-sm font-medium">
                      {asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : <span className="italic text-muted-foreground">Not Set</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Technical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Manufacturer</span>
                    <p className="font-medium mt-1">{asset.manufacturer || <span className="italic text-muted-foreground">Not Set</span>}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Model</span>
                    <p className="font-medium mt-1">{asset.model || <span className="italic text-muted-foreground">Not Set</span>}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Serial Number</span>
                    <p className="font-medium font-mono mt-1">{asset.serialNumber || <span className="italic text-muted-foreground">Not Set</span>}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {asset.specifications && Object.keys(asset.specifications).length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Additional Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Object.entries(asset.specifications).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-muted-foreground">{key}</span>
                        <p className="font-medium mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          {latestPerformance ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Real-Time Performance</h2>
                </div>
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="1min">Last 1 Min</option>
                  <option value="5min">Last 5 Min</option>
                  <option value="15min">Last 15 Min</option>
                  <option value="1hour">Last Hour</option>
                  <option value="1day">Last Day</option>
                </select>
              </div>

              {/* Performance Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CPU Card */}
                <Card className="border-l-4 border-l-blue-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      CPU Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold">{latestPerformance.cpu.usage.toFixed(1)}%</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${latestPerformance.cpu.usage}%` }}
                        />
                      </div>
                      {latestPerformance.cpu.temperature && (
                        <p className="text-xs text-muted-foreground">Temp: {latestPerformance.cpu.temperature}°C</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Memory Card */}
                <Card className="border-l-4 border-l-purple-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MemoryStick className="w-4 h-4 text-purple-600" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold">{latestPerformance.memory.usagePercent.toFixed(1)}%</p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 transition-all duration-300"
                          style={{ width: `${latestPerformance.memory.usagePercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(latestPerformance.memory.usedBytes)} / {formatBytes(latestPerformance.memory.totalBytes)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Disk Card */}
                <Card className="border-l-4 border-l-orange-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-orange-600" />
                      Disk Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold">
                        {latestPerformance.disk[0]?.usagePercent.toFixed(1) || 0}%
                      </p>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-600 transition-all duration-300"
                          style={{ width: `${latestPerformance.disk[0]?.usagePercent || 0}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {latestPerformance.disk[0]?.name || 'Primary Disk'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Network Card */}
                <Card className="border-l-4 border-l-green-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Network className="w-4 h-4 text-green-600" />
                      Network Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold">
                        {formatBytes(latestPerformance.network.totalUsage)}
                      </p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>↓ {formatBytes(latestPerformance.network.interfaces[0]?.bytesRecvPerSec || 0)}/s</span>
                        <span>↑ {formatBytes(latestPerformance.network.interfaces[0]?.bytesSentPerSec || 0)}/s</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {latestPerformance.network.interfaces.length} interface(s)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Stats */}
              <Card>
                <CardContent className="py-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <p className="text-lg font-bold">{formatUptime(latestPerformance.system.uptime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processes</p>
                      <p className="text-lg font-bold">{latestPerformance.system.processCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Threads</p>
                      <p className="text-lg font-bold">{latestPerformance.system.threadCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* All Disks */}
              {latestPerformance.disk.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Disk Drives</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {latestPerformance.disk.map((disk, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{disk.name}</span>
                            <span className="text-lg font-bold">{disk.usagePercent.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-600 transition-all duration-300"
                              style={{ width: `${disk.usagePercent}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatBytes(disk.usedBytes)} / {formatBytes(disk.totalBytes)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Network Interfaces */}
              {latestPerformance.network.interfaces.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Network Interfaces</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {latestPerformance.network.interfaces.map((iface, idx) => (
                        <div key={idx} className="p-3 bg-muted rounded-md">
                          <p className="font-medium text-sm mb-2">{iface.name}</p>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>↓ {formatBytes(iface.bytesRecvPerSec)}/s</span>
                            <span>↑ {formatBytes(iface.bytesSentPerSec)}/s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : asset.lastSeen ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No performance data available yet</p>
                <p className="text-sm mt-2">Waiting for agent to report metrics...</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Install Monitoring Agent
                </CardTitle>
                <CardDescription>Get real-time performance data and health monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Download Agent</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Hardware Tab */}
        <TabsContent value="hardware" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Information */}
            {asset.systemInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Operating System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    {asset.systemInfo.platform && (
                      <div>
                        <span className="text-muted-foreground">Platform</span>
                        <p className="font-medium mt-1">{asset.systemInfo.platform}</p>
                      </div>
                    )}
                    {asset.systemInfo.kernelArch && (
                      <div>
                        <span className="text-muted-foreground">Architecture</span>
                        <p className="font-medium mt-1">{asset.systemInfo.kernelArch}</p>
                      </div>
                    )}
                    {asset.systemInfo.osVersion && (
                      <div>
                        <span className="text-muted-foreground">Version</span>
                        <p className="font-medium mt-1">{asset.systemInfo.osVersion}</p>
                      </div>
                    )}
                    {asset.systemInfo.osBuild && (
                      <div>
                        <span className="text-muted-foreground">Build</span>
                        <p className="font-medium mt-1">{asset.systemInfo.osBuild}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hardware Details */}
            {asset.hardwareInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Hardware Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    {asset.hardwareInfo.cpuModel && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">CPU</span>
                        <p className="font-medium mt-1">{asset.hardwareInfo.cpuModel}</p>
                      </div>
                    )}
                    {asset.hardwareInfo.cpuCores && (
                      <div>
                        <span className="text-muted-foreground">CPU Cores</span>
                        <p className="font-medium mt-1">
                          {asset.hardwareInfo.cpuCores} cores
                          {asset.hardwareInfo.cpuThreads && ` (${asset.hardwareInfo.cpuThreads} threads)`}
                        </p>
                      </div>
                    )}
                    {asset.hardwareInfo.totalMemoryGB && (
                      <div>
                        <span className="text-muted-foreground">Memory</span>
                        <p className="font-medium mt-1">{asset.hardwareInfo.totalMemoryGB.toFixed(2)} GB</p>
                      </div>
                    )}
                    {asset.hardwareInfo.totalDiskGB && (
                      <div>
                        <span className="text-muted-foreground">Total Disk</span>
                        <p className="font-medium mt-1">{asset.hardwareInfo.totalDiskGB.toFixed(2)} GB</p>
                      </div>
                    )}
                  </div>
                  {asset.hardwareInfo.serialNumber && (
                    <div className="pt-3 border-t">
                      <span className="text-muted-foreground">Hardware Serial</span>
                      <p className="font-medium font-mono mt-1">{asset.hardwareInfo.serialNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Network Configuration */}
            {asset.networkInfo && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wifi className="w-5 h-5" />
                    Network Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    {asset.networkInfo.primaryIp && (
                      <div>
                        <span className="text-muted-foreground">Primary IP</span>
                        <p className="font-medium font-mono mt-1">{asset.networkInfo.primaryIp}</p>
                      </div>
                    )}
                    {asset.networkInfo.primaryMac && (
                      <div>
                        <span className="text-muted-foreground">Primary MAC</span>
                        <p className="font-medium font-mono text-xs mt-1">{asset.networkInfo.primaryMac}</p>
                      </div>
                    )}
                    {asset.networkInfo.fqdn && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">FQDN</span>
                        <p className="font-medium font-mono text-xs mt-1">{asset.networkInfo.fqdn}</p>
                      </div>
                    )}
                  </div>
                  {asset.networkInfo.ipAddresses && asset.networkInfo.ipAddresses.length > 1 && (
                    <div className="pt-3 border-t">
                      <span className="text-muted-foreground">All IP Addresses</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {asset.networkInfo.ipAddresses.map((ip, idx) => (
                          <div key={idx} className="font-mono text-xs bg-muted px-2 py-1 rounded">{ip}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Last Maintenance</p>
                    <p className="text-lg font-medium">
                      {asset.lastMaintenanceDate ? formatDate(asset.lastMaintenanceDate) : <span className="text-sm italic text-muted-foreground">Never</span>}
                    </p>
                  </div>
                  {asset.maintenanceSchedule && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Schedule</p>
                      <p className="text-lg font-medium">{asset.maintenanceSchedule}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Warranty & Lifecycle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Purchase Date</p>
                    <p className="text-sm font-medium">
                      {asset.purchaseDate ? formatDate(asset.purchaseDate) : <span className="italic text-muted-foreground">Not Set</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Warranty Expiry</p>
                    <p className="text-sm font-medium">
                      {asset.warrantyExpiry ? formatDate(asset.warrantyExpiry) : <span className="italic text-muted-foreground">Not Set</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Labels Tab */}
        <TabsContent value="labels" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Asset Label & Barcode</CardTitle>
                  <CardDescription>Generate printable labels for asset tracking</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={labelType === 'barcode' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLabelType('barcode')}
                  >
                    <BarcodeIcon className="w-4 h-4 mr-2" />
                    Barcode
                  </Button>
                  <Button
                    variant={labelType === 'qrcode' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLabelType('qrcode')}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Label Preview */}
                <div className="md:col-span-2">
                  <div id="asset-barcode-svg" className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-2 border-dashed rounded-lg p-8 flex items-center justify-center min-h-[200px]">
                    {labelType === 'barcode' ? (
                      <div className="flex flex-col items-center gap-4">
                        <Barcode
                          value={asset.assetTag}
                          format="CODE128"
                          width={2}
                          height={60}
                          displayValue={true}
                          fontSize={14}
                          margin={10}
                          background="transparent"
                        />
                        <div className="text-center">
                          <p className="text-sm font-semibold">{asset.name}</p>
                          {(asset.location || asset.category) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {[asset.location, asset.category].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <QRCodeSVG
                          value={asset.assetTag}
                          size={120}
                          level="H"
                          includeMargin={true}
                          bgColor="transparent"
                        />
                        <div className="text-center">
                          <p className="text-sm font-bold font-mono">{asset.assetTag}</p>
                          <p className="text-sm font-semibold mt-1">{asset.name}</p>
                          {(asset.location || asset.category) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {[asset.location, asset.category].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Label Details</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Format: {labelType === 'barcode' ? 'CODE128' : 'QR Code'}</p>
                      <p>• Size: 4" × 2"</p>
                      <p>• Standard printer compatible</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button className="w-full" onClick={handlePrintLabel}>
                      <Printer className="w-4 h-4 mr-2" />
                      Print Label
                    </Button>
                    <Button variant="outline" className="w-full" onClick={handleDownloadLabel}>
                      <Download className="w-4 h-4 mr-2" />
                      Download SVG
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{asset.name}</strong> ({asset.assetTag})?
              This action cannot be undone and will remove all associated performance data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete Asset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remote Control Modal */}
      {asset.capabilities?.remoteControl && (
        <RemoteSessionModal
          open={remoteModalOpen}
          onClose={() => setRemoteModalOpen(false)}
          assetId={asset._id}
          assetName={asset.name}
        />
      )}
    </div>
  )
}
