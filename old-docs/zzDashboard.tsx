
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';

import { DraggableDashboard } from '@/components/dashboard/DraggableDashboard';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';
import type { DashboardMetrics, PersonalMetrics } from '@/lib/services/dashboard-analytics';
import type { Ticket } from '@/lib/types';
import Link from 'next/link';
import React from 'react';
import { cn } from '@/lib/utils';










import { useToast } from '@/hooks/use-toast';




import { getPersonalDashboardWidgets, getCompanyDashboardWidgets } from '@/components/dashboard/widgets';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  BarChart3, 
  Building2, 
  Settings, 
  Target,
  Users,
  Zap,
  Shield,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Star,
  RefreshCw,
  MoreVertical,
  Layout,
  Eye,
  EyeOff,
  Plus,
  Ticket,
  AlertTriangle as IncidentIcon,
  Calendar,
  GitBranch,
  BookOpen,
  FileText,
  Package,
  ChevronDown,
  LayoutGrid,
  RotateCcw
} from 'lucide-react';

function DashboardContent() {
    const { isInternalITMode } = useSidebar();
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences, isLoading: prefsLoading, updateDashboardLayout, resetDashboardLayout } = useDashboard();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companyMetrics, setCompanyMetrics] = useState<DashboardMetrics | null>(null);
  const [personalMetrics, setPersonalMetrics] = useState<PersonalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<'company' | 'personal'>('company');

  const currentUser = user?.firstName || user?.email || 'User';

  useEffect(() => {
    const loadMockData = async () => {
      try {
        setLoading(true);
        
        // Simulate API delay for realistic loading
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Rich mock tickets data
        const mockTickets = [
          {
            id: 'TCK-2024-001',
            title: 'Server Performance Issues in Production',
            description: 'Users reporting slow response times on the main application server',
            status: 'In Progress',
            priority: 'High',
            assignedTo: 'John Smith',
            clientId: 'client-1',
            clientName: 'TechCorp Solutions',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            category: 'Infrastructure',
            tags: ['performance', 'critical'],
            slaStatus: 'On Track'
          },
          {
            id: 'TCK-2024-002',
            title: 'Email Configuration for New Employee',
            description: 'Set up email account and distribution lists for new team member',
            status: 'Open',
            priority: 'Medium',
            assignedTo: 'Sarah Johnson',
            clientId: 'client-2',
            clientName: 'Digital Marketing Inc',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            category: 'User Management',
            tags: ['onboarding', 'email'],
            slaStatus: 'On Track'
          },
          {
            id: 'TCK-2024-003',
            title: 'Network Printer Connection Issues',
            description: 'Unable to connect to network printer from workstations',
            status: 'Resolved',
            priority: 'Low',
            assignedTo: 'Mike Chen',
            clientId: 'client-1',
            clientName: 'TechCorp Solutions',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            category: 'Hardware',
            tags: ['printer', 'network'],
            slaStatus: 'Met'
          }
        ];
        
        // Rich company metrics
        const mockCompanyMetrics = {
          tickets: {
            total: 147,
            open: 23,
            inProgress: 18,
            resolved: 89,
            closed: 17,
            overdue: 3,
            avgResolutionTime: 180, // 3 hours in minutes
            weeklyTrend: [12, 18, 15, 22, 19, 25, 16],
            byPriority: {
              critical: 5,
              high: 18,
              medium: 67,
              low: 57
            },
            byStatus: {
              open: 23,
              'in_progress': 18,
              resolved: 89,
              closed: 17
            }
          },
          projects: {
            total: 12,
            active: 8,
            completed: 3,
            onHold: 1,
            overdue: 2,
            totalBudget: 485000,
            budgetUtilized: 312000,
            avgProgress: 67.5
          },
          incidents: {
            total: 8,
            open: 1,
            resolved: 7,
            avgResolutionTime: 45,
            criticalIncidents: 2
          },
          changeRequests: {
            total: 28,
            pending: 7,
            approved: 15,
            rejected: 2,
            implemented: 4
          },
          assets: {
            total: 342,
            active: 298,
            maintenance: 15,
            retired: 29,
            warrantyExpiring: 23
          }
        };

        // Rich personal metrics
        const mockPersonalMetrics = {
          tickets: {
            assigned: 14,
            open: 6,
            inProgress: 5,
            resolved: 3,
            overdue: 1,
            avgResolutionTime: 120,
            weeklyActivity: [2, 3, 1, 4, 2, 1, 1]
          },
          timeTracking: {
            thisWeek: [
              { day: 'Mon', hours: 8.5, billable: 7.2 },
              { day: 'Tue', hours: 7.8, billable: 6.5 },
              { day: 'Wed', hours: 8.2, billable: 7.8 },
              { day: 'Thu', hours: 6.5, billable: 5.2 },
              { day: 'Fri', hours: 7.5, billable: 6.8 },
            ],
            totalThisWeek: 38.5,
            billableThisWeek: 33.5,
            avgDailyHours: 7.7
          },
          projects: {
            assigned: 5,
            tasksAssigned: 18,
            tasksCompleted: 12,
            milestonesReached: 3
          },
          recentActivity: [
            {
              id: '1',
              type: 'ticket_resolved',
              title: 'Resolved printer connectivity issue',
              timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              details: 'TCK-2024-003 - Network Printer Connection Issues'
            },
            {
              id: '2', 
              type: 'project_milestone',
              title: 'Completed Database Migration milestone',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              details: 'Infrastructure Modernization Project'
            },
            {
              id: '3',
              type: 'ticket_assigned',
              title: 'New ticket assigned: Server Performance Issues',
              timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              details: 'TCK-2024-001 - High priority infrastructure issue'
            }
          ]
        };

        // Set the mock data
        setTickets(mockTickets);
        setCompanyMetrics(mockCompanyMetrics);
        setPersonalMetrics(mockPersonalMetrics);
        
      } catch (error) {
        console.error('Error loading mock data:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLastUpdated(new Date());
      }
    };

    loadMockData();
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Use same mock data with slightly updated values to show refresh
      const updatedMetrics = {
        tickets: {
          total: 149, // +2 from original
          open: 24, // +1 
          inProgress: 19, // +1
          resolved: 89,
          closed: 17,
          overdue: 3,
          avgResolutionTime: 175, // Improved by 5 minutes
          weeklyTrend: [12, 18, 15, 22, 19, 25, 18], // Updated last day
          byPriority: {
            critical: 5,
            high: 19, // +1
            medium: 68, // +1  
            low: 57
          },
          byStatus: {
            open: 24,
            'in_progress': 19,
            resolved: 89,
            closed: 17
          }
        },
        projects: {
          total: 12,
          active: 8,
          completed: 3,
          onHold: 1,
          overdue: 2,
          totalBudget: 485000,
          budgetUtilized: 315000, // +3k progress
          avgProgress: 68.2 // Slight improvement
        },
        incidents: {
          total: 8,
          open: 1,
          resolved: 7,
          avgResolutionTime: 42, // Improved by 3 minutes
          criticalIncidents: 2
        },
        changeRequests: {
          total: 29, // +1
          pending: 7,
          approved: 16, // +1
          rejected: 2,
          implemented: 4
        },
        assets: {
          total: 342,
          active: 298,
          maintenance: 15,
          retired: 29,
          warrantyExpiring: 22 // -1 (one renewed)
        }
      };

      setCompanyMetrics(updatedMetrics);
      
      toast({
        title: 'Dashboard Refreshed',
        description: 'All data has been updated successfully.',
      });
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh dashboard data.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  const personalWidgets = useMemo(() => 
    personalMetrics ? getPersonalDashboardWidgets(personalMetrics, tickets, isInternalITMode, currentUser) : [],
    [personalMetrics, tickets, isInternalITMode, currentUser]
  );

  const companyWidgets = useMemo(() =>
    companyMetrics ? getCompanyDashboardWidgets(companyMetrics, tickets, isInternalITMode) : [],
    [companyMetrics, tickets, isInternalITMode]
  );

  const handleLayoutChange = (newLayout: string[], dashboardType: 'personal' | 'company') => {
    if (!preferences) return;
    const newPreferences = { ...preferences.dashboardLayout };
    newPreferences[dashboardType].layout = newLayout;
    updateDashboardLayout(newPreferences);
  };

  const handleVisibilityChange = (itemId: string, visible: boolean, dashboardType: 'personal' | 'company') => {
    if (!preferences) return;
    const newPreferences = { ...preferences.dashboardLayout };
    const currentVisibility = newPreferences[dashboardType].visibility || {};
    newPreferences[dashboardType].visibility = { ...currentVisibility, [itemId]: visible };
    updateDashboardLayout(newPreferences);
  };

  const getOrderedWidgets = (widgets: any[], layout: string[], visibility: { [key: string]: boolean }) => {
    const widgetMap = new Map(widgets.map(w => [w.id, w]));
    const ordered = layout.map(id => widgetMap.get(id)).filter(Boolean);
    const newWidgets = widgets.filter(w => !layout.includes(w.id));
    const fullLayout = [...ordered, ...newWidgets];
    return fullLayout.map(widget => ({ ...widget, isVisible: visibility[widget.id] ?? true }));
  };

  const dashboardLayout = useMemo(() => {
    const defaultLayout = {
      personal: { layout: [], visibility: {} },
      company: { layout: [], visibility: {} },
    };
    const userLayout = preferences?.dashboardLayout;

    return {
      personal: { ...defaultLayout.personal, ...userLayout?.personal },
      company: { ...defaultLayout.company, ...userLayout?.company },
    };
  }, [preferences]);

  const personalDashboardItems = useMemo(() => 
    getOrderedWidgets(personalWidgets, dashboardLayout.personal.layout, dashboardLayout.personal.visibility),
    [personalWidgets, dashboardLayout.personal.layout, dashboardLayout.personal.visibility]
  );
  
  const companyDashboardItems = useMemo(() =>
    getOrderedWidgets(companyWidgets, dashboardLayout.company.layout, dashboardLayout.company.visibility),
    [companyWidgets, dashboardLayout.company.layout, dashboardLayout.company.visibility]
  );

  if (loading || prefsLoading || !preferences) {
    return (
      <div className="space-y-8">
        {/* Enhanced Header Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden"
        >
          <Card className="backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    ))}
                  </div>
                </div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats Skeleton */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="glass-card backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Tabs Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Dashboard Content Skeleton */}
          <div className="space-y-6">
            {/* Large stat cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Chart placeholders */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with ITIL Context */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden"
      >
        <Card className="backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </motion.div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-headline text-gray-900 dark:text-gray-100">
                      Welcome, {currentUser}! 👋
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {isInternalITMode ? 'Internal IT Service Management' : 'MSP Operations'} Dashboard
                    </p>
                  </div>
                </div>
                
                {/* Quick Status Indicators */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/30 dark:bg-success/20 dark:text-success">
                    <Activity className="h-3 w-3 mr-1" />
                    Services: Online
                  </Badge>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary">
                    <Target className="h-3 w-3 mr-1" />
                    SLA: {companyMetrics ? (((companyMetrics.tickets.resolved || 0) / (companyMetrics.tickets.total || 1)) * 100).toFixed(1) : '94.2'}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="outline" 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="backdrop-blur-xl border-white/20 hover:bg-white/10"
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </Button>
                </motion.div>

                {/* Dashboard Actions Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="backdrop-blur-xl border-white/20 hover:bg-white/10"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Dashboard View</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => setActiveView('company')}
                      className={cn("cursor-pointer", activeView === 'company' && "bg-accent")}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      {isInternalITMode ? 'Organization' : 'Company'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setActiveView('personal')}
                      className={cn("cursor-pointer", activeView === 'personal' && "bg-accent")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Personal
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Widget Customization</DropdownMenuLabel>
                    <DropdownMenuItem 
                      onClick={() => setIsCustomizing(!isCustomizing)}
                      className="cursor-pointer"
                    >
                      {isCustomizing ? (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Exit Customize
                        </>
                      ) : (
                        <>
                          <Layout className="mr-2 h-4 w-4" />
                          Customize Layout
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => resetDashboardLayout(activeView)}
                      className="cursor-pointer"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Layout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        New
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 p-2 glass bg-background/80 backdrop-blur-xl border border-border/50" align="start">
                    <DropdownMenuLabel className="text-sm font-semibold text-muted-foreground px-3 py-2">
                      Create New
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-2" />
                    
                    <Link href="/tickets/new">
                      <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                          <Ticket className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Ticket</div>
                          <div className="text-xs text-muted-foreground">Service request or issue</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/incidents/new">
                      <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-destructive/10 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center group-hover:from-destructive/30 group-hover:to-destructive/20 transition-all">
                          <IncidentIcon className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Incident</div>
                          <div className="text-xs text-muted-foreground">Service disruption</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/scheduling/new">
                      <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-success/10 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-success/20 to-success/10 flex items-center justify-center group-hover:from-success/30 group-hover:to-success/20 transition-all">
                          <Calendar className="h-5 w-5 text-success" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Appointment</div>
                          <div className="text-xs text-muted-foreground">Schedule a meeting</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/change-management/new">
                      <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-warning/10 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center group-hover:from-warning/30 group-hover:to-warning/20 transition-all">
                          <GitBranch className="h-5 w-5 text-warning" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Change</div>
                          <div className="text-xs text-muted-foreground">Change request</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/knowledge-base/new">
                      <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">KB Article</div>
                          <div className="text-xs text-muted-foreground">Knowledge base article</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/quotes/new">
                      <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-emerald-500/10 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-emerald-500/20 transition-all">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Quote</div>
                          <div className="text-xs text-muted-foreground">Sales proposal</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>

                    <Link href="/assets/new">
                      <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-500/10 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500/20 to-slate-500/10 flex items-center justify-center group-hover:from-slate-500/30 group-hover:to-slate-500/20 transition-all">
                          <Package className="h-5 w-5 text-slate-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">Asset</div>
                          <div className="text-xs text-muted-foreground">Hardware or software</div>
                        </div>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mode Toggle and Quick Stats */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="glass-card backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">Service Health</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-success">
                  {companyMetrics ? (((companyMetrics.incidents.total - companyMetrics.incidents.open) / (companyMetrics.incidents.total || 1)) * 100).toFixed(1) : '98.7'}%
                </div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Avg Response</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {companyMetrics ? (companyMetrics.tickets.avgResolutionTime / 60).toFixed(1) : '2.8'}h
                </div>
                <div className="text-xs text-muted-foreground">MTTR</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary/80" />
                <span className="text-sm font-medium">SLA Compliance</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary/80">
                  {companyMetrics ? (((companyMetrics.tickets.resolved || 0) / (companyMetrics.tickets.total || 1)) * 100).toFixed(1) : '94.2'}%
                </div>
                <div className="text-xs text-muted-foreground">This month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium">Satisfaction</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-warning">4.2/5</div>
                <div className="text-xs text-muted-foreground">Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dashboard Content without Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="space-y-6"
      >
        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="flex justify-end">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
              <Clock className="h-3 w-3" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <DraggableDashboard
              dashboardType={activeView}
              items={activeView === 'company' ? companyDashboardItems : personalDashboardItems}
              onLayoutChange={(newLayout) => handleLayoutChange(newLayout, activeView)}
              onVisibilityChange={(itemId, visible) => handleVisibilityChange(itemId, visible, activeView)}
              isCustomizing={isCustomizing}
              onCustomizingChange={setIsCustomizing}
              onSaveLayout={() => {}}
              onResetLayout={() => resetDashboardLayout(activeView)}
            >
              {/* Children are managed by DraggableDashboard */}
            </DraggableDashboard>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
