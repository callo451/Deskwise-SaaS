import { Handle, Position } from 'reactflow'
import { UserCog, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignmentNodeProps {
  data: {
    label: string
    description?: string
    assignmentType?: string
    team?: string
  }
  selected?: boolean
  id: string
}

export function AssignmentNode({ data, selected }: AssignmentNodeProps) {
  return (
    <div
      className={cn(
        'relative min-w-[220px] p-4 rounded-2xl backdrop-blur-md',
        'bg-gradient-to-br from-blue-600/90 via-sky-600/90 to-indigo-700/90',
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-blue-500/50 hover:scale-105',
        selected && 'ring-2 ring-blue-400 shadow-blue-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-2xl',
        'before:bg-gradient-to-br before:from-blue-400/20 before:to-indigo-600/20',
        'before:blur-xl before:-z-10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
          <UserCog className="w-6 h-6 text-white drop-shadow-md" />
        </div>

        <div className="flex-1">
          <h4 className="font-bold text-white drop-shadow-md mb-2">
            {data.label}
          </h4>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {data.assignmentType && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/25 text-white rounded-full backdrop-blur-sm">
                {data.assignmentType}
              </span>
            )}
            {data.team && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-white/30 text-white rounded-full backdrop-blur-sm">
                <Users className="w-3 h-3" />
                {data.team}
              </span>
            )}
          </div>

          {data.description && (
            <p className="text-sm text-blue-50 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-blue-400 !to-sky-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-blue-400 !to-sky-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
