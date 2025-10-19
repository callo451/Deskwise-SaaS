import { Handle, Position } from 'reactflow'
import { Timer } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SLANodeProps {
  data: {
    label: string
    description?: string
    responseTime?: string
    resolutionTime?: string
    status?: 'ok' | 'warning' | 'breach'
  }
  selected?: boolean
  id: string
}

export function SLANode({ data, selected }: SLANodeProps) {
  const statusColors = {
    ok: 'from-green-600/90 via-emerald-600/90 to-teal-700/90',
    warning: 'from-yellow-600/90 via-amber-600/90 to-orange-700/90',
    breach: 'from-red-600/90 via-rose-600/90 to-pink-700/90',
    default: 'from-slate-600/90 via-gray-600/90 to-zinc-700/90',
  }

  const statusBorderColors = {
    ok: 'before:from-green-400/20 before:to-teal-600/20',
    warning: 'before:from-yellow-400/20 before:to-orange-600/20',
    breach: 'before:from-red-400/20 before:to-pink-600/20',
    default: 'before:from-gray-400/20 before:to-zinc-600/20',
  }

  const colorClass = statusColors[data.status || 'default']
  const borderColorClass = statusBorderColors[data.status || 'default']

  return (
    <div
      className={cn(
        'relative min-w-[220px] p-4 rounded-2xl backdrop-blur-md',
        `bg-gradient-to-br ${colorClass}`,
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-red-500/50 hover:scale-105',
        selected && 'ring-2 ring-red-400 shadow-red-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-2xl',
        `before:bg-gradient-to-br ${borderColorClass}`,
        'before:blur-xl before:-z-10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
            <Timer className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          {data.status === 'breach' && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-white drop-shadow-md mb-2">
            {data.label}
          </h4>

          <div className="grid grid-cols-2 gap-2 mb-2">
            {data.responseTime && (
              <div className="px-2 py-1 text-xs bg-white/20 text-white rounded backdrop-blur-sm">
                <div className="text-[10px] opacity-80">Response</div>
                <div className="font-semibold">{data.responseTime}</div>
              </div>
            )}
            {data.resolutionTime && (
              <div className="px-2 py-1 text-xs bg-white/20 text-white rounded backdrop-blur-sm">
                <div className="text-[10px] opacity-80">Resolution</div>
                <div className="font-semibold">{data.resolutionTime}</div>
              </div>
            )}
          </div>

          {data.status && (
            <span
              className={cn(
                'inline-block px-2 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm',
                data.status === 'ok' && 'bg-green-500/50 text-white',
                data.status === 'warning' && 'bg-yellow-500/50 text-white',
                data.status === 'breach' && 'bg-red-500/50 text-white animate-pulse'
              )}
            >
              {data.status === 'ok' && 'On Track'}
              {data.status === 'warning' && 'At Risk'}
              {data.status === 'breach' && 'Breached'}
            </span>
          )}

          {data.description && (
            <p className="text-sm text-white/90 mt-2 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-red-400 !to-rose-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-red-400 !to-rose-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
