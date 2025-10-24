'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users,
  Search,
  Plus,
  Building2,
  TrendingUp,
  DollarSign,
  Heart,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Globe,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface Client {
  _id: string
  name: string
  displayName?: string
  email?: string
  phone?: string
  website?: string
  status: 'prospect' | 'active' | 'inactive' | 'churned'
  monthlyRecurringRevenue: number
  totalRevenue: number
  healthScore: number
  isParent: boolean
  contacts: any[]
  address?: {
    city?: string
    state?: string
    country?: string
  }
  createdAt: string
  lastActivityAt?: string
}

interface ClientMetrics {
  totalClients: number
  activeClients: number
  prospectClients: number
  inactiveClients: number
  totalMRR: number
  totalRevenue: number
  averageHealthScore: number
}

const statusColors = {
  prospect: 'bg-blue-500/10 text-blue-600 border-blue-200',
  active: 'bg-green-500/10 text-green-600 border-green-200',
  inactive: 'bg-gray-500/10 text-gray-600 border-gray-200',
  churned: 'bg-red-500/10 text-red-600 border-red-200',
}

const getHealthScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

const getHealthScoreBadge = (score: number) => {
  if (score >= 80) return 'bg-green-500/10 text-green-600 border-green-200'
  if (score >= 60) return 'bg-yellow-500/10 text-yellow-600 border-yellow-200'
  if (score >= 40) return 'bg-orange-500/10 text-orange-600 border-orange-200'
  return 'bg-red-500/10 text-red-600 border-red-200'
}

export default function ClientsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [clients, setClients] = useState<Client[]>([])
  const [metrics, setMetrics] = useState<ClientMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchClients()
    fetchMetrics()
  }, [statusFilter])

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/clients?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setClients(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/clients/stats')
      const data = await response.json()

      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchClients()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-muted-foreground text-base mt-1">
              Manage your client relationships and accounts
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/clients/new')} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Add Client
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="bg-gradient-to-r from-accent/50 to-accent/20 border-b-2 pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Total Clients</CardDescription>
                <div className="p-1.5 bg-blue-500/10 rounded-md">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold">{metrics.totalClients}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.activeClients} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="border-b-2 border-dashed pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Monthly Revenue</CardDescription>
                <div className="p-1.5 bg-green-500/10 rounded-md">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold">
                {formatCurrency(metrics.totalMRR)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Per month
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="border-b-2 border-dashed pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Total Revenue</CardDescription>
                <div className="p-1.5 bg-emerald-500/10 rounded-md">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All-time
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <CardHeader className="border-b-2 border-dashed pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-medium">Avg Health Score</CardDescription>
                <div className="p-1.5 bg-pink-500/10 rounded-md">
                  <Heart className="w-4 h-4 text-pink-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className={cn("text-3xl font-bold", getHealthScoreColor(metrics.averageHealthScore))}>
                {Math.round(metrics.averageHealthScore)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Out of 100
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2">
          <CardTitle className="text-lg font-semibold">Client List</CardTitle>
          <CardDescription className="text-sm mt-1">
            View and manage all your clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients by name, email, or display name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Cards */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No clients found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first client'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/clients/new')} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {clients.map((client) => (
                <Card
                  key={client._id}
                  className="border-2 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-primary/30"
                  onClick={() => router.push(`/clients/${client._id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {client.displayName || client.name}
                          </h3>
                          <Badge variant="outline" className={statusColors[client.status]}>
                            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                          </Badge>
                          {client.isParent && (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
                              Parent Account
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span>{client.email || 'No email'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span>{client.phone || 'No phone'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Globe className="w-4 h-4" />
                            <span>{client.website || 'No website'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {client.address?.city && client.address?.state
                                ? `${client.address.city}, ${client.address.state}`
                                : 'No location'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4">
                          <div>
                            <p className="text-xs text-muted-foreground">MRR</p>
                            <p className="text-sm font-semibold">
                              {formatCurrency(client.monthlyRecurringRevenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total Revenue</p>
                            <p className="text-sm font-semibold">
                              {formatCurrency(client.totalRevenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Health Score</p>
                            <div className="flex items-center gap-1">
                              <Heart className={`w-3 h-3 ${getHealthScoreColor(client.healthScore)}`} />
                              <p className={`text-sm font-semibold ${getHealthScoreColor(client.healthScore)}`}>
                                {client.healthScore}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Contacts</p>
                            <p className="text-sm font-semibold">
                              {client.contacts?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/clients/${client._id}`)
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/clients/${client._id}/edit`)
                          }}>
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
