import { useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Calendar,
  Columns,
  Square,
  MapPin,
  Tag,
} from 'lucide-react'
import {
  buildMonthMatrix,
  buildWeekMatrix,
  todayISO,
  toISODate,
  getCalendarCategory,
  getAllConflicts,
} from '../utils/calendarUtils'
import CalendarTaskForm from './CalendarTaskForm'
import CalendarTaskList from './CalendarTaskList'
import EventPopover from './EventPopover'
import type { CalendarTask, Subject } from '../types'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type CalendarViewMode = 'month' | 'week' | 'day'

interface CalendarViewProps {
  tasks: CalendarTask[]
  subjects?: Subject[]
  onAddTask: (task: Omit<CalendarTask, 'id' | 'createdAt' | 'done'>) => void
  onUpdateTask: (id: number, updates: Partial<CalendarTask>) => void
  onToggleTask: (id: number) => void
  onDeleteTask: (id: number) => void
}

export default function CalendarView({
  tasks,
  subjects = [],
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
}: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [cursor, setCursor] = useState(() => {
    const t = new Date()
    return { year: t.getFullYear(), month: t.getMonth() }
  })
  const [selectedDate, setSelectedDate] = useState(todayISO())

  const [activeTask, setActiveTask] = useState<CalendarTask | null>(null)
  const [activeAnchor, setActiveAnchor] = useState<HTMLElement | null>(null)
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null)

  const today = todayISO()

  // Detect schedule conflicts across all events
  const conflictIds = useMemo(() => getAllConflicts(tasks), [tasks])

  // Extract subject names for autocomplete
  const availableSubjects = useMemo(() => {
    const fromSubjects = subjects.map((s) => s.name)
    const fromTasks = tasks.map((t) => t.subject).filter((s): s is string => Boolean(s))
    return Array.from(new Set([...fromSubjects, ...fromTasks]))
  }, [subjects, tasks])

  // Index tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {}
    for (const t of tasks) {
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t)
    }
    return map
  }, [tasks])

  // Month cells
  const monthCells = useMemo(() => buildMonthMatrix(cursor.year, cursor.month), [cursor])

  // Week cells based on selectedDate
  const weekCells = useMemo(() => buildWeekMatrix(selectedDate), [selectedDate])

  // Day tasks sorted chronologically
  const dayTasks = useMemo(() => {
    const list = tasksByDate[selectedDate] || []
    return [...list].sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
      if (a.startTime) return -1
      if (b.startTime) return 1
      return a.id - b.id
    })
  }, [tasksByDate, selectedDate])

  // Popover handlers
  const handleOpenPopover = (e: React.MouseEvent<HTMLElement>, task: CalendarTask) => {
    e.stopPropagation()
    setActiveTask(task)
    setActiveAnchor(e.currentTarget)
  }

  const handleClosePopover = () => {
    setActiveTask(null)
    setActiveAnchor(null)
  }

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCursor((c) => {
        const d = new Date(c.year, c.month - 1, 1)
        return { year: d.getFullYear(), month: d.getMonth() }
      })
    } else if (viewMode === 'week') {
      const d = new Date(`${selectedDate}T00:00:00`)
      d.setDate(d.getDate() - 7)
      const iso = toISODate(d)
      setSelectedDate(iso)
      setCursor({ year: d.getFullYear(), month: d.getMonth() })
    } else {
      const d = new Date(`${selectedDate}T00:00:00`)
      d.setDate(d.getDate() - 1)
      const iso = toISODate(d)
      setSelectedDate(iso)
      setCursor({ year: d.getFullYear(), month: d.getMonth() })
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCursor((c) => {
        const d = new Date(c.year, c.month + 1, 1)
        return { year: d.getFullYear(), month: d.getMonth() }
      })
    } else if (viewMode === 'week') {
      const d = new Date(`${selectedDate}T00:00:00`)
      d.setDate(d.getDate() + 7)
      const iso = toISODate(d)
      setSelectedDate(iso)
      setCursor({ year: d.getFullYear(), month: d.getMonth() })
    } else {
      const d = new Date(`${selectedDate}T00:00:00`)
      d.setDate(d.getDate() + 1)
      const iso = toISODate(d)
      setSelectedDate(iso)
      setCursor({ year: d.getFullYear(), month: d.getMonth() })
    }
  }

  const handleToday = () => {
    const t = new Date()
    setSelectedDate(todayISO())
    setCursor({ year: t.getFullYear(), month: t.getMonth() })
  }

  // Title header text
  const viewTitle = useMemo(() => {
    if (viewMode === 'month') {
      return `${MONTH_NAMES[cursor.month]} ${cursor.year}`
    } else if (viewMode === 'week') {
      const start = weekCells[0]
      const end = weekCells[6]
      return `${start.day} ${MONTH_NAMES[new Date(start.iso).getMonth()].slice(0, 3)} – ${end.day} ${MONTH_NAMES[new Date(end.iso).getMonth()].slice(0, 3)} ${new Date(end.iso).getFullYear()}`
    } else {
      const d = new Date(`${selectedDate}T00:00:00`)
      return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }, [viewMode, cursor, weekCells, selectedDate])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <CalendarDays size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.25em]">Academic Schedule</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Calendar & Deadlines
          </h1>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm self-start md:self-auto">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'month'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Calendar size={14} /> Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'week'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Columns size={14} /> Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'day'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Square size={14} /> Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left Sidebar: Form & Task Manager */}
        <aside className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {editingTask ? 'Edit Event' : 'Add New Event'}
            </h3>
            {conflictIds.size > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                <AlertTriangle size={11} /> {conflictIds.size} conflict{conflictIds.size > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <CalendarTaskForm
            selectedDate={selectedDate}
            editingTask={editingTask}
            existingTasks={tasks}
            availableSubjects={availableSubjects}
            onAdd={onAddTask}
            onUpdate={(id, updates) => {
              onUpdateTask(id, updates)
              setEditingTask(null)
            }}
            onCancel={() => setEditingTask(null)}
          />

          <h3 className="text-sm font-bold mt-6 mb-3 pt-4 border-t border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white flex items-center justify-between">
            <span>All Scheduled Tasks</span>
            <span className="text-xs font-normal text-gray-400">{tasks.length} total</span>
          </h3>

          <CalendarTaskList
            tasks={tasks}
            onToggle={onToggleTask}
            onDelete={onDeleteTask}
            onEdit={(task) => {
              setEditingTask(task)
              setSelectedDate(task.date)
            }}
          />
        </aside>

        {/* Right Main Area: Month / Week / Day View */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{viewTitle}</h2>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                aria-label="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition"
                aria-label="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* VIEW MODE: MONTH */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-inner">
              {WEEKDAY_LABELS.map((w) => (
                <div
                  key={w}
                  className="bg-gray-50 dark:bg-gray-900 text-center text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 py-2.5"
                >
                  {w}
                </div>
              ))}
              {monthCells.map((cell) => {
                const dayTasksList = tasksByDate[cell.iso] || []
                const isToday = cell.iso === today
                const isSelected = cell.iso === selectedDate
                const hasConflict = dayTasksList.some((t) => conflictIds.has(t.id))

                return (
                  <div
                    key={cell.iso}
                    onClick={() => setSelectedDate(cell.iso)}
                    style={{
                      boxShadow: isSelected
                        ? 'inset 0 0 0 2px var(--accent-500, #3b82f6)'
                        : isToday
                        ? 'inset 0 0 0 2px #93c5fd'
                        : 'none',
                    }}
                    className={`relative bg-white dark:bg-gray-800 min-h-[105px] p-2 cursor-pointer flex flex-col gap-1 transition-colors duration-150 ${
                      cell.inMonth ? '' : 'opacity-35 bg-gray-50/50 dark:bg-gray-900/30'
                    } ${isSelected ? 'bg-blue-50/70 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {cell.day}
                      </span>
                      {hasConflict && (
                        <span
                          title="Schedule Conflict on this day"
                          className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5"
                        >
                          <AlertTriangle size={11} />
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      {dayTasksList.slice(0, 3).map((t) => {
                        const cat = getCalendarCategory(t.category)
                        const isTaskConflicted = conflictIds.has(t.id)

                        return (
                          <div
                            key={t.id}
                            onClick={(e) => handleOpenPopover(e, t)}
                            onMouseEnter={(e) => handleOpenPopover(e, t)}
                            onFocus={(e) => handleOpenPopover(e as any, t)}
                            tabIndex={0}
                            className={`group relative text-[11px] font-semibold text-white rounded px-1.5 py-0.5 truncate cursor-pointer outline-none transition flex items-center justify-between gap-1 shadow-sm ${
                              t.done ? 'opacity-40 line-through' : ''
                            } ${isTaskConflicted ? 'ring-1 ring-amber-400' : ''}`}
                            style={{ background: cat.color }}
                          >
                            <span className="truncate">{t.title}</span>
                            {isTaskConflicted && (
                              <AlertTriangle size={10} className="shrink-0 text-amber-200" />
                            )}
                          </div>
                        )
                      })}
                      {dayTasksList.length > 3 && (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium pl-0.5">
                          +{dayTasksList.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VIEW MODE: WEEK */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
              {weekCells.map((cell) => {
                const dayTasksList = tasksByDate[cell.iso] || []
                const isToday = cell.iso === today
                const isSelected = cell.iso === selectedDate
                const hasConflict = dayTasksList.some((t) => conflictIds.has(t.id))

                return (
                  <div
                    key={cell.iso}
                    onClick={() => setSelectedDate(cell.iso)}
                    className={`rounded-xl border p-3 cursor-pointer transition min-h-[300px] flex flex-col ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500'
                        : isToday
                        ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-2 mb-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {WEEKDAY_LABELS[new Date(`${cell.iso}T00:00:00`).getDay()]}
                        </p>
                        <p
                          className={`text-base font-extrabold ${
                            isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {cell.day}
                        </p>
                      </div>
                      {hasConflict && (
                        <span
                          title="Schedule Conflict detected"
                          className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-0.5"
                        >
                          <AlertTriangle size={11} />
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[360px] pr-0.5">
                      {dayTasksList.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic py-4 text-center">
                          No events
                        </p>
                      ) : (
                        dayTasksList.map((t) => {
                          const cat = getCalendarCategory(t.category)
                          const isTaskConflicted = conflictIds.has(t.id)

                          return (
                            <div
                              key={t.id}
                              onClick={(e) => handleOpenPopover(e, t)}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition hover:scale-[1.02] shadow-sm ${
                                isTaskConflicted
                                  ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-900/20'
                                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40'
                              } ${t.done ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span
                                  className={`text-xs font-bold text-gray-900 dark:text-white truncate ${
                                    t.done ? 'line-through' : ''
                                  }`}
                                >
                                  {t.title}
                                </span>
                              </div>

                              {t.startTime && t.endTime && (
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                  <Clock size={10} />
                                  <span>{t.startTime} – {t.endTime}</span>
                                </div>
                              )}

                              {isTaskConflicted && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-1">
                                  <AlertTriangle size={10} /> Conflict
                                </p>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* VIEW MODE: DAY */}
          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
                  <Clock size={16} className="text-blue-500" />
                  <span>
                    Schedule for {selectedDate} &bull; {dayTasks.length} total event{dayTasks.length === 1 ? '' : 's'}
                  </span>
                </div>
                {dayTasks.some((t) => conflictIds.has(t.id)) && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg">
                    <AlertTriangle size={13} /> Time Conflicts Detected
                  </span>
                )}
              </div>

              {dayTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <CalendarDays size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No events scheduled for this day.</p>
                  <p className="text-xs mt-1">Use the form on the left to add a class, assignment, or study block.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayTasks.map((t) => {
                    const cat = getCalendarCategory(t.category)
                    const isTaskConflicted = conflictIds.has(t.id)

                    return (
                      <div
                        key={t.id}
                        onClick={(e) => handleOpenPopover(e, t)}
                        className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isTaskConflicted
                            ? 'border-amber-400/80 bg-amber-50/50 dark:bg-amber-900/10'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        } ${t.done ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={`text-base font-bold text-gray-900 dark:text-white ${
                                  t.done ? 'line-through text-gray-400 dark:text-gray-500' : ''
                                }`}
                              >
                                {t.title}
                              </h4>
                              {isTaskConflicted && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                                  <AlertTriangle size={11} /> Conflict
                                </span>
                              )}
                              {t.priority && (
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {t.priority}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                              {t.startTime && t.endTime ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                                  <Clock size={12} /> {t.startTime} – {t.endTime}
                                </span>
                              ) : (
                                <span>All-day / Unscheduled</span>
                              )}

                              {t.subject && (
                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                  <Tag size={12} /> {t.subject}
                                </span>
                              )}

                              {t.location && (
                                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                  <MapPin size={12} /> {t.location}
                                </span>
                              )}
                            </div>

                            {t.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                {t.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleTask(t.id)
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              t.done
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100'
                            }`}
                          >
                            {t.done ? 'Mark Undone' : 'Mark Done'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Viewport-Clamped Popover */}
      {activeTask && activeAnchor && (
        <EventPopover
          task={activeTask}
          category={getCalendarCategory(activeTask.category)}
          anchorEl={activeAnchor}
          isConflicted={conflictIds.has(activeTask.id)}
          onClose={handleClosePopover}
          onEdit={(task) => {
            setEditingTask(task)
            setSelectedDate(task.date)
          }}
          onDelete={(id) => {
            onDeleteTask(id)
          }}
        />
      )}
    </div>
  )
}
