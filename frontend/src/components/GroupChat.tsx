import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Loader2 } from 'lucide-react'
import type { GroupMessageView } from '../types'
import { getGroupMessages } from '../services/groupService'
import { spawnRipple } from '../utils/effects'

interface GroupChatProps {
  groupId: number
  messages: GroupMessageView[]
  currentUserEmail: string
  onSend: (content: string) => Promise<void>
}

export default function GroupChat({
  groupId,
  messages: initialMessages,
  currentUserEmail,
  onSend,
}: GroupChatProps) {
  const [messages, setMessages] = useState<GroupMessageView[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Sync with prop updates
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Real-time polling every 3.5s
  useEffect(() => {
    let mounted = true

    const poll = async () => {
      try {
        const latest = await getGroupMessages(groupId, currentUserEmail)
        if (mounted && latest) {
          setMessages(latest)
        }
      } catch {
        // Silently ignore polling network errors
      }
    }

    const interval = setInterval(poll, 3500)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [groupId, currentUserEmail])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    try {
      await onSend(draft.trim())
      setDraft('')
      // Immediate refresh
      const latest = await getGroupMessages(groupId, currentUserEmail)
      setMessages(latest)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-[520px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Live Study Chat</h2>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Real-time channel
            </p>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50 dark:bg-gray-900/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <MessageSquare size={36} className="mb-2 opacity-40" />
            <p className="text-sm font-medium">No messages yet.</p>
            <p className="text-xs text-gray-400">Collaborate, ask questions, or share study tips!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderEmail === currentUserEmail
            const showName = !isMe && (i === 0 || messages[i - 1].senderEmail !== msg.senderEmail)
            const initials = (msg.senderName || msg.senderEmail || 'U').charAt(0).toUpperCase()

            return (
              <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && showName && (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0 self-end mb-1">
                    {initials}
                  </div>
                )}
                {!isMe && !showName && <div className="w-7 shrink-0" />}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[78%]`}>
                  {showName && (
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">
                      {msg.senderName || msg.senderEmail}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <span
                      className={`text-[10px] mt-1 block font-mono ${
                        isMe ? 'text-blue-200 text-right' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Share an update or question..."
          disabled={sending}
          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-gray-900 dark:text-white"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          onClick={spawnRipple}
          className="ripple-container p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 disabled:hover:bg-blue-600 shrink-0 flex items-center justify-center shadow-sm"
          aria-label="Send message"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  )
}
