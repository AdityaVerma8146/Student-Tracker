import { useEffect, useState } from 'react'
import { Award } from 'lucide-react'
import type { Badge } from '../types'
import { getBadges } from '../services/badgeService'

export default function BadgeShowcase({ email }: { email: string }) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getBadges(email)
      .then((b) => { if (!cancelled) setBadges(b) })
      .catch(() => { /* badges are a nice-to-have; fail silently */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [email])

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Award size={18} className="text-yellow-500" /> Badges
        </h3>
        {!loading && <span className="text-sm text-gray-400">{earnedCount}/{badges.length} earned</span>}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading badges…</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              title={b.description}
              className={`flex flex-col items-center text-center p-3 rounded-lg border ${
                b.earned
                  ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10 hover-lift'
                  : 'border-gray-200 dark:border-gray-700 opacity-40 grayscale'
              }`}
            >
              <span className="text-2xl mb-1">{b.emoji}</span>
              <span className="text-xs font-semibold leading-tight">{b.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
