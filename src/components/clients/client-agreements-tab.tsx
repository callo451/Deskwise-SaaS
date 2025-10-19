'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Shield,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  FileSignature,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { AgreementFormWizard } from '@/components/agreements/agreement-form-wizard'

interface ServiceAgreement {
  _id: string
  agreementNumber: string
  clientId: string
  clientName: string
  name: string
  description?: string
  type: 'msa' | 'sla' | 'sow' | 'maintenance'
  status: 'draft' | 'pending_review' | 'pending_approval' | 'pending_signature' | 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'renewed'
  startDate: string
  endDate?: string
  signedDate?: string
  sla: {
    tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'custom'
    responseTime: { critical: number; high: number; medium: number; low: number }
    resolutionTime: { critical: number; high: number; medium: number; low: number }
    availability?: number
  }
  billing: {
    frequency: 'monthly' | 'quarterly' | 'annually'
    amount: number
    currency: string
    nextBillingDate: string
  }
  metrics?: {
    slaComplianceRate: number
    totalTickets: number
    totalBreaches: number
    totalRevenue: number
  }
  renewal: {
    autoRenew: boolean
    renewalNoticeDays: number
  }
  createdAt: string
  updatedAt: string
}

interface ClientAgreementsTabProps {
  clientId: string
  clientName: string
}

const agreementTypeLabels = {
  msa: 'Master Service Agreement',
  sla: 'Service Level Agreement',
  sow: 'Statement of Work',
  maintenance: 'Maintenance Agreement',
}

const agreementTypeColors = {
  msa: 'bg-blue-500/10 text-blue-600 border-blue-200',
  sla: 'bg-purple-500/10 text-purple-600 border-purple-200',
  sow: 'bg-green-500/10 text-green-600 border-green-200',
  maintenance: 'bg-orange-500/10 text-orange-600 border-orange-200',
}

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  pending_review: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  pending_approval: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  pending_signature: 'bg-blue-500/10 text-blue-600 border-blue-200',
  active: 'bg-green-500/10 text-green-600 border-green-200',
  expiring_soon: 'bg-orange-500/10 text-orange-600 border-orange-200',
  expired: 'bg-red-500/10 text-red-600 border-red-200',
  terminated: 'bg-red-500/10 text-red-600 border-red-200',
  renewed: 'bg-green-500/10 text-green-600 border-green-200',
}

const slaTierColors = {
  platinum: 'bg-purple-500/10 text-purple-600 border-purple-200',
  gold: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  silver: 'bg-gray-500/10 text-gray-600 border-gray-200',
  bronze: 'bg-orange-500/10 text-orange-600 border-orange-200',
  custom: 'bg-blue-500/10 text-blue-600 border-blue-200',
}

export function ClientAgreementsTab({ clientId, clientName }: ClientAgreementsTabProps) {
  const { toast } = useToast()
  const [agreements, setAgreements] = useState<ServiceAgreement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingAgreement, setDeletingAgreement] = useState<ServiceAgreement | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [editingAgreement, setEditingAgreement] = useState<ServiceAgreement | null>(null)

  useEffect(() => {
    fetchAgreements()
  }, [clientId])

  const fetchAgreements = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ clientId })
      const response = await fetch(`/api/agreements?${params}`)
      const data = await response.json()

      if (data.success) {
        setAgreements(data.data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch agreements',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching agreements:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAgreement) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/agreements/${deletingAgreement._id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Agreement terminated successfully',
        })
        fetchAgreements()
        setDeleteDialogOpen(false)
        setDeletingAgreement(null)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to terminate agreement',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting agreement:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRenew = async (agreement: ServiceAgreement) => {
    try {
      const response = await fetch(`/api/agreements/${agreement._id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Agreement renewed successfully',
        })
        fetchAgreements()
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to renew agreement',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error renewing agreement:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const getDaysUntilExpiry = (endDate?: string) => {
    if (!endDate) return null
    const days = Math.ceil(
      (new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return days
  }

  // Filter agreements
  const filteredAgreements = agreements.filter((agreement) => {
    const matchesSearch =
      searchQuery === '' ||
      agreement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.agreementNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || agreement.status === statusFilter
    const matchesType = typeFilter === 'all' || agreement.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate summary stats
  const activeAgreements = agreements.filter((a) => a.status === 'active').length
  const expiringAgreements = agreements.filter((a) => a.status === 'expiring_soon').length
  const totalMRR = agreements
    .filter((a) => a.status === 'active' && a.billing.frequency === 'monthly')
    .reduce((sum, a) => sum + a.billing.amount, 0)
  const avgSLACompliance =
    agreements.length > 0
      ? Math.round(
          agreements
            .filter((a) => a.metrics?.slaComplianceRate)
            .reduce((sum, a) => sum + (a.metrics?.slaComplianceRate || 0), 0) /
            agreements.filter((a) => a.metrics?.slaComplianceRate).length
        )
      : 0

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading agreements...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {agreements.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAgreements}</div>
              <p className="text-xs text-muted-foreground">
                {expiringAgreements} expiring soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Recurring</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalMRR, agreements[0]?.billing.currency)}
              </div>
              <p className="text-xs text-muted-foreground">From active agreements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgSLACompliance}%</div>
              <p className="text-xs text-muted-foreground">Average across all agreements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agreements</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agreements.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Service Agreements</CardTitle>
              <CardDescription>
                Manage service agreements and SLAs for {clientName}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingAgreement(null)
                setWizardOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Agreement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          {agreements.length > 0 && (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search agreements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="msa">MSA</SelectItem>
                  <SelectItem value="sla">SLA</SelectItem>
                  <SelectItem value="sow">SOW</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Agreements Table */}
          {filteredAgreements.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agreement</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>SLA Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgreements.map((agreement) => {
                    const daysUntilExpiry = getDaysUntilExpiry(agreement.endDate)

                    return (
                      <TableRow key={agreement._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{agreement.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {agreement.agreementNumber}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={agreementTypeColors[agreement.type]}>
                            {agreementTypeLabels[agreement.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={slaTierColors[agreement.sla.tier]}>
                            {agreement.sla.tier.charAt(0).toUpperCase() +
                              agreement.sla.tier.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={statusColors[agreement.status]}>
                              {agreement.status.replace(/_/g, ' ')}
                            </Badge>
                            {daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{formatDate(agreement.startDate)}</p>
                            {agreement.endDate && (
                              <p className="text-muted-foreground">
                                to {formatDate(agreement.endDate)}
                              </p>
                            )}
                            {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {daysUntilExpiry} days left
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {formatCurrency(agreement.billing.amount, agreement.billing.currency)}
                            </p>
                            <p className="text-muted-foreground capitalize">
                              {agreement.billing.frequency}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {agreement.metrics ? (
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <span
                                  className={
                                    agreement.metrics.slaComplianceRate >= 95
                                      ? 'text-green-600'
                                      : agreement.metrics.slaComplianceRate >= 90
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                  }
                                >
                                  {agreement.metrics.slaComplianceRate}%
                                </span>
                                <span className="text-muted-foreground">SLA</span>
                              </div>
                              <p className="text-muted-foreground">
                                {agreement.metrics.totalTickets} tickets
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No data</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingAgreement(agreement)
                                  setWizardOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {(agreement.status === 'active' || agreement.status === 'expiring_soon') && (
                                <DropdownMenuItem onClick={() => handleRenew(agreement)}>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Renew
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeletingAgreement(agreement)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Terminate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed">
              <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {agreements.length === 0 ? 'No Agreements Yet' : 'No Matching Agreements'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                {agreements.length === 0
                  ? 'Create your first service agreement to establish SLAs and billing terms'
                  : 'Try adjusting your filters to see more agreements'}
              </p>
              {agreements.length === 0 && (
                <Button
                  onClick={() => {
                    setEditingAgreement(null)
                    setWizardOpen(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Agreement
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Agreement?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to terminate &quot;{deletingAgreement?.name}&quot;? This action
              will set the agreement status to terminated. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Terminating...' : 'Terminate Agreement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Agreement Form Wizard */}
      <AgreementFormWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        clientId={clientId}
        clientName={clientName}
        agreement={editingAgreement}
        onSuccess={() => {
          fetchAgreements()
          setWizardOpen(false)
          setEditingAgreement(null)
        }}
      />
    </div>
  )
}
