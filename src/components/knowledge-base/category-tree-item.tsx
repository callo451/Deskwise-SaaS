'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, FolderOpen, Folder, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { KBCategoryWithChildren } from '@/hooks/use-kb-categories'

interface CategoryTreeItemProps {
  category: KBCategoryWithChildren
  selectedId?: string
  onSelect: (categoryId: string) => void
  onEdit?: (category: KBCategoryWithChildren) => void
  onDelete?: (categoryId: string) => void
  isAdmin?: boolean
  level?: number
}

export function CategoryTreeItem({
  category,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  isAdmin = false,
  level = 0,
}: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0) // Auto-expand root categories
  const hasChildren = category.children && category.children.length > 0
  const isSelected = selectedId === category._id.toString()

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleSelect = () => {
    onSelect(category._id.toString())
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(category)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(category._id.toString())
  }

  const FolderIcon = isExpanded ? FolderOpen : Folder

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors',
          'hover:bg-accent',
          isSelected && 'bg-primary/10 text-primary font-medium',
          !isSelected && 'text-muted-foreground hover:text-foreground'
        )}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleSelect}
      >
        {/* Expand/Collapse Chevron */}
        <button
          onClick={handleToggle}
          className={cn(
            'p-0.5 hover:bg-accent rounded transition-colors',
            !hasChildren && 'invisible'
          )}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Color Indicator */}
        {category.color && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color }}
          />
        )}

        {/* Folder Icon */}
        <FolderIcon className="w-4 h-4 flex-shrink-0" />

        {/* Category Name */}
        <span className="flex-1 truncate text-sm">{category.name}</span>

        {/* Article Count Badge */}
        {category.articleCount !== undefined && category.articleCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {category.articleCount}
          </Badge>
        )}

        {/* Admin Actions */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Render Children */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child._id.toString()}
              category={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              isAdmin={isAdmin}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
