import { useState } from 'react'
import { Heart, Smile, Meh, Frown, Pencil, Trash2, Check, X } from 'lucide-react'

const moodOptions = [
  { label: 'Happy', emoji: '😊', icon: Smile },
  { label: 'Motivated', emoji: '💪', icon: Heart },
  { label: 'Calm', emoji: '😌', icon: Meh },
  { label: 'Reflective', emoji: '🤔', icon: Frown }
]

function Diary({ diaryEntries, onAddEntry, onUpdateEntry, onDeleteEntry }) {
  const [text, setText] = useState('')
  const [selectedMood, setSelectedMood] = useState(moodOptions[0].emoji)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editMood, setEditMood] = useState(moodOptions[0].emoji)

  const handleSubmit = (event) => {
    event.preventDefault()
    const content = text.trim()
    if (!content) return
    onAddEntry(content, selectedMood)
    setText('')
  }

  const startEditing = (entry) => {
    setEditingId(entry.id)
    setEditText(entry.text)
    setEditMood(entry.mood)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEditing = (id) => {
    const content = editText.trim()
    if (!content) return
    onUpdateEntry(id, { text: content, mood: editMood })
    setEditingId(null)
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold">📝 My Diary</h1>
        <p className="text-gray-600 dark:text-gray-400">Capture your study mood and daily reflections.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 card-shadow">
          <h2 className="text-2xl font-semibold mb-4">Add a new diary note</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write how you felt about today's study session..."
              className="w-full min-h-[180px] rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-semibold mb-2">Select your mood</p>
              <div className="flex flex-wrap gap-3">
                {moodOptions.map((mood) => {
                  const Icon = mood.icon
                  return (
                    <button
                      key={mood.emoji}
                      type="button"
                      onClick={() => setSelectedMood(mood.emoji)}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 transition ${selectedMood === mood.emoji ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:border-blue-400' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}
                    >
                      <Icon size={18} />
                      <span>{mood.emoji}</span>
                      <span className="sr-only">{mood.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-3xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 text-lg font-semibold transition"
            >
              Save diary entry {selectedMood}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 card-shadow">
            <h2 className="text-2xl font-semibold mb-4">Recent entries</h2>
            {diaryEntries.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No diary entries yet. Start by adding a mood note.</p>
            ) : (
              <div className="space-y-4">
                {diaryEntries.slice().reverse().map((entry) => (
                  <div key={entry.id} className="group rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                    {editingId === entry.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full min-h-[100px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex flex-wrap gap-2">
                          {moodOptions.map((mood) => (
                            <button
                              key={mood.emoji}
                              type="button"
                              onClick={() => setEditMood(mood.emoji)}
                              className={`rounded-xl border px-3 py-1.5 text-sm transition ${editMood === mood.emoji ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:border-blue-400' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}
                            >
                              {mood.emoji}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEditing(entry.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-sm font-semibold transition"
                          >
                            <Check size={16} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <X size={16} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4 mb-3">
                          <span className="text-lg font-semibold">{entry.mood}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => startEditing(entry)}
                                title="Edit entry"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 transition"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEntry(entry.id)}
                                title="Delete entry"
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{entry.text}</p>
                        {entry.updatedAt && (
                          <p className="mt-2 text-xs italic text-gray-400 dark:text-gray-500">Edited {new Date(entry.updatedAt).toLocaleString()}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-600 text-white rounded-3xl p-6 card-shadow">
            <h3 className="text-xl font-semibold mb-3">Mood check</h3>
            <p className="text-sm text-blue-100">Use the emoji selection to capture how your day felt, then review your entries anytime.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Diary
