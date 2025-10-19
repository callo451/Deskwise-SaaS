'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Check,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import { useCannedResponses, useCannedResponseCategories } from '@/hooks/use-canned-responses'
import { CannedResponse } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CannedResponseSelectorProps {
  onSelect: (content: string) => void
  variables?: Record<string, string | number | undefined>
  disabled?: boolean
  variant?: 'default' | 'outline' | 'ghost'
}

export function CannedResponseSelector({
  onSelect,
  variables = {},
  disabled = false,
  variant = 'outline',
}: CannedResponseSelectorProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const {
    cannedResponses,
    loading: fetchLoading,
    useCannedResponse,
  } = useCannedResponses({
    isActive: true,
    category: selectedCategory || undefined,
  })

  const { categories } = useCannedResponseCategories()

  // Group responses by category
  const groupedResponses = cannedResponses.reduce((acc, response) => {
    const category = response.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(response)
    return acc
  }, {} as Record<string, CannedResponse[]>)

  // Sort responses within each category by usage count
  Object.keys(groupedResponses).forEach((category) => {
    groupedResponses[category].sort((a, b) => b.usageCount - a.usageCount)
  })

  const handleSelect = async (response: CannedResponse) => {
    setLoading(true)

    // Use the API to interpolate variables and increment usage count
    const result = await useCannedResponse(response._id.toString(), variables)

    if (result.success && result.content) {
      onSelect(result.content)
      setOpen(false)
    } else {
      // Fallback: just insert the raw content
      onSelect(response.content)
      setOpen(false)
    }

    setLoading(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          disabled={disabled || loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Inserting...
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4" />
              Canned Response
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search canned responses..." />
          <CommandList>
            <CommandEmpty>
              {fetchLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  No canned responses found
                </div>
              )}
            </CommandEmpty>

            {/* Category filter */}
            {categories.length > 0 && (
              <>
                <CommandGroup heading="Filter by Category">
                  <CommandItem
                    onSelect={() => setSelectedCategory('')}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedCategory === '' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    All Categories
                  </CommandItem>
                  {categories.map((category) => (
                    <CommandItem
                      key={category}
                      onSelect={() => setSelectedCategory(category)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedCategory === category ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {category}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Grouped responses */}
            {Object.keys(groupedResponses).map((category) => (
              <CommandGroup key={category} heading={category}>
                {groupedResponses[category].map((response) => (
                  <CommandItem
                    key={response._id.toString()}
                    onSelect={() => handleSelect(response)}
                    className="cursor-pointer flex items-start gap-2 py-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{response.name}</span>
                        {response.usageCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {response.usageCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {response.content}
                      </p>
                      {response.variables.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {response.variables.map((variable) => (
                            <Badge
                              key={variable}
                              variant="secondary"
                              className="text-xs"
                            >
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
