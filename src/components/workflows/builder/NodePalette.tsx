'use client'

import React, { useState } from 'react'
import { Search, Zap, GitBranch, CheckCircle, Clock, Bell, UserPlus, Timer, Settings, Repeat, Merge, StopCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface NodeType {
  type: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'Triggers' | 'Logic' | 'Actions' | 'Flow Control'
  gradient: string
}

const nodeTypes: NodeType[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Start workflow on event',
    icon: Zap,
    category: 'Triggers',
    gradient: 'from-indigo-500 to-purple-600',
  },

  // Logic
  {
    type: 'condition',
    label: 'Condition',
    description: 'Branch based on rules',
    icon: GitBranch,
    category: 'Logic',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    type: 'loop',
    label: 'Loop',
    description: 'Repeat actions',
    icon: Repeat,
    category: 'Logic',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    type: 'merge',
    label: 'Merge',
    description: 'Combine branches',
    icon: Merge,
    category: 'Logic',
    gradient: 'from-purple-500 to-blue-600',
  },

  // Actions
  {
    type: 'action',
    label: 'Action',
    description: 'Update data',
    icon: Zap,
    category: 'Actions',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    type: 'approval',
    label: 'Approval',
    description: 'Request approval',
    icon: CheckCircle,
    category: 'Actions',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    type: 'notification',
    label: 'Notification',
    description: 'Send alerts',
    icon: Bell,
    category: 'Actions',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    type: 'assignment',
    label: 'Assignment',
    description: 'Auto-assign users',
    icon: UserPlus,
    category: 'Actions',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    type: 'sla',
    label: 'SLA',
    description: 'Manage SLA timers',
    icon: Timer,
    category: 'Actions',
    gradient: 'from-red-500 to-pink-600',
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Process data',
    icon: Settings,
    category: 'Actions',
    gradient: 'from-amber-500 to-orange-600',
  },

  // Flow Control
  {
    type: 'delay',
    label: 'Delay',
    description: 'Wait before continuing',
    icon: Clock,
    category: 'Flow Control',
    gradient: 'from-purple-500 to-pink-600',
  },
  {
    type: 'end',
    label: 'End',
    description: 'Terminate workflow',
    icon: StopCircle,
    category: 'Flow Control',
    gradient: 'from-rose-600 to-purple-700',
  },
]

const categories = ['Triggers', 'Logic', 'Actions', 'Flow Control'] as const

export function NodePalette() {
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedType, setDraggedType] = useState<string | null>(null)

  // Filter nodes based on search
  const filteredNodes = nodeTypes.filter((node) =>
    node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group by category
  const groupedNodes = categories.map((category) => ({
    category,
    nodes: filteredNodes.filter((node) => node.category === category),
  })).filter((group) => group.nodes.length > 0)

  // Handle drag start
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
    setDraggedType(nodeType)
  }

  // Handle drag end
  const onDragEnd = () => {
    setDraggedType(null)
  }

  return (
    <div className="h-full bg-gray-50 dark:bg-[#141927] border-r border-gray-200 dark:border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Node Palette</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-[#1e2536] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Node list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {groupedNodes.map((group) => (
            <div key={group.category}>
              {/* Category header */}
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {group.category}
              </h3>

              {/* Nodes in category */}
              <div className="space-y-2">
                {group.nodes.map((node) => {
                  const Icon = node.icon
                  const isDragging = draggedType === node.type

                  return (
                    <div
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        'group relative p-3 rounded-lg border bg-white dark:bg-[#1e2536]',
                        'border-gray-200 dark:border-white/10',
                        'hover:bg-gray-50 dark:hover:bg-[#252d42] hover:border-gray-300 dark:hover:border-white/20',
                        'transition-all cursor-grab active:cursor-grabbing shadow-sm',
                        isDragging && 'opacity-50 scale-95'
                      )}
                    >
                      {/* Gradient indicator */}
                      <div className={cn('absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br', node.gradient)} />

                      <div className="relative flex items-start gap-3">
                        {/* Icon */}
                        <div className={cn('flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center bg-gradient-to-br', node.gradient)}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">{node.label}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{node.description}</p>
                        </div>
                      </div>

                      {/* Drag hint */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[10px] text-gray-500 bg-gray-100 dark:bg-[#0a0e1a] px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10">
                          Drag
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {filteredNodes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">No nodes found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-100/50 dark:bg-[#0a0e1a]/50">
        <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
          Drag and drop nodes onto the canvas to build your workflow
        </p>
      </div>
    </div>
  )
}
