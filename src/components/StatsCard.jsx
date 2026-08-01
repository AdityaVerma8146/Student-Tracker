function StatsCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  }

  const textColorClasses = {
    blue: 'text-blue-700 dark:text-blue-300',
    purple: 'text-purple-700 dark:text-purple-300',
    green: 'text-green-700 dark:text-green-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    orange: 'text-orange-700 dark:text-orange-300',
  }

  return (
    <div className={`p-4 rounded-lg border-2 card-shadow transition-transform hover:scale-105 ${colorClasses[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-xs sm:text-sm font-semibold ${textColorClasses[color]}`}>
        {title}
      </p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  )
}

export default StatsCard
