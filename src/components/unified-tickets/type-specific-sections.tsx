'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  AlertTriangle,
  Settings,
  HelpCircle,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Calendar,
  FileText,
  Users,
  Zap,
  DollarSign,
} from 'lucide-react'
import {
  UnifiedTicket,
  IncidentMetadata,
  ChangeMetadata,
  ServiceRequestMetadata,
  ProblemMetadata,
} from '@/lib/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface TypeSpecificSectionsProps {
  ticket: UnifiedTicket
  className?: string
}

export function TypeSpecificSections({ ticket, className }: TypeSpecificSectionsProps) {
  const renderIncidentSection = () => {
    if (ticket.ticketType !== 'incident') return null
    const metadata = ticket.metadata as IncidentMetadata

    return (
      <Card className={cn('border-2 border-l-4 border-l-red-500 shadow-lg', className)}>
        <CardHeader className="bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50 border-b-2">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-md">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Incident Details</CardTitle>
              <CardDescription className="text-base">Impact assessment and affected services</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {/* Severity/Impact/Urgency Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                Severity
              </div>
              <Badge className={
                metadata.severity === 'critical' ? 'bg-red-500' :
                metadata.severity === 'high' ? 'bg-orange-500' :
                metadata.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
              }>
                {metadata.severity.toUpperCase()}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Impact
              </div>
              <Badge variant="outline" className="capitalize">
                {metadata.impact}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Urgency
              </div>
              <Badge variant="outline" className="capitalize">
                {metadata.urgency}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Affected Services */}
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Affected Services
            </div>
            <div className="flex flex-wrap gap-2">
              {metadata.affectedServices && metadata.affectedServices.length > 0 ? (
                metadata.affectedServices.map((service) => (
                  <Badge key={service} variant="secondary">
                    {service}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">No services specified</span>
              )}
            </div>
          </div>

          {/* Client IDs */}
          {metadata.clientIds && metadata.clientIds.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Affected Clients
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.clientIds.map((clientId) => (
                    <Badge key={clientId} variant="outline">
                      {clientId}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Public Status */}
          {metadata.isPublic && (
            <>
              <Separator />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This incident is visible on the public status page
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Major Incident Flag */}
          {metadata.isMajorIncident && (
            <>
              <Separator />
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription className="font-semibold">
                  MAJOR INCIDENT - Critical business impact
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderChangeSection = () => {
    if (ticket.ticketType !== 'change') return null
    const metadata = ticket.metadata as ChangeMetadata

    return (
      <Card className={cn('border-l-4 border-l-green-500', className)}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Settings className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Change Request Details</CardTitle>
              <CardDescription>Implementation planning and approval</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Risk and Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
              <Badge className={
                metadata.risk === 'high' ? 'bg-red-500' :
                metadata.risk === 'medium' ? 'bg-orange-500' : 'bg-green-500'
              }>
                {metadata.risk.toUpperCase()}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1">Impact</div>
              <Badge variant="outline" className="capitalize">
                {metadata.impact}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Planned Dates */}
          <div className="space-y-3">
            <div className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Planned Schedule
            </div>
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                <div className="text-sm font-medium">
                  {format(new Date(metadata.plannedStartDate), 'PPp')}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">End Date</div>
                <div className="text-sm font-medium">
                  {format(new Date(metadata.plannedEndDate), 'PPp')}
                </div>
              </div>
            </div>
          </div>

          {/* Actual Dates */}
          {(metadata.actualStartDate || metadata.actualEndDate) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Actual Timeline
                </div>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  {metadata.actualStartDate && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Actual Start</div>
                      <div className="text-sm font-medium">
                        {format(new Date(metadata.actualStartDate), 'PPp')}
                      </div>
                    </div>
                  )}
                  {metadata.actualEndDate && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Actual End</div>
                      <div className="text-sm font-medium">
                        {format(new Date(metadata.actualEndDate), 'PPp')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Implementation Plan */}
          {metadata.implementationPlan && (
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Implementation Plan
              </div>
              <Card className="p-4 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap">{metadata.implementationPlan}</p>
              </Card>
            </div>
          )}

          {/* Test Plan */}
          {metadata.testPlan && (
            <div>
              <div className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Test Plan
              </div>
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <p className="text-sm whitespace-pre-wrap">{metadata.testPlan}</p>
              </Card>
            </div>
          )}

          {/* Backout Plan */}
          <div>
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Backout Plan
            </div>
            <Card className="p-4 bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
              <p className="text-sm whitespace-pre-wrap">{metadata.backoutPlan}</p>
            </Card>
          </div>

          {/* Approval Status */}
          {metadata.approvalStatus && (
            <>
              <Separator />
              <div className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Approval Status</span>
                  <Badge className={
                    metadata.approvalStatus === 'approved' ? 'bg-green-500' :
                    metadata.approvalStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                  }>
                    {metadata.approvalStatus === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {metadata.approvalStatus === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                    {metadata.approvalStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {metadata.approvalStatus.toUpperCase()}
                  </Badge>
                </div>
                {metadata.approvedBy && (
                  <p className="text-xs text-muted-foreground">
                    by {metadata.approvedByName || metadata.approvedBy}
                    {metadata.approvedAt && ` on ${format(new Date(metadata.approvedAt), 'PPp')}`}
                  </p>
                )}
                {metadata.rejectionReason && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertDescription>{metadata.rejectionReason}</AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderServiceRequestSection = () => {
    if (ticket.ticketType !== 'service_request') return null
    const metadata = ticket.metadata as ServiceRequestMetadata

    return (
      <Card className={cn('border-l-4 border-l-orange-500', className)}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <HelpCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle>Service Request Details</CardTitle>
              <CardDescription>Request information and approval status</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Approval Status */}
          {metadata.approvalStatus && (
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Approval Status</span>
                <Badge className={
                  metadata.approvalStatus === 'approved' ? 'bg-green-500' :
                  metadata.approvalStatus === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                }>
                  {metadata.approvalStatus === 'approved' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {metadata.approvalStatus === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                  {metadata.approvalStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                  {metadata.approvalStatus.toUpperCase()}
                </Badge>
              </div>
              {metadata.approvedBy && (
                <p className="text-xs text-muted-foreground">
                  Approved by {metadata.approvedByName || metadata.approvedBy}
                </p>
              )}
              {metadata.rejectionReason && (
                <Alert className="mt-2" variant="destructive">
                  <AlertDescription>{metadata.rejectionReason}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Approvers */}
          {metadata.approvers && metadata.approvers.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Approvers
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.approvers.map((approverId) => (
                    <Badge key={approverId} variant="outline">
                      {approverId}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderProblemSection = () => {
    if (ticket.ticketType !== 'problem') return null
    const metadata = ticket.metadata as ProblemMetadata

    return (
      <Card className={cn('border-l-4 border-l-purple-500', className)}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <GitBranch className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Problem Details</CardTitle>
              <CardDescription>Root cause analysis and resolution</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Impact and Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1">Impact</div>
              <Badge variant="outline" className="capitalize">
                {metadata.impact}
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="text-xs text-muted-foreground mb-1">Urgency</div>
              <Badge variant="outline" className="capitalize">
                {metadata.urgency}
              </Badge>
            </div>
          </div>

          {/* Root Cause */}
          {metadata.rootCause && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Root Cause
                </div>
                <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm whitespace-pre-wrap">{metadata.rootCause}</p>
                </Card>
              </div>
            </>
          )}

          {/* Workaround */}
          {metadata.workaround && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Workaround
                </div>
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                  <p className="text-sm whitespace-pre-wrap">{metadata.workaround}</p>
                </Card>
              </div>
            </>
          )}

          {/* Solution */}
          {metadata.solution && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Solution
                </div>
                <Card className="p-4 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
                  <p className="text-sm whitespace-pre-wrap">{metadata.solution}</p>
                </Card>
              </div>
            </>
          )}

          {/* Related Incidents */}
          {metadata.relatedIncidents && metadata.relatedIncidents.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Related Incidents
                  <Badge variant="secondary" className="text-xs">
                    {metadata.relatedIncidents.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metadata.relatedIncidents.map((incidentId) => (
                    <Badge key={incidentId} variant="outline">
                      {incidentId}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Known Error */}
          {metadata.isKnownError && (
            <>
              <Separator />
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Marked as Known Error
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Standard ticket type doesn't need a special section
  if (ticket.ticketType === 'ticket') {
    return null
  }

  return (
    <>
      {renderIncidentSection()}
      {renderChangeSection()}
      {renderServiceRequestSection()}
      {renderProblemSection()}
    </>
  )
}
