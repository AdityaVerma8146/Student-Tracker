import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Crown,
  Trophy,
  Medal,
  Plus,
  Trash2,
  Check,
  UserPlus,
  X,
  Loader2,
  Users,
  ShieldCheck,
  LogOut,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import type { GroupDetail, PublicProfile, GroupRequestView } from '../types'
import {
  getGroup,
  addMember,
  removeMember,
  deleteGroup,
  leaveGroup,
  createGroupTask,
  toggleGroupTask,
  deleteGroupTask,
  postGroupMessage,
  listGroupRequests,
  respondToJoinRequest,
  updateMemberRole,
} from '../services/groupService'
import { extractErrorMessage } from '../utils/apiError'
import { spawnRipple, handleSpotlight } from '../utils/effects'
import FriendsPanel from './FriendsPanel'
import GroupChat from './GroupChat'

interface GroupDetailViewProps {
  groupId: number
  currentUserEmail: string
  onBack: () => void
  onGroupDeleted: () => void
}

function Avatar({ profile, size = 42 }: { profile: PublicProfile; size?: number }) {
  const label = (profile?.name || profile?.email || '').trim()
  const initials = label ? label.charAt(0).toUpperCase() : '?'
  const isOnline = Boolean(profile?.isOnline)

  return (
    <div className="relative inline-block shrink-0">
      {profile?.avatar ? (
        <img
          src={profile.avatar}
          alt={profile.name || profile.email || 'Member'}
          style={{ width: size, height: size }}
          className="rounded-full object-cover shrink-0 block border border-gray-200 dark:border-gray-700"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800"
        >
          {initials}
        </div>
      )}
      <span
        title={isOnline ? 'Online now' : 'Offline'}
        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
          isOnline ? 'bg-emerald-500 ring-2 ring-emerald-400/40' : 'bg-gray-400'
        }`}
      />
    </div>
  )
}

const RANK_ICON: Record<number, JSX.Element> = {
  1: <Trophy size={18} className="text-yellow-500" />,
  2: <Medal size={18} className="text-slate-400" />,
  3: <Medal size={18} className="text-amber-700" />,
}

export default function GroupDetailView({
  groupId,
  currentUserEmail,
  onBack,
  onGroupDeleted,
}: GroupDetailViewProps) {
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Join Requests state (for leader)
  const [joinRequests, setJoinRequests] = useState<GroupRequestView[]>([])
  const [showRequestsDrawer, setShowRequestsDrawer] = useState(false)
  const [respondingId, setRespondingId] = useState<number | null>(null)

  const isLeader = group?.leaderEmail === currentUserEmail

  const load = async () => {
    try {
      const detail = await getGroup(groupId, currentUserEmail)
      setGroup(detail)
      setError(null)

      // If leader, also fetch pending join requests
      if (detail.leaderEmail === currentUserEmail) {
        try {
          const reqs = await listGroupRequests(groupId, currentUserEmail)
          setJoinRequests(reqs.filter((r) => r.status === 'PENDING'))
        } catch {
          // ignore
        }
      }
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
    if (!confirm(`Remove ${email} from the study group?`)) return
    try {
      await removeMember(group.id, currentUserEmail, email)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleRoleChange = async (memberEmail: string, newRole: string) => {
    if (!group) return
    try {
      await updateMemberRole(group.id, currentUserEmail, memberEmail, newRole)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleRespondRequest = async (requestId: number, accept: boolean) => {
    setRespondingId(requestId)
    try {
      await respondToJoinRequest(requestId, currentUserEmail, accept)
      await load()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setRespondingId(null)
    }
  }

  const handleLeave = async () => {
    if (!group) return
    if (!confirm('Are you sure you want to leave this study group?')) return
    try {
      await leaveGroup(group.id, currentUserEmail)
      onBack()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleDeleteGroup = async () => {
    if (!group) return
    if (!confirm('Delete this group permanently? All group tasks and records will be removed.')) return
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
      await createGroupTask(
        group.id,
        currentUserEmail,
        taskTitle.trim(),
        '',
        taskAssignee || null,
        taskDue || null
      )
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

  const handleSendMessage = async (content: string) => {
    if (!group) return
    await postGroupMessage(group.id, currentUserEmail, content)
    await load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    )
  }

  if (error && !group) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-rose-500 mb-4 font-semibold">{error}</p>
        <button onClick={onBack} className="text-sm font-semibold text-blue-600 hover:underline">
          &larr; Back to groups
        </button>
      </div>
    )
  }

  if (!group) return null

  const members = (group.members ?? []).filter((m) => m && m.profile)
  const tasks = group.tasks ?? []
  const podium = members.filter((m) => m.rank <= 3)
  const rest = members.filter((m) => m.rank > 3)
  const memberEmails = members.map((m) => m.profile.email)

  return (
    <div className="space-y-8">
      {/* Top Bar Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition"
      >
        <ArrowLeft size={16} /> Back to groups
      </button>

      {/* Group Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{group.name}</h1>
            {isLeader && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                <Crown size={12} /> Leader
              </span>
            )}
          </div>
          {group.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{group.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3 font-medium">
            <span>{members.length} members</span>
            <span>&bull;</span>
            <span>{tasks.length} total tasks</span>
            <span>&bull;</span>
            <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          {isLeader && (
            <button
              onClick={() => setShowRequestsDrawer((v) => !v)}
              className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition"
            >
              <Bell size={14} /> Requests
              {joinRequests.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center -mr-1">
                  {joinRequests.length}
                </span>
              )}
            </button>
          )}

          {isLeader ? (
            <>
              <button
                onClick={(e) => {
                  spawnRipple(e)
                  setShowAddMember(true)
                }}
                className="ripple-container btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
              >
                <UserPlus size={14} /> Add Member
              </button>
              <button
                onClick={handleDeleteGroup}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                title="Delete study group"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={handleLeave}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
            >
              <LogOut size={14} /> Leave Group
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 border border-rose-200 dark:border-rose-800">
          {error}
        </p>
      )}

      {/* Leader Join Requests Drawer */}
      {showRequestsDrawer && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 p-5 rounded-3xl animate-in fade-in space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <Bell size={16} /> Pending Join Requests ({joinRequests.length})
            </h3>
            <button
              onClick={() => setShowRequestsDrawer(false)}
              className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              <X size={15} />
            </button>
          </div>

          {joinRequests.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-300 italic py-2">
              No pending requests to join this group.
            </p>
          ) : (
            <div className="space-y-2">
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      profile={{
                        name: req.userName,
                        email: req.userEmail,
                        avatar: req.userAvatar,
                      }}
                      size={36}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        {req.userName || req.userEmail}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {req.message ? `"${req.message}"` : 'No message provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={respondingId === req.id}
                      onClick={() => handleRespondRequest(req.id, true)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1"
                    >
                      <CheckCircle2 size={13} /> Accept
                    </button>
                    <button
                      disabled={respondingId === req.id}
                      onClick={() => handleRespondRequest(req.id, false)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition flex items-center gap-1"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left (Leaderboard & Tasks) vs Right (Live Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-8">
          {/* Member Leaderboard */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" /> Member Progress &amp; Leaderboard
            </h2>

            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.profile.email}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-750 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-6 text-xs font-bold text-gray-400">
                      {RANK_ICON[m.rank] || `#${m.rank}`}
                    </div>
                    <Avatar profile={m.profile} size={38} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {m.profile.name || m.profile.email}
                        </span>
                        {m.role === 'LEADER' && (
                          <Crown size={12} className="text-amber-500 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 block truncate">
                        {m.profile.isOnline ? (
                          <span className="text-emerald-500 font-medium">Online</span>
                        ) : (
                          'Offline'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {m.completionPercent}%
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {m.completedTasks} / {m.totalTasks} tasks
                      </span>
                    </div>

                    {/* Role / Remove controls for Leader */}
                    {isLeader && m.profile.email !== currentUserEmail && (
                      <button
                        onClick={() => handleRemoveMember(m.profile.email)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group Tasks */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={20} className="text-blue-600" /> Collaborative Group Tasks
              </h2>
              <button
                onClick={() => setShowTaskForm((v) => !v)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus size={14} /> Add Group Task
              </button>
            </div>

            {/* Task Form */}
            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 space-y-3 animate-in fade-in">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Solve Unit 2 Exercise Set)"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Unassigned (Anyone)</option>
                    {members.map((m) => (
                      <option key={m.profile.email} value={m.profile.email}>
                        {m.profile.name || m.profile.email}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            )}

            {/* Task List */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  No collaborative tasks yet. Add one above!
                </p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      task.done
                        ? 'bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-60'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
                          task.done
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                        }`}
                      >
                        {task.done && <Check size={13} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0">
                        <span
                          className={`text-xs font-semibold text-gray-900 dark:text-white truncate block ${
                            task.done ? 'line-through text-gray-400' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                          {task.assignedTo && <span>Assigned to: {task.assignedTo.name || task.assignedTo.email}</span>}
                          {task.dueDate && <span>&bull; Due: {task.dueDate}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition"
                      title="Delete task"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat */}
        <div className="lg:col-span-5 sticky top-24">
          <GroupChat
            groupId={group.id}
            messages={group.messages || []}
            currentUserEmail={currentUserEmail}
            onSend={handleSendMessage}
          />
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Add Friends to Group</h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500">Pick from your connected friends list:</p>
            <FriendsPanel
              currentUserEmail={currentUserEmail}
              pickedEmails={memberEmails}
              onPickFriend={(friend) => {
                handleAddMember(friend)
                setShowAddMember(false)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
