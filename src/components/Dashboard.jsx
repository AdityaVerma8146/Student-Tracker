import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'
import { getStatistics, calculateOverallCompletion, calculateSubjectCompletion, getProgressByDays, getProgressByWeeks, getProgressByMonths } from '../utils/storage'
import StatsCard from './StatsCard'
import DailyTasks from './DailyTasks'

function Dashboard({ subjects, dailyTasks, onAddDailyTask, onToggleDailyTask, onDeleteDailyTask }) {
  const stats = getStatistics(subjects)
  
  const subjectChartData = subjects.map(s => ({
    name: s.name.substring(0, 15),
    completion: calculateSubjectCompletion(s),
    fullName: s.name
  }))

  const completionData = [
    { name: 'Completed', value: stats.completedTopics },
    { name: 'Remaining', value: stats.remainingTopics }
  ]

  const COLORS = ['#3b82f6', '#e5e7eb']
  const completionPercentage = stats.overallCompletion

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">📊 Study Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Track your learning progress across all subjects</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Subjects"
          value={stats.totalSubjects}
          icon="📚"
          color="blue"
        />
        <StatsCard
          title="Total Chapters"
          value={stats.totalChapters}
          icon="📖"
          color="purple"
        />
        <StatsCard
          title="Total Topics"
          value={stats.totalTopics}
          icon="📝"
          color="green"
        />
        <StatsCard
          title="Completed"
          value={stats.completedTopics}
          icon="✅"
          color="emerald"
        />
        <StatsCard
          title="Overall Progress"
          value={`${completionPercentage}%`}
          icon="🎯"
          color="orange"
        />
      </div>

      {/* Overall Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
          <h3 className="text-xl font-bold mb-4">Overall Completion</h3>
          {stats.totalTopics > 0 ? (
            <div className="flex flex-col items-center justify-center h-80">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">
                  {completionPercentage}%
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Complete</p>
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <p>No topics yet. Start by adding subjects and chapters!</p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
          <h3 className="text-xl font-bold mb-6">Study Summary</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Topics Completed</span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {stats.completedTopics} / {stats.totalTopics}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.completedTopics}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.remainingTopics}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Progress Chart */}
      {subjectChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
          <h3 className="text-xl font-bold mb-4">Subject-wise Progress</h3>
          {subjectChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={subjectChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
                <XAxis dataKey="name" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="completion" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Add subjects to see progress chart</p>
          )}
        </div>
      )}

      <DailyTasks
        dailyTasks={dailyTasks}
        onAddTask={onAddDailyTask}
        onToggleTask={onToggleDailyTask}
        onDeleteTask={onDeleteDailyTask}
      />

          {/* Periodic Progress: Daily / Weekly / Monthly */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
              <h3 className="text-lg font-bold mb-4">Daily Progress (Last 7 days)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={getProgressByDays(dailyTasks, 7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
                  <XAxis dataKey="date" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip formatter={(value) => `${value} completions`} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
              <h3 className="text-lg font-bold mb-4">Weekly Progress (Last 4 weeks)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={getProgressByWeeks(dailyTasks, 4)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
                  <XAxis dataKey="week" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip formatter={(value) => `${value} completions`} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
              <h3 className="text-lg font-bold mb-4">Monthly Progress (Last 6 months)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={getProgressByMonths(dailyTasks, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" />
                  <XAxis dataKey="month" stroke="currentColor" />
                  <YAxis stroke="currentColor" />
                  <Tooltip formatter={(value) => `${value} completions`} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
    </div>
  )
}

export default Dashboard
