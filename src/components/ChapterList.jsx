import { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { calculateChapterCompletion } from '../utils/storage'
import TopicList from './TopicList'
import TopicForm from './TopicForm'

function ChapterList({
  chapters,
  subjectId,
  onUpdateChapter,
  onDeleteChapter,
  onAddTopic,
  onToggleTopic,
  onDeleteTopic
}) {
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [editingChapterId, setEditingChapterId] = useState(null)
  const [editName, setEditName] = useState('')

  const handleEditClick = (chapter) => {
    setEditingChapterId(chapter.id)
    setEditName(chapter.name)
  }

  const handleSaveEdit = (chapterId) => {
    if (editName.trim() && editName !== chapters.find(c => c.id === chapterId).name) {
      onUpdateChapter(subjectId, chapterId, editName.trim())
    }
    setEditingChapterId(null)
    setEditName('')
  }

  return (
    <div className="space-y-3 mt-4">
      {chapters.map(chapter => (
        <div
          key={chapter.id}
          className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
        >
          <div className="p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div
              onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
              className="flex items-center justify-between"
            >
              <div className="flex-1">
                {editingChapterId === chapter.id ? (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(chapter.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChapterId(null)}
                      className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      📖 {chapter.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {chapter.topics?.length || 0} topics • {calculateChapterCompletion(chapter)}% complete
                    </p>
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-2 ml-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => handleEditClick(chapter)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit chapter"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDeleteChapter(subjectId, chapter.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete chapter"
                >
                  <Trash2 size={16} />
                </button>
                {expandedChapter === chapter.id ? (
                  <ChevronUp size={18} className="text-gray-400" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {chapter.topics && chapter.topics.length > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${calculateChapterCompletion(chapter)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Expanded Content */}
          {expandedChapter === chapter.id && (
            <div className="border-t border-gray-200 dark:border-gray-600 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/50">
              <TopicForm
                onAddTopic={(name) => onAddTopic(subjectId, chapter.id, name)}
              />

              {chapter.topics && chapter.topics.length > 0 ? (
                <TopicList
                  topics={chapter.topics}
                  subjectId={subjectId}
                  chapterId={chapter.id}
                  onToggleTopic={onToggleTopic}
                  onDeleteTopic={onDeleteTopic}
                />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No topics yet. Add one to track your study progress!
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ChapterList
