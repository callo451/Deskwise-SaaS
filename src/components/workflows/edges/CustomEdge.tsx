import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'
import { cn } from '@/lib/utils'

interface CustomEdgeData {
  label?: string
  condition?: string
  animated?: boolean
  status?: 'active' | 'success' | 'error'
}

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps<CustomEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const isAnimated = data?.animated || false
  const label = data?.label || data?.condition

  // Determine edge color based on status
  const getEdgeColor = () => {
    if (data?.status === 'active') return '#10b981' // green
    if (data?.status === 'success') return '#3b82f6' // blue
    if (data?.status === 'error') return '#ef4444' // red
    if (selected) return '#8b5cf6' // purple
    return '#64748b' // slate
  }

  const edgeColor = getEdgeColor()

  return (
    <>
      {/* Glow effect layer */}
      <path
        id={`${id}-glow`}
        d={edgePath}
        className="react-flow__edge-path"
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 6 : 4,
          opacity: 0.3,
          filter: 'blur(8px)',
          fill: 'none',
        }}
      />

      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        className={cn(
          'react-flow__edge-path',
          isAnimated && 'animate-dash'
        )}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 3 : 2,
          fill: 'none',
          strokeDasharray: isAnimated ? '5 5' : 'none',
          transition: 'all 0.3s ease',
        }}
        markerEnd={markerEnd}
      />

      {/* Animated flow indicator */}
      {isAnimated && (
        <circle r="4" fill={edgeColor} className="animate-flow-particle">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {/* Edge label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className={cn(
                'px-3 py-1.5 rounded-full backdrop-blur-md',
                'bg-gradient-to-br from-slate-800/90 to-slate-900/90',
                'border border-white/20 shadow-lg',
                'text-xs font-medium text-white',
                'transition-all duration-200',
                'hover:scale-105 hover:shadow-xl',
                selected && 'ring-2 ring-purple-400'
              )}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
