import { Handle, Position } from 'reactflow'
import { CheckCircle2, XCircle, StopCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EndNodeProps {
  data: {
    label: string
    description?: string
    endType?: 'success' | 'failure' | 'cancel'
    output?: Record<string, any>
  }
  selected?: boolean
  id: string
}

export function EndNode({ data, selected }: EndNodeProps) {
  const endType = data.endType || 'success'

  const colors = {
    success: {
      gradient: 'from-green-600/90 via-emerald-600/90 to-teal-700/90',
      glow: 'before:from-green-400/20 before:to-teal-600/20',
      shadow: 'hover:shadow-green-500/50',
      ring: 'ring-green-400 shadow-green-500/50',
    },
    failure: {
      gradient: 'from-red-600/90 via-rose-600/90 to-pink-700/90',
      glow: 'before:from-red-400/20 before:to-pink-600/20',
      shadow: 'hover:shadow-red-500/50',
      ring: 'ring-red-400 shadow-red-500/50',
    },
    cancel: {
      gradient: 'from-gray-600/90 via-slate-600/90 to-zinc-700/90',
      glow: 'before:from-gray-400/20 before:to-zinc-600/20',
      shadow: 'hover:shadow-gray-500/50',
      ring: 'ring-gray-400 shadow-gray-500/50',
    },
  }

  const icons = {
    success: CheckCircle2,
    failure: XCircle,
    cancel: StopCircle,
  }

  const Icon = icons[endType]
  const color = colors[endType]

  return (
    <div className="relative">
      <div
        className={cn(
          'relative w-[160px] h-[160px] backdrop-blur-md',
          `bg-gradient-to-br ${color.gradient}`,
          'border border-white/20 shadow-2xl',
          'transition-all duration-300',
          color.shadow,
          'hover:scale-105',
          selected && `ring-2 ${color.ring} scale-105`,
          'before:absolute before:inset-0',
          `before:bg-gradient-to-br ${color.glow}`,
          'before:blur-xl before:-z-10',
          'flex flex-col items-center justify-center text-center p-4'
        )}
        style={{
          clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
        }}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-3',
            endType === 'success' && 'bg-gradient-to-br from-green-300 to-emerald-500',
            endType === 'failure' && 'bg-gradient-to-br from-red-300 to-rose-500',
            endType === 'cancel' && 'bg-gradient-to-br from-gray-300 to-slate-500'
          )}
        >
          <Icon className="w-9 h-9 text-white drop-shadow-md" />
        </div>

        <h4 className="font-bold text-white text-base drop-shadow-md mb-1">
          {data.label}
        </h4>

        <span
          className={cn(
            'inline-block px-2 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm',
            endType === 'success' && 'bg-green-500/50 text-white',
            endType === 'failure' && 'bg-red-500/50 text-white',
            endType === 'cancel' && 'bg-gray-500/50 text-white'
          )}
        >
          {endType === 'success' && 'Success'}
          {endType === 'failure' && 'Failure'}
          {endType === 'cancel' && 'Cancelled'}
        </span>

        {data.description && (
          <p className="text-xs text-white/90 mt-2 leading-tight max-w-[120px]">
            {data.description}
          </p>
        )}
      </div>

      {/* Input handle only - end nodes are terminal */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          '!w-4 !h-4 !bg-gradient-to-br !border-2 !border-white hover:!scale-125 transition-transform',
          endType === 'success' && '!from-green-400 !to-emerald-500',
          endType === 'failure' && '!from-red-400 !to-rose-500',
          endType === 'cancel' && '!from-gray-400 !to-slate-500'
        )}
      />
    </div>
  )
}
