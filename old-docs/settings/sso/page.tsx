
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const ssoSettingsSchema = z.object({
  enabled: z.boolean(),
  entityId: z.string().url().optional().or(z.literal('')),
  ssoUrl: z.string().url().optional().or(z.literal('')),
  certificate: z.string().optional(),
});

type SsoSettingsFormValues = z.infer<typeof ssoSettingsSchema>;

export default function SsoSettingsPage() {
  const { toast } = useToast();
  const form = useForm<SsoSettingsFormValues>({
    resolver: zodResolver(ssoSettingsSchema),
    defaultValues: {
      enabled: false,
      entityId: 'https://api.serviceflow.ai/sso/metadata',
      ssoUrl: '',
      certificate: '',
    },
  });

  function onSubmit(data: SsoSettingsFormValues) {
    console.log(data);
    toast({
      title: 'SSO Settings Saved',
      description: 'Your SAML SSO settings have been updated.',
    });
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">SAML SSO</h1>
            <p className="text-muted-foreground">
            Configure Single Sign-On for your organization.
            </p>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>SSO Configuration</CardTitle>
                        <CardDescription>Manage how your users sign in with SAML.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="enabled"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                <FormLabel className="text-base">Enable SAML SSO</FormLabel>
                                <FormDescription>
                                    Allow users to log in through your identity provider.
                                </FormDescription>
                                </div>
                                <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        
                        <CardTitle className="text-xl pt-4">Service Provider Details</CardTitle>
                        <CardDescription>Use these values to configure your Identity Provider (IdP).</CardDescription>
                         <div>
                            <FormLabel>Entity ID / Audience URI</FormLabel>
                            <Input readOnly value="https://api.serviceflow.ai/sso/metadata" />
                        </div>
                         <div>
                            <FormLabel>Assertion Consumer Service (ACS) URL</FormLabel>
                            <Input readOnly value="https://api.serviceflow.ai/sso/acs" />
                        </div>
                        
                        <CardTitle className="text-xl pt-4">Identity Provider Details</CardTitle>
                        <CardDescription>Provide these details from your IdP.</CardDescription>
                         <FormField
                            control={form.control}
                            name="ssoUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>IdP SSO URL</FormLabel>
                                <FormControl>
                                <Input placeholder="https://idp.example.com/sso" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="certificate"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>X.509 Certificate</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Paste your certificate here..." {...field} rows={6} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Save Changes</Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    </div>
  );
}
