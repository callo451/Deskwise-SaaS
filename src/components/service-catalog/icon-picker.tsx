'use client'

import { useState, useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// Common service/ITSM related icons
const COMMON_ICONS = [
  'Wrench',
  'Settings',
  'Tool',
  'Package',
  'Box',
  'Server',
  'HardDrive',
  'Laptop',
  'Monitor',
  'Smartphone',
  'Tablet',
  'Wifi',
  'Database',
  'Cloud',
  'Lock',
  'Unlock',
  'Shield',
  'ShieldAlert',
  'AlertCircle',
  'AlertTriangle',
  'CheckCircle',
  'XCircle',
  'Info',
  'HelpCircle',
  'Mail',
  'Phone',
  'MessageSquare',
  'Users',
  'User',
  'UserPlus',
  'UserCheck',
  'Building',
  'Home',
  'MapPin',
  'Globe',
  'Zap',
  'Activity',
  'BarChart',
  'TrendingUp',
  'TrendingDown',
  'Clipboard',
  'FileText',
  'File',
  'Folder',
  'FolderOpen',
  'Archive',
  'Download',
  'Upload',
  'Save',
  'Trash',
  'Edit',
  'Plus',
  'Minus',
  'X',
  'Check',
  'Search',
  'Filter',
  'Calendar',
  'Clock',
  'Timer',
  'Bell',
  'BellOff',
  'Star',
  'Heart',
  'Bookmark',
  'Tag',
  'Grid',
  'List',
  'Layout',
  'Layers',
  'Copy',
  'Clipboard',
  'RefreshCw',
  'RotateCcw',
  'RotateCw',
  'Repeat',
  'Play',
  'Pause',
  'StopCircle',
  'SkipForward',
  'SkipBack',
  'Volume2',
  'VolumeX',
  'Video',
  'Camera',
  'Image',
  'Paperclip',
  'Link',
  'ExternalLink',
  'Eye',
  'EyeOff',
  'ThumbsUp',
  'ThumbsDown',
  'Flag',
  'GitBranch',
  'GitCommit',
  'GitMerge',
  'Code',
  'Terminal',
  'Command',
  'Cpu',
  'Power',
  'Battery',
  'BatteryCharging',
  'Plug',
  'BluetoothConnected',
  'Cast',
  'Share',
  'Send',
  'Navigation',
  'Target',
  'Crosshair',
  'Maximize',
  'Minimize',
  'Move',
  'Shuffle',
  'Award',
  'Gift',
  'ShoppingCart',
  'CreditCard',
  'DollarSign',
  'Percent',
  'PieChart',
  'BarChart3',
  'LineChart',
]

interface IconPickerProps {
  value?: string
  onChange: (icon: string) => void
  className?: string
}

export function IconPicker({ value = 'Wrench', onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Get the icon component dynamically
  const CurrentIcon = (LucideIcons as any)[value] || LucideIcons.Wrench

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!search) return COMMON_ICONS
    const searchLower = search.toLowerCase()
    return COMMON_ICONS.filter((iconName) =>
      iconName.toLowerCase().includes(searchLower)
    )
  }, [search])

  const handleIconSelect = (iconName: string) => {
    onChange(iconName)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-start', className)}
        >
          <CurrentIcon className="h-4 w-4 mr-2" />
          <span className="flex-1 text-left">{value}</span>
          <LucideIcons.ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-2">
            {filteredIcons.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No icons found
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.map((iconName) => {
                  const Icon = (LucideIcons as any)[iconName]
                  if (!Icon) return null

                  return (
                    <button
                      key={iconName}
                      onClick={() => handleIconSelect(iconName)}
                      className={cn(
                        'flex flex-col items-center justify-center p-3 rounded-md',
                        'hover:bg-accent hover:text-accent-foreground',
                        'transition-colors duration-150',
                        'group relative',
                        value === iconName && 'bg-primary text-primary-foreground'
                      )}
                      title={iconName}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-1 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {iconName}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
          {filteredIcons.length} {filteredIcons.length === 1 ? 'icon' : 'icons'} available
        </div>
      </PopoverContent>
    </Popover>
  )
}
