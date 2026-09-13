import { useState } from 'react'
import { X, Send, Check, Mail, Bug } from 'lucide-react'
import { submitFeedback, type FeedbackType } from '../services/feedbackService'
import { extractErrorMessage } from '../utils/apiError'
import { spawnRipple } from '../utils/effects'

interface ContactModalProps {
  type: FeedbackType
  currentUserEmail: string
  onClose: () => void
}

export default function ContactModal({ type, currentUserEmail, onClose }: ContactModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const isBug = type === 'BUG_REPORT'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await submitFeedback(currentUserEmail, type, subject.trim(), message.trim())
      setDone(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full sm:w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2">
            {isBug ? <Bug size={18} className="text-red-500" /> : <Mail size={18} className="accent-text" />}
            {isBug ? 'Report a Problem' : 'Contact Us'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <Check size={32} className="mx-auto text-green-500 mb-2" />
            <p className="font-semibold">Thanks — we've got it.</p>
            <p className="text-sm text-gray-400 mt-1">
              {isBug ? "We'll look into it." : "We'll get back to you at " + currentUserEmail + "."}
            </p>
            <button onClick={onClose} className="mt-4 text-sm font-semibold accent-text">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isBug
                ? 'Describe what went wrong — what you were doing, and what you expected to happen instead.'
                : "Questions, feedback, or anything else — we'd like to hear it."}
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={isBug ? 'Short summary of the problem' : 'Subject (optional)'}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder={isBug ? "What happened, and what did you expect instead?" : 'Your message…'}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              onClick={spawnRipple}
              disabled={submitting || !message.trim()}
              className="ripple-container btn-primary w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              <Send size={15} /> {submitting ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </>
  )
}
