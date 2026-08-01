import { useState } from 'react'
import { Plus, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import { calculateSubjectCompletion } from '../utils/storage'
import ChapterList from './ChapterList'
import ChapterForm from './ChapterForm'

function SubjectList({
  subjects,
  onDeleteSubject,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  onAddTopic,
  onToggleTopic,
  onDeleteTopic
}) {
  const [expandedSubject, setExpandedSubject] = useState(null)
  const [editingChapterId, setEditingChapterId] = useState(null)

  return (
    <div className="grid gap-4 mt-8">
      {subjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-400 text-lg">No subjects yet. Create one to get started!</p>
        </div>
      ) : (
        subjects.map(subject => (
          <div
            key={subject.id}
            className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden card-shadow"
          >
            <div
              className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
              onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {subject.name}
                  </h3>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
                    {subject.chapters?.length || 0} chapters
                  </span>
                </div>

                {/* Progress Bar */}
                {subject.chapters && subject.chapters.length > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Progress</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {calculateSubjectCompletion(subject)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${calculateSubjectCompletion(subject)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSubject(subject.id)
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete subject"
                >
                  <Trash2 size={18} />
                </button>
                {expandedSubject === subject.id ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            {expandedSubject === subject.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50 dark:bg-gray-700/50">
                {/* Add Chapter Form */}
                <ChapterForm
                  onAddChapter={(name) => {
                    onAddChapter(subject.id, name)
                  }}
                />

                {/* Chapters List */}
                {subject.chapters && subject.chapters.length > 0 ? (
                  <ChapterList
                    chapters={subject.chapters}
                    subjectId={subject.id}
                    onUpdateChapter={onUpdateChapter}
                    onDeleteChapter={onDeleteChapter}
                    onAddTopic={onAddTopic}
                    onToggleTopic={onToggleTopic}
                    onDeleteTopic={onDeleteTopic}
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No chapters yet. Add one to get started!
                  </p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default SubjectList
