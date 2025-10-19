'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientFormModal } from '@/components/clients/client-form-modal'

export default function NewClientPage() {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  // Redirect back to clients list when modal is closed
  useEffect(() => {
    if (!open) {
      router.push('/clients')
    }
  }, [open, router])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/clients')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Client</h1>
          <p className="text-muted-foreground mt-1">
            Add a new client to your organization
          </p>
        </div>
      </div>

      {/* Form Modal */}
      <ClientFormModal
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => router.push('/clients')}
      />
    </div>
  )
}
