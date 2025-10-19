
'use client';

import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { DashboardStat, CsatResponse } from '@/lib/types';
import { csatPageStats, csatScoreDistribution, csatByTechnician, recentCsatResponses } from '@/lib/placeholder-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';

const csatSettingsSchema = z.object({
  enabled: z.boolean(),
  sendAfter: z.string(),
  question: z.string().min(10, "Question must be at least 10 characters."),
  thankYouMessage: z.string().min(10, "Message must be at least 10 characters."),
});

type CsatSettingsFormValues = z.infer<typeof csatSettingsSchema>;

const StatCard = ({ stat }: { stat: DashboardStat }) => {
  const isIncrease = stat.changeType === 'increase';
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stat.value}</div>
        <p className="text-xs text-muted-foreground flex items-center">
          <span className={`flex items-center mr-1 ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
            {isIncrease ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {stat.change}
          </span>
          {stat.description}
        </p>
      </CardContent>
    </Card>
  );
};

const CsatScoreIcon = ({ score }: { score: CsatResponse['score'] }) => {
  if (score === 'Great') return <Smile className="h-5 w-5 text-green-500" />;
  if (score === 'Okay') return <Meh className="h-5 w-5 text-amber-500" />;
  return <Frown className="h-5 w-5 text-red-500" />;
};


export default function CsatSettingsPage() {
  const { toast } = useToast();
  const form = useForm<CsatSettingsFormValues>({
    resolver: zodResolver(csatSettingsSchema),
    defaultValues: {
      enabled: true,
      sendAfter: '24h',
      question: 'How would you rate the support you received?',
      thankYouMessage: 'Thank you for your feedback! We appreciate you taking the time to help us improve.',
    },
  });

  function onSubmit(data: CsatSettingsFormValues) {
    console.log(data);
    toast({
      title: 'Settings Saved',
      description: 'Your CSAT settings have been updated.',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">CSAT Management</h1>
        <p className="text-muted-foreground">
          Configure and monitor customer satisfaction surveys and metrics.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {csatPageStats.map(stat => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CSAT Settings</CardTitle>
              <CardDescription>Manage when and how surveys are sent.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Surveys</FormLabel>
                          <FormDescription>
                            Automatically send surveys when tickets are resolved.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sendAfter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Send survey after</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="1h">1 hour</SelectItem>
                            <SelectItem value="24h">24 hours</SelectItem>
                            <SelectItem value="48h">48 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Survey Question</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="thankYouMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thank You Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit">Save Settings</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Technician Performance</CardTitle>
              <CardDescription>CSAT scores by technician over last 30 days.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-right">Responses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csatByTechnician.map(item => (
                    <TableRow key={item.technician}>
                      <TableCell className="font-medium">{item.technician}</TableCell>
                      <TableCell>{item.score}</TableCell>
                      <TableCell className="text-right">{item.responses}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Score Distribution</CardTitle>
                    <CardDescription>Breakdown of all responses in the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer>
                          <BarChart data={csatScoreDistribution} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={70} />
                              <XAxis type="number" hide />
                              <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                  {csatScoreDistribution.map((entry) => (
                                      <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                    <CardDescription>Latest comments from customers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentCsatResponses.map(response => (
                    <div key={response.id} className="flex items-start gap-4 p-3 border rounded-lg">
                      <CsatScoreIcon score={response.score} />
                      <div className="flex-1 text-sm">
                        <div className="text-muted-foreground">
                          From <span className="font-medium text-foreground">{response.client}</span> on ticket <Badge variant="secondary">{response.ticketId}</Badge>
                        </div>
                        <p className="mt-1">{response.comment}</p>
                        <p className="text-xs text-muted-foreground mt-2">{response.respondedAt}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
