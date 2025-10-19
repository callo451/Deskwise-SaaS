'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Heart,
  Users,
  FileText,
  Package,
  Ticket,
  Edit,
  Trash2,
  AlertTriangle,
  Plus,
  Search,
  Server,
  Monitor,
  HardDrive,
  Filter,
  X,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { ClientFormModal } from '@/components/clients/client-form-modal'
import { ContactFormDialog } from '@/components/clients/contact-form-dialog'
import { ClientAgreementsTab } from '@/components/clients/client-agreements-tab'
import { useToast } from '@/hooks/use-toast'

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
  lifetimeValue: number
  healthScore: number
  isParent: boolean
  contacts: ClientContact[]
  address?: {
    street?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  industry?: string
  companySize?: string
  paymentTerms: number
  currency: string
  taxRate: number
  timezone: string
  language: string
  preferences?: {
    portalEnabled: boolean
    autoTicketCreation: boolean
    billingNotifications: boolean
  }
  tags?: string[]
  createdAt: string
  updatedAt: string
  lastActivityAt?: string
  onboardedAt?: string
}

interface ClientContact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  mobile?: string
  role?: string
  department?: string
  isPrimary: boolean
  portalAccess: boolean
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

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string>('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Contact management state
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ClientContact | undefined>(undefined)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)

  useEffect(() => {
    params.then((p) => {
      setClientId(p.id)
      // Don't fetch if creating a new client
      if (p.id !== 'new') {
        fetchClient(p.id)
      } else {
        setLoading(false)
      }
    })
  }, [])

  const fetchClient = async (id: string) => {
    try {
      const response = await fetch(`/api/clients/${id}`)
      const data = await response.json()

      if (data.success) {
        setClient(data.data)
      } else {
        router.push('/clients')
      }
    } catch (error) {
      console.error('Failed to fetch client:', error)
      router.push('/clients')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: client?.currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleEditSuccess = () => {
    // Refetch client data after successful edit
    if (clientId) {
      fetchClient(clientId)
    }
    toast({
      title: 'Success',
      description: 'Client updated successfully',
    })
  }

  const handleDelete = async () => {
    if (!client) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/clients/${client._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Client deleted successfully',
        })
        // Redirect to clients list after successful deletion
        router.push('/clients')
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete client',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Delete client error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Contact management handlers
  const handleAddContact = () => {
    setEditingContact(undefined)
    setIsContactDialogOpen(true)
  }

  const handleEditContact = (contact: ClientContact) => {
    setEditingContact(contact)
    setIsContactDialogOpen(true)
  }

  const handleContactSuccess = () => {
    // Refetch client data after successful contact save
    if (clientId) {
      fetchClient(clientId)
    }
    toast({
      title: 'Success',
      description: editingContact ? 'Contact updated successfully' : 'Contact added successfully',
    })
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!client) return

    try {
      const response = await fetch(`/api/clients/${client._id}/contacts/${contactId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Contact deleted successfully',
        })
        // Refetch client data
        fetchClient(clientId)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete contact',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Delete contact error:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setDeletingContactId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/clients')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {client.displayName || client.name}
              </h1>
              <Badge variant="outline" className={statusColors[client.status]}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
              {client.isParent && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
                  Parent Account
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Client since {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Recurring Revenue
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(client.monthlyRecurringRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(client.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime Value
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(client.lifetimeValue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Health Score
            </CardTitle>
            <Heart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(client.healthScore)}`}>
              {client.healthScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic client details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Legal Name</p>
                    <p className="text-sm text-muted-foreground">{client.name}</p>
                  </div>
                </div>

                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{client.phone}</p>
                    </div>
                  </div>
                )}

                {client.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Website</p>
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {client.website}
                      </a>
                    </div>
                  </div>
                )}

                {client.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {client.address.street && `${client.address.street}, `}
                        {client.address.city && `${client.address.city}, `}
                        {client.address.state} {client.address.postalCode}
                        {client.address.country && `, ${client.address.country}`}
                      </p>
                    </div>
                  </div>
                )}

                {client.industry && (
                  <div>
                    <p className="text-sm font-medium">Industry</p>
                    <p className="text-sm text-muted-foreground">{client.industry}</p>
                  </div>
                )}

                {client.companySize && (
                  <div>
                    <p className="text-sm font-medium">Company Size</p>
                    <p className="text-sm text-muted-foreground">{client.companySize}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Billing & Settings</CardTitle>
                <CardDescription>Financial and preference settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Payment Terms</p>
                  <p className="text-sm text-muted-foreground">
                    Net {client.paymentTerms} days
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Currency</p>
                  <p className="text-sm text-muted-foreground">{client.currency}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Tax Rate</p>
                  <p className="text-sm text-muted-foreground">{client.taxRate}%</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Timezone</p>
                  <p className="text-sm text-muted-foreground">{client.timezone}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">{client.language}</p>
                </div>

                <Separator />

                {client.preferences && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Preferences</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Client Portal</span>
                        <Badge variant={client.preferences.portalEnabled ? 'default' : 'secondary'}>
                          {client.preferences.portalEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Auto Ticket Creation</span>
                        <Badge variant={client.preferences.autoTicketCreation ? 'default' : 'secondary'}>
                          {client.preferences.autoTicketCreation ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Billing Notifications</span>
                        <Badge variant={client.preferences.billingNotifications ? 'default' : 'secondary'}>
                          {client.preferences.billingNotifications ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {client.tags && client.tags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {client.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Recent client activity and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Client Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>

                {client.onboardedAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Onboarded</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(client.onboardedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {client.lastActivityAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Last Activity</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(client.lastActivityAt)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(client.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Client Contacts</h3>
              <p className="text-sm text-muted-foreground">
                Manage contacts for this client
              </p>
            </div>
            <Button onClick={handleAddContact}>
              <Users className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          {client.contacts && client.contacts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {client.contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {contact.firstName} {contact.lastName}
                        </CardTitle>
                        {contact.role && (
                          <CardDescription>{contact.role}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.isPrimary && (
                          <Badge>Primary</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{contact.email}</span>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.department && (
                      <div className="text-sm text-muted-foreground">
                        {contact.department}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t">
                      <Badge variant={contact.portalAccess ? 'default' : 'secondary'} className="text-xs">
                        {contact.portalAccess ? 'Portal Access' : 'No Portal Access'}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContact(contact)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => setDeletingContactId(contact.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add contacts to manage communication with this client
                </p>
                <Button onClick={handleAddContact}>
                  <Users className="w-4 h-4 mr-2" />
                  Add First Contact
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Agreements Tab */}
        <TabsContent value="agreements">
          <ClientAgreementsTab clientId={client._id} clientName={client.displayName || client.name} />
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <ClientBillingTab clientId={client._id} formatCurrency={formatCurrency} formatDate={formatDate} />
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Client Tickets</h3>
              <p className="text-sm text-muted-foreground">
                Related tickets will appear here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <ClientAssetsTab clientId={clientId} clientName={client.displayName || client.name} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <ClientFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        client={client}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Client
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{client?.displayName || client?.name}</strong>?
              This action cannot be undone. All associated data including contacts, agreements, and history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Dialog */}
      <ContactFormDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        clientId={clientId}
        contact={editingContact}
        onSuccess={handleContactSuccess}
      />

      {/* Delete Contact Confirmation Dialog */}
      <AlertDialog open={!!deletingContactId} onOpenChange={(open) => !open && setDeletingContactId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Delete Contact
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingContactId && handleDeleteContact(deletingContactId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Contact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Client Assets Tab Component
interface ClientAssetsTabProps {
  clientId: string
  clientName: string
}

interface Asset {
  _id: string
  assetTag: string
  name: string
  category: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  status: 'active' | 'maintenance' | 'retired' | 'disposed'
  location?: string
  fullLocationPath?: string
  assignedTo?: string
  assignedToName?: string
  updatedAt: string
}

const assetStatusColors = {
  active: 'bg-green-500/10 text-green-600 border-green-200',
  maintenance: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  retired: 'bg-gray-500/10 text-gray-600 border-gray-200',
  disposed: 'bg-red-500/10 text-red-600 border-red-200',
}

const assetStatusIcons = {
  active: Server,
  maintenance: HardDrive,
  retired: Package,
  disposed: X,
}

function ClientAssetsTab({ clientId, clientName }: ClientAssetsTabProps) {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Get unique categories from assets
  const categories = Array.from(new Set(assets.map(a => a.category))).filter(Boolean)

  useEffect(() => {
    fetchAssets()
  }, [clientId])

  const fetchAssets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ clientId })
      const response = await fetch(`/api/assets?${params}`)
      const data = await response.json()

      if (data.success) {
        setAssets(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter assets based on search and filters
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = search === '' ||
      asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Assets</h3>
          <p className="text-sm text-muted-foreground">
            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
            {search || statusFilter !== 'all' || categoryFilter !== 'all' ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/assets/new?clientId=${clientId}`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {search}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSearch('')}
                    />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setStatusFilter('all')}
                    />
                  </Badge>
                )}
                {categoryFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {categoryFilter}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setCategoryFilter('all')}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setCategoryFilter('all')
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assets Table/Grid */}
      {filteredAssets.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const StatusIcon = assetStatusIcons[asset.status]
                return (
                  <TableRow
                    key={asset._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/assets/${asset._id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-muted-foreground" />
                        {asset.assetTag}
                      </div>
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{asset.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={assetStatusColors[asset.status]}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.manufacturer || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {asset.model || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {asset.serialNumber || '-'}
                    </TableCell>
                    <TableCell>
                      {asset.fullLocationPath || asset.location ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="text-sm">{asset.fullLocationPath || asset.location}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(asset.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/assets/${asset._id}`)
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {search || statusFilter !== 'all' || categoryFilter !== 'all' ? (
              <>
                <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assets found</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  No assets match your current filters. Try adjusting your search criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setCategoryFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  This client doesn&apos;t have any assets assigned yet.<br />
                  Add assets to track hardware and equipment for {clientName}.
                </p>
                <Button onClick={() => router.push(`/assets/new?clientId=${clientId}`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Asset
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
// Client Tickets Tab Component
interface ClientTicketsTabProps {
  clientId: string
  clientName: string
}

interface TicketData {
  _id: string
  ticketNumber: string
  title: string
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  category: string
}

const ticketStatusColors = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pending: 'bg-purple-100 text-purple-800 border-purple-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
}

const ticketPriorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
}

function ClientTicketsTab({ clientId, clientName }: ClientTicketsTabProps) {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [clientId])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ clientId })
      const response = await fetch(`/api/tickets?${params}`)
      const data = await response.json()

      if (data.success) {
        setTickets(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = search === '' ||
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
      case 'open':
        return AlertCircle
      case 'pending':
        return Clock
      case 'resolved':
      case 'closed':
        return CheckCircle2
      default:
        return AlertCircle
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tickets</h3>
          <p className="text-sm text-muted-foreground">
            {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
            {search || statusFilter !== 'all' || priorityFilter !== 'all' ? ' (filtered)' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/tickets/new?clientId=${clientId}`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {search && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {search}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setSearch('')}
                    />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setStatusFilter('all')}
                    />
                  </Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {priorityFilter}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => setPriorityFilter('all')}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tickets Table */}
      {filteredTickets.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const StatusIcon = getStatusIcon(ticket.status)
                return (
                  <TableRow
                    key={ticket._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/tickets/${ticket._id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-muted-foreground" />
                        {ticket.ticketNumber}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={ticket.title}>
                        {ticket.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ticketStatusColors[ticket.status]}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={ticketPriorityColors[ticket.priority]}>
                        {ticket.priority === 'critical' || ticket.priority === 'high' ? (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        ) : null}
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.assignedToName || (
                        <span className="text-muted-foreground/50 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(ticket.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(ticket.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/tickets/${ticket._id}`)
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {search || statusFilter !== 'all' || priorityFilter !== 'all' ? (
              <>
                <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  No tickets match your current filters. Try adjusting your search criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                    setPriorityFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <Ticket className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets yet</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  This client doesn&apos;t have any tickets yet.<br />
                  Create a ticket to track support requests for {clientName}.
                </p>
                <Button onClick={() => router.push(`/tickets/new?clientId=${clientId}`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Ticket
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Client Billing Tab Component
interface ClientBillingTabProps {
  clientId: string
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
}

interface Invoice {
  _id: string
  invoiceNumber: string
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
  total: number
  amountPaid: number
  amountDue: number
  invoiceDate: string
  dueDate: string
  createdAt: string
}

interface Quote {
  _id: string
  quoteNumber: string
  title: string
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired' | 'converted'
  total: number
  validUntil: string
  createdAt: string
}

const invoiceStatusColors = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  sent: 'bg-blue-500/10 text-blue-600 border-blue-200',
  viewed: 'bg-purple-500/10 text-purple-600 border-purple-200',
  partial: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  paid: 'bg-green-500/10 text-green-600 border-green-200',
  overdue: 'bg-red-500/10 text-red-600 border-red-200',
  cancelled: 'bg-gray-500/10 text-gray-600 border-gray-200',
  refunded: 'bg-orange-500/10 text-orange-600 border-orange-200',
}

const quoteStatusColors = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  sent: 'bg-blue-500/10 text-blue-600 border-blue-200',
  viewed: 'bg-purple-500/10 text-purple-600 border-purple-200',
  approved: 'bg-green-500/10 text-green-600 border-green-200',
  declined: 'bg-red-500/10 text-red-600 border-red-200',
  converted: 'bg-teal-500/10 text-teal-600 border-teal-200',
  expired: 'bg-orange-500/10 text-orange-600 border-orange-200',
}

function ClientBillingTab({ clientId, formatCurrency, formatDate }: ClientBillingTabProps) {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [activeTab, setActiveTab] = useState('invoices')

  // Invoice stats
  const [invoiceStats, setInvoiceStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    outstanding: 0,
  })

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const response = await fetch(`/api/billing/invoices?clientId=${clientId}`)
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        setInvoices(data.data)

        // Calculate stats
        const totalInvoiced = data.data.reduce((sum: number, inv: Invoice) => sum + inv.total, 0)
        const totalPaid = data.data.reduce((sum: number, inv: Invoice) => sum + inv.amountPaid, 0)
        const outstanding = data.data.reduce((sum: number, inv: Invoice) => sum + inv.amountDue, 0)

        setInvoiceStats({ totalInvoiced, totalPaid, outstanding })
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const fetchQuotes = async () => {
    setLoadingQuotes(true)
    try {
      const response = await fetch(`/api/quotes?clientId=${clientId}`)
      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        setQuotes(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoadingQuotes(false)
    }
  }

  const handleConvertToInvoice = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/convert`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        // Navigate to the new invoice
        router.push(`/billing/invoices/${data.data._id}`)
      }
    } catch (error) {
      console.error('Failed to convert quote:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices()
    } else {
      fetchQuotes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clientId])

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Invoice Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Invoiced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(invoiceStats.totalInvoiced)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(invoiceStats.totalPaid)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outstanding Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(invoiceStats.outstanding)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>All invoices for this client</CardDescription>
                </div>
                <Button onClick={() => router.push(`/billing/invoices/new?clientId=${clientId}`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingInvoices ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow
                        key={invoice._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/billing/invoices/${invoice._id}`)}
                      >
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                        <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(invoice.total)}</div>
                            {invoice.amountDue > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Due: {formatCurrency(invoice.amountDue)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={invoiceStatusColors[invoice.status]}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/billing/invoices/${invoice._id}`)
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first invoice for this client
                  </p>
                  <Button onClick={() => router.push(`/billing/invoices/new?clientId=${clientId}`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quotes</CardTitle>
                  <CardDescription>All quotes for this client</CardDescription>
                </div>
                <Button onClick={() => router.push(`/quotes/new?clientId=${clientId}`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quote
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingQuotes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : quotes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow
                        key={quote._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/quotes/${quote._id}`)}
                      >
                        <TableCell className="font-medium">{quote.quoteNumber}</TableCell>
                        <TableCell>{quote.title}</TableCell>
                        <TableCell>{formatDate(quote.createdAt)}</TableCell>
                        <TableCell>{formatDate(quote.validUntil)}</TableCell>
                        <TableCell>{formatCurrency(quote.total)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={quoteStatusColors[quote.status]}>
                            {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {quote.status === 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleConvertToInvoice(quote._id)
                                }}
                              >
                                <ArrowRight className="w-4 h-4 mr-1" />
                                Convert
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/quotes/${quote._id}`)
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first quote for this client
                  </p>
                  <Button onClick={() => router.push(`/quotes/new?clientId=${clientId}`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Quote
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
