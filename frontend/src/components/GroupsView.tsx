import { useEffect, useState } from 'react'
import { Users, Plus, X, ClipboardList, UserPlus } from 'lucide-react'
import type { GroupSummary } from '../types'
import { listMyGroups, createGroup } from '../services/groupService'
import { extractErrorMessage } from '../utils/apiError'
import { spawnRipple, handleSpotlight } from '../utils/effects'
import FriendsPanel from './FriendsPanel'
import GroupDetailView from './GroupDetailView'

interface GroupsViewProps {
  currentUserEmail: string
}

type Tab = 'groups' | 'friends'

export default function GroupsView({ currentUserEmail }: GroupsViewProps) {
  const [tab, setTab] = useState<Tab>('groups')
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const list = await listMyGroups(currentUserEmail)
      setGroups(list)
      setError(null)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const created = await createGroup(currentUserEmail, newName.trim(), newDescription.trim())
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
      await load()
      setSelectedGroupId(created.id)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  if (selectedGroupId !== null) {
    return (
      <GroupDetailView
        groupId={selectedGroupId}
        currentUserEmail={currentUserEmail}
        onBack={() => { setSelectedGroupId(null); load() }}
        onGroupDeleted={() => { setSelectedGroupId(null); load() }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 accent-text mb-1">
          <Users size={20} />
          <span className="text-xs font-semibold uppercase tracking-[0.3em]">Community</span>
        </div>
        <h1 className="text-4xl font-bold">Study Groups &amp; Friends</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Team up, assign tasks, and track everyone's progress together.</p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setTab('groups')}
            className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 ${tab === 'groups' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <ClipboardList size={14} /> My Groups
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 ${tab === 'friends' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <UserPlus size={14} /> Find Friends
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 max-w-lg mx-auto">{error}</p>}

      {tab === 'friends' ? (
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
          <FriendsPanel currentUserEmail={currentUserEmail} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-end">
            <button
              onClick={(e) => { spawnRipple(e); setShowCreate(true) }}
              className="ripple-container btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Plus size={15} /> Create Group
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-10">Loading groups…</p>
          ) : groups.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg card-shadow">
              <Users size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No groups yet. Create one and add your friends to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((g, i) => (
                <button
                  key={g.id}
                  onMouseMove={handleSpotlight}
                  onClick={() => setSelectedGroupId(g.id)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="stagger-item spotlight-card hover-lift text-left bg-white dark:bg-gray-800 rounded-lg p-5 card-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg">{g.name}</h3>
                    <span className="text-xs shrink-0 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                      {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                  {g.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{g.description}</p>}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${g.myCompletionPercent}%`, background: 'var(--accent-500)' }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-500">{g.myCompletionPercent}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create group modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowCreate(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full sm:w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Create a study group</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Group name (e.g. Data Structures Squad)"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What's the project or goal? (optional)"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
              />
              <button type="submit" disabled={creating || !newName.trim()} className="btn-primary w-full py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">
                {creating ? 'Creating…' : 'Create Group'}
              </button>
              <p className="text-xs text-gray-400 text-center">You'll be the leader — you can add friends and assign tasks once it's created.</p>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
