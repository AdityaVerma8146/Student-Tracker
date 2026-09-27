import { useEffect, useMemo, useState } from 'react'
import { Plus, Check, AlertTriangle, Clock, MapPin, Tag } from 'lucide-react'
import { CALENDAR_CATEGORIES, todayISO, checkTaskConflict } from '../utils/calendarUtils'
import { spawnRipple } from '../utils/effects'
import type { CalendarTask } from '../types'

interface CalendarTaskFormProps {
  selectedDate: string
  editingTask: CalendarTask | null
  existingTasks?: CalendarTask[]
  availableSubjects?: string[]
  onAdd: (task: Omit<CalendarTask, 'id' | 'createdAt' | 'done'>) => void
  onUpdate: (id: number, task: Partial<CalendarTask>) => void
  onCancel: () => void
}

export default function CalendarTaskForm({
  selectedDate,
  editingTask,
  existingTasks = [],
  availableSubjects = [],
  onAdd,
  onUpdate,
  onCancel,
}: CalendarTaskFormProps) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(selectedDate || todayISO())
  const [category, setCategory] = useState('study')
  const [eventType, setEventType] = useState<'class' | 'assignment' | 'exam' | 'study' | 'task' | 'deadline'>('study')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [subject, setSubject] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  // Populate form if editing
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '')
      setDate(editingTask.date || todayISO())
      setCategory(editingTask.category || 'study')
      setEventType(editingTask.eventType || 'study')
      setPriority(editingTask.priority || 'medium')
      setStartTime(editingTask.startTime || '')
      setEndTime(editingTask.endTime || '')
      setSubject(editingTask.subject || '')
      setLocation(editingTask.location || '')
      setDescription(editingTask.description || '')
      setNotes(editingTask.notes || '')
    } else {
      setTitle('')
      setStartTime('')
      setEndTime('')
      setSubject('')
      setLocation('')
      setDescription('')
      setNotes('')
      if (selectedDate) setDate(selectedDate)
    }
  }, [editingTask, selectedDate])

  // Real-time conflict detection
  const detectedConflict = useMemo(() => {
    if (!date || !startTime || !endTime) return null
    return checkTaskConflict(
      {
        date,
        startTime,
        endTime,
        id: editingTask?.id,
      },
      existingTasks
    )
  }, [date, startTime, endTime, editingTask, existingTasks])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) return

    const taskData: Omit<CalendarTask, 'id' | 'createdAt' | 'done'> = {
      title: title.trim(),
      date,
      category,
      eventType,
      priority,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      subject: subject.trim() || undefined,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
    }

    if (editingTask) {
      onUpdate(editingTask.id, taskData)
    } else {
      onAdd(taskData)
    }

    if (!editingTask) {
      setTitle('')
      setStartTime('')
      setEndTime('')
      setDescription('')
      setNotes('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Real-time Conflict Alert */}
      {detectedConflict && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertTriangle size={15} className="shrink-0 text-amber-500 mt-0.5" />
          <div>
            <span className="font-bold">Schedule Conflict!</span>
            <p className="mt-0.5 opacity-90">
              Overlaps with &ldquo;{detectedConflict.title}&rdquo; ({detectedConflict.startTime} – {detectedConflict.endTime})
            </p>
          </div>
        </div>
      )}

      {/* Task Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          Task title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Algorithms Lecture, Midterm Exam..."
          required
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date & Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
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

      {/* Event Type & Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="study">Study Session</option>
            <option value="class">Lecture / Class</option>
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="deadline">Deadline</option>
            <option value="task">General Task</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority ⚠️</option>
          </select>
        </div>
      </div>

      {/* Start Time & End Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            <Clock size={11} className="inline mr-1" /> Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            <Clock size={11} className="inline mr-1" /> End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Subject & Location */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            <Tag size={11} className="inline mr-1" /> Subject
          </label>
          {availableSubjects.length > 0 ? (
            <input
              type="text"
              list="calendar-subjects-list"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <datalist id="calendar-subjects-list">
            {availableSubjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
            <MapPin size={11} className="inline mr-1" /> Location / Room
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Room 302, Zoom..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Description / Notes */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
          Description & Notes
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Topics covered, syllabus references, preparation notes..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          onClick={spawnRipple}
          className="ripple-container btn-primary flex-1 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold py-2.5 transition shadow-sm hover:shadow"
        >
          {editingTask ? <Check size={16} /> : <Plus size={16} />}
          {editingTask ? 'Update Event' : 'Add to Calendar'}
        </button>

        {editingTask && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
