import { Handle, Position } from 'reactflow'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TriggerNodeProps {
  data: {
    label: string
    description?: string
    triggerType?: string
  }
  selected?: boolean
  id: string
}

export function TriggerNode({ data, selected }: TriggerNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[240px] p-4 rounded-xl backdrop-blur-md',
        'bg-gradient-to-br from-blue-600/90 via-purple-600/90 to-indigo-700/90',
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-blue-500/50 hover:scale-105',
        selected && 'ring-2 ring-indigo-500 shadow-indigo-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-xl',
        'before:bg-gradient-to-br before:from-blue-400/20 before:to-purple-600/20',
        'before:blur-xl before:-z-10',
        'animate-pulse-slow'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white drop-shadow-md" fill="currentColor" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white text-lg drop-shadow-md">
              {data.label}
            </h4>
          </div>

          {data.triggerType && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm mb-2">
              {data.triggerType}
            </span>
          )}

          {data.description && (
            <p className="text-sm text-blue-50 mt-2 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* Output handle only - triggers are entry points */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-blue-400 !to-purple-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
