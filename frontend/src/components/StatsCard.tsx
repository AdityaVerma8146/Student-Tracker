import type { ReactNode } from 'react'
import { handleSpotlight } from '../utils/effects'

type StatColor = 'blue' | 'purple' | 'green' | 'emerald' | 'orange'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  color: StatColor
  delay?: number
}

function StatsCard({ title, value, icon, color, delay = 0 }: StatsCardProps) {
  const colorClasses: Record<StatColor, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  }

  const textColorClasses: Record<StatColor, string> = {
    blue: 'text-blue-700 dark:text-blue-300',
    purple: 'text-purple-700 dark:text-purple-300',
    green: 'text-green-700 dark:text-green-300',
    emerald: 'text-emerald-700 dark:text-emerald-300',
    orange: 'text-orange-700 dark:text-orange-300',
  }

  return (
    <div
      onMouseMove={handleSpotlight}
      style={{ animationDelay: `${delay}ms` }}
      className={`stagger-item spotlight-card hover-lift p-4 rounded-lg border-2 card-shadow cursor-default ${colorClasses[color]}`}
    >
      <div className="text-2xl mb-2 relative z-10">{icon}</div>
      <p className={`relative z-10 text-xs sm:text-sm font-semibold ${textColorClasses[color]}`}>
        {title}
      </p>
      <p className="relative z-10 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
        {value}
      </p>
    </div>
  )
}

export default StatsCard
