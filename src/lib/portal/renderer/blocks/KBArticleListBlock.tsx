import type { BlockProps, KBArticle } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { FileText, Eye } from 'lucide-react'

interface KBArticleListBlockProps {
  props: BlockProps
  orgId: string
}

export function KBArticleListBlock({ props, orgId }: KBArticleListBlockProps) {
  const { list, style } = props

  // In a real implementation, this would fetch articles from the data context
  const articles: KBArticle[] = []

  return (
    <div className={cn('portal-kb-article-list', style?.className)}>
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Knowledge Base Articles
      </h3>

      {articles.length === 0 ? (
        <div className="border rounded-lg p-6 text-center">
          <p className="text-muted-foreground">No articles found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article._id.toString()}
              href={`/portal/kb/${article._id}`}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-medium mb-2">{article.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {article.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline">{article.category}</Badge>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {article.views}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
