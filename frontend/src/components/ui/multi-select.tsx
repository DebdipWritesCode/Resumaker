import * as React from 'react'
import { Check, ChevronDown} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { cn } from '../../lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
  details?: Record<string, any>
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  maxSelections?: number
  searchable?: boolean
  className?: string
  disabled?: boolean
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      selected,
      onChange,
      placeholder = 'Select items...',
      maxSelections,
      searchable = true,
      className,
      disabled = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)
    const [maxHeight, setMaxHeight] = React.useState<string>('300px')

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchQuery) return options
      const query = searchQuery.toLowerCase()
      return options.filter((option) =>
        option.label.toLowerCase().includes(query)
      )
    }, [options, searchQuery, searchable])

    const handleToggle = (value: string) => {
      if (disabled) return

      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value))
      } else {
        if (maxSelections === 1) {
          // Single select mode: replace selection
          onChange([value])
        } else if (maxSelections && selected.length >= maxSelections) {
          return
        } else {
          onChange([...selected, value])
        }
      }
    }

    const handleSelectAll = () => {
      if (disabled) return
      if (maxSelections) return
      if (selected.length === filteredOptions.length) {
        onChange([])
      } else {
        onChange(filteredOptions.map((opt) => opt.value))
      }
    }

    const selectedLabels = React.useMemo(() => {
      return selected
        .map((val) => options.find((opt) => opt.value === val)?.label)
        .filter(Boolean) as string[]
    }, [selected, options])

    const displayText = React.useMemo(() => {
      if (selected.length === 0) return placeholder
      if (selected.length === 1) return selectedLabels[0]
      return `${selected.length} selected`
    }, [selected.length, selectedLabels, placeholder])

    // Calculate max height for small screens to prevent viewport overflow
    React.useEffect(() => {
      if (open) {
        const updateMaxHeight = () => {
          const viewportHeight = window.innerHeight
          
          // Use smaller max-height on small screens to prevent overflow
          // Reserve space for header elements (search, select all) and padding
          if (viewportHeight < 600) {
            // Very small screens: use 40% of viewport or 200px, whichever is smaller
            setMaxHeight(`${Math.min(viewportHeight * 0.4, 200)}px`)
          } else if (viewportHeight < 800) {
            // Small screens: use 45% of viewport or 300px, whichever is smaller
            setMaxHeight(`${Math.min(viewportHeight * 0.45, 300)}px`)
          } else {
            // Larger screens: use fixed 400px
            setMaxHeight('400px')
          }
        }
        
        updateMaxHeight()
        window.addEventListener('resize', updateMaxHeight)
        
        return () => {
          window.removeEventListener('resize', updateMaxHeight)
        }
      } else {
        // Reset to default when closed
        setMaxHeight('300px')
      }
    }, [open])

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between text-left font-normal',
              !selected.length && 'text-muted-foreground',
              className
            )}
            disabled={disabled}
          >
            <span className="truncate flex-1">{displayText}</span>
            <div className="flex items-center gap-1">
              {selected.length > 0 && (
                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                  {selected.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="max-w-[calc(100vw-2rem)] sm:max-w-md p-0 overflow-x-hidden w-[85%]" 
          align="start"
          side="bottom"
          sideOffset={-80}
          avoidCollisions={false}
          collisionPadding={8}
        >
          <div className="flex flex-col">
            {searchable && (
              <div className="p-2 border-b">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
            )}
            {!maxSelections && filteredOptions.length > 0 && (
              <div className="p-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs"
                  onClick={handleSelectAll}
                >
                  {selected.length === filteredOptions.length
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
            )}
            <div 
              ref={scrollContainerRef}
              tabIndex={0}
              className="overflow-y-auto custom-scrollbar focus:outline-none"
              style={{ 
                maxHeight: maxHeight,
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth'
              }}
              onWheel={(e) => {
                // Ensure wheel events properly scroll the container
                // Stop propagation to prevent parent elements from handling the event
                e.stopPropagation()
                // Allow default scrolling behavior
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No options found
                </div>
              ) : (
                <div className="p-1 sm:p-2 space-y-1.5 sm:space-y-2">
                  {filteredOptions.map((option) => {
                    const isSelected = selected.includes(option.value)
                    
                    return (
                      <div
                        key={option.value}
                        role="button"
                        tabIndex={0}
                        className={cn(
                          'relative border rounded-lg p-2 sm:p-3 cursor-pointer transition-all',
                          'hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring',
                          'overflow-hidden w-full',
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-sm' 
                            : 'border-border bg-card'
                        )}
                        onClick={() => handleToggle(option.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleToggle(option.value)
                          }
                        }}
                      >
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 w-full">
                          <div
                            className={cn(
                              'h-4 w-4 sm:h-5 sm:w-5 shrink-0 rounded-sm border-2 border-primary flex items-center justify-center mt-0.5 transition-colors pointer-events-none',
                              isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-background'
                            )}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-medium text-xs sm:text-sm mb-1 wrap-break-word" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{option.label}</div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground wrap-break-word line-clamp-2 sm:line-clamp-3" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                {option.description}
                              </div>
                            )}
                            {option.details && (
                              <div className="mt-1 sm:mt-2 space-y-0.5 sm:space-y-1">
                                {Object.entries(option.details).slice(0, 2).map(([key, value]) => (
                                  value && (
                                    <div key={key} className="text-xs text-muted-foreground wrap-break-word" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                      <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>{' '}
                                      <span className="break-all" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{String(value)}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {maxSelections && (
              <div className="p-2 border-t text-xs text-muted-foreground">
                Maximum {maxSelections} selection{maxSelections !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
MultiSelect.displayName = 'MultiSelect'
