import { Handle, Position } from 'reactflow'
import { Bell, Mail, MessageSquare, Webhook } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationNodeProps {
  data: {
    label: string
    description?: string
    channels?: string[]
    recipients?: number
  }
  selected?: boolean
  id: string
}

const channelIcons = {
  email: Mail,
  sms: MessageSquare,
  webhook: Webhook,
  default: Bell,
}

export function NotificationNode({ data, selected }: NotificationNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[240px] p-4 rounded-2xl backdrop-blur-md',
        'bg-gradient-to-br from-cyan-600/90 via-teal-600/90 to-blue-700/90',
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-cyan-500/50 hover:scale-105',
        selected && 'ring-2 ring-cyan-400 shadow-cyan-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-2xl',
        'before:bg-gradient-to-br before:from-cyan-400/20 before:to-blue-600/20',
        'before:blur-xl before:-z-10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 flex items-center justify-center shadow-lg">
            <Bell className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-white text-base drop-shadow-md mb-2">
            {data.label}
          </h4>

          {data.channels && data.channels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {data.channels.map((channel, idx) => {
                const Icon = channelIcons[channel as keyof typeof channelIcons] || channelIcons.default
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/25 text-white rounded-full backdrop-blur-sm"
                  >
                    <Icon className="w-3 h-3" />
                    {channel}
                  </div>
                )
              })}
            </div>
          )}

          {data.recipients !== undefined && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm mb-2">
              {data.recipients} recipient{data.recipients !== 1 ? 's' : ''}
            </span>
          )}

          {data.description && (
            <p className="text-sm text-cyan-50 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-cyan-400 !to-teal-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-cyan-400 !to-teal-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
