export interface CalendarCategory {
  id: string
  label: string
  color: string
}

export interface MonthCell {
  iso: string
  day: number
  inMonth: boolean
}

export const CALENDAR_CATEGORIES: CalendarCategory[] = [
  { id: 'study', label: 'Study Session', color: '#3d7bff' },
  { id: 'assignment', label: 'Assignment', color: '#fb7185' },
  { id: 'exam', label: 'Exam', color: '#f59e0b' },
  { id: 'revision', label: 'Revision', color: '#10b981' },
  { id: 'other', label: 'Other', color: '#94a3b8' },
]

const CATEGORY_MAP: Record<string, CalendarCategory> = Object.fromEntries(
  CALENDAR_CATEGORIES.map((c) => [c.id, c])
)

export function getCalendarCategory(id: string): CalendarCategory {
  return CATEGORY_MAP[id] || CATEGORY_MAP.other
}

export function toISODate(date: Date | string | number): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

function addDays(base: Date, amount: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + amount)
  return d
}

export function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function buildMonthMatrix(year: number, month: number): MonthCell[] {
  const firstOfMonth = new Date(year, month, 1)
  const firstWeekday = firstOfMonth.getDay()
  const gridStart = addDays(firstOfMonth, -firstWeekday)

  const cells: MonthCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i)
    cells.push({
      iso: toISODate(d),
      day: d.getDate(),
      inMonth: d.getMonth() === month,
    })
  }

  while (cells.length > 35 && cells.slice(-7).every((c) => !c.inMonth)) {
    cells.splice(-7, 7)
  }

  return cells
}

export function buildWeekMatrix(referenceIso: string): MonthCell[] {
  const target = new Date(`${referenceIso}T00:00:00`)
  const dayOfWeek = target.getDay() // 0 = Sun
  const sunday = addDays(target, -dayOfWeek)
  
  const cells: MonthCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(sunday, i)
    cells.push({
      iso: toISODate(d),
      day: d.getDate(),
      inMonth: true,
    })
  }
  return cells
}

export function timeToMinutes(t?: string): number | null {
  if (!t || typeof t !== 'string') return null
  const parts = t.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

export function checkTaskConflict(
  candidate: { date: string; startTime?: string; endTime?: string; id?: number },
  existingTasks: { id: number; date: string; startTime?: string; endTime?: string; title: string }[]
): { id: number; title: string; startTime?: string; endTime?: string } | null {
  if (!candidate.date || !candidate.startTime || !candidate.endTime) return null
  const cStart = timeToMinutes(candidate.startTime)
  const cEnd = timeToMinutes(candidate.endTime)
  if (cStart === null || cEnd === null || cEnd <= cStart) return null

  for (const t of existingTasks) {
    if (candidate.id && t.id === candidate.id) continue
    if (t.date !== candidate.date) continue
    if (!t.startTime || !t.endTime) continue
    const tStart = timeToMinutes(t.startTime)
    const tEnd = timeToMinutes(t.endTime)
    if (tStart === null || tEnd === null) continue

    // overlap condition
    if (cStart < tEnd && cEnd > tStart) {
      return t
    }
  }
  return null
}

export function getAllConflicts(tasks: { id: number; date: string; startTime?: string; endTime?: string }[]): Set<number> {
  const conflictIds = new Set<number>()
  const byDate: Record<string, typeof tasks> = {}
  
  for (const t of tasks) {
    if (!t.startTime || !t.endTime) continue
    if (!byDate[t.date]) byDate[t.date] = []
    byDate[t.date].push(t)
  }

  for (const date in byDate) {
    const dayTasks = byDate[date]
    for (let i = 0; i < dayTasks.length; i++) {
      const a = dayTasks[i]
      const aStart = timeToMinutes(a.startTime)
      const aEnd = timeToMinutes(a.endTime)
      if (aStart === null || aEnd === null) continue

      for (let j = i + 1; j < dayTasks.length; j++) {
        const b = dayTasks[j]
        const bStart = timeToMinutes(b.startTime)
        const bEnd = timeToMinutes(b.endTime)
        if (bStart === null || bEnd === null) continue

        if (aStart < bEnd && aEnd > bStart) {
          conflictIds.add(a.id)
          conflictIds.add(b.id)
        }
      }
    }
  }

  return conflictIds
}
