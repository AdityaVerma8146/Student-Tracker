import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, Wand2, CalendarPlus, Loader2, Check, Copy, MessageCircle, Send } from 'lucide-react'
import { correctText, generateSchedule, chatWithAI } from '../services/aiService'
import type { GeneratedScheduleTask, ChatMessage } from '../services/aiService'
import { getCalendarCategory } from '../utils/calendarUtils'
import { todayISO } from '../utils/calendarUtils'
import { spawnRipple } from '../utils/effects'
import type { Subject, Roadmap } from '../types'

interface AIAssistantProps {
  subjects: Subject[]
  roadmap: Roadmap
  setRoadmap: React.Dispatch<React.SetStateAction<Roadmap>>
  onAddCalendarTasks: (tasks: { title: string; date: string; category: string }[]) => void
}

type Tab = 'chat' | 'fix' | 'schedule'

function buildContextSummary(subjects: Subject[], roadmap: Roadmap): string {
  const subjectNames = subjects.map((s) => s.name).filter(Boolean).slice(0, 8)
  const weekLabels = roadmap.weeks.map((w) => w.label).filter(Boolean)
  const parts: string[] = []
  if (subjectNames.length) parts.push(`Current subjects: ${subjectNames.join(', ')}.`)
  if (weekLabels.length) parts.push(`Current roadmap phases: ${weekLabels.join(', ')}.`)
  return parts.join(' ')
}

export default function AIAssistant({ subjects, roadmap, onAddCalendarTasks }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('chat')

  // ---- Chat state ----
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // ---- Fix Mistakes state ----
  const [fixInput, setFixInput] = useState('')
  const [fixResult, setFixResult] = useState<{ corrected: string; changed: boolean; explanation?: string } | null>(null)
  const [fixLoading, setFixLoading] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // ---- Build Schedule state ----
  const [schedulePrompt, setSchedulePrompt] = useState('')
  const [startDate, setStartDate] = useState(todayISO())
  const [scheduleResult, setScheduleResult] = useState<{ summary: string; tasks: GeneratedScheduleTask[] } | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const runChat = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return
    const nextMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }]
    setChatMessages(nextMessages)
    setChatInput('')
    setChatLoading(true)
    setChatError(null)
    try {
      const context = buildContextSummary(subjects, roadmap)
      const reply = await chatWithAI(nextMessages, context)
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setChatError((err as Error).message)
    } finally {
      setChatLoading(false)
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      runChat()
    }
  }

  const runFix = async () => {
    if (!fixInput.trim()) return
    setFixLoading(true)
    setFixError(null)
    setFixResult(null)
    try {
      const result = await correctText(fixInput.trim())
      setFixResult(result)
    } catch (err) {
      setFixError((err as Error).message)
    } finally {
      setFixLoading(false)
    }
  }

  const runSchedule = async () => {
    if (!schedulePrompt.trim()) return
    setScheduleLoading(true)
    setScheduleError(null)
    setScheduleResult(null)
    setAdded(false)
    try {
      const context = buildContextSummary(subjects, roadmap)
      const result = await generateSchedule(schedulePrompt.trim(), startDate, context)
      setScheduleResult(result)
    } catch (err) {
      setScheduleError((err as Error).message)
    } finally {
      setScheduleLoading(false)
    }
  }

  const applySchedule = () => {
    if (!scheduleResult) return
    onAddCalendarTasks(scheduleResult.tasks)
    setAdded(true)
  }

  const copyFixed = async () => {
    if (!fixResult) return
    try {
      await navigator.clipboard.writeText(fixResult.corrected)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable — silently ignore, the text is still on screen to select manually.
    }
  }

  return (
    <>
      {/* Floating trigger — highest z-index in the app so no modal or panel
          can ever end up covering it. */}
      <button
        onClick={(e) => {
          spawnRipple(e)
          setOpen(true)
        }}
        className={`ripple-container fixed bottom-6 right-6 z-[90] h-14 w-14 rounded-full btn-primary shadow-lg flex items-center justify-center transition-transform ${open ? 'scale-0' : 'scale-100'}`}
        aria-label="Open AI Assistant"
        title="AI Assistant"
      >
        <span className="ambient-glow" />
        <Sparkles size={24} />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[1px]" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 right-0 top-0 z-[100] w-full sm:w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 font-display text-xl">
                <Sparkles size={18} className="accent-text" />
                AI Assistant
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setTab('chat')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 ${tab === 'chat' ? 'accent-text border-b-2' : 'text-gray-400'}`}
                style={tab === 'chat' ? { borderColor: 'var(--accent-500)' } : undefined}
              >
                <MessageCircle size={15} /> Chat
              </button>
              <button
                onClick={() => setTab('schedule')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 ${tab === 'schedule' ? 'accent-text border-b-2' : 'text-gray-400'}`}
                style={tab === 'schedule' ? { borderColor: 'var(--accent-500)' } : undefined}
              >
                <CalendarPlus size={15} /> Schedule
              </button>
              <button
                onClick={() => setTab('fix')}
                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 ${tab === 'fix' ? 'accent-text border-b-2' : 'text-gray-400'}`}
                style={tab === 'fix' ? { borderColor: 'var(--accent-500)' } : undefined}
              >
                <Wand2 size={15} /> Fix
              </button>
            </div>

            {tab === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 space-y-3">
                  {chatMessages.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ask anything — explain a topic, help with homework, brainstorm, or just chat. For a
                      day-by-day plan added straight to your calendar, use the Schedule tab instead.
                    </p>
                  )}
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <p
                        className={`max-w-[85%] text-sm rounded-2xl px-3.5 py-2 whitespace-pre-line ${
                          m.role === 'user'
                            ? 'btn-primary rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {m.content}
                      </p>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <p className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-3.5 py-2 inline-flex items-center gap-1.5 text-sm text-gray-400">
                        <Loader2 size={14} className="animate-spin" /> Thinking…
                      </p>
                    </div>
                  )}
                  {chatError && (
                    <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{chatError}</p>
                  )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-end gap-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleChatKeyDown}
                    rows={1}
                    placeholder="Message the AI assistant…"
                    className="flex-1 resize-none px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] max-h-32"
                  />
                  <button
                    onClick={(e) => { spawnRipple(e); runChat() }}
                    disabled={chatLoading || !chatInput.trim()}
                    className="ripple-container btn-primary shrink-0 h-9 w-9 rounded-lg inline-flex items-center justify-center disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-5">
                {tab === 'schedule' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Describe what you need to prepare for and how much time you have. The assistant will turn it
                      into a day-by-day schedule you can drop straight onto your Calendar.
                    </p>
                    <textarea
                      value={schedulePrompt}
                      onChange={(e) => setSchedulePrompt(e.target.value)}
                      rows={4}
                      placeholder="e.g. I have 3 days before my Data Structures exam, about 2 hours a day. I need to cover trees, graphs, and dynamic programming."
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                    />
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                        Start date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                      />
                    </div>

                    <button
                      onClick={(e) => { spawnRipple(e); runSchedule() }}
                      disabled={scheduleLoading || !schedulePrompt.trim()}
                      className="ripple-container btn-primary w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      {scheduleLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {scheduleLoading ? 'Thinking…' : 'Generate Schedule'}
                    </button>

                    {scheduleError && (
                      <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{scheduleError}</p>
                    )}

                    {scheduleResult && (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{scheduleResult.summary}</p>
                        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {scheduleResult.tasks.map((t, i) => {
                            const cat = getCalendarCategory(t.category)
                            return (
                              <li key={i} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                                <span className="inline-block w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: cat.color }} />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{t.title}</p>
                                  <p className="text-xs text-gray-400">{t.date} · {cat.label}</p>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                        <button
                          onClick={(e) => { spawnRipple(e); applySchedule() }}
                          className="ripple-container w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          {added ? <Check size={16} /> : <CalendarPlus size={16} />}
                          {added ? 'Added to Calendar' : `Add ${scheduleResult.tasks.length} Tasks to Calendar`}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Paste a roadmap note, diary entry, or task description. The assistant will fix typos and
                      grammar without changing your meaning.
                    </p>
                    <textarea
                      value={fixInput}
                      onChange={(e) => setFixInput(e.target.value)}
                      rows={6}
                      placeholder="Paste text to proofread…"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)]"
                    />
                    <button
                      onClick={(e) => { spawnRipple(e); runFix() }}
                      disabled={fixLoading || !fixInput.trim()}
                      className="ripple-container btn-primary w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
                    >
                      {fixLoading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                      {fixLoading ? 'Checking…' : 'Fix with AI'}
                    </button>

                    {fixError && (
                      <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">{fixError}</p>
                    )}

                    {fixResult && (
                      <div className="space-y-2">
                        {fixResult.changed ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Corrected</p>
                              <button
                                onClick={copyFixed}
                                className="text-xs inline-flex items-center gap-1 text-gray-400 hover:accent-text"
                              >
                                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <p className="text-sm p-3 rounded-lg bg-gray-50 dark:bg-gray-800 whitespace-pre-line">
                              {fixResult.corrected}
                            </p>
                            {fixResult.explanation && (
                              <p className="text-xs text-gray-400">{fixResult.explanation}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                            <Check size={15} /> No mistakes found — this text already reads clean.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
