'use client'

import { useState, useMemo } from 'react'
import { useComposerStore } from '@/lib/stores/composer-store'
import { getBlockDefinition, BlockPropertySchema } from '@/lib/portal-blocks'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import * as Icons from 'lucide-react'

// Helper to get nested property value
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Helper to set nested property value
function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.')
  const result = { ...obj }
  let current = result

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    current[key] = { ...current[key] }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
  return result
}

// ============================================
// ADVANCED PROPERTY TYPE COMPONENTS
// ============================================

/**
 * Icon Picker Component
 * Searchable Lucide icon selector with preview
 */
function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  // Get all available Lucide icons
  const allIcons = useMemo(() => {
    return Object.keys(Icons).filter(
      (key) => key !== 'default' && key !== 'createLucideIcon' && typeof (Icons as any)[key] === 'function'
    )
  }, [])

  const filteredIcons = useMemo(() => {
    if (!search) return allIcons.slice(0, 50) // Show first 50 by default
    return allIcons
      .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 50)
  }, [search, allIcons])

  // Safely get icon component - ensure it's a valid component
  const IconComponent = value && allIcons.includes(value) ? (Icons as any)[value] : null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {IconComponent ? (
            <>
              <IconComponent className="w-4 h-4 mr-2" />
              {value}
            </>
          ) : (
            <span className="text-muted-foreground">Select icon...</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-5 gap-1 p-2">
            {filteredIcons.map((iconName) => {
              const Icon = (Icons as any)[iconName]
              return (
                <button
                  key={iconName}
                  onClick={() => {
                    onChange(iconName)
                    setOpen(false)
                  }}
                  className={`p-2 rounded hover:bg-accent transition-colors ${
                    value === iconName ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  title={iconName}
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              )
            })}
          </div>
        </ScrollArea>
        {search && filteredIcons.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No icons found</p>
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Array Editor Component
 * Add/remove/reorder items with nested object editing
 */
function ArrayEditor({
  value,
  onChange,
  itemSchema,
}: {
  value: any[]
  onChange: (value: any[]) => void
  itemSchema?: Record<string, { label: string; type: string; defaultValue?: any }>
}) {
  const items = Array.isArray(value) ? value : []

  const addItem = () => {
    const newItem = itemSchema
      ? Object.entries(itemSchema).reduce((acc, [key, config]) => {
          acc[key] = config.defaultValue ?? ''
          return acc
        }, {} as any)
      : { label: '', value: '' }
    onChange([...items, newItem])
  }

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, fieldValue: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: fieldValue }
    onChange(newItems)
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return
    }
    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]
    onChange(newItems)
  }

  return (
    <div className="space-y-2 w-full">
      {items.map((item, index) => (
        <Collapsible key={index}>
          <div className="border rounded-md p-2 space-y-2 w-full">
            <div className="flex items-center justify-between w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="flex-1 justify-start min-w-0">
                  <Icons.ChevronRight className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    Item {index + 1}
                    {item.title || item.label || item.name ? `: ${item.title || item.label || item.name}` : ''}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                >
                  <Icons.ArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                >
                  <Icons.ArrowDown className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeItem(index)}
                >
                  <Icons.X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <CollapsibleContent className="space-y-2 pt-2 w-full">
              {itemSchema ? (
                Object.entries(itemSchema).map(([field, config]) => (
                  <div key={field} className="space-y-1 w-full">
                    <Label className="text-xs">{config.label}</Label>
                    {config.type === 'textarea' ? (
                      <Textarea
                        value={item[field] || ''}
                        onChange={(e) => updateItem(index, field, e.target.value)}
                        rows={3}
                        className="text-xs w-full"
                      />
                    ) : config.type === 'number' ? (
                      <Input
                        type="number"
                        value={item[field] || ''}
                        onChange={(e) => updateItem(index, field, Number(e.target.value))}
                        className="text-xs w-full"
                      />
                    ) : config.type === 'boolean' ? (
                      <Switch
                        checked={item[field] || false}
                        onCheckedChange={(checked) => updateItem(index, field, checked)}
                      />
                    ) : (
                      <Input
                        value={item[field] || ''}
                        onChange={(e) => updateItem(index, field, e.target.value)}
                        className="text-xs w-full"
                      />
                    )}
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-1 w-full">
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={item.label || ''}
                      onChange={(e) => updateItem(index, 'label', e.target.value)}
                      className="text-xs w-full"
                    />
                  </div>
                  <div className="space-y-1 w-full">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={item.value || ''}
                      onChange={(e) => updateItem(index, 'value', e.target.value)}
                      className="text-xs w-full"
                    />
                  </div>
                </>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
      <Button onClick={addItem} variant="outline" size="sm" className="w-full">
        <Icons.Plus className="w-4 h-4 mr-2" />
        Add Item
      </Button>
    </div>
  )
}

/**
 * Link Editor Component
 * URL input with validation and open in new tab toggle
 */
function LinkEditor({
  value,
  onChange,
}: {
  value: { url: string; openInNewTab?: boolean }
  onChange: (value: { url: string; openInNewTab?: boolean }) => void
}) {
  const linkValue = typeof value === 'string' ? { url: value, openInNewTab: false } : value || { url: '', openInNewTab: false }

  return (
    <div className="space-y-2 w-full">
      <div className="space-y-1 w-full">
        <Label className="text-xs">URL</Label>
        <Input
          type="url"
          value={linkValue.url}
          onChange={(e) => onChange({ ...linkValue, url: e.target.value })}
          placeholder="https://example.com"
          className="w-full"
        />
      </div>
      <div className="flex items-center justify-between w-full">
        <Label htmlFor="new-tab" className="text-xs">
          Open in new tab
        </Label>
        <Switch
          id="new-tab"
          checked={linkValue.openInNewTab || false}
          onCheckedChange={(checked) => onChange({ ...linkValue, openInNewTab: checked })}
        />
      </div>
    </div>
  )
}

/**
 * Data Source Selector Component
 * Dropdown for available data sources
 */
function DataSourceSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const dataSources = [
    { value: 'tickets', label: 'Tickets' },
    { value: 'incidents', label: 'Incidents' },
    { value: 'kb_articles', label: 'Knowledge Base Articles' },
    { value: 'announcements', label: 'Announcements' },
    { value: 'stats', label: 'Statistics' },
  ]

  return (
    <Select value={value || 'tickets'} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select data source..." />
      </SelectTrigger>
      <SelectContent>
        {dataSources.map((source) => (
          <SelectItem key={source.value} value={source.value}>
            {source.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Role/Permission Selector Component
 * Multi-select for roles (simplified as badges for now)
 */
function RoleSelector({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const roles = ['admin', 'technician', 'user', 'guest']
  const selectedRoles = Array.isArray(value) ? value : []

  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      onChange(selectedRoles.filter((r) => r !== role))
    } else {
      onChange([...selectedRoles, role])
    }
  }

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-wrap gap-2 w-full">
        {roles.map((role) => (
          <Badge
            key={role}
            variant={selectedRoles.includes(role) ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => toggleRole(role)}
          >
            {role}
          </Badge>
        ))}
      </div>
      {selectedRoles.length === 0 && (
        <p className="text-xs text-muted-foreground">No roles selected (visible to all)</p>
      )}
    </div>
  )
}

/**
 * Date/Time Picker Component
 * Simple datetime-local input
 */
function DateTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input
      type="datetime-local"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full"
    />
  )
}

/**
 * Service Catalog Selector Component
 * Dropdown for selecting service catalog items with live data
 */
function ServiceCatalogSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [services, setServices] = useState<Array<{ value: string; label: string; description?: string }>>([])
  const [loading, setLoading] = useState(true)

  useMemo(() => {
    async function fetchServices() {
      try {
        setLoading(true)
        const res = await fetch('/api/portal/data/service-catalog')
        if (res.ok) {
          const data = await res.json()
          setServices(data)
        }
      } catch (error) {
        console.error('Failed to fetch service catalog:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  return (
    <Select value={value || '__none__'} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Loading services...' : 'Select service catalog item...'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">None</SelectItem>
        {services.map((service) => (
          <SelectItem key={service.value} value={service.value}>
            {service.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * Form Template Selector Component
 * Dropdown for selecting form templates with live data
 */
function FormTemplateSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [templates, setTemplates] = useState<Array<{ value: string; label: string; description?: string }>>([])
  const [loading, setLoading] = useState(true)

  useMemo(() => {
    async function fetchTemplates() {
      try {
        setLoading(true)
        const res = await fetch('/api/portal/data/forms')
        if (res.ok) {
          const data = await res.json()
          setTemplates(data)
        }
      } catch (error) {
        console.error('Failed to fetch form templates:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  return (
    <Select value={value || '__none__'} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Loading templates...' : 'Select form template...'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">None</SelectItem>
        {templates.map((template) => (
          <SelectItem key={template.value} value={template.value}>
            {template.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * API Endpoint Selector Component
 * Dropdown for selecting predefined API endpoints
 */
function ApiEndpointSelector({
  value,
  onChange,
  blockType
}: {
  value: string;
  onChange: (value: string) => void;
  blockType?: string;
}) {
  const [endpoints, setEndpoints] = useState<Array<{ value: string; label: string; description: string }>>([])
  const [loading, setLoading] = useState(true)

  useMemo(() => {
    async function fetchEndpoints() {
      try {
        setLoading(true)
        const url = blockType
          ? `/api/portal/data/endpoints?blockType=${blockType}`
          : '/api/portal/data/endpoints'
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          // If data is an object of arrays, flatten it
          const endpointList = Array.isArray(data) ? data : Object.values(data).flat()
          setEndpoints(endpointList as any)
        }
      } catch (error) {
        console.error('Failed to fetch endpoints:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchEndpoints()
  }, [blockType])

  return (
    <Select value={value || '__none__'} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Loading endpoints...' : 'Select API endpoint...'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Custom endpoint</SelectItem>
        {endpoints.map((endpoint) => (
          <SelectItem key={endpoint.value} value={endpoint.value} title={endpoint.description}>
            {endpoint.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/**
 * KB Category Selector Component
 * Dropdown for selecting knowledge base categories
 */
function KBCategorySelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [categories, setCategories] = useState<Array<{ value: string; label: string; articleCount?: number }>>([])
  const [loading, setLoading] = useState(true)

  useMemo(() => {
    async function fetchCategories() {
      try {
        setLoading(true)
        const res = await fetch('/api/portal/data/kb-categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (error) {
        console.error('Failed to fetch KB categories:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <Select value={value || '__none__'} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Loading categories...' : 'Select KB category...'} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">All categories</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label} {category.articleCount !== undefined && `(${category.articleCount})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PropertyEditor({ property, blockId, currentValue }: {
  property: BlockPropertySchema
  blockId: string
  currentValue: any
}) {
  const { updateBlock } = useComposerStore()

  const handleChange = (value: any) => {
    updateBlock(blockId, {
      props: setNestedValue(currentValue, property.key, value),
    })
  }

  const value = getNestedValue(currentValue, property.key) ?? property.defaultValue

  // Handle conditional rendering with showIf
  if (property.showIf) {
    const conditionValue = getNestedValue(currentValue, property.showIf.property)
    const expectedValue = property.showIf.value

    // Support both single values and arrays
    let shouldShow = false
    if (Array.isArray(expectedValue)) {
      // Show if conditionValue is in the array
      shouldShow = expectedValue.includes(conditionValue)
    } else {
      // Show if conditionValue matches the single value
      shouldShow = conditionValue === expectedValue
    }

    // Hide the field if condition is not met
    if (!shouldShow) {
      return null
    }
  }

  switch (property.type) {
    case 'string':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Input
            id={property.key}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={property.description}
            className="w-full"
          />
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
        </div>
      )

    case 'number':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Input
            id={property.key}
            type="number"
            value={value || property.defaultValue || 0}
            onChange={(e) => handleChange(Number(e.target.value))}
            min={property.min}
            max={property.max}
            step={property.step || 1}
            className="w-full"
          />
        </div>
      )

    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Switch
            id={property.key}
            checked={value || false}
            onCheckedChange={handleChange}
          />
        </div>
      )

    case 'select':
      // Convert empty string values to "__none__" for Radix UI compatibility
      const normalizeValue = (val: any) => {
        if (val === '' || val === null || val === undefined) return '__none__'
        return String(val)
      }

      const denormalizeValue = (val: string) => {
        if (val === '__none__') return ''
        return val
      }

      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Select
            value={normalizeValue(value || property.defaultValue)}
            onValueChange={(val) => handleChange(denormalizeValue(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {property.options?.map((option) => (
                <SelectItem
                  key={normalizeValue(option.value)}
                  value={normalizeValue(option.value)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'color':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          <div className="flex gap-2 w-full">
            <Input
              id={property.key}
              type="color"
              value={value || property.defaultValue || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="w-16 h-10 p-1 flex-shrink-0"
            />
            <Input
              value={value || property.defaultValue || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="flex-1 min-w-0"
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Input
            id={property.key}
            type="url"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full"
          />
          {value && (
            <div className="border rounded overflow-hidden w-full">
              <img src={value} alt="Preview" className="w-full h-32 object-cover" />
            </div>
          )}
        </div>
      )

    case 'richtext':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          <Textarea
            id={property.key}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            rows={6}
            placeholder={property.description}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">HTML supported</p>
        </div>
      )

    case 'spacing':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          <div className="flex items-center gap-2 w-full">
            <Input
              id={property.key}
              type="range"
              min={0}
              max={20}
              step={1}
              value={value || property.defaultValue || 0}
              onChange={(e) => handleChange(Number(e.target.value))}
              className="flex-1 min-w-0"
            />
            <span className="text-sm font-mono w-12 text-right flex-shrink-0">
              {((value || property.defaultValue || 0) * 4)}px
            </span>
          </div>
        </div>
      )

    case 'alignment':
      return (
        <div className="space-y-2 w-full">
          <Label>{property.label}</Label>
          <div className="flex gap-1 w-full">
            {[
              { value: 'left', icon: 'AlignLeft' },
              { value: 'center', icon: 'AlignCenter' },
              { value: 'right', icon: 'AlignRight' },
            ].map((align) => {
              const IconComp = (Icons as any)[align.icon]
              return (
                <button
                  key={align.value}
                  onClick={() => handleChange(align.value)}
                  className={`flex-1 p-2 border rounded transition-colors ${
                    value === align.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  <IconComp className="w-4 h-4 mx-auto" />
                </button>
              )
            })}
          </div>
        </div>
      )

    case 'array':
      return (
        <div className="space-y-2 w-full">
          <Label>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground mb-2">{property.description}</p>
          )}
          <ArrayEditor
            value={value || []}
            onChange={handleChange}
            itemSchema={property.itemSchema}
          />
        </div>
      )

    case 'icon':
      return (
        <div className="space-y-2 w-full">
          <Label>{String(property.label || '')}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{String(property.description)}</p>
          )}
          <IconPicker value={String(value || '')} onChange={handleChange} />
        </div>
      )

    case 'link':
      return (
        <div className="space-y-2 w-full">
          <Label>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <LinkEditor value={value || { url: '', openInNewTab: false }} onChange={handleChange} />
        </div>
      )

    case 'datasource':
      return (
        <div className="space-y-2 w-full">
          <Label>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <DataSourceSelector value={value || ''} onChange={handleChange} />
        </div>
      )

    case 'roles':
      return (
        <div className="space-y-2 w-full">
          <Label>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <RoleSelector value={value || []} onChange={handleChange} />
        </div>
      )

    case 'datetime':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <DateTimePicker value={value || ''} onChange={handleChange} />
        </div>
      )

    case 'service-catalog-select':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <ServiceCatalogSelector value={value || ''} onChange={handleChange} />
        </div>
      )

    case 'form-template-select':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <FormTemplateSelector value={value || ''} onChange={handleChange} />
        </div>
      )

    case 'api-endpoint-select':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <ApiEndpointSelector
            value={value || ''}
            onChange={handleChange}
            blockType={property.blockType}
          />
          {value && value !== '__none__' && (
            <p className="text-xs text-muted-foreground font-mono">{value}</p>
          )}
        </div>
      )

    case 'kb-category-select':
      return (
        <div className="space-y-2 w-full">
          <Label htmlFor={property.key}>{property.label}</Label>
          {property.description && (
            <p className="text-xs text-muted-foreground">{property.description}</p>
          )}
          <KBCategorySelector value={value || ''} onChange={handleChange} />
        </div>
      )

    default:
      return null
  }
}

export function Inspector() {
  const { selectedBlockId, blocks, deleteBlock, duplicateBlock, updateBlock } = useComposerStore()

  // Find selected block
  const findBlock = (blockId: string, blockList: any[]): any => {
    for (const block of blockList) {
      if (block.id === blockId) return block
      if (block.children) {
        const found = findBlock(blockId, block.children)
        if (found) return found
      }
    }
    return null
  }

  const selectedBlock = selectedBlockId ? findBlock(selectedBlockId, blocks) : null
  const definition = selectedBlock ? getBlockDefinition(selectedBlock.type) : null

  if (!selectedBlock || !definition) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center">
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Icons.Settings className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Select a block to edit its properties
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Block Info */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold truncate flex-1 mr-2">{definition.label}</h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => duplicateBlock(selectedBlock.id)}
            >
              <Icons.Copy className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => deleteBlock(selectedBlock.id)}
            >
              <Icons.Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{definition.description}</p>
      </div>

      {/* Properties */}
      <Tabs defaultValue="properties" className="flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsList className="mx-4 mt-4 grid w-[calc(100%-2rem)] grid-cols-2 flex-shrink-0">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 min-h-0">
          <TabsContent value="properties" className="p-4 space-y-4 mt-0 pr-6">
            {definition.propertySchema.map((property) => (
              <PropertyEditor
                key={property.key}
                property={property}
                blockId={selectedBlock.id}
                currentValue={selectedBlock.props}
              />
            ))}

            {definition.propertySchema.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No properties available for this block
              </p>
            )}
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4 mt-0 pr-6">
            <div className="space-y-2 w-full">
              <Label>Block ID</Label>
              <Input
                value={selectedBlock.id}
                readOnly
                className="font-mono text-xs w-full"
              />
            </div>

            <Separator />

            <div className="space-y-2 w-full">
              <Label>Custom CSS Classes</Label>
              <Input
                value={selectedBlock.props.style?.className || ''}
                onChange={(e) => {
                  const newProps = { ...selectedBlock.props }
                  if (!newProps.style) newProps.style = {}
                  newProps.style.className = e.target.value
                  updateBlock(selectedBlock.id, { props: newProps })
                }}
                placeholder="custom-class-name"
                className="w-full"
              />
            </div>

            <div className="space-y-2 w-full">
              <Label>Background Color</Label>
              <div className="flex gap-2 w-full">
                <Input
                  type="color"
                  value={selectedBlock.props.style?.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    const newProps = { ...selectedBlock.props }
                    if (!newProps.style) newProps.style = {}
                    newProps.style.backgroundColor = e.target.value
                    updateBlock(selectedBlock.id, { props: newProps })
                  }}
                  className="w-16 h-10 p-1 flex-shrink-0"
                />
                <Input
                  value={selectedBlock.props.style?.backgroundColor || '#ffffff'}
                  onChange={(e) => {
                    const newProps = { ...selectedBlock.props }
                    if (!newProps.style) newProps.style = {}
                    newProps.style.backgroundColor = e.target.value
                    updateBlock(selectedBlock.id, { props: newProps })
                  }}
                  className="flex-1 min-w-0"
                />
              </div>
            </div>

            <div className="space-y-2 w-full">
              <Label>Border Radius (px)</Label>
              <Input
                type="number"
                value={selectedBlock.props.style?.borderRadius || 0}
                onChange={(e) => {
                  const newProps = { ...selectedBlock.props }
                  if (!newProps.style) newProps.style = {}
                  newProps.style.borderRadius = Number(e.target.value)
                  updateBlock(selectedBlock.id, { props: newProps })
                }}
                min={0}
                max={50}
                className="w-full"
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
