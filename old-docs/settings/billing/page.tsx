
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DollarSign, Zap } from 'lucide-react';
import Image from 'next/image';

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Billing & Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage your payment methods, plan, and billing integrations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automated Billing</CardTitle>
          <CardDescription>
            Configure settings for automated invoice generation based on project milestones or contract renewals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="automated-billing" className="text-base">Enable Automated Billing</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate and send invoices when milestones are met.
              </p>
            </div>
            <Switch id="automated-billing" disabled />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5"/>Integrations</CardTitle>
            <CardDescription>Connect to your accounting software to sync invoices and payments.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white">
                        <Image src="https://placehold.co/40x40/00d46a/FFFFFF.png" alt="QuickBooks Logo" width={32} height={32} data-ai-hint="logo quickbooks"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">QuickBooks</h3>
                        <p className="text-sm text-muted-foreground">Not connected</p>
                    </div>
                </div>
                <Button variant="outline" disabled>Connect</Button>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-white p-1">
                        <Image src="https://placehold.co/100x40/09a0f7/FFFFFF.png" alt="Xero Logo" width={80} height={32} data-ai-hint="logo xero"/>
                    </div>
                    <div>
                        <h3 className="font-semibold">Xero</h3>
                        <p className="text-sm text-muted-foreground">Not connected</p>
                    </div>
                </div>
                <Button variant="outline" disabled>Connect</Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Subscription</CardTitle>
          <CardDescription>
            You are currently on the <span className="font-semibold text-primary">Pro Plan</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Manage your subscription details, payment methods, and view your invoice history on our main billing portal.</p>
        </CardContent>
        <CardFooter>
            <Button disabled>Manage Subscription</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
