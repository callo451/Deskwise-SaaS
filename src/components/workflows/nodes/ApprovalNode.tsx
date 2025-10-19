import { Handle, Position } from 'reactflow'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApprovalNodeProps {
  data: {
    label: string
    description?: string
    approvers?: string[]
  }
  selected?: boolean
  id: string
}

export function ApprovalNode({ data, selected }: ApprovalNodeProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          'relative min-w-[220px] p-4 backdrop-blur-md',
          'bg-gradient-to-r from-green-500/90 via-emerald-500/90 to-red-500/90',
          'border border-white/20 shadow-2xl',
          'transition-all duration-300',
          'hover:shadow-emerald-500/50 hover:scale-105',
          selected && 'ring-2 ring-emerald-400 shadow-emerald-500/50 scale-105',
          'before:absolute before:inset-0',
          'before:bg-gradient-to-br before:from-green-400/20 before:to-red-400/20',
          'before:blur-xl before:-z-10',
          // Octagon shape
          'clip-path-octagon'
        )}
        style={{
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="flex gap-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
            </div>
            <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
              <XCircle className="w-5 h-5 text-white drop-shadow-md" />
            </div>
          </div>

          <h4 className="font-bold text-white text-sm drop-shadow-md mb-2">
            {data.label}
          </h4>

          {data.approvers && data.approvers.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mb-2">
              {data.approvers.slice(0, 2).map((approver, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-0.5 text-xs font-medium bg-white/30 text-white rounded-full backdrop-blur-sm"
                >
                  {approver}
                </span>
              ))}
              {data.approvers.length > 2 && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-white/30 text-white rounded-full backdrop-blur-sm">
                  +{data.approvers.length - 2}
                </span>
              )}
            </div>
          )}

          {data.description && (
            <p className="text-xs text-white/90 max-w-[180px] leading-relaxed">
              {data.description}
            </p>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br !from-emerald-400 !to-green-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      {/* Approved path */}
      <Handle
        type="source"
        position={Position.Top}
        id="approved"
        className="!w-4 !h-4 !bg-gradient-to-br !from-green-400 !to-emerald-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />

      {/* Rejected path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="rejected"
        className="!w-4 !h-4 !bg-gradient-to-br !from-red-400 !to-rose-500 !border-2 !border-white hover:!scale-125 transition-transform"
      />
    </div>
  )
}
