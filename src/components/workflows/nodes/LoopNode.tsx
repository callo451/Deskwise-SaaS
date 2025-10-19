import { Handle, Position } from 'reactflow'
import { RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoopNodeProps {
  data: {
    label: string
    description?: string
    loopType?: string
    iterations?: number | string
  }
  selected?: boolean
  id: string
}

export function LoopNode({ data, selected }: LoopNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[220px] p-4 rounded-2xl backdrop-blur-md',
        'bg-gradient-to-br from-orange-600/90 via-amber-600/90 to-yellow-700/90',
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-orange-500/50 hover:scale-105',
        selected && 'ring-2 ring-orange-400 shadow-orange-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-2xl',
        'before:bg-gradient-to-br before:from-orange-400/20 before:to-yellow-600/20',
        'before:blur-xl before:-z-10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
            <RotateCw className="w-6 h-6 text-white drop-shadow-md animate-spin-slow" />
          </div>
          {data.iterations && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-xs font-bold text-white">
                {typeof data.iterations === 'number' ? data.iterations : '∞'}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-white drop-shadow-md mb-2">
            {data.label}
          </h4>

          {data.loopType && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/25 text-white rounded-full backdrop-blur-sm mb-2">
              {data.loopType}
            </span>
          )}

          {data.description && (
            <p className="text-sm text-orange-50 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-orange-400 !to-amber-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-orange-400 !to-amber-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      {/* Loop body connection */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop-body"
        className="!w-4 !h-4 !bg-gradient-to-br !from-yellow-400 !to-orange-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
