import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, BookOpen, GraduationCap, Award, Clock } from 'lucide-react'
import { spawnRipple } from '../utils/effects'
import type { Subject } from '../types'

interface SubjectFormProps {
  onAddSubject: (subjectData: Partial<Subject> & { name: string }) => void
}

export default function SubjectForm({ onAddSubject }: SubjectFormProps) {
  const [subjectName, setSubjectName] = useState('')
  const [code, setCode] = useState('')
  const [teacher, setTeacher] = useState('')
  const [credits, setCredits] = useState<number | ''>('')
  const [studyHours, setStudyHours] = useState<number | ''>('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectName.trim()) {
      setError('Subject name is required')
      return
    }
    if (subjectName.trim().length < 2) {
      setError('Subject name must be at least 2 characters')
      return
    }

    onAddSubject({
      name: subjectName.trim(),
      code: code.trim() || undefined,
      teacher: teacher.trim() || undefined,
      credits: credits !== '' ? Number(credits) : undefined,
      studyHours: studyHours !== '' ? Number(studyHours) : undefined,
      difficulty,
      priority,
      notes: notes.trim() || undefined,
      assignments: [],
    })

    setSubjectName('')
    setCode('')
    setTeacher('')
    setCredits('')
    setStudyHours('')
    setNotes('')
    setShowAdvanced(false)
    setError('')
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white mb-8 shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen size={24} /> Add Academic Subject Workspace
          </h2>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-semibold transition flex items-center gap-1.5"
          >
            {showAdvanced ? 'Simple Form' : 'Add Course Details'}
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                value={subjectName}
                onChange={(e) => {
                  setSubjectName(e.target.value)
                  setError('')
                }}
                placeholder="Subject name (e.g. Algorithms, Thermodynamics, Discrete Math)"
                className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/30 transition text-sm font-medium"
              />
            </div>
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code (e.g. CS301, PHY102)"
                className="w-full px-4 py-3 rounded-xl bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/30 transition text-sm font-medium"
              />
            </div>
          </div>

          {/* Advanced Workspace Options */}
          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-white/20 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1">
                  <GraduationCap size={12} className="inline mr-1" /> Professor
                </label>
                <input
                  type="text"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  placeholder="e.g. Dr. Roberts"
                  className="w-full px-3 py-2 rounded-lg bg-white/20 placeholder-white/60 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1">
                  <Award size={12} className="inline mr-1" /> Credits
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={credits}
                  onChange={(e) => setCredits(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 4"
                  className="w-full px-3 py-2 rounded-lg bg-white/20 placeholder-white/60 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1">
                  <Clock size={12} className="inline mr-1" /> Study Hrs / Wk
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 6"
                  className="w-full px-3 py-2 rounded-lg bg-white/20 placeholder-white/60 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white [&>option]:text-gray-900"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard 🔥</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/80 mb-1">
                  Syllabus Highlights / Objectives
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key concepts, grading criteria, lab schedule..."
                  className="w-full px-3 py-2 rounded-lg bg-white/20 placeholder-white/60 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white"
                />
              </div>
            </div>
          )}

          {error && <p className="text-rose-200 text-xs font-semibold">{error}</p>}

          <button
            type="submit"
            onClick={spawnRipple}
            className="ripple-container w-full flex items-center justify-center gap-2 bg-white text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-50 transition-all shadow-md active:scale-[0.99]"
          >
            <Plus size={18} />
            Create Subject Workspace
          </button>
        </form>
      </div>
    </div>
  )
}
