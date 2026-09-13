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

/* Build a 6-row x 7-col calendar grid for the given month, including the
   padding days from the previous/next month needed to fill the grid. */
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
