import { useEffect, useState } from 'react'
import { Search, UserPlus, Check, X, Loader2, Users } from 'lucide-react'
import type { PublicProfile, FriendRequestView } from '../types'
import { searchUsers, sendFriendRequest, respondToFriendRequest, listFriends, listFriendRequests } from '../services/friendService'
import { extractErrorMessage } from '../utils/apiError'
import { spawnRipple } from '../utils/effects'

interface FriendsPanelProps {
  currentUserEmail: string
  /** When provided, shows an "Add to group" action instead of "Add friend" for people already added. */
  onPickFriend?: (friend: PublicProfile) => void
  pickedEmails?: string[]
}

function Avatar({ profile, size = 36 }: { profile: PublicProfile; size?: number }) {
  const initials = (profile.name || profile.email).trim().charAt(0).toUpperCase()
  return profile.avatar ? (
    <img src={profile.avatar} alt={profile.name} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-semibold text-sm shrink-0"
    >
      {initials}
    </div>
  )
}

export default function FriendsPanel({ currentUserEmail, onPickFriend, pickedEmails = [] }: FriendsPanelProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<Set<string>>(new Set())

  const [friends, setFriends] = useState<PublicProfile[]>([])
  const [requests, setRequests] = useState<FriendRequestView[]>([])
  const [loadingLists, setLoadingLists] = useState(true)

  const refreshLists = async () => {
    setLoadingLists(true)
    try {
      const [f, r] = await Promise.all([listFriends(currentUserEmail), listFriendRequests(currentUserEmail)])
      setFriends(f)
      setRequests(r)
    } catch {
      // Non-fatal — the panel still works for searching/sending requests.
    } finally {
      setLoadingLists(false)
    }
  }

  useEffect(() => {
    refreshLists()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserEmail])

  const runSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim().length < 2) {
      setSearchError('Type at least 2 characters to search.')
      return
    }
    setSearching(true)
    setSearchError(null)
    try {
      const found = await searchUsers(query.trim(), currentUserEmail)
      setResults(found)
    } catch (err) {
      setSearchError(extractErrorMessage(err))
    } finally {
      setSearching(false)
    }
  }

  const friendEmails = new Set(friends.map((f) => f.email))

  const handleAddFriend = async (profile: PublicProfile) => {
    try {
      await sendFriendRequest(currentUserEmail, profile.email)
      setSentTo((prev) => new Set(prev).add(profile.email))
    } catch (err) {
      setSearchError(extractErrorMessage(err))
    }
  }

  const handleRespond = async (requestId: number, accept: boolean) => {
    try {
      await respondToFriendRequest(requestId, currentUserEmail, accept)
      await refreshLists()
    } catch {
      // Silently ignore — the request list will just still show the item, which is an acceptable fallback.
    }
  }

  return (
    <div className="space-y-8">
      {/* Search */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><Search size={15} /> Find people</h3>
        <form onSubmit={runSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
          />
          <button
            type="submit"
            onClick={spawnRipple}
            disabled={searching}
            className="ripple-container btn-primary px-4 rounded-lg text-sm font-semibold disabled:opacity-50"
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
          </button>
        </form>
        {searchError && <p className="text-sm text-red-500 mt-2">{searchError}</p>}

        {results.length > 0 && (
          <ul className="mt-3 space-y-1">
            {results.map((p) => {
              const isFriend = friendEmails.has(p.email)
              const isPicked = pickedEmails.includes(p.email)
              const alreadySent = sentTo.has(p.email)
              return (
                <li key={p.email} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Avatar profile={p} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  </div>
                  {onPickFriend ? (
                    <button
                      onClick={() => onPickFriend(p)}
                      disabled={!isFriend || isPicked}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600"
                      title={!isFriend ? 'Only accepted friends can be added to a group' : undefined}
                    >
                      {isPicked ? 'Added' : 'Add to group'}
                    </button>
                  ) : isFriend ? (
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Friends</span>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(p)}
                      disabled={alreadySent}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <UserPlus size={13} /> {alreadySent ? 'Requested' : 'Add friend'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {!onPickFriend && (
        <>
          {/* Pending requests */}
          {requests.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3">Friend requests</h3>
              <ul className="space-y-1">
                {requests.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <Avatar profile={r.from} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.from.name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.from.email}</p>
                    </div>
                    <button onClick={() => handleRespond(r.id, true)} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50">
                      <Check size={15} />
                    </button>
                    <button onClick={() => handleRespond(r.id, false)} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50">
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Friends list */}
          <div>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5"><Users size={15} /> Your friends ({friends.length})</h3>
            {loadingLists ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : friends.length === 0 ? (
              <p className="text-sm text-gray-400">No friends yet — search above to find and add people.</p>
            ) : (
              <ul className="space-y-1">
                {friends.map((f) => (
                  <li key={f.email} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                    <Avatar profile={f} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-gray-400 truncate">{f.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
