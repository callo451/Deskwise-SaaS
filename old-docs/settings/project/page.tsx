'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function ProjectSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [allowMultipleActive, setAllowMultipleActive] = useState(false)

  useEffect(() => {
    (async()=>{
      try {
        const res = await fetch('/api/settings/project-settings')
        if (res.ok) {
          const data = await res.json()
          setAllowMultipleActive(!!data.sprintAllowMultipleActive)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const save = async (value: boolean) => {
    setAllowMultipleActive(value)
    await fetch('/api/settings/project-settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sprintAllowMultipleActive: value }) })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Management Settings</CardTitle>
          <CardDescription>Control global project behavior for your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label htmlFor="multi-active">Allow multiple Active sprints per project</Label>
              <p className="text-sm text-muted-foreground">When off, activating a sprint automatically deactivates other Active sprints in the same project.</p>
            </div>
            <Switch id="multi-active" checked={allowMultipleActive} onCheckedChange={save} disabled={loading} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
