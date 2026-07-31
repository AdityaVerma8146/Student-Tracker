import { useState, useMemo } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getCurrentWeekDates } from '../utils/storage'

function DailyTasks({ dailyTasks, onAddTask, onToggleTask, onDeleteTask }) {
  const [taskName, setTaskName] = useState('')
  const [taskDuration, setTaskDuration] = useState('30m')
  const weekDates = useMemo(() => getCurrentWeekDates(), [])

  const handleAdd = (e) => {
    e.preventDefault()
    const trimmed = taskName.trim()
    if (!trimmed) return
    onAddTask(trimmed, taskDuration || '30m')
    setTaskName('')
    setTaskDuration('30m')
  }

  const buildRowSchedule = (task) => {
    if (task.schedule) return task.schedule
    const schedule = {}
    weekDates.forEach(day => {
      schedule[day.key] = false
    })
    return schedule
  }

  const progressData = weekDates.map(day => ({
    day: day.label,
    completed: dailyTasks.filter(task => buildRowSchedule(task)[day.key]).length
  }))

  const totalItems = dailyTasks.length * weekDates.length
  const totalCompleted = dailyTasks.reduce((sum, task) => {
    const schedule = buildRowSchedule(task)
    return sum + weekDates.reduce((rowSum, day) => rowSum + (schedule[day.key] ? 1 : 0), 0)
  }, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">Daily Goals</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your weekly checklist and mark tasks for each day.</p>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{dailyTasks.length} tasks · {totalCompleted} of {totalItems} checked this week</p>
        </div>
        <div className="w-full lg:w-1/3 h-40 bg-slate-50 dark:bg-gray-900 rounded-2xl p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" allowDecimals={false} />
              <Tooltip formatter={(value) => `${value} tasks`} />
              <Line type="monotone" dataKey="completed" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <form onSubmit={handleAdd} className="mt-6 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Add a new daily task"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={taskDuration}
          onChange={(e) => setTaskDuration(e.target.value)}
          placeholder="Duration (e.g. 30m)"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 transition"
        >
          <Plus size={16} /> Add Task
        </button>
      </form>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-sm text-gray-500 dark:text-gray-400 text-left">
              <th className="pl-4 pb-3">Task</th>
              <th className="pb-3">Duration</th>
              {weekDates.map(day => (
                <th key={day.key} className="pb-3 text-center text-xs uppercase tracking-[0.2em] text-gray-400">{day.label}</th>
              ))}
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {dailyTasks.map(task => {
              const schedule = buildRowSchedule(task)
              return (
                <tr key={task.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm align-top">
                  <td className="pl-4 py-4 align-top">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{task.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Added {new Date(task.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="py-4 align-top text-sm text-gray-600 dark:text-gray-300">
                    {task.duration || '—'}
                    <div className="mt-1 text-xs text-gray-400">Daily target</div>
                  </td>
                  {weekDates.map(day => (
                    <td key={day.key} className="py-4 text-center align-top">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id, day.key)}
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition ${schedule[day.key] ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-700 text-gray-500 hover:border-blue-500 dark:hover:border-blue-400'}`}
                        title={`${day.label} ${schedule[day.key] ? 'completed' : 'not completed'}`}
                      >
                        {schedule[day.key] ? <Check size={16} /> : ''}
                      </button>
                    </td>
                  ))}
                  <td className="py-4 pr-4 text-right align-top">
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-900/30 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DailyTasks
