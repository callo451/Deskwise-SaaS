import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {
  // Minimal options - let MongoDB driver handle defaults
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the client isn't constantly recreated
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

// Helper function to get the database
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db('deskwise')
}

// Export the client promise (both default and named for compatibility)
export default clientPromise
export { clientPromise }

// MongoDB Collections Type Safety
export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  TICKETS: 'tickets',
  TICKET_COMMENTS: 'ticket_comments',
  TIME_ENTRIES: 'time_entries',
  CSAT_RATINGS: 'csat_ratings',
  CANNED_RESPONSES: 'canned_responses',

  // Unified Ticketing System (Tickets, Incidents, Changes, Service Requests, Problems)
  UNIFIED_TICKETS: 'unified_tickets',
  UNIFIED_TICKET_UPDATES: 'unified_ticket_updates',

  // Legacy collections (deprecated - kept for migration rollback)
  /** @deprecated Use UNIFIED_TICKETS with ticketType='service_request' filter */
  SERVICE_REQUESTS: 'service_requests',
  /** @deprecated Use UNIFIED_TICKETS with ticketType='incident' filter */
  INCIDENTS: 'incidents',
  /** @deprecated Use UNIFIED_TICKET_UPDATES for incident updates */
  INCIDENT_UPDATES: 'incident_updates',
  /** @deprecated Use UNIFIED_TICKETS with ticketType='problem' filter */
  PROBLEMS: 'problems',
  /** @deprecated Use UNIFIED_TICKET_UPDATES for problem updates */
  PROBLEM_UPDATES: 'problem_updates',
  /** @deprecated Use UNIFIED_TICKETS with ticketType='change' filter */
  CHANGE_REQUESTS: 'change_requests',
  /** @deprecated Integrated into UNIFIED_TICKETS metadata */
  CHANGE_APPROVALS: 'change_approvals',
  PROJECTS: 'projects',
  PROJECT_TASKS: 'project_tasks',
  PROJECT_MILESTONES: 'project_milestones',
  SCHEDULE_ITEMS: 'schedule_items',
  ASSETS: 'assets',
  ASSET_MAINTENANCE: 'asset_maintenance',
  PERFORMANCE_SNAPSHOTS: 'performance_snapshots',
  INVENTORY: 'inventory',
  STOCK_MOVEMENTS: 'stock_movements',
  PURCHASE_ORDERS: 'purchase_orders',
  KB_ARTICLES: 'kb_articles',
  KB_CATEGORIES: 'kb_categories',
  KB_TAGS: 'kb_tags',
  RECORDING_SESSIONS: 'recording_sessions',
  RECORDING_STEPS: 'recording_steps',
  RECORDER_SCREENSHOTS: 'recorder_screenshots',
  CLIENTS: 'clients',
  QUOTES: 'quotes',
  SERVICE_CATALOGUE: 'service_catalogue',
  SERVICE_CATALOG_CATEGORIES: 'service_catalog_categories',
  FORM_TEMPLATES: 'form_templates',
  CONTRACTS: 'contracts',
  TIME_LOGS: 'time_logs',
  SLA_POLICIES: 'sla_policies',
  INVOICES: 'invoices',
  ENROLLMENT_TOKENS: 'enrollment_tokens',
  AGENT_CREDENTIALS: 'agent_credentials',
  ASSET_CATEGORIES: 'asset_categories',
  ASSET_LOCATIONS: 'asset_locations',
  ORGANIZATION_ASSET_SETTINGS: 'organization_asset_settings',
  RC_SESSIONS: 'rc_sessions',
  RC_POLICIES: 'rc_policies',
  AUDIT_REMOTE_CONTROL: 'audit_remote_control',
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
  ROLE_ASSIGNMENT_HISTORY: 'role_assignment_history',
  WORKFLOWS: 'workflows',
  WORKFLOW_EXECUTIONS: 'workflow_executions',
  WORKFLOW_TEMPLATES: 'workflow_templates',
  WORKFLOW_LOGS: 'workflow_logs',
  PORTAL_PAGES: 'portal_pages',
  PORTAL_PAGE_VERSIONS: 'portal_page_versions',
  PORTAL_THEMES: 'portal_themes',
  PORTAL_DATA_SOURCES: 'portal_data_sources',
  PORTAL_AUDIT_LOGS: 'portal_audit_logs',
  PORTAL_ANALYTICS: 'portal_analytics',
  PORTAL_PREVIEW_TOKENS: 'portal_preview_tokens',
  EMAIL_SETTINGS: 'email_settings',
  NOTIFICATION_TEMPLATES: 'notification_templates',
  NOTIFICATION_RULES: 'notification_rules',
  USER_NOTIFICATION_PREFERENCES: 'user_notification_preferences',
  EMAIL_DELIVERY_LOGS: 'email_delivery_logs',
  EMAIL_QUEUE: 'email_queue',
  INBOUND_EMAIL_ACCOUNTS: 'inbound_email_accounts',
  PROCESSED_EMAILS: 'processed_emails',
} as const

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS]
