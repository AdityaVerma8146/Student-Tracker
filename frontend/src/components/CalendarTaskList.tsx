import { useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { getCalendarCategory, formatDayLabel } from '../utils/calendarUtils'

const EXIT_MS = 220

function CalendarTaskList({ tasks, onToggle, onDelete }) {
  // Track ids currently animating out, so the row plays a fade+shrink
  // before it actually leaves the `tasks` array.
  const [leaving, setLeaving] = useState(() => new Set())

  const handleDelete = (id) => {
    setLeaving((prev) => new Set(prev).add(id))
    setTimeout(() => {
      onDelete(id)
      setLeaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, EXIT_MS)
  }

  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return a.date.localeCompare(b.date)
  })

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        No tasks yet. Add one above, or click a day on the calendar.
      </p>
    )
  }

  return (
    <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
      {sorted.map((t) => {
        const cat = getCalendarCategory(t.category)
        const isLeaving = leaving.has(t.id)
        return (
          <li
            key={t.id}
            className={`flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group ${isLeaving ? 'badge-out' : ''}`}
            onClick={() => onToggle(t.id)}
          >
            <span
              key={t.done ? 'on' : 'off'}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${t.done ? 'bg-blue-600 border-blue-600 text-white check-pop' : 'border-gray-300 dark:border-gray-600'}`}
            >
              {t.done && <Check size={13} />}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: cat.color }} />
                <span className={`strike-wrap ${t.done ? 'text-gray-400' : ''}`}>
                  {t.title}
                  <span className={`strike-line ${t.done ? 'active' : ''}`} />
                </span>
              </p>
              <p className="text-xs text-gray-400">{formatDayLabel(t.date)} · {cat.label}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(t.id)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition"
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default CalendarTaskList
