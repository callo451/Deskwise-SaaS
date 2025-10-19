'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { Ticket, Client } from '@/lib/types';

// Lightweight client-side types
type WorkOSUserLite = {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
};

type TicketDefaults = {
    defaultQueue: string;
    defaultStatus: string;
    defaultPriority: string;
    availableQueues: Array<{ id: string; name: string }>;
    availableStatuses: Array<{ id: string; name: string; color: string; type: string }>;
    availablePriorities: Array<{ id: string; name: Ticket['priority']; color: string; level: number }>;
};

type NewTicketFormData = {
    subject: string;
    description: string;
    client: string;
    assignee: string;
    priority: Ticket['priority'];
    status: Ticket['status'];
    queue: string; // queues can be any name from settings
};

export default function NewTicketPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [clientsList, setClientsList] = useState<Client[]>([]);
    const [assignees, setAssignees] = useState<WorkOSUserLite[]>([]);
    const [ticketDefaults, setTicketDefaults] = useState<TicketDefaults | null>(null);
    const [formData, setFormData] = useState<NewTicketFormData>({
        subject: '',
        description: '',
        client: '',
        assignee: 'Unassigned',
        priority: 'Medium',
        status: 'Open',
        queue: 'Unassigned',
    });

    useEffect(() => {
        let cancelled = false;
        async function loadOptions() {
            try {
                setOptionsLoading(true);
                const [clientsRes, usersRes, defaultsRes] = await Promise.all([
                    fetch('/api/clients'),
                    fetch('/api/users'),
                    fetch('/api/tickets/defaults'),
                ]);
                const [clientsData, usersData, defaultsData] = await Promise.all([
                    clientsRes.ok ? clientsRes.json() : Promise.resolve([]),
                    usersRes.ok ? usersRes.json() : Promise.resolve({ users: [] }),
                    defaultsRes.ok ? defaultsRes.json() : Promise.resolve(null),
                ]);
                if (cancelled) return;
                setClientsList(Array.isArray(clientsData) ? clientsData : []);
                setAssignees(Array.isArray(usersData?.users) ? usersData.users : []);
                setTicketDefaults(defaultsData);

                // Initialize defaults for priority/status/queue
                setFormData(prev => ({
                    ...prev,
                    priority: (defaultsData?.defaultPriority ?? prev.priority) as Ticket['priority'],
                    status: (defaultsData?.defaultStatus ?? prev.status) as Ticket['status'],
                    queue: defaultsData?.defaultQueue ?? prev.queue,
                }));
            } catch (err) {
                console.error('Failed to load ticket options', err);
            } finally {
                if (!cancelled) setOptionsLoading(false);
            }
        }
        loadOptions();
        return () => { cancelled = true; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const ticket = await response.json();
                router.push(`/tickets/${ticket.id}`);
            } else {
                console.error('Failed to create ticket');
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/tickets"><ChevronLeft className="h-4 w-4" /></Link>
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">Create New Ticket</h1>
             </div>
            <Card>
                <CardHeader>
                    <CardTitle>New Ticket</CardTitle>
                    <CardDescription>
                        Create a new service request or issue ticket.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject *</Label>
                                <Input
                                    id="subject"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    placeholder="Brief description of the issue"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="client">Client *</Label>
                                <Select
                                    value={formData.client}
                                    onValueChange={(value) => setFormData({...formData, client: value})}
                                    disabled={optionsLoading}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clientsList.map((client) => (
                                            <SelectItem key={client.id} value={client.name}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Detailed description of the issue or request"
                                rows={4}
                                required
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({...formData, priority: value as Ticket['priority']})}
                                    disabled={optionsLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ticketDefaults?.availablePriorities?.length ? (
                                            ticketDefaults.availablePriorities.map((p) => (
                                                <SelectItem key={p.id} value={p.name}>
                                                    {p.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Critical">Critical</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="queue">Queue</Label>
                                <Select
                                    value={formData.queue}
                                    onValueChange={(value) => setFormData({...formData, queue: value})}
                                    disabled={optionsLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ticketDefaults?.availableQueues?.length ? (
                                            ticketDefaults.availableQueues.map((q) => (
                                                <SelectItem key={q.id} value={q.name}>
                                                    {q.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="Unassigned">Unassigned</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({...formData, status: value as Ticket['status']})}
                                    disabled={optionsLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ticketDefaults?.availableStatuses?.length ? (
                                            ticketDefaults.availableStatuses.map((s) => (
                                                <SelectItem key={s.id} value={s.name as Ticket['status']}>
                                                    {s.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="Open">Open</SelectItem>
                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                <SelectItem value="Resolved">Resolved</SelectItem>
                                                <SelectItem value="Closed">Closed</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assignee">Assignee</Label>
                                <Select
                                    value={formData.assignee}
                                    onValueChange={(value) => setFormData({...formData, assignee: value})}
                                    disabled={optionsLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                                        {assignees.map((u) => {
                                            const label = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
                                            return (
                                                <SelectItem key={u.id} value={label}>
                                                    {label}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Ticket
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/tickets">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
