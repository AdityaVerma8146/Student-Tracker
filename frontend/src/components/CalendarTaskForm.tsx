import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { CALENDAR_CATEGORIES, todayISO } from '../utils/calendarUtils'
import { spawnRipple } from '../utils/effects'

function CalendarTaskForm({ selectedDate, onAdd }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(selectedDate || todayISO())
  const [category, setCategory] = useState('study')

  // Keep the date field in sync when the user clicks a different day on the
  // calendar grid, instead of only reading the prop once on mount.
  useEffect(() => {
    if (selectedDate) setDate(selectedDate)
  }, [selectedDate])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim() || !date) return
    onAdd({ title: title.trim(), date, category })
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          Task title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Revise Chapter 4"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CALENDAR_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        onClick={spawnRipple}
        className="ripple-container btn-primary w-full inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold py-2.5"
      >
        <Plus size={16} /> Add Task
      </button>
    </form>
  )
}

export default CalendarTaskForm
