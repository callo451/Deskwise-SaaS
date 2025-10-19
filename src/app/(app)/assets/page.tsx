'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  Server,
  Wifi,
  Filter,
  X,
  FileDown,
  Edit,
  Trash2,
  MoreVertical,
  MapPin,
  User,
  Tag as TagIcon,
  Monitor,
  Code,
  Terminal,
  BookOpen
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { SettingsHeader } from '@/components/settings/settings-header'

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
  lastSeen?: string
  createdAt: string
  updatedAt: string
  categoryColor?: string
  fullLocationPath?: string
  assignedToName?: string
  isAgentMonitored?: boolean
}

interface AssetStats {
  total: number
  active: number
  maintenance: number
  retired: number
  byCategory: Record<string, number>
}

interface AssetCategory {
  _id: string
  name: string
  code: string
  color?: string
}

interface AssetLocation {
  _id: string
  name: string
  fullPath?: string
}

export default function AssetsPage() {
  const { data: session } = useSession()
  const [assets, setAssets] = useState<Asset[]>([])
  const [stats, setStats] = useState<AssetStats | null>(null)
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [locations, setLocations] = useState<AssetLocation[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Bulk selection
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [categoryFilter, statusFilter, locationFilter, assignedToFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchAssets(),
        fetchStats(),
        fetchCategories(),
        fetchLocations()
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams()

      if (categoryFilter.length > 0) {
        categoryFilter.forEach(cat => params.append('category', cat))
      }
      if (statusFilter.length > 0) {
        statusFilter.forEach(status => params.append('status', status))
      }
      if (locationFilter) params.set('location', locationFilter)
      if (assignedToFilter) params.set('assignedTo', assignedToFilter)
      if (search) params.set('search', search)

      const response = await fetch(`/api/assets?${params}`)
      const data = await response.json()

      if (data.success) {
        setAssets(data.data)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/assets/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/assets/categories')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/assets/locations')
      const data = await response.json()

      if (data.success) {
        setLocations(data.data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleSearch = () => {
    fetchAssets()
  }

  const handleClearFilters = () => {
    setSearch('')
    setCategoryFilter([])
    setStatusFilter([])
    setLocationFilter('')
    setAssignedToFilter('')
  }

  const handleExportCSV = () => {
    const csvData = assets.map(asset => ({
      'Asset Tag': asset.assetTag,
      'Name': asset.name,
      'Category': asset.category,
      'Manufacturer': asset.manufacturer || '',
      'Model': asset.model || '',
      'Serial Number': asset.serialNumber || '',
      'Status': asset.status,
      'Location': asset.fullLocationPath || asset.location || '',
      'Assigned To': asset.assignedToName || asset.assignedTo || 'Unassigned',
      'Last Seen': asset.lastSeen ? new Date(asset.lastSeen).toLocaleString() : 'Never',
      'Created': new Date(asset.createdAt).toLocaleDateString()
    }))

    const headers = Object.keys(csvData[0] || {})
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assets-export-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAssets([])
    } else {
      setSelectedAssets(assets.map(a => a._id))
    }
    setSelectAll(!selectAll)
  }

  const handleSelectAsset = (assetId: string) => {
    setSelectedAssets(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    )
  }

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return

    try {
      const response = await fetch(`/api/assets/${assetToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
        setDeleteDialogOpen(false)
        setAssetToDelete(null)
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any, icon: any, color: string }> = {
      active: {
        variant: 'default',
        icon: CheckCircle2,
        color: 'text-green-600'
      },
      maintenance: {
        variant: 'secondary',
        icon: AlertTriangle,
        color: 'text-orange-600'
      },
      retired: {
        variant: 'outline',
        icon: null,
        color: 'text-gray-600'
      },
      disposed: {
        variant: 'outline',
        icon: null,
        color: 'text-gray-400'
      }
    }

    const config = statusConfig[status] || statusConfig.active
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getMonitoringBadge = (lastSeen?: string) => {
    if (!lastSeen) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Monitor className="w-3 h-3" />
          Manual
        </Badge>
      )
    }

    const lastSeenDate = new Date(lastSeen)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / 1000 / 60

    if (diffMinutes < 5) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <Activity className="w-3 h-3" />
          Online
        </Badge>
      )
    } else if (diffMinutes < 30) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Recent
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-orange-600">
          <AlertTriangle className="w-3 h-3" />
          Offline
        </Badge>
      )
    }
  }

  const getCategoryBadge = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName)
    const color = category?.color || '#6B7280'

    return (
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span>{categoryName}</span>
      </div>
    )
  }

  // Calculate monitoring statistics
  const monitoredAssets = assets.filter(a => a.lastSeen)
  const onlineAssets = assets.filter(a => {
    if (!a.lastSeen) return false
    const diffMinutes = (new Date().getTime() - new Date(a.lastSeen).getTime()) / 1000 / 60
    return diffMinutes < 5
  })
  const offlineAssets = assets.filter(a => {
    if (!a.lastSeen) return false
    const diffMinutes = (new Date().getTime() - new Date(a.lastSeen).getTime()) / 1000 / 60
    return diffMinutes >= 30
  })

  const hasActiveFilters = search || categoryFilter.length > 0 || statusFilter.length > 0 || locationFilter || assignedToFilter
  const totalAssets = stats?.total || 0
  const filteredCount = assets.length

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Asset Management"
        description="Track, monitor, and manage your IT infrastructure inventory"
        icon={<HardDrive className="h-6 w-6 text-gray-600" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link href="/assets/new">
              <Button size="sm" className="bg-gray-600 hover:bg-gray-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
            </Link>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-700">Total Assets</CardDescription>
            <CardTitle className="text-3xl text-gray-900">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {stats?.active || 0}
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monitored</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {monitoredAssets.length}
              <Server className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700">Online</CardDescription>
            <CardTitle className="text-3xl text-green-600 flex items-center gap-2">
              {onlineAssets.length}
              <Wifi className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-orange-700">Offline</CardDescription>
            <CardTitle className="text-3xl text-orange-600 flex items-center gap-2">
              {offlineAssets.length}
              <AlertTriangle className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="agent" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Monitoring Agent
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          {/* Search and Filters Toolbar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                {/* Primary Search Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, asset tag, serial number, or manufacturer..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className={showFilters ? 'bg-muted' : ''}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>

                {/* Advanced Filters (Collapsible) */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t">
                    <Select
                      value={categoryFilter.length === 1 ? categoryFilter[0] : 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setCategoryFilter([])
                        } else {
                          setCategoryFilter([value])
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: cat.color || '#6B7280' }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={locationFilter || 'all'} onValueChange={(value) => setLocationFilter(value === 'all' ? '' : value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc._id} value={loc._id}>
                            {loc.fullPath || loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={statusFilter.length === 1 ? statusFilter[0] : 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          setStatusFilter([])
                        } else {
                          setStatusFilter([value])
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="disposed">Disposed</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Assigned to..."
                        value={assignedToFilter}
                        onChange={(e) => setAssignedToFilter(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                )}

                {/* Filter Summary */}
                {hasActiveFilters && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>
                      Showing {filteredCount} of {totalAssets} assets
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedAssets.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedAssets.length} asset{selectedAssets.length > 1 ? 's' : ''} selected
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setSelectedAssets([])}>
                    Clear
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location
                  </Button>
                  <Button variant="outline" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Assign
                  </Button>
                  <Button variant="outline" size="sm">
                    <TagIcon className="w-4 h-4 mr-2" />
                    Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assets Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {filteredCount} Asset{filteredCount !== 1 ? 's' : ''}
                  </CardTitle>
                  <CardDescription>
                    Manage your IT infrastructure inventory
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectAll}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Asset Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Monitoring</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Server className="w-8 h-8 text-muted-foreground animate-pulse" />
                            <p className="text-sm text-muted-foreground">Loading assets...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : assets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <div className="flex flex-col items-center gap-4">
                            <HardDrive className="w-12 h-12 text-muted-foreground opacity-20" />
                            <div>
                              <p className="text-muted-foreground mb-2">
                                {hasActiveFilters ? 'No assets match your filters' : 'No assets found'}
                              </p>
                              {!hasActiveFilters && (
                                <>
                                  <p className="text-sm text-muted-foreground mb-4">Get started by adding your first asset</p>
                                  <Link href="/assets/new">
                                    <Button className="bg-gray-600 hover:bg-gray-700">
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Your First Asset
                                    </Button>
                                  </Link>
                                </>
                              )}
                              {hasActiveFilters && (
                                <Button variant="outline" onClick={handleClearFilters}>
                                  <X className="w-4 h-4 mr-2" />
                                  Clear Filters
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      assets.map((asset) => (
                        <TableRow key={asset._id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedAssets.includes(asset._id)}
                              onCheckedChange={() => handleSelectAsset(asset._id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Link href={`/assets/${asset._id}`}>
                              <Badge variant="outline" className="font-mono hover:bg-primary/10 cursor-pointer">
                                {asset.assetTag}
                              </Badge>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/assets/${asset._id}`} className="hover:underline">
                              <div>
                                <p className="font-medium">{asset.name}</p>
                                {asset.manufacturer && asset.model && (
                                  <p className="text-xs text-muted-foreground">
                                    {asset.manufacturer} {asset.model}
                                  </p>
                                )}
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            {getCategoryBadge(asset.category)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">
                                {asset.fullLocationPath || asset.location || 'Not Set'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {asset.assignedToName || asset.assignedTo ? (
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {asset.assignedToName || asset.assignedTo}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">Unassigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(asset.status)}</TableCell>
                          <TableCell>{getMonitoringBadge(asset.lastSeen)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {asset.lastSeen ? formatRelativeTime(asset.lastSeen) : 'Never'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/assets/${asset._id}`}>
                                    <HardDrive className="w-4 h-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/assets/${asset._id}/edit`}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setAssetToDelete(asset._id)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Agent Tab */}
        <TabsContent value="agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Real-Time Asset Monitoring
              </CardTitle>
              <CardDescription>
                Download and install the Deskwise monitoring agent to track performance metrics in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <Activity className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-semibold mb-1">Live Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor CPU, memory, disk, and network usage in real-time
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-orange-600 mb-2" />
                  <h3 className="font-semibold mb-1">Proactive Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get notified before issues impact your operations
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <Server className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-semibold mb-1">Auto Discovery</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect and register new assets
                  </p>
                </div>
              </div>

              {/* Download Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Download Agent
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/assets/agent">
                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium mb-1">Download & Install</p>
                            <p className="text-sm text-muted-foreground">
                              Get detailed installation instructions
                            </p>
                          </div>
                          <Download className="h-6 w-6 text-primary" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                  <a href="/api/downloads/agent/windows" download>
                    <Card className="cursor-pointer hover:border-blue-600 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium mb-1">Quick Download</p>
                            <p className="text-sm text-muted-foreground">
                              Windows x64 agent (latest)
                            </p>
                          </div>
                          <Server className="h-6 w-6 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </div>
              </div>

              {/* Quick Start Guide */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Start
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Download the agent</p>
                      <p className="text-sm text-muted-foreground">
                        Choose the appropriate version for your operating system
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Install and configure</p>
                      <p className="text-sm text-muted-foreground">
                        Run the installer and enter your organization credentials
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Start monitoring</p>
                      <p className="text-sm text-muted-foreground">
                        Assets will appear here automatically with real-time metrics
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Link */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <Terminal className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium mb-1">Need help?</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      View complete documentation, API reference, and troubleshooting guides
                    </p>
                    <Link href="/assets/agent">
                      <Button variant="outline" size="sm">
                        <Code className="w-4 h-4 mr-2" />
                        View Documentation
                      </Button>
                    </Link>
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
              Are you sure you want to delete this asset? This action cannot be undone and will permanently remove the asset and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssetToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAsset}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
