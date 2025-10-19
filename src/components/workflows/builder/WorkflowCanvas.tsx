'use client'

import React, { useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkflowStore, WorkflowNode, WorkflowEdge } from '@/lib/stores/workflow-store'
import { nodeTypes } from '@/components/workflows/nodes'

interface WorkflowCanvasProps {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: WorkflowCanvasProps) {
  const { selectNode, deleteNode } = useWorkflowStore()

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectNode(node.id)
    },
    [selectNode]
  )

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Handle delete key
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      deleted.forEach((node) => deleteNode(node.id))
    },
    [deleteNode]
  )

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        fitView
        attributionPosition="bottom-right"
        className="workflow-canvas"
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
      >
        {/* Custom dot pattern background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          className="bg-white dark:bg-[#0a0e1a]"
        />

        {/* Controls */}
        <Controls
          className="bg-white dark:bg-[#1e2536] border border-gray-200 dark:border-white/10 rounded-lg shadow-sm"
          showInteractive={false}
        />

        {/* MiniMap */}
        <MiniMap
          className="bg-white dark:bg-[#1e2536] border border-gray-200 dark:border-white/10 rounded-lg shadow-sm"
          nodeColor={(node) => {
            const workflowNode = node as WorkflowNode
            return workflowNode.data.color || '#6366f1'
          }}
          pannable
          zoomable
        />

        {/* Custom panel for keyboard shortcuts hint */}
        <Panel position="top-left" className="bg-white/90 dark:bg-[#1e2536]/90 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-gray-600 dark:text-gray-400 shadow-sm">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#0a0e1a] rounded border border-gray-300 dark:border-white/10">Del</kbd> Delete</span>
            <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#0a0e1a] rounded border border-gray-300 dark:border-white/10">Shift</kbd> Multi-select</span>
          </div>
        </Panel>
      </ReactFlow>

      <style jsx global>{`
        /* Light mode canvas */
        .workflow-canvas {
          background: #ffffff;
        }

        .dark .workflow-canvas {
          background: #0a0e1a;
        }

        .workflow-canvas .react-flow__node {
          cursor: pointer;
        }

        .workflow-canvas .react-flow__node.selected {
          box-shadow: 0 0 0 2px #6366f1, 0 0 20px rgba(99, 102, 241, 0.5);
        }

        /* Light mode edges */
        .workflow-canvas .react-flow__edge-path {
          stroke: #94a3b8;
          stroke-width: 2;
        }

        .dark .workflow-canvas .react-flow__edge-path {
          stroke: #64748b;
        }

        .workflow-canvas .react-flow__edge.selected .react-flow__edge-path {
          stroke: #8b5cf6;
        }

        .workflow-canvas .react-flow__edge.animated .react-flow__edge-path {
          stroke: #10b981;
          stroke-dasharray: 5;
          animation: dashdraw 0.5s linear infinite;
        }

        @keyframes dashdraw {
          to {
            stroke-dashoffset: -10;
          }
        }

        /* Light mode handles */
        .workflow-canvas .react-flow__handle {
          width: 10px;
          height: 10px;
          background: #6366f1;
          border: 2px solid #ffffff;
        }

        .dark .workflow-canvas .react-flow__handle {
          border: 2px solid #0a0e1a;
        }

        .workflow-canvas .react-flow__handle:hover {
          background: #8b5cf6;
        }

        /* Light mode controls */
        .workflow-canvas .react-flow__controls {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dark .workflow-canvas .react-flow__controls {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }

        .workflow-canvas .react-flow__controls-button {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
        }

        .dark .workflow-canvas .react-flow__controls-button {
          background: #1e2536;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .workflow-canvas .react-flow__controls-button:hover {
          background: #f3f4f6;
        }

        .dark .workflow-canvas .react-flow__controls-button:hover {
          background: #2d3548;
        }

        .workflow-canvas .react-flow__minimap {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .dark .workflow-canvas .react-flow__minimap {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  )
}
