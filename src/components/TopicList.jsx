import { Trash2, Check } from 'lucide-react'

function TopicList({ topics, subjectId, chapterId, onToggleTopic, onDeleteTopic }) {
  return (
    <div className="space-y-2 mt-3">
      {topics.map(topic => (
        <div
          key={topic.id}
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
        >
          <button
            onClick={() => onToggleTopic(subjectId, chapterId, topic.id)}
            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
              topic.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400'
            }`}
            title={topic.completed ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {topic.completed && <Check size={16} className="text-white" />}
          </button>

          <span
            className={`flex-1 transition-all ${
              topic.completed
                ? 'line-through text-gray-500 dark:text-gray-400'
                : 'text-gray-900 dark:text-white'
            }`}
          >
            {topic.name}
          </span>

          <button
            onClick={() => onDeleteTopic(subjectId, chapterId, topic.id)}
            className="flex-shrink-0 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete topic"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default TopicList
