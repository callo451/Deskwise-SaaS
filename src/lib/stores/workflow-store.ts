import { create } from 'zustand'
import {
  Node,
  Edge,
  Connection,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  NodeChange,
  EdgeChange,
  Viewport,
} from 'reactflow'

export type WorkflowNode = Node<{
  label: string
  description?: string
  icon: string
  color: string
  config: Record<string, any>
  errors?: string[]
}>

export type WorkflowEdge = Edge<{
  label?: string
  condition?: string
}>

interface WorkflowState {
  // State
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNode: WorkflowNode | null
  viewport: Viewport
  isDirty: boolean
  isSaving: boolean

  // Actions
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: WorkflowEdge[]) => void
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void

  addNode: (type: string, position: { x: number; y: number }) => void
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void
  deleteNode: (nodeId: string) => void
  selectNode: (nodeId: string | null) => void

  setViewport: (viewport: Viewport) => void
  setIsSaving: (isSaving: boolean) => void
  markDirty: () => void
  markClean: () => void
  reset: () => void

  // Load workflow
  loadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[], viewport?: Viewport) => void
}

const initialViewport: Viewport = { x: 0, y: 0, zoom: 1 }

// Node type configurations
const nodeConfigs: Record<string, { icon: string; color: string; defaultConfig: Record<string, any> }> = {
  trigger: {
    icon: 'Zap',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    defaultConfig: { type: 'event', module: 'tickets', event: 'created' },
  },
  condition: {
    icon: 'GitBranch',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    defaultConfig: { conditions: [], logicOperator: 'AND' },
  },
  action: {
    icon: 'Zap',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    defaultConfig: { action: 'update', module: 'tickets' },
  },
  approval: {
    icon: 'CheckCircle',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    defaultConfig: { approvers: [], approvalType: 'any' },
  },
  delay: {
    icon: 'Clock',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    defaultConfig: { delayType: 'duration', duration: 3600000 },
  },
  notification: {
    icon: 'Bell',
    color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    defaultConfig: { channel: 'email', recipients: [] },
  },
  assignment: {
    icon: 'UserPlus',
    color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    defaultConfig: { assignmentType: 'round-robin' },
  },
  sla: {
    icon: 'Timer',
    color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    defaultConfig: { operation: 'start', responseTime: 240 },
  },
  transform: {
    icon: 'Settings',
    color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    defaultConfig: { operations: [] },
  },
  loop: {
    icon: 'Repeat',
    color: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    defaultConfig: { loopType: 'forEach', maxIterations: 100 },
  },
  merge: {
    icon: 'Merge',
    color: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    defaultConfig: { strategy: 'waitForAll' },
  },
  end: {
    icon: 'StopCircle',
    color: 'linear-gradient(135deg, #f5576c 0%, #4c4177 100%)',
    defaultConfig: { endType: 'success' },
  },
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  selectedNode: null,
  viewport: initialViewport,
  isDirty: false,
  isSaving: false,

  // Set nodes
  setNodes: (nodes) => set({ nodes }),

  // Set edges
  setEdges: (edges) => set({ edges }),

  // Handle node changes (drag, delete, etc.)
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
      isDirty: true,
    })
  },

  // Handle edge changes
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
      isDirty: true,
    })
  },

  // Handle new connections
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
      isDirty: true,
    })
  },

  // Add a new node
  addNode: (type: string, position: { x: number; y: number }) => {
    const config = nodeConfigs[type]
    if (!config) return

    const newNode: WorkflowNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        icon: config.icon,
        color: config.color,
        config: config.defaultConfig,
      },
    }

    set({
      nodes: [...get().nodes, newNode],
      isDirty: true,
    })
  },

  // Update node data
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
      isDirty: true,
    })
  },

  // Delete a node
  deleteNode: (nodeId: string) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
      isDirty: true,
    })
  },

  // Select a node
  selectNode: (nodeId: string | null) => {
    const node = nodeId ? get().nodes.find((n) => n.id === nodeId) : null
    set({ selectedNode: node || null })
  },

  // Set viewport
  setViewport: (viewport: Viewport) => set({ viewport }),

  // Set saving state
  setIsSaving: (isSaving: boolean) => set({ isSaving }),

  // Mark as dirty (unsaved changes)
  markDirty: () => set({ isDirty: true }),

  // Mark as clean (saved)
  markClean: () => set({ isDirty: false }),

  // Reset state
  reset: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    viewport: initialViewport,
    isDirty: false,
    isSaving: false,
  }),

  // Load workflow from API
  loadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[], viewport?: Viewport) => {
    set({
      nodes,
      edges,
      viewport: viewport || initialViewport,
      selectedNode: null,
      isDirty: false,
    })
  },
}))
