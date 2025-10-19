'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown, HardDrive, Laptop, Server, Smartphone, Monitor, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Asset {
  _id: string
  assetTag: string
  name: string
  category: string
  status: 'active' | 'maintenance' | 'retired' | 'disposed'
  assignedTo?: string
  location?: string
  manufacturer?: string
  model?: string
}

interface AssetSelectorProps {
  selectedAssetIds: string[]
  onSelectionChange: (assetIds: string[]) => void
  multiSelect?: boolean
  className?: string
  suggestedAssetIds?: string[] // For smart suggestions
}

const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase()
  if (lowerCategory.includes('laptop')) return Laptop
  if (lowerCategory.includes('desktop') || lowerCategory.includes('computer')) return Monitor
  if (lowerCategory.includes('server')) return Server
  if (lowerCategory.includes('phone') || lowerCategory.includes('mobile')) return Smartphone
  return HardDrive
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'retired':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'disposed':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function AssetSelector({
  selectedAssetIds,
  onSelectionChange,
  multiSelect = true,
  className,
  suggestedAssetIds = [],
}: AssetSelectorProps) {
  const [open, setOpen] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      const data = await response.json()
      if (data.success) {
        // Sort: suggested first, then active, then by name
        const sortedAssets = data.data.sort((a: Asset, b: Asset) => {
          const aIsSuggested = suggestedAssetIds.includes(a._id)
          const bIsSuggested = suggestedAssetIds.includes(b._id)

          if (aIsSuggested && !bIsSuggested) return -1
          if (!aIsSuggested && bIsSuggested) return 1

          if (a.status === 'active' && b.status !== 'active') return -1
          if (a.status !== 'active' && b.status === 'active') return 1

          return a.name.localeCompare(b.name)
        })
        setAssets(sortedAssets)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedAssets = assets.filter((asset) =>
    selectedAssetIds.includes(asset._id)
  )

  const handleSelect = (assetId: string) => {
    if (multiSelect) {
      if (selectedAssetIds.includes(assetId)) {
        onSelectionChange(selectedAssetIds.filter((id) => id !== assetId))
      } else {
        onSelectionChange([...selectedAssetIds, assetId])
      }
    } else {
      if (selectedAssetIds.includes(assetId)) {
        onSelectionChange([])
        setOpen(false)
      } else {
        onSelectionChange([assetId])
        setOpen(false)
      }
    }
  }

  const handleRemoveAsset = (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selectedAssetIds.filter((id) => id !== assetId))
  }

  // Group assets by category
  const groupedAssets = assets.reduce((groups, asset) => {
    const category = asset.category || 'Uncategorized'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(asset)
    return groups
  }, {} as Record<string, Asset[]>)

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] py-2"
          >
            {selectedAssets.length === 0 ? (
              <span className="text-muted-foreground flex items-center gap-2">
                <Search className="w-4 h-4" />
                {multiSelect ? 'Select assets...' : 'Select an asset...'}
              </span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedAssets.map((asset) => {
                  const Icon = getCategoryIcon(asset.category)
                  return (
                    <Badge
                      key={asset._id}
                      variant="secondary"
                      className="flex items-center gap-1 pr-1"
                    >
                      <Icon className="w-3 h-3" />
                      <span className="font-mono text-xs">{asset.assetTag}</span>
                      <span className="text-xs">- {asset.name}</span>
                      {multiSelect && (
                        <button
                          onClick={(e) => handleRemoveAsset(asset._id, e)}
                          className="ml-1 rounded-full hover:bg-muted p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  )
                })}
              </div>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search assets by tag, name, or location..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>
              {loading ? 'Loading assets...' : 'No assets found.'}
            </CommandEmpty>
            <CommandList className="max-h-[300px]">
              {suggestedAssetIds.length > 0 && (
                <>
                  <CommandGroup heading="Suggested Assets">
                    {assets
                      .filter((asset) => suggestedAssetIds.includes(asset._id))
                      .map((asset) => {
                        const Icon = getCategoryIcon(asset.category)
                        const isSelected = selectedAssetIds.includes(asset._id)
                        return (
                          <CommandItem
                            key={asset._id}
                            value={`${asset.assetTag} ${asset.name} ${asset.location || ''}`}
                            onSelect={() => handleSelect(asset._id)}
                            className="flex items-center gap-2 py-3"
                          >
                            <div
                              className={cn(
                                'flex h-4 w-4 items-center justify-center rounded border',
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-muted-foreground'
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold">
                                {asset.assetTag}
                              </span>
                              <span className="text-sm">-</span>
                              <span className="text-sm font-medium">{asset.name}</span>
                              <Badge
                                variant="outline"
                                className={cn('text-xs', getStatusColor(asset.status))}
                              >
                                {asset.status}
                              </Badge>
                            </div>
                            {asset.location && (
                              <span className="text-xs text-muted-foreground">
                                {asset.location}
                              </span>
                            )}
                          </CommandItem>
                        )
                      })}
                  </CommandGroup>
                </>
              )}
              {Object.entries(groupedAssets).map(([category, categoryAssets]) => {
                // Filter out suggested assets from regular groups
                const nonSuggestedAssets = categoryAssets.filter(
                  (asset) => !suggestedAssetIds.includes(asset._id)
                )

                if (nonSuggestedAssets.length === 0) return null

                return (
                  <CommandGroup key={category} heading={category}>
                    {nonSuggestedAssets.map((asset) => {
                      const Icon = getCategoryIcon(asset.category)
                      const isSelected = selectedAssetIds.includes(asset._id)
                      return (
                        <CommandItem
                          key={asset._id}
                          value={`${asset.assetTag} ${asset.name} ${asset.location || ''}`}
                          onSelect={() => handleSelect(asset._id)}
                          className="flex items-center gap-2 py-3"
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border',
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-muted-foreground'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {asset.assetTag}
                            </span>
                            <span className="text-sm">-</span>
                            <span className="text-sm font-medium">{asset.name}</span>
                            <Badge
                              variant="outline"
                              className={cn('text-xs', getStatusColor(asset.status))}
                            >
                              {asset.status}
                            </Badge>
                          </div>
                          {asset.location && (
                            <span className="text-xs text-muted-foreground">
                              {asset.location}
                            </span>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedAssets.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedAssets.length} asset{selectedAssets.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  )
}
