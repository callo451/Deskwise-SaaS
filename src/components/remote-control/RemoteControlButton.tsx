'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Monitor } from 'lucide-react'
import { RemoteSessionModal } from './RemoteSessionModal'

interface RemoteControlButtonProps {
  assetId: string
  assetName: string
  hasCapability: boolean
  disabled?: boolean
}

export function RemoteControlButton({
  assetId,
  assetName,
  hasCapability,
  disabled = false,
}: RemoteControlButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (!hasCapability) {
    return (
      <Button disabled variant="outline" size="sm">
        <Monitor className="h-4 w-4 mr-2" />
        Remote Control (Not Available)
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        disabled={disabled}
        variant="default"
        size="sm"
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Monitor className="h-4 w-4 mr-2" />
        Remote Control
      </Button>

      <RemoteSessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        assetId={assetId}
        assetName={assetName}
      />
    </>
  )
}
