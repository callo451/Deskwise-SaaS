import { Handle, Position } from 'reactflow'
import { GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConditionNodeProps {
  data: {
    label: string
    description?: string
    condition?: string
  }
  selected?: boolean
  id: string
}

export function ConditionNode({ data, selected }: ConditionNodeProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          'relative min-w-[200px] p-4 backdrop-blur-md',
          'bg-gradient-to-br from-amber-500/90 via-orange-500/90 to-yellow-600/90',
          'border border-white/20 shadow-2xl',
          'transition-all duration-300',
          'hover:shadow-amber-500/50 hover:scale-105',
          selected && 'ring-2 ring-amber-400 shadow-amber-500/50 scale-105',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-br before:from-amber-400/20 before:to-orange-600/20',
          'before:blur-xl before:-z-10',
          // Diamond shape using clip-path
          'rotate-45'
        )}
        style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        }}
      >
        <div className="-rotate-45 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center shadow-lg mb-2">
            <GitBranch className="w-5 h-5 text-white drop-shadow-md" />
          </div>

          <h4 className="font-bold text-white text-sm drop-shadow-md mb-1">
            {data.label}
          </h4>

          {data.condition && (
            <p className="text-xs text-amber-50 max-w-[140px] truncate">
              {data.condition}
            </p>
          )}
        </div>
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-amber-400 !to-orange-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      {/* True path handle (top) */}
      <Handle
        type="source"
        position={Position.Top}
        id="true"
        className="!w-4 !h-4 !bg-gradient-to-br !from-green-400 !to-emerald-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      {/* False path handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="!w-4 !h-4 !bg-gradient-to-br !from-red-400 !to-rose-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
