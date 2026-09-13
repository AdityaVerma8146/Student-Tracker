import { useEffect, useState } from 'react'
import { ArrowLeft, Crown, Trophy, Medal, Plus, Trash2, Check, UserPlus, X, Loader2 } from 'lucide-react'
import type { GroupDetail, PublicProfile } from '../types'
import { getGroup, addMember, removeMember, deleteGroup, createGroupTask, toggleGroupTask, deleteGroupTask } from '../services/groupService'
import { extractErrorMessage } from '../utils/apiError'
import { spawnRipple, handleSpotlight } from '../utils/effects'
import FriendsPanel from './FriendsPanel'

interface GroupDetailViewProps {
  groupId: number
  currentUserEmail: string
  onBack: () => void
  onGroupDeleted: () => void
}

function Avatar({ profile, size = 40 }: { profile: PublicProfile; size?: number }) {
  const label = (profile?.name || profile?.email || '').trim()
  const initials = label ? label.charAt(0).toUpperCase() : '?'
  return profile?.avatar ? (
    <img src={profile.avatar} alt={profile.name || profile.email || 'Member'} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-semibold shrink-0">
      {initials}
    </div>
  )
}

const RANK_ICON: Record<number, JSX.Element> = {
  1: <Trophy size={20} className="text-yellow-500" />,
  2: <Medal size={20} className="text-gray-400" />,
  3: <Medal size={20} className="text-amber-700" />,
}

export default function GroupDetailView({ groupId, currentUserEmail, onBack, onGroupDeleted }: GroupDetailViewProps) {
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isLeader = group?.leaderEmail === currentUserEmail

  const load = async () => {
    try {
      const detail = await getGroup(groupId, currentUserEmail)
      setGroup(detail)
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
  }, [groupId])

  const handleAddMember = async (friend: PublicProfile) => {
    if (!group) return
    try {
      await addMember(group.id, currentUserEmail, friend.email)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleRemoveMember = async (email: string) => {
    if (!group) return
    if (!confirm('Remove this member from the group?')) return
    try {
      await removeMember(group.id, currentUserEmail, email)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleLeave = async () => {
    if (!group) return
    if (!confirm('Leave this group?')) return
    try {
      await removeMember(group.id, currentUserEmail, currentUserEmail)
      onBack()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleDeleteGroup = async () => {
    if (!group) return
    if (!confirm('Delete this group permanently? All tasks will be lost.')) return
    try {
      await deleteGroup(group.id, currentUserEmail)
      onGroupDeleted()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group || !taskTitle.trim()) return
    setSubmitting(true)
    try {
      await createGroupTask(group.id, currentUserEmail, taskTitle.trim(), '', taskAssignee || null, taskDue || null)
      setTaskTitle('')
      setTaskAssignee('')
      setTaskDue('')
      setShowTaskForm(false)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleTask = async (taskId: number) => {
    if (!group) return
    try {
      await toggleGroupTask(group.id, taskId, currentUserEmail)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    if (!group) return
    try {
      await deleteGroupTask(group.id, taskId, currentUserEmail)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
  }

  if (error && !group) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={onBack} className="text-sm font-semibold accent-text">← Back to groups</button>
      </div>
    )
  }

  if (!group) return null

  // Defensive defaults: if the backend ever omits these arrays (a null
  // field in an older/edge-case record, a response that isn't quite the
  // shape we expect, etc.) this view should degrade gracefully — an empty
  // section, not a full crash that white-screens the whole app.
  const members = (group.members ?? []).filter((m) => m && m.profile)
  const tasks = group.tasks ?? []
  const podium = members.filter((m) => m.rank <= 3)
  const rest = members.filter((m) => m.rank > 3)
  const memberEmails = members.map((m) => m.profile.email)

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
        <ArrowLeft size={16} /> Back to groups
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          {group.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>}
        </div>
        <div className="flex gap-2">
          {isLeader ? (
            <>
              <button
                onClick={(e) => { spawnRipple(e); setShowAddMember(true) }}
                className="ripple-container btn-primary inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold"
              >
                <UserPlus size={15} /> Add Member
              </button>
              <button onClick={handleDeleteGroup} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <button onClick={handleLeave} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              Leave Group
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{error}</p>}

      {/* Results podium */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
        <h2 className="text-lg font-bold mb-5 flex items-center gap-2"><Trophy size={18} className="text-yellow-500" /> Results</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {podium.map((m) => (
            <div
              key={m.profile.email}
              onMouseMove={handleSpotlight}
              className={`stagger-item spotlight-card hover-lift rounded-lg p-4 text-center border-2 ${
                m.rank === 1 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10' :
                m.rank === 2 ? 'border-gray-300 bg-gray-50 dark:bg-gray-700/30' :
                'border-amber-700/40 bg-amber-50 dark:bg-amber-900/10'
              }`}
              style={{ animationDelay: `${(m.rank - 1) * 80}ms` }}
            >
              <div className="flex justify-center mb-2">{RANK_ICON[m.rank]}</div>
              <div className="flex justify-center mb-2"><Avatar profile={m.profile} size={48} /></div>
              <p className="font-semibold text-sm truncate">{m.profile.name}</p>
              <p className="text-xs text-gray-400">{m.completedTasks}/{m.totalTasks} tasks</p>
              <p className="text-2xl font-display mt-1">{m.completionPercent}%</p>
            </div>
          ))}
        </div>

        {rest.length > 0 && (
          <ul className="space-y-1">
            {rest.map((m) => (
              <li key={m.profile.email} className="flex items-center gap-3 p-2 rounded-lg">
                <span className="w-5 text-center text-sm text-gray-400 font-semibold">{m.rank}</span>
                <Avatar profile={m.profile} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.profile.name}</p>
                </div>
                <span className="text-xs text-gray-400">{m.completedTasks}/{m.totalTasks}</span>
                <span className="text-sm font-semibold w-12 text-right">{m.completionPercent}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
        <h2 className="text-lg font-bold mb-4">Members ({members.length})</h2>
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.profile.email} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <Avatar profile={m.profile} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate flex items-center gap-1.5">
                  {m.profile.name}
                  {m.role === 'LEADER' && <Crown size={13} className="text-yellow-500" />}
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1 max-w-[160px]">
                  <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${m.completionPercent}%`, background: 'var(--accent-500)' }} />
                </div>
              </div>
              {isLeader && m.role !== 'LEADER' && (
                <button onClick={() => handleRemoveMember(m.profile.email)} className="text-gray-300 hover:text-red-500 p-1">
                  <X size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Tasks</h2>
          <button onClick={() => setShowTaskForm((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-semibold accent-text">
            <Plus size={15} /> {isLeader ? 'Assign / Add Task' : 'Add My Task'}
          </button>
        </div>

        {showTaskForm && (
          <form onSubmit={handleCreateTask} className="mb-5 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 space-y-3">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                disabled={!isLeader}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm disabled:opacity-50"
              >
                <option value="">{isLeader ? 'Unassigned / open' : 'Assigned to me'}</option>
                {isLeader && members.map((m) => (
                  <option key={m.profile.email} value={m.profile.email}>{m.profile.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <button type="submit" disabled={submitting || !taskTitle.trim()} className="btn-primary w-full py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
              {submitting ? 'Adding…' : 'Add Task'}
            </button>
          </form>
        )}

        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No tasks yet.</p>
        ) : (
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 group">
                <button
                  onClick={() => handleToggleTask(t.id)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${t.done ? 'bg-blue-600 border-blue-600 text-white check-pop' : 'border-gray-300 dark:border-gray-600'}`}
                >
                  {t.done && <Check size={13} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${t.done ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                  <p className="text-xs text-gray-400">
                    {t.assignedTo ? `Assigned to ${t.assignedTo.name}` : `Open · created by ${t.createdBy.name}`}
                    {t.dueDate && ` · due ${t.dueDate}`}
                  </p>
                </div>
                <button onClick={() => handleDeleteTask(t.id)} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 p-1">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowAddMember(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full sm:w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Add a friend to {group.name}</h3>
              <button onClick={() => setShowAddMember(false)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                <X size={18} />
              </button>
            </div>
            <FriendsPanel currentUserEmail={currentUserEmail} onPickFriend={handleAddMember} pickedEmails={memberEmails} />
          </div>
        </>
      )}
    </div>
  )
}
