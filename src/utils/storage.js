export const storageKey = 'syllabusTrackerData'

export const loadData = () => {
  try {
    const data = localStorage.getItem(storageKey)
    return data ? JSON.parse(data) : { subjects: [], dailyTasks: [] }
  } catch (error) {
    console.error('Error loading data:', error)
    return { subjects: [], dailyTasks: [] }
  }
}

export const saveData = (data) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

export const calculateChapterCompletion = (chapter) => {
  if (!chapter.topics || chapter.topics.length === 0) return 0
  const completed = chapter.topics.filter(t => t.completed).length
  return Math.round((completed / chapter.topics.length) * 100)
}

export const calculateSubjectCompletion = (subject) => {
  if (!subject.chapters || subject.chapters.length === 0) return 0
  const totalTopics = subject.chapters.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0)
  if (totalTopics === 0) return 0
  const completedTopics = subject.chapters.reduce((sum, ch) => {
    return sum + (ch.topics?.filter(t => t.completed).length || 0)
  }, 0)
  return Math.round((completedTopics / totalTopics) * 100)
}

export const calculateOverallCompletion = (subjects) => {
  const allTopics = subjects.reduce((sum, subj) => {
    return sum + (subj.chapters?.reduce((s, ch) => s + (ch.topics?.length || 0), 0) || 0)
  }, 0)
  if (allTopics === 0) return 0
  const completedTopics = subjects.reduce((sum, subj) => {
    return sum + (subj.chapters?.reduce((s, ch) => {
      return s + (ch.topics?.filter(t => t.completed).length || 0)
    }, 0) || 0)
  }, 0)
  return Math.round((completedTopics / allTopics) * 100)
}

// Shared week convention: weeks start on Monday everywhere in the app
// (daily task creation, the weekly tracker table, and the weekly chart all
// use this so a given date always falls in the same displayed week).
export const getMondayWeekStart = (referenceDate = new Date()) => {
  const start = new Date(referenceDate)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  start.setHours(0, 0, 0, 0)
  return start
}

export const getCurrentWeekDates = () => {
  const weekStart = getMondayWeekStart()
  return Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + idx)
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      day: date.getDate()
    }
  })
}

// Helpers to aggregate completions over time based on daily task schedule
const parseDateKey = (key) => new Date(`${key}T00:00:00`)

const getDateRange = (days) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: days }, (_, idx) => {
    const day = new Date(today)
    day.setDate(today.getDate() - (days - 1 - idx))
    return day
  })
}

const countScheduleCompletions = (dailyTasks, rangeStart, rangeEnd) => {
  return dailyTasks.reduce((total, task) => {
    const schedule = task.schedule || {}
    return total + Object.entries(schedule).reduce((taskSum, [dateKey, completed]) => {
      if (!completed) return taskSum
      const date = parseDateKey(dateKey)
      return date >= rangeStart && date <= rangeEnd ? taskSum + 1 : taskSum
    }, 0)
  }, 0)
}

export const getProgressByDays = (dailyTasks, days = 7) => {
  return getDateRange(days).map(day => ({
    date: day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: dailyTasks.reduce((sum, task) => {
      const schedule = task.schedule || {}
      return sum + (schedule[day.toISOString().slice(0, 10)] ? 1 : 0)
    }, 0)
  }))
}

const getWeekRanges = (weeks = 4) => {
  const today = new Date()
  const result = []

  for (let i = weeks - 1; i >= 0; i--) {
    const ref = new Date(today)
    ref.setDate(today.getDate() - i * 7)
    const start = getMondayWeekStart(ref)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    const label = `Week of ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    result.push({ label, start, end })
  }

  return result
}

export const getProgressByWeeks = (dailyTasks, weeks = 4) => {
  return getWeekRanges(weeks).map(range => ({
    week: range.label,
    count: countScheduleCompletions(dailyTasks, range.start, range.end)
  }))
}

const getMonthRanges = (months = 6) => {
  const today = new Date()
  const result = []

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(today.getFullYear(), today.getMonth() - i, 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    const label = start.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    result.push({ label, start, end })
  }

  return result
}

export const getProgressByMonths = (dailyTasks, months = 6) => {
  return getMonthRanges(months).map(range => ({
    month: range.label,
    count: countScheduleCompletions(dailyTasks, range.start, range.end)
  }))
}

export const getStatistics = (subjects) => {
  const totalSubjects = subjects.length
  const totalChapters = subjects.reduce((sum, s) => sum + (s.chapters?.length || 0), 0)
  const totalTopics = subjects.reduce((sum, s) => {
    return sum + (s.chapters?.reduce((ch_sum, ch) => ch_sum + (ch.topics?.length || 0), 0) || 0)
  }, 0)
  const completedTopics = subjects.reduce((sum, s) => {
    return sum + (s.chapters?.reduce((ch_sum, ch) => {
      return ch_sum + (ch.topics?.filter(t => t.completed).length || 0)
    }, 0) || 0)
  }, 0)

  return {
    totalSubjects,
    totalChapters,
    totalTopics,
    completedTopics,
    remainingTopics: totalTopics - completedTopics,
    overallCompletion: calculateOverallCompletion(subjects)
  }
}

export const exportData = (data) => {
  const dataStr = JSON.stringify(data, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `syllabus-tracker-backup-${new Date().toISOString().split('T')[0]}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.subjects && Array.isArray(data.subjects)) {
          resolve(data)
        } else {
          reject(new Error('Invalid data format'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = () => reject(new Error('Error reading file'))
    reader.readAsText(file)
  })
}

