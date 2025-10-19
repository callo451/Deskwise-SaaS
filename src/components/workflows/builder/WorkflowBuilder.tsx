'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import { ReactFlowProvider, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'
import { useWorkflowStore } from '@/lib/stores/workflow-store'
import { WorkflowCanvas } from './WorkflowCanvas'
import { NodePalette } from './NodePalette'
import { PropertiesPanel } from './PropertiesPanel'
import { Toolbar } from './Toolbar'
import { useToast } from '@/hooks/use-toast'

interface WorkflowBuilderProps {
  workflowId?: string
  initialData?: {
    name: string
    nodes: any[]
    edges: any[]
    viewport?: any
    enabled: boolean
  }
  onSave?: (data: { nodes: any[]; edges: any[]; viewport: any }) => Promise<void>
  onTest?: () => Promise<void>
  onToggleEnabled?: () => Promise<void>
}

function WorkflowBuilderInner({
  workflowId,
  initialData,
  onSave,
  onTest,
  onToggleEnabled,
}: WorkflowBuilderProps) {
  const reactFlowInstance = useReactFlow()
  const { toast } = useToast()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setViewport,
    loadWorkflow,
    markClean,
    setIsSaving,
  } = useWorkflowStore()

  // Load initial data
  useEffect(() => {
    if (initialData) {
      loadWorkflow(
        initialData.nodes,
        initialData.edges,
        initialData.viewport
      )
    }
  }, [initialData, loadWorkflow])

  // Handle drop from node palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
      if (!reactFlowBounds) return

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      addNode(type, position)
    },
    [reactFlowInstance, addNode]
  )

  // Handle save
  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      const viewport = reactFlowInstance.getViewport()
      await onSave({ nodes, edges, viewport })
      markClean()
      toast({
        title: 'Success',
        description: 'Workflow saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle test
  const handleTest = async () => {
    if (!onTest) return

    try {
      await onTest()
      toast({
        title: 'Test Started',
        description: 'Workflow test is running',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test workflow',
        variant: 'destructive',
      })
    }
  }

  // Handle toggle enabled
  const handleToggleEnabled = async () => {
    if (!onToggleEnabled) return

    try {
      await onToggleEnabled()
      toast({
        title: 'Success',
        description: `Workflow ${initialData?.enabled ? 'disabled' : 'enabled'} successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle workflow',
        variant: 'destructive',
      })
    }
  }

  // Zoom controls
  const handleZoomIn = () => reactFlowInstance.zoomIn()
  const handleZoomOut = () => reactFlowInstance.zoomOut()
  const handleFitView = () => reactFlowInstance.fitView({ padding: 0.2 })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0a0e1a]">
      {/* Toolbar */}
      <Toolbar
        workflowName={initialData?.name || 'Untitled Workflow'}
        isEnabled={initialData?.enabled || false}
        onSave={handleSave}
        onTest={handleTest}
        onToggleEnabled={handleToggleEnabled}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <div className="w-80 flex-shrink-0">
          <NodePalette />
        </div>

        {/* Canvas */}
        <div
          ref={reactFlowWrapper}
          className="flex-1"
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />
        </div>

        {/* Properties Panel */}
        <div className="w-96 flex-shrink-0">
          <PropertiesPanel />
        </div>
      </div>

      {/* Global styles */}
      <style jsx global>{`
        .workflow-builder {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        /* Smooth animations */
        .workflow-builder * {
          transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
        }

        /* Hide scrollbar but keep functionality */
        .workflow-builder ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .workflow-builder ::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Theme-aware scrollbar */
        .workflow-builder ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }

        .dark .workflow-builder ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }

        .workflow-builder ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }

        .dark .workflow-builder ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  )
}

export function WorkflowBuilder(props: WorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <div className="workflow-builder">
        <WorkflowBuilderInner {...props} />
      </div>
    </ReactFlowProvider>
  )
}
