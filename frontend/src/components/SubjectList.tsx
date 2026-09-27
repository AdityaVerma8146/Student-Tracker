import { useState, useMemo } from 'react'
import {
  BookOpen,
  Trash2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Award,
  Clock,
  ListTodo,
  FileText,
  Calendar,
  Plus,
  Check,
  AlertCircle,
  Save,
  Filter,
} from 'lucide-react'
import { calculateSubjectCompletion } from '../utils/storage'
import ChapterList from './ChapterList'
import ChapterForm from './ChapterForm'
import type { Subject, SubjectAssignment } from '../types'

interface SubjectListProps {
  subjects: Subject[]
  onDeleteSubject: (id: number) => void
  onUpdateSubject?: (id: number, patch: Partial<Subject>) => void
  onAddChapter: (subjectId: number, chapterName: string) => void
  onUpdateChapter: (subjectId: number, chapterId: number, updatedName: string) => void
  onDeleteChapter: (subjectId: number, chapterId: number) => void
  onAddTopic: (subjectId: number, chapterId: number, topicName: string) => void
  onToggleTopic: (subjectId: number, chapterId: number, topicId: number) => void
  onDeleteTopic: (subjectId: number, chapterId: number, topicId: number) => void
}

type FilterType = 'all' | 'active' | 'completed' | 'struggling'
type WorkspaceTab = 'chapters' | 'assignments' | 'details'

export default function SubjectList({
  subjects,
  onDeleteSubject,
  onUpdateSubject,
  onAddChapter,
  onUpdateChapter,
  onDeleteChapter,
  onAddTopic,
  onToggleTopic,
  onDeleteTopic,
}: SubjectListProps) {
  const [expandedSubjectId, setExpandedSubjectId] = useState<number | null>(null)
  const [activeTabMap, setActiveTabMap] = useState<Record<number, WorkspaceTab>>({})
  const [filter, setFilter] = useState<FilterType>('all')

  // Local state for editing subject metadata
  const [editFormData, setEditFormData] = useState<Record<number, Partial<Subject>>>({})

  // Local state for new assignment form
  const [assignmentForm, setAssignmentForm] = useState<{
    subjectId: number | null
    title: string
    dueDate: string
    description: string
  }>({
    subjectId: null,
    title: '',
    dueDate: '',
    description: '',
  })

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const progress = calculateSubjectCompletion(s)
      if (filter === 'active') return progress < 100
      if (filter === 'completed') return progress === 100
      if (filter === 'struggling') {
        return progress < 40 || s.difficulty === 'hard' || s.priority === 'high'
      }
      return true
    })
  }, [subjects, filter])

  const getActiveTab = (subjectId: number): WorkspaceTab => {
    return activeTabMap[subjectId] || 'chapters'
  }

  const setActiveTab = (subjectId: number, tab: WorkspaceTab) => {
    setActiveTabMap((prev) => ({ ...prev, [subjectId]: tab }))
  }

  // Handle assignment creation
  const handleCreateAssignment = (subject: Subject) => {
    if (!assignmentForm.title.trim() || !assignmentForm.dueDate) return

    const newAssignment: SubjectAssignment = {
      id: Date.now(),
      title: assignmentForm.title.trim(),
      dueDate: assignmentForm.dueDate,
      completed: false,
      description: assignmentForm.description.trim() || undefined,
    }

    const updatedAssignments = [...(subject.assignments || []), newAssignment]
    if (onUpdateSubject) {
      onUpdateSubject(subject.id, { assignments: updatedAssignments })
    }

    setAssignmentForm({
      subjectId: null,
      title: '',
      dueDate: '',
      description: '',
    })
  }

  // Handle assignment completion toggle
  const handleToggleAssignment = (subject: Subject, assignmentId: number) => {
    const updatedAssignments = (subject.assignments || []).map((a) =>
      a.id === assignmentId ? { ...a, completed: !a.completed } : a
    )
    if (onUpdateSubject) {
      onUpdateSubject(subject.id, { assignments: updatedAssignments })
    }
  }

  // Handle assignment delete
  const handleDeleteAssignment = (subject: Subject, assignmentId: number) => {
    const updatedAssignments = (subject.assignments || []).filter((a) => a.id !== assignmentId)
    if (onUpdateSubject) {
      onUpdateSubject(subject.id, { assignments: updatedAssignments })
    }
  }

  // Handle metadata save
  const handleSaveMetadata = (subjectId: number) => {
    const patch = editFormData[subjectId]
    if (patch && onUpdateSubject) {
      onUpdateSubject(subjectId, patch)
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Quick Filters Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter size={13} /> Filter:
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            All Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('struggling')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'struggling'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Needs Attention ⚠️
          </button>
        </div>
      </div>

      {/* Subjects Workspace List */}
      <div className="space-y-4">
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <BookOpen size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              {subjects.length === 0
                ? 'No subjects created yet. Add a subject above to get started!'
                : 'No subjects match this filter.'}
            </p>
          </div>
        ) : (
          filteredSubjects.map((subject, idx) => {
            const progress = calculateSubjectCompletion(subject)
            const isExpanded = expandedSubjectId === subject.id
            const currentTab = getActiveTab(subject.id)
            const assignmentsCount = subject.assignments?.length || 0
            const pendingAssignments = (subject.assignments || []).filter((a) => !a.completed).length

            return (
              <div
                key={subject.id}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={`stagger-item bg-white dark:bg-gray-800 rounded-3xl border transition-all duration-200 overflow-hidden shadow-sm ${
                  isExpanded
                    ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {/* Subject Header Banner */}
                <div
                  className="p-5 sm:p-6 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-750 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  onClick={() => setExpandedSubjectId(isExpanded ? null : subject.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                        {subject.name}
                      </h3>

                      {subject.code && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {subject.code}
                        </span>
                      )}

                      {subject.difficulty && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            subject.difficulty === 'hard'
                              ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                              : subject.difficulty === 'easy'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {subject.difficulty}
                        </span>
                      )}

                      {pendingAssignments > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 flex items-center gap-1">
                          <AlertCircle size={10} /> {pendingAssignments} assignment{pendingAssignments > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      {subject.teacher && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <GraduationCap size={14} className="text-gray-400" />
                          <span>{subject.teacher}</span>
                        </span>
                      )}

                      {subject.credits && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Award size={14} className="text-gray-400" />
                          <span>{subject.credits} Credits</span>
                        </span>
                      )}

                      {subject.studyHours && (
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock size={14} className="text-gray-400" />
                          <span>{subject.studyHours}h / week</span>
                        </span>
                      )}

                      <span className="font-medium">
                        {subject.chapters?.length || 0} chapters &bull;{' '}
                        {subject.chapters?.reduce((acc, c) => acc + (c.topics?.length || 0), 0) || 0} topics
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3.5 max-w-md">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Progress</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            progress === 100
                              ? 'bg-emerald-500'
                              : progress > 50
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Header Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteSubject(subject.id)
                      }}
                      className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                      title="Delete subject workspace"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                      <span>{isExpanded ? 'Collapse' : 'Open Workspace'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* EXPANDED WORKSPACE */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-850 p-5 sm:p-6">
                    {/* Workspace Tabs */}
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
                      <button
                        onClick={() => setActiveTab(subject.id, 'chapters')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                          currentTab === 'chapters'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <ListTodo size={14} /> Curriculum & Topics
                      </button>
                      <button
                        onClick={() => setActiveTab(subject.id, 'assignments')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                          currentTab === 'assignments'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Calendar size={14} /> Assignments & Deadlines ({assignmentsCount})
                      </button>
                      <button
                        onClick={() => setActiveTab(subject.id, 'details')}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                          currentTab === 'details'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FileText size={14} /> Course Notes & Info
                      </button>
                    </div>

                    {/* TAB 1: CHAPTERS & TOPICS */}
                    {currentTab === 'chapters' && (
                      <div className="space-y-4">
                        <ChapterForm
                          onAddChapter={(name) => {
                            onAddChapter(subject.id, name)
                          }}
                        />

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
                          <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              No chapters in this curriculum yet. Add a chapter above!
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: ASSIGNMENTS & DEADLINES */}
                    {currentTab === 'assignments' && (
                      <div className="space-y-6">
                        {/* Add Assignment Form */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                            <Plus size={14} /> Add Assignment / Milestone
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={assignmentForm.subjectId === subject.id ? assignmentForm.title : ''}
                              onChange={(e) =>
                                setAssignmentForm({
                                  ...assignmentForm,
                                  subjectId: subject.id,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Assignment title (e.g. Lab Report 2, Essay)"
                              className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="date"
                              value={assignmentForm.subjectId === subject.id ? assignmentForm.dueDate : ''}
                              onChange={(e) =>
                                setAssignmentForm({
                                  ...assignmentForm,
                                  subjectId: subject.id,
                                  dueDate: e.target.value,
                                })
                              }
                              className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <textarea
                              value={
                                assignmentForm.subjectId === subject.id ? assignmentForm.description : ''
                              }
                              onChange={(e) =>
                                setAssignmentForm({
                                  ...assignmentForm,
                                  subjectId: subject.id,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Instructions, rubric links, submission details..."
                              rows={2}
                              className="sm:col-span-3 px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCreateAssignment(subject)}
                            className="mt-3 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5"
                          >
                            <Plus size={14} /> Add Assignment
                          </button>
                        </div>

                        {/* Assignment List */}
                        <div className="space-y-2">
                          {(!subject.assignments || subject.assignments.length === 0) ? (
                            <p className="text-xs text-gray-400 italic text-center py-4">
                              No assignments recorded for this subject yet.
                            </p>
                          ) : (
                            subject.assignments.map((assignment) => {
                              const isOverdue = !assignment.completed && assignment.dueDate < todayStr

                              return (
                                <div
                                  key={assignment.id}
                                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition ${
                                    assignment.completed
                                      ? 'bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 opacity-60'
                                      : isOverdue
                                      ? 'bg-rose-50/70 dark:bg-rose-900/20 border-rose-300 dark:border-rose-800'
                                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAssignment(subject, assignment.id)}
                                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition shrink-0 ${
                                        assignment.completed
                                          ? 'bg-blue-600 border-blue-600 text-white'
                                          : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                                      }`}
                                    >
                                      {assignment.completed && <Check size={12} />}
                                    </button>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h5
                                          className={`text-sm font-semibold text-gray-900 dark:text-white ${
                                            assignment.completed ? 'line-through text-gray-400' : ''
                                          }`}
                                        >
                                          {assignment.title}
                                        </h5>
                                        {isOverdue && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                                            <AlertCircle size={10} /> Overdue
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <Calendar size={12} />
                                        <span>Due: {assignment.dueDate}</span>
                                      </div>

                                      {assignment.description && (
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5">
                                          {assignment.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAssignment(subject, assignment.id)}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition shrink-0"
                                    title="Delete assignment"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: COURSE DETAILS & NOTES */}
                    {currentTab === 'details' && (
                      <div className="space-y-4 bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Professor / Teacher
                            </label>
                            <input
                              type="text"
                              defaultValue={subject.teacher || ''}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  [subject.id]: {
                                    ...(prev[subject.id] || {}),
                                    teacher: e.target.value,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Credits
                            </label>
                            <input
                              type="number"
                              defaultValue={subject.credits ?? ''}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  [subject.id]: {
                                    ...(prev[subject.id] || {}),
                                    credits: e.target.value ? Number(e.target.value) : undefined,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Weekly Study Hours
                            </label>
                            <input
                              type="number"
                              defaultValue={subject.studyHours ?? ''}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  [subject.id]: {
                                    ...(prev[subject.id] || {}),
                                    studyHours: e.target.value ? Number(e.target.value) : undefined,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Difficulty
                            </label>
                            <select
                              defaultValue={subject.difficulty || 'medium'}
                              onChange={(e) =>
                                setEditFormData((prev) => ({
                                  ...prev,
                                  [subject.id]: {
                                    ...(prev[subject.id] || {}),
                                    difficulty: e.target.value as any,
                                  },
                                }))
                              }
                              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard 🔥</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            Course Notes & Syllabus Details
                          </label>
                          <textarea
                            defaultValue={subject.notes || ''}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                [subject.id]: {
                                  ...(prev[subject.id] || {}),
                                  notes: e.target.value,
                                },
                              }))
                            }
                            placeholder="Key textbook references, grading policy, office hours..."
                            rows={3}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleSaveMetadata(subject.id)}
                            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Save size={14} /> Save Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
