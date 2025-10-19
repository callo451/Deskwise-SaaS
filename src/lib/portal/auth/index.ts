/**
 * Portal Auth Module
 *
 * Centralized exports for portal authentication, authorization, and auditing
 */

// Permission checking
export {
  canEditPortal,
  canPublishPage,
  canDeletePage,
  canAccessDataSource,
  canEditTheme,
  canCreatePage,
  canViewPortalComposer,
  getPortalPermissions,
  hasAllPortalPermissions,
  hasAnyPortalPermission,
} from './permissions'

// Page access control
export {
  canAccessPage,
  getAccessiblePage,
  evaluateVisibilityGuard,
  filterBlocksByVisibility,
  checkGuestAccess,
  getPageForRender,
  incrementPageViews,
  validateGuestSubmission,
  cleanupRateLimits,
} from './page-access'

// Audit logging
export {
  PortalAuditService,
  type PortalAuditAction,
  type PortalAuditLog,
} from './audit'
