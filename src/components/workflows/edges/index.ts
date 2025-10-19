import { CustomEdge } from './CustomEdge'

// Export custom edge component
export { CustomEdge }

// Export edgeTypes object for React Flow
export const edgeTypes = {
  custom: CustomEdge,
  default: CustomEdge,
  conditional: CustomEdge,
}

// Type definitions for edge data
export interface CustomEdgeData {
  label?: string
  condition?: string
  animated?: boolean
  status?: 'active' | 'success' | 'error'
}
