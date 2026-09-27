import { useEffect, useState } from 'react'
import {
  Users,
  Plus,
  X,
  ClipboardList,
  UserPlus,
  Compass,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  ShieldCheck,
  Crown,
} from 'lucide-react'
import type { GroupSummary, GroupSearchResult, GroupRequestView } from '../types'
import {
  listMyGroups,
  createGroup,
  searchGroups,
  sendJoinRequest,
  cancelJoinRequest,
  listMyRequests,
} from '../services/groupService'
import { extractErrorMessage } from '../utils/apiError'
import { spawnRipple, handleSpotlight } from '../utils/effects'
import FriendsPanel from './FriendsPanel'
import GroupDetailView from './GroupDetailView'

interface GroupsViewProps {
  currentUserEmail: string
}

type Tab = 'my-groups' | 'discover' | 'my-requests' | 'friends'

export default function GroupsView({ currentUserEmail }: GroupsViewProps) {
  const [tab, setTab] = useState<Tab>('my-groups')
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

  // Create Group Modal
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Discover Groups state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GroupSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [joinModalGroup, setJoinModalGroup] = useState<GroupSearchResult | null>(null)
  const [joinMessage, setJoinMessage] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)

  // My Requests state
  const [myRequests, setMyRequests] = useState<GroupRequestView[]>([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  const loadMyGroups = async () => {
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

  const loadDiscover = async (query = searchQuery) => {
    setSearching(true)
    try {
      const res = await searchGroups(query, currentUserEmail)
      setSearchResults(res)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  const loadMyRequests = async () => {
    setLoadingRequests(true)
    try {
      const reqs = await listMyRequests(currentUserEmail)
      setMyRequests(reqs)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    loadMyGroups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail])

  useEffect(() => {
    if (tab === 'discover') {
      loadDiscover()
    } else if (tab === 'my-requests') {
      loadMyRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const created = await createGroup(currentUserEmail, newName.trim(), newDescription.trim())
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
      await loadMyGroups()
      setSelectedGroupId(created.id)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleSendJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinModalGroup) return
    setSendingRequest(true)
    try {
      await sendJoinRequest(joinModalGroup.id, currentUserEmail, joinMessage.trim())
      setJoinModalGroup(null)
      setJoinMessage('')
      await loadDiscover()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSendingRequest(false)
    }
  }

  const handleCancelRequest = async (requestId: number) => {
    try {
      await cancelJoinRequest(requestId, currentUserEmail)
      if (tab === 'my-requests') await loadMyRequests()
      if (tab === 'discover') await loadDiscover()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  if (selectedGroupId !== null) {
    return (
      <GroupDetailView
        groupId={selectedGroupId}
        currentUserEmail={currentUserEmail}
        onBack={() => {
          setSelectedGroupId(null)
          loadMyGroups()
        }}
        onGroupDeleted={() => {
          setSelectedGroupId(null)
          loadMyGroups()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
          <Users size={20} />
          <span className="text-xs font-bold uppercase tracking-[0.25em]">Study Community</span>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Study Groups &amp; Collaboration
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xl mx-auto text-sm">
          Form accountability circles, track peer progress, chat in real-time, and crush milestones together.
        </p>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-1.5 flex-wrap gap-1 shadow-sm">
          <button
            onClick={() => setTab('my-groups')}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
              tab === 'my-groups'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList size={14} /> My Groups ({groups.length})
          </button>
          <button
            onClick={() => setTab('discover')}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
              tab === 'discover'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Compass size={14} /> Discover Groups
          </button>
          <button
            onClick={() => setTab('my-requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
              tab === 'my-requests'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock size={14} /> My Requests
          </button>
          <button
            onClick={() => setTab('friends')}
            className={`px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
              tab === 'friends'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserPlus size={14} /> Find Friends
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 max-w-lg mx-auto border border-rose-200 dark:border-rose-800 text-center">
          {error}
        </p>
      )}

      {/* TAB 1: MY GROUPS */}
      {tab === 'my-groups' && (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Memberships</h2>
            <button
              onClick={(e) => {
                spawnRipple(e)
                setShowCreate(true)
              }}
              className="ripple-container btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
            >
              <Plus size={15} /> Create Study Group
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="animate-spin text-blue-500 mx-auto" size={28} />
              <p className="text-xs text-gray-400 mt-2">Loading your study groups...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No Groups Joined Yet</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Create your own study squad or browse the &ldquo;Discover Groups&rdquo; tab to join other students!
              </p>
              <div className="flex justify-center gap-3 mt-5">
                <button
                  onClick={() => setShowCreate(true)}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setTab('discover')}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Browse Groups
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {groups.map((g, i) => (
                <div
                  key={g.id}
                  onMouseMove={handleSpotlight}
                  onClick={() => setSelectedGroupId(g.id)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="stagger-item spotlight-card cursor-pointer bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                      {g.name}
                    </h3>
                    <span className="text-[11px] shrink-0 font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                      {g.memberCount} {g.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[32px] mb-4">
                    {g.description || 'Dedicated study space for collaborative coursework and exam prep.'}
                  </p>

                  {/* Completion Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                      <span>My Progress</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">
                        {g.myCompletionPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${g.myCompletionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DISCOVER GROUPS */}
      {tab === 'discover' && (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <Search size={18} className="text-gray-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                loadDiscover(e.target.value)
              }}
              placeholder="Search public study groups by subject, course name, topic..."
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none"
            />
            {searching && <Loader2 size={16} className="animate-spin text-gray-400 shrink-0" />}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {searchResults.length === 0 && !searching ? (
              <div className="sm:col-span-2 text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
                <Compass size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-gray-500">No study groups matched your search query.</p>
              </div>
            ) : (
              searchResults.map((g) => (
                <div
                  key={g.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-gray-900 dark:text-white">{g.name}</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {g.memberCount} members
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {g.description || 'Public study group.'}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                      <Crown size={11} className="text-amber-500" /> Leader: {g.leaderName || g.leaderEmail}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                    {g.userStatus === 'MEMBER' ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Member
                      </span>
                    ) : g.userStatus === 'PENDING_REQUEST' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock size={13} /> Pending Review
                        </span>
                        {g.pendingRequestId && (
                          <button
                            onClick={() => handleCancelRequest(g.pendingRequestId!)}
                            className="text-[11px] text-gray-400 hover:text-rose-500 underline"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setJoinModalGroup(g)
                          setJoinMessage('')
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 shadow-sm"
                      >
                        <UserPlus size={13} /> Request to Join
                      </button>
                    )}

                    {g.userStatus === 'MEMBER' && (
                      <button
                        onClick={() => setSelectedGroupId(g.id)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open Group &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MY REQUESTS */}
      {tab === 'my-requests' && (
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sent Join Requests</h2>
          {loadingRequests ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-blue-500 mx-auto" size={24} />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
              <Clock size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs text-gray-500">You have no active or past group join requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      {req.groupName || `Group #${req.groupId}`}
                    </h4>
                    {req.message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">&ldquo;{req.message}&rdquo;</p>
                    )}
                    <span className="text-[10px] text-gray-400 block mt-1">
                      Submitted on {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        req.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : req.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {req.status}
                    </span>

                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelRequest(req.id)}
                        className="text-xs text-rose-500 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: FIND FRIENDS */}
      {tab === 'friends' && (
        <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <FriendsPanel currentUserEmail={currentUserEmail} />
        </div>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New Study Group</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Distributed Systems Final Prep"
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Description & Goals
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Study meeting times, target chapters, syllabus scope..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Join Request Modal */}
      {joinModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Join &ldquo;{joinModalGroup.name}&rdquo;
              </h3>
              <button
                onClick={() => setJoinModalGroup(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendJoinRequest} className="space-y-3">
              <p className="text-xs text-gray-500">
                Send an introductory message to the group leader ({joinModalGroup.leaderName || joinModalGroup.leaderEmail}):
              </p>
              <textarea
                value={joinMessage}
                onChange={(e) => setJoinMessage(e.target.value)}
                placeholder="e.g. Hi! I'm taking this class this semester and would love to collaborate on the weekly problem sets."
                rows={3}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalGroup(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingRequest}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {sendingRequest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send Join Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
