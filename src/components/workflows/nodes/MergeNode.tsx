import { Handle, Position } from 'reactflow'
import { GitMerge } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MergeNodeProps {
  data: {
    label: string
    description?: string
    strategy?: string
    inputs?: number
  }
  selected?: boolean
  id: string
}

export function MergeNode({ data, selected }: MergeNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[200px] p-4 rounded-2xl backdrop-blur-md',
        'bg-gradient-to-br from-purple-600/90 via-fuchsia-600/90 to-pink-700/90',
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-purple-500/50 hover:scale-105',
        selected && 'ring-2 ring-purple-400 shadow-purple-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-2xl',
        'before:bg-gradient-to-br before:from-purple-400/20 before:to-pink-600/20',
        'before:blur-xl before:-z-10'
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30 mb-3">
          <GitMerge className="w-7 h-7 text-white drop-shadow-md rotate-90" />
        </div>

        <h4 className="font-bold text-white drop-shadow-md mb-2">
          {data.label}
        </h4>

        <div className="flex flex-wrap gap-1.5 justify-center mb-2">
          {data.strategy && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/25 text-white rounded-full backdrop-blur-sm">
              {data.strategy}
            </span>
          )}
          {data.inputs && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/30 text-white rounded-full backdrop-blur-sm">
              {data.inputs} inputs
            </span>
          )}
        </div>

        {data.description && (
          <p className="text-sm text-purple-50 leading-relaxed">
            {data.description}
          </p>
        )}
      </div>

      {/* Multiple input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-1"
        style={{ top: '30%' }}
        className="!w-4 !h-4 !bg-gradient-to-br !from-purple-400 !to-fuchsia-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-2"
        style={{ top: '50%' }}
        className="!w-4 !h-4 !bg-gradient-to-br !from-purple-400 !to-fuchsia-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input-3"
        style={{ top: '70%' }}
        className="!w-4 !h-4 !bg-gradient-to-br !from-purple-400 !to-fuchsia-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      {/* Single output handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-purple-400 !to-fuchsia-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
