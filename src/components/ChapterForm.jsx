import { useState } from 'react'
import { Plus } from 'lucide-react'

function ChapterForm({ onAddChapter }) {
  const [chapterName, setChapterName] = useState('')
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!chapterName.trim()) {
      setError('Chapter name is required')
      return
    }
    if (chapterName.trim().length < 2) {
      setError('Chapter name must be at least 2 characters')
      return
    }
    onAddChapter(chapterName.trim())
    setChapterName('')
    setError('')
    setIsOpen(false)
  }

  return (
    <div className="mb-4">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800 font-semibold"
        >
          <Plus size={18} />
          Add Chapter
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={chapterName}
            onChange={(e) => {
              setChapterName(e.target.value)
              setError('')
            }}
            placeholder="Enter chapter name..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setChapterName('')
                setError('')
              }}
              className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default ChapterForm
