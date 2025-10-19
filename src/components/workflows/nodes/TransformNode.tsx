import { Handle, Position } from 'reactflow'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransformNodeProps {
  data: {
    label: string
    description?: string
    operations?: string[]
  }
  selected?: boolean
  id: string
}

export function TransformNode({ data, selected }: TransformNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[220px] p-4 rounded-2xl backdrop-blur-md',
        'bg-gradient-to-br from-gray-600/90 via-slate-600/90 to-zinc-700/90',
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-gray-500/50 hover:scale-105',
        selected && 'ring-2 ring-gray-400 shadow-gray-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-2xl',
        'before:bg-gradient-to-br before:from-gray-400/20 before:to-zinc-600/20',
        'before:blur-xl before:-z-10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
          <Settings className="w-6 h-6 text-white drop-shadow-md animate-spin-slow" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-white drop-shadow-md mb-2">
            {data.label}
          </h4>

          {data.operations && data.operations.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {data.operations.slice(0, 3).map((op, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm"
                >
                  {op}
                </span>
              ))}
              {data.operations.length > 3 && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/30 text-white rounded-full backdrop-blur-sm">
                  +{data.operations.length - 3}
                </span>
              )}
            </div>
          )}

          {data.description && (
            <p className="text-sm text-gray-100 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-gray-400 !to-slate-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-gray-400 !to-slate-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
