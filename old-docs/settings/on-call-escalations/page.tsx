'use client';

import { useEffect, useMemo, useState } from 'react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

// Lightweight inline modal since project already has dialog components
function SimpleModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export default function OnCallEscalationsSettingsPage() {
  const [tab, setTab] = useState<'groups' | 'policies' | 'audit'>('groups');

  // Resolver groups
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [editGroup, setEditGroup] = useState<any | null>(null);
  const [testOnCallResult, setTestOnCallResult] = useState<any | null>(null);

  // Policies
  const [policies, setPolicies] = useState<any[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [editPolicy, setEditPolicy] = useState<any | null>(null);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [dryRunIncidentId, setDryRunIncidentId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<string[]>([]);

  // Audit
  const [auditIncidentId, setAuditIncidentId] = useState('');
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingGroups(true);
      try {
        const res = await fetch('/api/escalations/resolver-groups');
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      } finally {
        setLoadingGroups(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingPolicies(true);
      try {
        const res = await fetch('/api/escalations/policies');
        const data = await res.json();
        setPolicies(Array.isArray(data) ? data : []);
      } finally {
        setLoadingPolicies(false);
      }
    })();
  }, []);

  // Load users for pickers
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) return;
        const data = await res.json();
        const list = (data?.users || []).map((u:any) => ({ id: u.id || u.user?.id || u.workosUserId || u.email, name: `${u.firstName ?? u.givenName ?? ''} ${u.lastName ?? u.familyName ?? ''}`.trim() || u.email, email: u.email }));
        setUsers(list);
      } catch {}
    })();
  }, []);

  // Load services for rule builder
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/service-catalogue?isActive=true');
        if (!res.ok) return;
        const data = await res.json();
        const names = (Array.isArray(data) ? data : []).map((s:any)=>s.name).filter(Boolean);
        setServices(Array.from(new Set(names)).sort());
      } catch {}
    })();
  }, []);

  async function saveGroup() {
    if (!editGroup) return;
    const isNew = !editGroup.id;
    const res = await fetch(isNew ? '/api/escalations/resolver-groups' : `/api/escalations/resolver-groups/${editGroup.id}` , {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editGroup.name,
        description: editGroup.description,
        memberUserIds: editGroup.memberUserIds || [],
        calendar: editGroup.calendar || undefined,
      })
    });
    if (!res.ok) {
      toast({ title: 'Failed to save group', variant: 'destructive' });
      return;
    }
    const saved = await res.json();
    setGroups(prev => {
      const others = prev.filter(g => g.id !== saved.id);
      return [...others, saved].sort((a,b)=>a.name.localeCompare(b.name));
    });
    setEditGroup(null);
    toast({ title: 'Group saved', variant: 'default' });
  }

  async function deleteGroup(id: string) {
    const res = await fetch(`/api/escalations/resolver-groups/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setGroups(prev => prev.filter(g => g.id !== id));
      toast({ title: 'Group deleted' });
    } else {
      toast({ title: 'Failed to delete group', variant: 'destructive' });
    }
  }

  async function testOnCall(groupId: string) {
    const res = await fetch(`/api/escalations/resolver-groups/${groupId}/oncall`);
    if (res.ok) setTestOnCallResult(await res.json());
  }

  async function savePolicy() {
    if (!editPolicy) return;
    const isNew = !editPolicy.id;
    const payload = {
      name: editPolicy.name,
      description: editPolicy.description,
      isActive: !!editPolicy.isActive,
      rules: (editPolicy.rules || []).map((r: any) => ({
        services: r.services || '*',
        priority: r.priority || 'Any',
        levels: (r.levels || []).map((l: any, idx: number) => ({
          level: l.level ?? idx + 1,
          afterMinutes: Number(l.afterMinutes) || 0,
          assign: l.assign || undefined,
          notify: l.notify || undefined,
        }))
      }))
    };
    const res = await fetch(isNew ? '/api/escalations/policies' : `/api/escalations/policies/${editPolicy.id}` , {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      toast({ title: 'Failed to save policy', variant: 'destructive' });
      return;
    }
    const saved = await res.json();
    setPolicies(prev => {
      const others = prev.filter(p => p.id !== saved.id);
      return [...others, saved].sort((a,b)=>a.name.localeCompare(b.name));
    });
    setEditPolicy(null);
    toast({ title: 'Policy saved' });
  }

  async function deletePolicy(id: string) {
    const res = await fetch(`/api/escalations/policies/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPolicies(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Policy deleted' });
    } else {
      toast({ title: 'Failed to delete policy', variant: 'destructive' });
    }
  }

  async function dryRun() {
    if (!dryRunIncidentId) return;
    const res = await fetch(`/api/incidents/${dryRunIncidentId}/escalations/dry-run`);
    if (res.ok) {
      const data = await res.json();
      setDryRunResult(data.result || []);
    }
  }

  async function loadAudit() {
    if (!auditIncidentId) return;
    setLoadingAudit(true);
    try {
      const res = await fetch(`/api/incidents/${auditIncidentId}/escalations/audit`);
      if (res.ok) {
        const data = await res.json();
        setAuditEntries(data.audit || []);
      }
    } finally {
      setLoadingAudit(false);
    }
  }

  return (
    <SettingsLayout activeItem="oncall-escalations">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">On-Call & Escalations</h1>
        <p className="text-muted-foreground">Manage resolver groups, on-call calendars, escalation policies, and audit history.</p>

        <Tabs value={tab} onValueChange={(v:any)=>setTab(v)}>
          <TabsList>
            <TabsTrigger value="groups">Resolver Groups</TabsTrigger>
            <TabsTrigger value="policies">Escalation Policies</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-6 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Resolver Groups</h2>
              <Button onClick={() => setEditGroup({ name: '', description: '', memberUserIds: [], calendar: { provider: 'google', calendarId: '', integrationUserId: '' } })}>New Group</Button>
            </div>
            <Card>
              <CardHeader><CardTitle>Groups</CardTitle></CardHeader>
              <CardContent>
                {loadingGroups ? (
                  <div>Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Calendar</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No resolver groups yet. Click "New Group" to create one.
                          </TableCell>
                        </TableRow>
                      ) : groups.map(g => (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell>{g.memberUserIds?.length || 0}</TableCell>
                          <TableCell>
                            {g.calendar ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{g.calendar.provider}</Badge>
                                <span className="text-xs text-muted-foreground truncate max-w-[240px]" title={g.calendar.calendarId}>{g.calendar.calendarId}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" onClick={()=>setEditGroup(g)}>Edit</Button>
                            <Button size="sm" variant="secondary" onClick={()=>testOnCall(g.id)}>Test On-Call</Button>
                            <Button size="sm" variant="destructive" onClick={()=>deleteGroup(g.id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <SimpleModal open={!!editGroup} onClose={()=>setEditGroup(null)} title={editGroup?.id ? 'Edit Group' : 'New Group'}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editGroup?.name || ''} onChange={(e)=>setEditGroup((p:any)=>({...p, name: e.target.value}))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={editGroup?.description || ''} onChange={(e)=>setEditGroup((p:any)=>({...p, description: e.target.value}))} />
                </div>
                <div>
                  <Label>Members</Label>
                  <div className="max-h-48 overflow-auto border rounded p-2 space-y-1">
                    {users.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No users</div>
                    ) : (
                      users.map((u:any)=>{
                        const checked = (editGroup?.memberUserIds||[]).includes(u.id);
                        return (
                          <label key={u.id} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={!!checked} onChange={(e)=>{
                              setEditGroup((p:any)=>{
                                const set = new Set(p?.memberUserIds||[]);
                                if (e.target.checked) set.add(u.id); else set.delete(u.id);
                                return { ...(p||{}), memberUserIds: Array.from(set) };
                              });
                            }} />
                            <span>{u.name || u.email}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Calendar Provider</Label>
                    <Select value={editGroup?.calendar?.provider || 'google'} onValueChange={(v)=>setEditGroup((p:any)=>({...p, calendar: { ...(p?.calendar||{}), provider: v }}))}>
                      <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="microsoft">Microsoft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Calendar ID</Label>
                    <Input value={editGroup?.calendar?.calendarId || ''} onChange={(e)=>setEditGroup((p:any)=>({...p, calendar: { ...(p?.calendar||{}), calendarId: e.target.value }}))} />
                  </div>
                  <div>
                    <Label>Integration User ID</Label>
                    <Input value={editGroup?.calendar?.integrationUserId || ''} onChange={(e)=>setEditGroup((p:any)=>({...p, calendar: { ...(p?.calendar||{}), integrationUserId: e.target.value }}))} />
                  </div>
                  <div>
                    <Label>Timezone</Label>
                    <Input placeholder="e.g., America/New_York" value={editGroup?.calendar?.timezone || ''} onChange={(e)=>setEditGroup((p:any)=>({...p, calendar: { ...(p?.calendar||{}), timezone: e.target.value }}))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={()=>setEditGroup(null)}>Cancel</Button>
                  <Button onClick={saveGroup}>Save</Button>
                </div>
              </div>
            </SimpleModal>

            <SimpleModal open={!!testOnCallResult} onClose={()=>setTestOnCallResult(null)} title="On-Call Result">
              <pre className="text-sm whitespace-pre-wrap break-all bg-muted rounded p-3">{JSON.stringify(testOnCallResult, null, 2)}</pre>
            </SimpleModal>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Escalation Policies</h2>
              <Button onClick={()=>setEditPolicy({ name: '', description: '', isActive: true, rules: [] })}>New Policy</Button>
            </div>
            <Card>
              <CardHeader><CardTitle>Policies</CardTitle></CardHeader>
              <CardContent>
                {loadingPolicies ? (
                  <div>Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rules</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {policies.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No escalation policies yet. Click "New Policy" to create one.
                          </TableCell>
                        </TableRow>
                      ) : policies.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                          <TableCell>{p.rules?.length || 0}</TableCell>
                          <TableCell className="space-x-2">
                            <Button size="sm" variant="outline" onClick={()=>setEditPolicy(p)}>Edit</Button>
                            <Button size="sm" variant="destructive" onClick={()=>deletePolicy(p.id)}>Delete</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Dry-Run Simulator</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Incident ID</Label>
                    <Input placeholder="Enter incident ID" value={dryRunIncidentId} onChange={(e)=>setDryRunIncidentId(e.target.value)} />
                  </div>
                  <Button onClick={dryRun}>Run Dry-Run</Button>
                </div>
                {dryRunResult && (
                  <pre className="text-sm whitespace-pre-wrap break-all bg-muted rounded p-3">{JSON.stringify(dryRunResult, null, 2)}</pre>
                )}
              </CardContent>
            </Card>

            <SimpleModal open={!!editPolicy} onClose={()=>setEditPolicy(null)} title={editPolicy?.id ? 'Edit Policy' : 'New Policy'}>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editPolicy?.name || ''} onChange={(e)=>setEditPolicy((p:any)=>({...p, name: e.target.value}))} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={editPolicy?.description || ''} onChange={(e)=>setEditPolicy((p:any)=>({...p, description: e.target.value}))} />
                </div>
                <div className="flex items-center gap-3">
                  <Label>Active</Label>
                  <Select value={editPolicy?.isActive ? 'true' : 'false'} onValueChange={(v)=>setEditPolicy((p:any)=>({...p, isActive: v === 'true'}))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Rules</h4>
                    <Button size="sm" variant="secondary" onClick={()=>setEditPolicy((p:any)=>({...p, rules: [...(p.rules||[]), { services: '*', priority: 'Any', levels: [] }]}))}>Add Rule</Button>
                  </div>
                  {(editPolicy?.rules || []).map((r:any, rIdx:number) => (
                    <Card key={rIdx}>
                      <CardContent className="space-y-3 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Services</Label>
                            <Input placeholder="* or comma-separated names" value={Array.isArray(r.services) ? r.services.join(', ') : r.services || '*'} onChange={(e)=>{
                              const v = e.target.value.trim();
                              const services = v === '*' || v === '' ? '*' : v.split(',').map(s=>s.trim()).filter(Boolean);
                              setEditPolicy((p:any)=>{
                                const rules = [...(p.rules||[])];
                                rules[rIdx] = { ...rules[rIdx], services };
                                return { ...p, rules };
                              });
                            }} />
                          </div>
                          <div>
                            <Label>Priority</Label>
                            <Select value={r.priority || 'Any'} onValueChange={(v)=>setEditPolicy((p:any)=>{
                              const rules = [...(p.rules||[])];
                              rules[rIdx] = { ...rules[rIdx], priority: v };
                              return { ...p, rules };
                            })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Any">Any</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h5 className="font-medium">Levels</h5>
                            <Button size="sm" variant="outline" onClick={()=>setEditPolicy((p:any)=>{
                              const rules = [...(p.rules||[])];
                              const levels = [...(rules[rIdx].levels||[]), { afterMinutes: 0 }];
                              rules[rIdx] = { ...rules[rIdx], levels };
                              return { ...p, rules };
                            })}>Add Level</Button>
                          </div>
                          {(r.levels||[]).map((l:any, lIdx:number) => (
                            <div key={lIdx} className="grid grid-cols-5 gap-3 items-end">
                              <div>
                                <Label>Level</Label>
                                <Input type="number" value={l.level ?? (lIdx+1)} onChange={(e)=>{
                                  const val = Number(e.target.value);
                                  setEditPolicy((p:any)=>{
                                    const rules = [...(p.rules||[])];
                                    const levels = [...(rules[rIdx].levels||[])];
                                    levels[lIdx] = { ...(levels[lIdx]||{}), level: val };
                                    rules[rIdx] = { ...rules[rIdx], levels };
                                    return { ...p, rules };
                                  });
                                }} />
                              </div>
                              <div>
                                <Label>After Minutes</Label>
                                <Input type="number" value={l.afterMinutes || 0} onChange={(e)=>{
                                  const val = Number(e.target.value);
                                  setEditPolicy((p:any)=>{
                                    const rules = [...(p.rules||[])];
                                    const levels = [...(rules[rIdx].levels||[])];
                                    levels[lIdx] = { ...(levels[lIdx]||{}), afterMinutes: val };
                                    rules[rIdx] = { ...rules[rIdx], levels };
                                    return { ...p, rules };
                                  });
                                }} />
                              </div>
                              <div>
                                <Label>Assign Group</Label>
                                <Select value={l.assign?.groupId || ''} onValueChange={(v)=>{
                                  setEditPolicy((p:any)=>{
                                    const rules = [...(p.rules||[])];
                                    const levels = [...(rules[rIdx].levels||[])];
                                    levels[lIdx] = { ...(levels[lIdx]||{}), assign: { ...(levels[lIdx]?.assign||{}), groupId: v || undefined } };
                                    rules[rIdx] = { ...rules[rIdx], levels };
                                    return { ...p, rules };
                                  })
                                }}>
                                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Assign User</Label>
                                <Select value={l.assign?.userId || ''} onValueChange={(v)=>{
                                  setEditPolicy((p:any)=>{
                                    const rules = [...(p.rules||[])];
                                    const levels = [...(rules[rIdx].levels||[])];
                                    levels[lIdx] = { ...(levels[lIdx]||{}), assign: { ...(levels[lIdx]?.assign||{}), userId: v || undefined } };
                                    rules[rIdx] = { ...rules[rIdx], levels };
                                    return { ...p, rules };
                                  })
                                }}>
                                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-5">
                                <Label>Notify Users</Label>
                                <div className="flex flex-wrap gap-2">
                                  {users.slice(0, 12).map(u => {
                                    const selected = (l.notify?.userIds||[]).includes(u.id);
                                    return (
                                      <button key={u.id} type="button" className={`text-xs px-2 py-1 rounded border ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`} onClick={()=>{
                                        setEditPolicy((p:any)=>{
                                          const rules = [...(p.rules||[])];
                                          const levels = [...(rules[rIdx].levels||[])];
                                          const curr = new Set(levels[lIdx]?.notify?.userIds || []);
                                          if (selected) curr.delete(u.id); else curr.add(u.id);
                                          levels[lIdx] = { ...(levels[lIdx]||{}), notify: { ...(levels[lIdx]?.notify||{}), userIds: Array.from(curr), channels: ['in-app'] } };
                                          rules[rIdx] = { ...rules[rIdx], levels };
                                          return { ...p, rules };
                                        })
                                      }}>
                                        {u.name || u.email}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={()=>setEditPolicy(null)}>Cancel</Button>
                  <Button onClick={savePolicy}>Save</Button>
                </div>
              </div>
            </SimpleModal>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6 mt-4">
            <Card>
              <CardHeader><CardTitle>Escalation Audit</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label>Incident ID</Label>
                    <Input placeholder="Enter incident ID" value={auditIncidentId} onChange={(e)=>setAuditIncidentId(e.target.value)} />
                  </div>
                  <Button onClick={loadAudit}>Load</Button>
                </div>
                {loadingAudit ? (
                  <div>Loading...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No audit entries. Enter an incident ID above and click Load.
                          </TableCell>
                        </TableRow>
                      ) : auditEntries.map((a, idx)=> (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{a.timestamp}</TableCell>
                          <TableCell><Badge variant={a.action==='missed_response' ? 'destructive' : 'secondary'}>{a.action}</Badge></TableCell>
                          <TableCell>{a.level ?? '-'}</TableCell>
                          <TableCell>{a.userId ?? '-'}</TableCell>
                          <TableCell>{a.groupId ?? '-'}</TableCell>
                          <TableCell className="max-w-[320px] truncate" title={a.details}>{a.details ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
}
