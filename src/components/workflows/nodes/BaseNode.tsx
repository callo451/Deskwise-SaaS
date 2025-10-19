'use client'

import React from 'react'
import { Handle, Position } from 'reactflow'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

interface BaseNodeProps {
  data: {
    label: string
    description?: string
    icon: string
    color: string
    config?: Record<string, any>
    errors?: string[]
  }
  selected?: boolean
  type?: string
}

export function BaseNode({ data, selected, type }: BaseNodeProps) {
  // Dynamically get icon component
  const IconComponent = (LucideIcons as any)[data.icon] || LucideIcons.Zap

  return (
    <div
      className={cn(
        'relative min-w-[200px] p-4 rounded-lg backdrop-blur-md',
        'border border-white/10 shadow-2xl transition-all duration-200',
        'hover:shadow-3xl hover:border-white/20',
        selected && 'ring-2 ring-indigo-500 shadow-indigo-500/50'
      )}
      style={{
        background: `linear-gradient(135deg, rgba(10, 14, 26, 0.8), rgba(30, 37, 54, 0.8))`,
      }}
    >
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
        style={{
          background: data.color,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: data.color,
            }}
          >
            <IconComponent className="w-5 h-5 text-white" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-sm truncate">{data.label}</h4>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{type}</p>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-gray-300 mt-2 line-clamp-2">{data.description}</p>
        )}

        {/* Errors */}
        {data.errors && data.errors.length > 0 && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-400">
            {data.errors[0]}
          </div>
        )}

        {/* Config preview */}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-2 text-[10px] text-gray-500 truncate">
            {Object.keys(data.config).length} config options
          </div>
        )}
      </div>

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-indigo-500 border-2 border-[#0a0e1a] hover:bg-indigo-400 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-indigo-500 border-2 border-[#0a0e1a] hover:bg-indigo-400 transition-colors"
      />

      {/* Animated glow on hover */}
      {selected && (
        <div
          className="absolute inset-0 rounded-lg animate-pulse pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${data.color}20, transparent)`,
          }}
        />
      )}
    </div>
  )
}
