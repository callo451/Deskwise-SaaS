'use client';

import React, { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Users,
  BarChart,
  Settings,
  Download,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
} from 'date-fns';
import type { ScheduleItem, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ScheduleItemDialog } from '@/components/scheduling/schedule-item-dialog';
import { AppointmentCreationDialog } from '@/components/scheduling/appointment-creation-dialog';
import { WorkloadAnalysisPanel } from '@/components/scheduling/workload-analysis-panel';

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];

export default function SchedulingPage() {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, 'MMM-yyyy')
  );

  const firstDayCurrentMonth = parse(
    currentMonth,
    'MMM-yyyy',
    new Date()
  );

  const [selectedItem, setSelectedItem] = React.useState<ScheduleItem | null>(null);
  const [scheduleItems, setScheduleItems] = React.useState<ScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAppointmentDialog, setShowAppointmentDialog] = React.useState(false);
  const [showWorkloadPanel, setShowWorkloadPanel] = React.useState(false);

  const days = eachDayOfInterval({
    start: firstDayCurrentMonth,
    end: endOfMonth(firstDayCurrentMonth),
  });

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'));
  }

  const [technicians, setTechnicians] = React.useState<User[]>([]);
  const [visibleTechnicians, setVisibleTechnicians] = React.useState<string[]>([]);
  const [showGoogleEvents, setShowGoogleEvents] = React.useState(false);
  const [showOutlookEvents, setShowOutlookEvents] = React.useState(false);
  const [externalEvents, setExternalEvents] = React.useState<ScheduleItem[]>([]);
  const [providersInitialized, setProvidersInitialized] = React.useState(false);
  const [integrationStatus, setIntegrationStatus] = React.useState({ google: false, microsoft: false });
  const [currentTimeZone, setCurrentTimeZone] = React.useState('');
  const [schedulingMetrics, setSchedulingMetrics] = React.useState({
    totalAppointments: 0,
    completedToday: 0,
    upcomingToday: 0,
    overdue: 0,
    avgUtilization: 0,
    activeTechnicians: 0
  });

  // Load organization users and map to technicians
  useEffect(() => {
    const loadTechnicians = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          const membershipsByUser: Map<string, any> = new Map(
            (data.memberships || []).map((m: any) => [m.userId, m])
          );
          const mapped: User[] = (data.users || []).map((u: any) => {
            const m = membershipsByUser.get(u.id);
            const roleName = (m?.role?.name || '').toString().toLowerCase();
            const role: User['role'] = roleName.includes('technician')
              ? 'Technician'
              : roleName.includes('admin')
              ? 'Administrator'
              : 'Read-Only';
            const status: User['status'] = m?.status === 'pending'
              ? 'Invited'
              : m?.status === 'active'
              ? 'Active'
              : 'Inactive';
            const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
            return {
              id: u.id,
              name,
              email: u.email,
              role,
              status,
              avatarUrl: u.profilePictureUrl || '',
              groups: [],
            } as User;
          });
          const techs = mapped.filter(u => u.role === 'Technician' || u.role === 'Administrator');
          setTechnicians(techs);
          setVisibleTechnicians(techs.map(t => t.id));
        } else {
          console.error('Failed to fetch users');
        }
      } catch (e) {
        console.error('Error loading users', e);
      }
    };
    loadTechnicians();
  }, []);

  useEffect(() => {
    fetchScheduleItems();
    fetchSchedulingMetrics();
  }, [selectedDay, visibleTechnicians]);

  useEffect(() => {
    fetchExternalEvents();
  }, [selectedDay, showGoogleEvents, showOutlookEvents]);

  // Detect timezone once on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setCurrentTimeZone(tz);
    } catch {
      setCurrentTimeZone('');
    }
  }, []);

  // Initialize provider toggles based on integration status so events appear when connected
  useEffect(() => {
    const initProviders = async () => {
      if (providersInitialized) return;
      try {
        const res = await fetch('/api/integrations/status');
        if (res.ok) {
          const data = await res.json();
          setIntegrationStatus({ google: !!data?.google, microsoft: !!data?.microsoft });
          if (data?.google) setShowGoogleEvents(true);
          if (data?.microsoft) setShowOutlookEvents(true);
        }
      } catch (e) {
        console.error('Failed to initialize provider toggles', e);
      } finally {
        setProvidersInitialized(true);
      }
    };
    initProviders();
  }, [providersInitialized]);

  const fetchScheduleItems = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDay, 'yyyy-MM-dd');
      const technicianIdsParam = visibleTechnicians.join(',');
      
      const response = await fetch(`/api/schedule/by-date?date=${dateStr}&technicianIds=${technicianIdsParam}`);
      if (response.ok) {
        const data = await response.json();
        setScheduleItems(data);
      } else {
        console.error('Failed to fetch schedule items');
        setScheduleItems([]);
      }
    } catch (error) {
      console.error('Error fetching schedule items:', error);
      setScheduleItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulingMetrics = async () => {
    try {
      const dateStr = format(selectedDay, 'yyyy-MM-dd');
      const technicianIdsParam = visibleTechnicians.join(',');
      
      // Calculate metrics from current data
      const totalAppointments = scheduleItems.length + externalEvents.length;
      const now = new Date();
      const todayStart = new Date(selectedDay);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(selectedDay);
      todayEnd.setHours(23, 59, 59, 999);
      
      const completedToday = [...scheduleItems, ...externalEvents].filter(item => {
        const itemEnd = parse(item.end, 'yyyy-MM-dd HH:mm', new Date());
        return itemEnd < now && itemEnd >= todayStart && itemEnd <= todayEnd;
      }).length;
      
      const upcomingToday = [...scheduleItems, ...externalEvents].filter(item => {
        const itemStart = parse(item.start, 'yyyy-MM-dd HH:mm', new Date());
        return itemStart > now && itemStart >= todayStart && itemStart <= todayEnd;
      }).length;
      
      const overdue = [...scheduleItems, ...externalEvents].filter(item => {
        const itemStart = parse(item.start, 'yyyy-MM-dd HH:mm', new Date());
        return itemStart < now && itemStart >= todayStart;
      }).length;
      
      // Calculate average utilization (simplified)
      const workingHours = 8; // Assume 8-hour workday
      const totalScheduledHours = [...scheduleItems, ...externalEvents].reduce((acc, item) => {
        const start = parse(item.start, 'yyyy-MM-dd HH:mm', new Date());
        const end = parse(item.end, 'yyyy-MM-dd HH:mm', new Date());
        return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);
      
      const avgUtilization = visibleTechnicians.length > 0 
        ? Math.min(100, (totalScheduledHours / (visibleTechnicians.length * workingHours)) * 100)
        : 0;
      
      setSchedulingMetrics({
        totalAppointments,
        completedToday,
        upcomingToday,
        overdue,
        avgUtilization: Math.round(avgUtilization),
        activeTechnicians: visibleTechnicians.length
      });
    } catch (error) {
      console.error('Error calculating scheduling metrics:', error);
    }
  };

  const fetchExternalEvents = async () => {
    const providers = [
      showGoogleEvents ? 'google' : null,
      showOutlookEvents ? 'microsoft' : null,
    ].filter(Boolean).join(',');
    if (!providers) {
      setExternalEvents([]);
      return;
    }
    try {
      const start = format(selectedDay, 'yyyy-MM-dd');
      const end = format(selectedDay, 'yyyy-MM-dd');
      const tz = currentTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(`/api/schedule/external?start=${start}&end=${end}&providers=${providers}&timeZone=${encodeURIComponent(tz)}`);
      if (res.ok) {
        const data = await res.json();
        setExternalEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch external events', err);
    }
  };

  const meetingsForDay = [...scheduleItems, ...externalEvents].filter((item) =>
    isSameDay(parse(item.start, 'yyyy-MM-dd HH:mm', new Date()), selectedDay) &&
    (visibleTechnicians.length === 0 || !item.technicianId || visibleTechnicians.includes(item.technicianId))
  );

  const handleItemClick = (item: ScheduleItem) => {
    setSelectedItem(item);
  };
  
  const handleDialogClose = () => {
    setSelectedItem(null);
  };
  
  const handleItemSave = async (updatedItem: ScheduleItem) => {
    try {
      const response = await fetch(`/api/schedule/${updatedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });

      if (response.ok) {
        // Refresh the schedule items to show the update
        await fetchScheduleItems();
        setSelectedItem(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to save schedule item:', errorData);
        // You could show an error toast here
      }
    } catch (error) {
      console.error('Error saving schedule item:', error);
    }
  };

  const handleAppointmentSuccess = () => {
    fetchScheduleItems();
    fetchSchedulingMetrics();
    setShowAppointmentDialog(false);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleExportCsv = () => {
    try {
      const headers = ['Title','Type','Start','End','Technician','Source'];
      const rows = meetingsForDay.map((m) => {
        const techName = technicians.find(t => t.id === m.technicianId)?.name || '';
        const source = m.externalProvider ? (m.externalProvider === 'google' ? 'Google' : 'Outlook') : 'Internal';
        return [m.title, m.type, m.start, m.end, techName, source];
      });
      const csv = [headers, ...rows]
        .map(r => r.map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schedule-${format(selectedDay, 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export CSV', e);
    }
  };

  // Recalculate metrics when data changes
  React.useEffect(() => {
    fetchSchedulingMetrics();
  }, [scheduleItems, externalEvents, visibleTechnicians, selectedDay]);

  const StatCard = ({ title, value, change, changeType, icon: Icon, description }: {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon: React.ElementType;
    description: string;
  }) => {
    const isIncrease = changeType === 'increase';
    return (
      <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground flex items-center">
            {change && (
              <span className={`flex items-center mr-1 ${
                isIncrease ? 'text-success' : 'text-destructive'
              }`}>
                {isIncrease ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {change}
              </span>
            )}
            {description}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline">Scheduling</h1>
            <p className="text-muted-foreground">
              Manage technician schedules, appointments, and dispatching.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Primary Actions */}
            <Button onClick={() => setShowAppointmentDialog(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
            
            {/* Technician Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  {visibleTechnicians.length}/{technicians.length}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Technicians</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setVisibleTechnicians(technicians.map(t => t.id))}>Select all</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setVisibleTechnicians([])}>Clear all</DropdownMenuItem>
                <DropdownMenuSeparator />
                {technicians.map(tech => (
                  <DropdownMenuCheckboxItem
                    key={tech.id}
                    checked={visibleTechnicians.includes(tech.id)}
                    onCheckedChange={(checked) => {
                      setVisibleTechnicians(prev => 
                        checked ? [...prev, tech.id] : prev.filter(id => id !== tech.id)
                      )
                    }}
                  >
                    {tech.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Calendar Integration Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Calendar className="mr-2 h-4 w-4" />
                  External
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>External Calendars</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={showGoogleEvents}
                  onCheckedChange={(checked) => setShowGoogleEvents(checked === true)}
                  disabled={!integrationStatus.google}
                >
                  Google Calendar
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={showOutlookEvents}
                  onCheckedChange={(checked) => setShowOutlookEvents(checked === true)}
                  disabled={!integrationStatus.microsoft}
                >
                  Outlook Calendar
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings/integrations/calendar">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Calendars
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <BarChart className="mr-2 h-4 w-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Analysis & Export</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowWorkloadPanel(true)}>
                  <BarChart className="mr-2 h-4 w-4" />
                  Workload Analysis
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Schedule
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  TZ: {currentTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Scheduling Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatCard
            title="Total Appointments"
            value={schedulingMetrics.totalAppointments}
            icon={Calendar}
            description="for selected day"
          />
          <StatCard
            title="Completed Today"
            value={schedulingMetrics.completedToday}
            icon={CheckCircle2}
            description="finished appointments"
          />
          <StatCard
            title="Upcoming Today"
            value={schedulingMetrics.upcomingToday}
            icon={Clock}
            description="scheduled ahead"
          />
          <StatCard
            title="Overdue"
            value={schedulingMetrics.overdue}
            changeType={schedulingMetrics.overdue > 0 ? 'decrease' : undefined}
            icon={AlertTriangle}
            description="past due time"
          />
          <StatCard
            title="Avg Utilization"
            value={`${schedulingMetrics.avgUtilization}%`}
            icon={BarChart}
            description="technician capacity"
          />
          <StatCard
            title="Active Technicians"
            value={schedulingMetrics.activeTechnicians}
            icon={Users}
            description="currently visible"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="md:grid md:grid-cols-2 md:divide-x md:divide-border">
              <div className="p-6">
                <div className="flex items-center">
                  <h2 className="flex-auto font-semibold text-foreground">
                    {format(firstDayCurrentMonth, 'MMMM yyyy')}
                  </h2>
                  <button
                    type="button"
                    onClick={previousMonth}
                    className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <span className="sr-only">Previous month</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={nextMonth}
                    type="button"
                    className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <span className="sr-only">Next month</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-6 grid grid-cols-7 text-center text-xs leading-6 text-muted-foreground">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>
                <div className="mt-2 grid grid-cols-7 text-sm">
                  {days.map((day, dayIdx) => (
                    <div
                      key={day.toString()}
                      className={cn(
                        dayIdx === 0 && colStartClasses[getDay(day)],
                        'py-1.5'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          'mx-auto flex h-8 w-8 items-center justify-center rounded-full',
                          isEqual(day, selectedDay) && 'text-white',
                          !isEqual(day, selectedDay) &&
                            isToday(day) &&
                            'text-primary',
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            isSameMonth(day, firstDayCurrentMonth) &&
                            'text-foreground',
                          !isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            !isSameMonth(day, firstDayCurrentMonth) &&
                            'text-muted-foreground',
                          isEqual(day, selectedDay) && isToday(day) && 'bg-primary',
                          isEqual(day, selectedDay) &&
                            !isToday(day) &&
                            'bg-primary/80',
                          !isEqual(day, selectedDay) && 'hover:bg-accent',
                          (isEqual(day, selectedDay) || isToday(day)) &&
                            'font-semibold'
                        )}
                      >
                        <time dateTime={format(day, 'yyyy-MM-dd')}>
                          {format(day, 'd')}
                        </time>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <section className="p-6">
                <h2 className="font-semibold text-foreground">
                  Schedule for{' '}
                  <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>
                    {format(selectedDay, 'MMM dd, yyy')}
                  </time>
                </h2>
                <ol className="mt-4 space-y-1 text-sm leading-6 text-muted-foreground">
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center p-2 rounded-xl">
                          <div className="w-2 h-10 bg-muted/50 rounded-full mr-4 animate-pulse"></div>
                          <div className="flex-auto space-y-2">
                            <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-muted/50 rounded animate-pulse w-1/2"></div>
                          </div>
                          <div className="w-16 h-6 bg-muted/50 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : meetingsForDay.length > 0 ? (
                    meetingsForDay
                      .sort((a,b) =>
                        parse(a.start, 'yyyy-MM-dd HH:mm', new Date()).getTime() -
                        parse(b.start, 'yyyy-MM-dd HH:mm', new Date()).getTime()
                      )
                      .map((meeting) => (
                        <Meeting 
                          meeting={meeting} 
                          key={meeting.id} 
                          onClick={() => handleItemClick(meeting)} 
                          technicians={technicians}
                        />
                      ))
                  ) : (
                    <p>No appointments for today.</p>
                  )}
                </ol>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
      {selectedItem && (
        <ScheduleItemDialog 
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleDialogClose}
          onSave={handleItemSave}
          technicians={technicians}
        />
      )}
      
      <AppointmentCreationDialog
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        onSuccess={handleAppointmentSuccess}
        initialDate={format(selectedDay, 'yyyy-MM-dd')}
        initialTime="09:00"
        technicians={technicians}
      />
      
      <WorkloadAnalysisPanel
        open={showWorkloadPanel}
        onOpenChange={setShowWorkloadPanel}
        technicians={technicians}
      />
    </>
  );
}

function Meeting({ meeting, onClick, technicians }: { meeting: ScheduleItem; onClick: () => void; technicians: User[] }) {
  const startDateTime = parse(meeting.start, 'yyyy-MM-dd HH:mm', new Date());
  const endDateTime = parse(meeting.end, 'yyyy-MM-dd HH:mm', new Date());
  const technician = technicians.find((u: User) => u.id === meeting.technicianId);
  const typeColor = meeting.externalProvider
    ? 'bg-muted'
    : {
        'Ticket': 'bg-primary',
        'Meeting': 'bg-primary/80',
        'Time Off': 'bg-muted-foreground',
        'Appointment': 'bg-success',
      }[meeting.type];

  return (
    <li className="flex items-center rounded-xl p-2 group hover:bg-secondary cursor-pointer" onClick={onClick}>
      <div className={cn("w-2 h-10 rounded-full mr-4", typeColor)}></div>
      <div className="flex-auto">
        <p className="font-semibold text-foreground">{meeting.title}</p>
        <p>
          <time dateTime={meeting.start}>{format(startDateTime, 'h:mm a')}</time> -{' '}
          <time dateTime={meeting.end}>{format(endDateTime, 'h:mm a')}</time>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={meeting.type === 'Ticket' ? 'default' : 'secondary'}>{meeting.type}</Badge>
        {meeting.externalProvider && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {meeting.externalProvider === 'google' ? 'Google' : 'Outlook'}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                External event
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {technician && (
           <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={technician.avatarUrl} alt={technician.name} data-ai-hint="user avatar" />
                  <AvatarFallback>{technician.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{technician.name}</p>
              </TooltipContent>
            </Tooltip>
           </TooltipProvider>
        )}
      </div>
    </li>
  );
}
