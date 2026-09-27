import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Clock, MapPin, Tag, X, Edit3, Trash2 } from 'lucide-react'
import { CalendarCategory } from '../utils/calendarUtils'
import type { CalendarTask } from '../types'

interface EventPopoverProps {
  task: CalendarTask
  category: CalendarCategory
  anchorEl: HTMLElement
  isConflicted?: boolean
  onClose: () => void
  onEdit?: (task: CalendarTask) => void
  onDelete?: (id: number) => void
}

export default function EventPopover({
  task,
  category,
  anchorEl,
  isConflicted,
  onClose,
  onEdit,
  onDelete,
}: EventPopoverProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updatePosition = () => {
      if (!anchorEl || !popoverRef.current) return

      const anchorRect = anchorEl.getBoundingClientRect()
      const popoverRect = popoverRef.current.getBoundingClientRect()

      const margin = 12
      // Default: position above anchor
      let top = anchorRect.top + window.scrollY - popoverRect.height - 8
      let left = anchorRect.left + window.scrollX + (anchorRect.width / 2) - (popoverRect.width / 2)

      // If overflowing above viewport, position below anchor
      if (top < window.scrollY + margin) {
        top = anchorRect.bottom + window.scrollY + 8
      }

      // If overflowing below viewport, clamp to viewport bottom
      const maxTop = window.scrollY + window.innerHeight - popoverRect.height - margin
      if (top > maxTop) {
        top = maxTop
      }

      // Horizontal clamping
      if (left < margin) {
        left = margin
      } else if (left + popoverRect.width > window.innerWidth - margin) {
        left = window.innerWidth - popoverRect.width - margin
      }

      setPosition({ top: Math.max(margin, top), left: Math.max(margin, left) })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [anchorEl, task])

  // Handle escape key & click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !anchorEl.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, anchorEl])

  const priorityColors = {
    high: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  }

  const content = (
    <div
      ref={popoverRef}
      className="absolute z-[120] w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700/80 p-4.5 backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95 text-left"
      style={{
        top: position.top,
        left: position.left,
      }}
      role="dialog"
      aria-modal="false"
      aria-label={task.title}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: category.color }}
          />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {category.label}
          </span>
          {task.eventType && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {task.eventType}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Close popover"
        >
          <X size={14} />
        </button>
      </div>

      {/* Conflict Warning Banner */}
      {isConflicted && (
        <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold">
          <AlertTriangle size={14} className="shrink-0 text-amber-500" />
          <span>Schedule Conflict with another event</span>
        </div>
      )}

      {/* Title */}
      <h4 className="font-bold text-gray-900 dark:text-white text-base mt-2 leading-snug break-words">
        {task.title}
      </h4>

      {/* Tags / Priority / Subject */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {task.priority && (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityColors[task.priority] || ''}`}>
            {task.priority} priority
          </span>
        )}
        {task.subject && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Tag size={10} /> {task.subject}
          </span>
        )}
      </div>

      {/* Details (Time & Location) */}
      <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/60 pt-2.5">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-gray-400 shrink-0" />
          <span>
            {task.date}
            {task.startTime && task.endTime ? ` • ${task.startTime} – ${task.endTime}` : ''}
          </span>
        </div>

        {task.location && (
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{task.location}</span>
          </div>
        )}
      </div>

      {/* Description / Notes */}
      {(task.description || task.notes) && (
        <div className="mt-2.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
          {task.description && <p>{task.description}</p>}
          {task.notes && (
            <p className={task.description ? 'mt-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 italic' : 'italic'}>
              {task.notes}
            </p>
          )}
        </div>
      )}

      {/* Quick Action Footer */}
      {(onEdit || onDelete) && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end gap-2">
          {onEdit && (
            <button
              onClick={() => {
                onClose()
                onEdit(task)
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition"
            >
              <Edit3 size={12} /> Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                onClose()
                onDelete(task.id)
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  )

  return createPortal(content, document.body)
}
