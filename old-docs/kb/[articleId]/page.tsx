'use client'

import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { LiveObject, LiveList, LiveMap, JsonObject } from '@liveblocks/client'
import { ClientSideSuspense } from '@liveblocks/react'
import { createRoomId } from '@/lib/liveblocks'
import { useAuth } from '@/contexts/auth-context'
import BlockEditor from '@/components/blocks/BlockEditor'
import AuthenticatedRoom from '@/components/kb-collaborative/AuthenticatedRoom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function LoadingEditor() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Loading collaborative editor...</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorEditor({ error }: { error: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Error Loading Editor</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

function KBEditorRoom({ roomId, articleId, user }: { roomId: string; articleId: string; user: any }) {
  return (
    <AuthenticatedRoom
      roomId={roomId}
      initialPresence={{
        cursor: null,
        selection: [],
        editingBlockId: '',
        caretPosition: 0,
        typing: false
      }}
      initialStorage={() => {
        console.log('Creating proper Liveblocks initial storage...')
        
        // Use proper Liveblocks structures for block-based editor
        const storage = {
          article: new LiveObject({
            meta: new LiveObject({
              title: 'Untitled Article',
              categoryId: 'general',
              visibility: 'AllTechnicians' as const,
              tags: [],
              status: 'draft' as const,
              lastSaved: Date.now(),
              version: 1
            }),
            blocks: new LiveList([{
              id: 'block-default-1',
              type: 'paragraph' as const,
              position: 1,
              textContent: '',
              content: {
                root: {
                  type: 'root',
                  children: [{
                    type: 'paragraph',
                    children: [{ type: 'text', text: '' }]
                  }]
                }
              } as JsonObject,
              createdBy: user?.id || 'unknown',
              createdAt: Date.now(),
              lastModifiedAt: Date.now()
            }]),
            comments: new LiveObject({
              threadIds: new LiveList([]),
              anchors: new LiveMap()
            })
          })
        }
        
        console.log('Liveblocks storage created:', storage)
        return storage as any
      }}
    >
      <ClientSideSuspense fallback={<LoadingEditor />}>
        <BlockEditor articleId={articleId} />
      </ClientSideSuspense>
    </AuthenticatedRoom>
  )
}

export default function CollaborativeKBEditorPage() {
  const params = useParams<{ articleId: string }>()
  const { user, organizationId, loading } = useAuth()

  if (loading) {
    return <LoadingEditor />
  }

  if (!user || !organizationId) {
    return <ErrorEditor error="Please sign in to access the collaborative editor." />
  }

  if (!params.articleId) {
    return <ErrorEditor error="Article ID is required." />
  }

  const roomId = createRoomId(organizationId, params.articleId)

  return (
    <div className="h-screen overflow-hidden">
      <Suspense fallback={<LoadingEditor />}>
        <KBEditorRoom roomId={roomId} articleId={params.articleId} user={user} />
      </Suspense>
    </div>
  )
}