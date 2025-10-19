import { withAuth } from '@workos-inc/authkit-nextjs'
import { AdminPortalClient } from './admin-portal-client'

export default async function AdminPortalPage() {
  const { user, organizationId } = await withAuth({ ensureSignedIn: true })

  if (!user) {
    return <div>Please sign in to access the Admin Portal.</div>
  }

  return <AdminPortalClient user={user} organizationId={organizationId} />
}