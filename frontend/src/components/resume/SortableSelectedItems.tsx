import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MultiSelectOption } from '@/components/ui/multi-select'

interface SortableItemProps {
  id: string
  option: MultiSelectOption
}

const SortableItem: React.FC<SortableItemProps> = ({ id, option }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: 'manipulation', // Prevents default touch behaviors on mobile
      }}
      className={cn(
        'border rounded-lg p-3 bg-card transition-all',
        isDragging && 'shadow-lg border-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-0.5 text-muted-foreground hover:text-foreground transition-colors touch-none p-1 -ml-1 -mt-1"
          style={{ touchAction: 'none' }}
        >
          <GripVertical className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1 wrap-break-word" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {option.label}
          </div>
          {option.description && (
            <div className="text-xs text-muted-foreground wrap-break-word line-clamp-2" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {option.description}
            </div>
          )}
          {option.details && (
            <div className="mt-2 space-y-1">
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
}

interface SortableSelectedItemsProps {
  selectedIds: string[]
  options: MultiSelectOption[]
}

export const SortableSelectedItems: React.FC<SortableSelectedItemsProps> = ({
  selectedIds,
  options,
}) => {
  // Get the selected options in the current order
  const selectedOptions = selectedIds
    .map((id) => options.find((opt) => opt.value === id))
    .filter((opt): opt is MultiSelectOption => opt !== undefined)

  if (selectedOptions.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none">
        Selected Items <span className="text-muted-foreground font-normal">(drag to reorder)</span>
      </label>
      <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
        {selectedOptions.map((option) => (
          <SortableItem key={option.value} id={option.value} option={option} />
        ))}
      </div>
    </div>
  )
}
