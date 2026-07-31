import { useState } from 'react'
import { Plus } from 'lucide-react'

function SubjectForm({ onAddSubject }) {
  const [subjectName, setSubjectName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!subjectName.trim()) {
      setError('Subject name is required')
      return
    }
    if (subjectName.trim().length < 2) {
      setError('Subject name must be at least 2 characters')
      return
    }
    onAddSubject(subjectName.trim())
    setSubjectName('')
    setError('')
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white mb-8 card-shadow">
      <h2 className="text-2xl font-bold mb-4">➕ Add New Subject</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={subjectName}
          onChange={(e) => {
            setSubjectName(e.target.value)
            setError('')
          }}
          placeholder="Enter subject name (e.g., Mathematics, Physics, History)"
          className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/30 transition-colors"
        />
        {error && <p className="text-red-200 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-white text-blue-600 font-bold py-3 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus size={20} />
          Add Subject
        </button>
      </form>
    </div>
  )
}

export default SubjectForm
