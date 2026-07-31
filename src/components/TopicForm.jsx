import { useState } from 'react'
import { Plus } from 'lucide-react'

function TopicForm({ onAddTopic }) {
  const [topicName, setTopicName] = useState('')
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!topicName.trim()) {
      setError('Topic name is required')
      return
    }
    if (topicName.trim().length < 2) {
      setError('Topic name must be at least 2 characters')
      return
    }
    onAddTopic(topicName.trim())
    setTopicName('')
    setError('')
    setIsOpen(false)
  }

  return (
    <div className="mb-3">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800 font-semibold text-sm"
        >
          <Plus size={16} />
          Add Topic
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            type="text"
            value={topicName}
            onChange={(e) => {
              setTopicName(e.target.value)
              setError('')
            }}
            placeholder="Enter topic name..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-semibold text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setTopicName('')
                setError('')
              }}
              className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors font-semibold text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default TopicForm
