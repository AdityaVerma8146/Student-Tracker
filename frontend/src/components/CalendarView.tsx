import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { buildMonthMatrix, todayISO, getCalendarCategory } from '../utils/calendarUtils'
import CalendarTaskForm from './CalendarTaskForm'
import CalendarTaskList from './CalendarTaskList'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function CalendarView({ tasks, onAddTask, onToggleTask, onDeleteTask }) {
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return { year: t.getFullYear(), month: t.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState(todayISO())

  const cells = useMemo(() => buildMonthMatrix(cursor.year, cursor.month), [cursor])
  const today = todayISO()

  const tasksByDate = useMemo(() => {
    const map = {}
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t)
    }
    return map
  }, [tasks])

  const changeMonth = (delta) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
          <CalendarDays size={22} />
          <span className="text-xs font-semibold uppercase tracking-[0.3em]">Calendar</span>
        </div>
        <h1 className="text-4xl font-bold">Every Task, Mapped to a Day</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Sidebar */}
        <aside className="bg-white dark:bg-gray-800 rounded-lg p-5 card-shadow lg:sticky lg:top-24">
          <h3 className="text-sm font-bold mb-3">Add a task</h3>
          <CalendarTaskForm selectedDate={selectedDate} onAdd={onAddTask} />

          <h3 className="text-sm font-bold mt-6 mb-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            All tasks
          </h3>
          <CalendarTaskList tasks={tasks} onToggle={onToggleTask} onDelete={onDeleteTask} />
        </aside>

        {/* Month grid */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-5 card-shadow">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-bold">{MONTH_NAMES[cursor.month]} {cursor.year}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCursor({ year: new Date().getFullYear(), month: new Date().getMonth() })}
                className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Today
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="bg-gray-50 dark:bg-gray-900 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 py-2">
                {w}
              </div>
            ))}
            {cells.map((cell) => {
              const dayTasks = tasksByDate[cell.iso] || []
              const isToday = cell.iso === today
              const isSelected = cell.iso === selectedDate
              return (
                <div
                  key={cell.iso}
                  onClick={() => setSelectedDate(cell.iso)}
                  style={{
                    boxShadow: isSelected
                      ? '0 0 0 2px var(--accent-500)'
                      : isToday
                      ? 'inset 0 0 0 2px var(--accent-300)'
                      : 'none',
                  }}
                  className={[
                    'relative bg-white dark:bg-gray-800 min-h-[96px] p-1.5 cursor-pointer flex flex-col gap-1',
                    'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:z-10',
                    cell.inMonth ? '' : 'opacity-40',
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40',
                  ].join(' ')}
                >
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{cell.day}</span>
                  <div className="flex flex-col gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => {
                      const cat = getCalendarCategory(t.category)
                      return (
                        <span
                          key={t.id}
                          title={t.title}
                          className={`badge-in text-[10px] font-semibold text-white rounded px-1.5 py-0.5 truncate ${t.done ? 'opacity-50 line-through' : ''}`}
                          style={{ background: cat.color }}
                        >
                          {t.title}
                        </span>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{dayTasks.length - 3} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarView
