import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  LayoutDashboard,
  BookOpen,
  CheckCircle2,
  Target,
  Plus,
  Calendar as CalendarIcon,
  Sparkles,
  Flame,
  Clock,
  AlertTriangle,
  Compass,
  MessageSquare,
  Check,
  ChevronRight,
  GraduationCap
} from 'lucide-react'
import { getStatistics, calculateSubjectCompletion, getProgressByWeeks } from '../utils/storage'
import { todayISO, getCalendarCategory } from '../utils/calendarUtils'
import StatsCard from './StatsCard'
import DailyTasks from './DailyTasks'
import type { Subject, DailyTask, CalendarTask, Profile, CurrentView } from '../types'

interface DashboardProps {
  profile?: Profile
  subjects: Subject[]
  dailyTasks: DailyTask[]
  calendarTasks?: CalendarTask[]
  onAddDailyTask: (name: string, duration?: string) => void
  onToggleDailyTask: (id: number, dateKey: string) => void
  onDeleteDailyTask: (id: number) => void
  onToggleCalendarTask?: (id: number) => void
  onNavigate: (view: CurrentView) => void
  onOpenAi?: () => void
}

export default function Dashboard({
  profile,
  subjects,
  dailyTasks,
  calendarTasks = [],
  onAddDailyTask,
  onToggleDailyTask,
  onDeleteDailyTask,
  onToggleCalendarTask,
  onNavigate,
  onOpenAi,
}: DashboardProps) {
  const stats = getStatistics(subjects)
  const today = todayISO()

  // Calculate Streak based on daily tasks or completed topics
  const streakDays = useMemo(() => {
    let streak = 0
    const now = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().split('T')[0]
      const hasActivity =
        dailyTasks.some((t) => t.schedule && t.schedule[iso]) ||
        calendarTasks.some((c) => c.date === iso && c.done)
      if (hasActivity || i === 0) {
        streak++
      } else {
        break
      }
    }
    return Math.max(streak, 1)
  }, [dailyTasks, calendarTasks])

  // Today's schedule events
  const todayEvents = useMemo(() => {
    return calendarTasks.filter((t) => t.date === today)
  }, [calendarTasks, today])

  // Upcoming classes
  const upcomingClasses = useMemo(() => {
    return calendarTasks
      .filter((t) => (t.eventType === 'class' || t.category === 'lecture') && t.date >= today && !t.done)
      .slice(0, 4)
  }, [calendarTasks, today])

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = useMemo(() => {
    const next7Days = new Date()
    next7Days.setDate(next7Days.getDate() + 7)
    const limitISO = next7Days.toISOString().split('T')[0]

    return calendarTasks
      .filter(
        (t) =>
          (t.eventType === 'assignment' ||
            t.eventType === 'exam' ||
            t.category === 'exam' ||
            t.category === 'assignment') &&
          t.date >= today &&
          t.date <= limitISO &&
          !t.done
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5)
  }, [calendarTasks, today])

  // Subject completion chart data
  const subjectChartData = useMemo(() => {
    return subjects.map((s) => ({
      name: s.name.length > 14 ? s.name.substring(0, 14) + '…' : s.name,
      completion: calculateSubjectCompletion(s),
      fullName: s.name,
    }))
  }, [subjects])

  // AI Recommendation subject
  const recommendedSubject = useMemo(() => {
    if (subjects.length === 0) return null
    // Find subject with lowest completion that has topics
    return [...subjects].sort(
      (a, b) => calculateSubjectCompletion(a) - calculateSubjectCompletion(b)
    )[0]
  }, [subjects])

  const completionPercentage = stats.overallCompletion

  const completionData = [
    { name: 'Completed', value: stats.completedTopics },
    { name: 'Remaining', value: Math.max(stats.remainingTopics, 0) },
  ]
  const PIE_COLORS = ['#3b82f6', '#e2e8f0']

  const pendingTasksCount = calendarTasks.filter((t) => !t.done).length
  const completedTasksCount = calendarTasks.filter((t) => t.done).length

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Greeting & Streak Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <LayoutDashboard size={18} />
            <span className="text-xs font-bold uppercase tracking-[0.25em]">Academic Command Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Welcome, Student'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Here is your live study progress, today's schedule, and pending coursework.
          </p>
        </div>

        {/* Motivation Streak Pill */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent dark:from-amber-500/15 p-3 sm:px-5 sm:py-3 rounded-2xl border border-amber-500/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
            <Flame size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white">{streakDays} Day</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Streak</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep learning today to hold your rhythm!</p>
          </div>
        </div>
      </div>

      {/* Quick Action Bar (Requirement #8) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">
            Quick Actions:
          </span>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('subjects')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              <Plus size={14} /> Add Subject
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              <CalendarIcon size={14} /> Create Schedule
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              <Clock size={14} /> Open Calendar
            </button>
            <button
              onClick={() => onNavigate('roadmap')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 hover:bg-purple-100 transition-colors"
            >
              <Compass size={14} /> Generate Roadmap
            </button>
            <button
              onClick={onOpenAi}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Sparkles size={14} /> Ask AI Assistant
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title="Subjects"
          value={stats.totalSubjects}
          icon={<BookOpen size={20} />}
          color="blue"
          delay={0}
        />
        <StatsCard
          title="Topics Total"
          value={stats.totalTopics}
          icon={<Target size={20} />}
          color="purple"
          delay={50}
        />
        <StatsCard
          title="Topics Done"
          value={stats.completedTopics}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
          delay={100}
        />
        <StatsCard
          title="Pending Tasks"
          value={pendingTasksCount}
          icon={<Clock size={20} />}
          color="orange"
          delay={150}
        />
        <StatsCard
          title="Completed Tasks"
          value={completedTasksCount}
          icon={<Check size={20} />}
          color="blue"
          delay={200}
        />
        <StatsCard
          title="Overall Progress"
          value={`${completionPercentage}%`}
          icon={<GraduationCap size={20} />}
          color="emerald"
          delay={250}
        />
      </div>

      {/* AI Recommendation Banner */}
      {recommendedSubject && (
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-purple-600/10 border border-blue-500/25 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  AI Academic Recommendation
                </h4>
                <span className="text-[10px] uppercase font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  Priority Focus
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Your lowest completion is in <strong className="text-blue-600 dark:text-blue-400">{recommendedSubject.name}</strong> ({calculateSubjectCompletion(recommendedSubject)}%). Dedicating 45 minutes to its next chapter today will significantly balance your preparation.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('subjects')}
            className="shrink-0 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all"
          >
            Study Subject <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Schedule, Classes & Deadlines (Overview Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Timeline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Today's Schedule</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              {todayEvents.length} events
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-72 pr-1">
            {todayEvents.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <CalendarIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No tasks scheduled for today.</p>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  + Add Today's Agenda
                </button>
              </div>
            ) : (
              todayEvents.map((event) => {
                const cat = getCalendarCategory(event.category)
                return (
                  <div
                    key={event.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      event.done
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm'
                    }`}
                  >
                    {onToggleCalendarTask && (
                      <button
                        type="button"
                        onClick={() => onToggleCalendarTask(event.id)}
                        className={`mt-0.5 h-4 w-4 rounded flex items-center justify-center border transition-all ${
                          event.done
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                        }`}
                      >
                        {event.done && <Check size={12} />}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${event.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {event.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span>{cat.label}</span>
                        {event.startTime && <span>&bull; {event.startTime}</span>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-purple-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Upcoming Classes</h3>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-72 pr-1">
            {upcomingClasses.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No upcoming classes logged.</p>
                <button
                  onClick={() => onNavigate('calendar')}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline mt-2"
                >
                  Schedule a Class
                </button>
              </div>
            ) : (
              upcomingClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/40 dark:bg-purple-950/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{cls.title}</h4>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shrink-0">
                      {cls.date === today ? 'Today' : cls.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    {cls.startTime && <span>🕒 {cls.startTime} - {cls.endTime || 'End'}</span>}
                    {cls.location && <span>📍 {cls.location}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deadlines Radar (Upcoming 7 Days) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Deadlines Radar</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              Next 7 Days
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-72 pr-1">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40 text-emerald-500" />
                <p className="text-sm font-medium">All clear! No urgent deadlines this week.</p>
              </div>
            ) : (
              upcomingDeadlines.map((dl) => (
                <div
                  key={dl.id}
                  className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{dl.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Due on {dl.date}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shrink-0 shadow-sm shadow-rose-500/20">
                    {dl.date === today ? 'Due Today' : dl.date.slice(5)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Progress Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Overall Completion Ring */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Overall Degree &amp; Syllabus Completion</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Percentage of all required topics mastered across all registered subjects.</p>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                  {completionPercentage}%
                </span>
                <span className="text-xs font-semibold uppercase text-slate-400">Mastered</span>
              </div>
            </div>

            <div className="space-y-4 w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-blue-600" /> Completed Topics
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.completedTopics}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700" /> Remaining Topics
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.remainingTopics}</span>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-purple-500" /> Total Chapters
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{stats.totalChapters}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-Wise Progress Bars */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Subject Performance Breakdown</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Real-time completion percentage by subject.</p>

          {subjectChartData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-400">
              <BookOpen size={32} className="mb-2 opacity-40" />
              <p className="text-sm">No subjects yet. Create your first subject to view metrics.</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                  <XAxis type="number" domain={[0, 100]} unit="%" stroke="currentColor" fontSize={11} opacity={0.6} />
                  <YAxis type="category" dataKey="name" stroke="currentColor" fontSize={11} opacity={0.8} width={100} />
                  <Tooltip formatter={(val) => [`${val}%`, 'Completion']} wrapperClassName="chart-tooltip" />
                  <Bar dataKey="completion" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Daily Tasks / Habits Matrix */}
      <DailyTasks
        dailyTasks={dailyTasks}
        onAddTask={onAddDailyTask}
        onToggleTask={onToggleDailyTask}
        onDeleteTask={onDeleteDailyTask}
      />
    </div>
  )
}
