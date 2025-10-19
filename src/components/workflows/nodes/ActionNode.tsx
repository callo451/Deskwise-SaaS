import { Handle, Position } from 'reactflow'
import { Zap, Database, Send, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionNodeProps {
  data: {
    label: string
    description?: string
    action?: string
    module?: string
  }
  selected?: boolean
  id: string
}

const moduleColors = {
  tickets: 'from-blue-600 via-blue-500 to-cyan-600',
  incidents: 'from-red-600 via-rose-500 to-pink-600',
  changes: 'from-purple-600 via-violet-500 to-indigo-600',
  assets: 'from-slate-600 via-gray-500 to-zinc-600',
  projects: 'from-green-600 via-emerald-500 to-teal-600',
  default: 'from-indigo-600 via-blue-500 to-cyan-600',
}

const actionIcons = {
  create: Database,
  update: Edit,
  delete: Trash2,
  send: Send,
  default: Zap,
}

export function ActionNode({ data, selected }: ActionNodeProps) {
  const colorClass = moduleColors[data.module as keyof typeof moduleColors] || moduleColors.default
  const Icon = actionIcons[data.action as keyof typeof actionIcons] || actionIcons.default

  return (
    <div
      className={cn(
        'relative min-w-[220px] p-4 rounded-2xl backdrop-blur-md',
        `bg-gradient-to-br ${colorClass}/90`,
        'border border-white/20 shadow-2xl',
        'transition-all duration-300',
        'hover:shadow-blue-500/50 hover:scale-105',
        selected && 'ring-2 ring-indigo-500 shadow-indigo-500/50 scale-105',
        'before:absolute before:inset-0 before:rounded-2xl',
        'before:bg-gradient-to-br before:from-white/10 before:to-transparent',
        'before:blur-xl before:-z-10'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
          <Icon className="w-6 h-6 text-white drop-shadow-md" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-white drop-shadow-md">
              {data.label}
            </h4>
          </div>

          <div className="flex gap-1.5 mb-2">
            {data.action && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm">
                {data.action}
              </span>
            )}
            {data.module && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/30 text-white rounded-full backdrop-blur-sm">
                {data.module}
              </span>
            )}
          </div>

          {data.description && (
            <p className="text-sm text-white/90 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-blue-400 !to-indigo-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-gradient-to-br !from-blue-400 !to-indigo-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
