import { Handle, Position } from 'reactflow'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DelayNodeProps {
  data: {
    label: string
    description?: string
    duration?: string
  }
  selected?: boolean
  id: string
}

export function DelayNode({ data, selected }: DelayNodeProps) {
  return (
    <div
      className={cn(
        'relative w-[180px] h-[180px] rounded-full backdrop-blur-md',
        'bg-gradient-to-br from-purple-600/90 via-indigo-600/90 to-violet-700/90',
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-purple-500/50 hover:scale-105',
        selected && 'ring-2 ring-purple-400 shadow-purple-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-full',
        'before:bg-gradient-to-br before:from-purple-400/20 before:to-indigo-600/20',
        'before:blur-xl before:-z-10',
        'flex flex-col items-center justify-center text-center p-6'
      )}
    >
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-300 to-indigo-500 flex items-center justify-center shadow-lg mb-3">
        <Clock className="w-8 h-8 text-white drop-shadow-md" />
      </div>

      <h4 className="font-bold text-white text-base drop-shadow-md mb-2">
        {data.label}
      </h4>

      {data.duration && (
        <span className="inline-block px-3 py-1 text-xs font-medium bg-white/25 text-white rounded-full backdrop-blur-sm mb-2">
          {data.duration}
        </span>
      )}

      {data.description && (
        <p className="text-xs text-purple-50 leading-relaxed">
          {data.description}
        </p>
      )}

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-purple-400 !to-indigo-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-purple-400 !to-indigo-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
