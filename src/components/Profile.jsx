import { useRef, useState } from 'react'
import { Camera, Trash2, Save } from 'lucide-react'
import { getStatistics } from '../utils/storage'

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2MB, comfortably under the 5MB request body limit

function Profile({ email, profile, onUpdateProfile, subjects, dailyTasks, diaryEntries }) {
  const fileInputRef = useRef(null)
  const [name, setName] = useState(profile?.name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [error, setError] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  const stats = getStatistics(subjects || [])
  const initials = (profile?.name || email || '?').trim().charAt(0).toUpperCase()

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-selecting the same file later
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('That image is too large. Please choose one under 2MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      onUpdateProfile({ avatar: reader.result })
      setError('')
    }
    reader.onerror = () => setError('Could not read that image. Please try another file.')
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    onUpdateProfile({ avatar: null })
  }

  const handleSave = (event) => {
    event.preventDefault()
    onUpdateProfile({ name: name.trim(), bio: bio.trim() })
    setSavedMessage('Profile saved.')
    setTimeout(() => setSavedMessage(''), 2000)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center mb-2">
        <h1 className="text-4xl font-bold">👤 My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your photo and details.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 card-shadow flex flex-col items-center text-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-blue-100 dark:border-blue-500/20 bg-blue-600 flex items-center justify-center text-white text-4xl font-semibold">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarPick}
              title="Change photo"
              className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg transition"
            >
              <Camera size={18} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />

          {profile?.avatar && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Trash2 size={15} /> Remove photo
            </button>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-6 w-full border-t border-gray-100 dark:border-gray-700 pt-6">
            <p className="text-lg font-semibold">{profile?.name || 'Add your name'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 break-all">{email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-3xl p-6 card-shadow space-y-4">
            <h2 className="text-2xl font-semibold">Details</h2>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Display name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email</span>
              <input
                type="email"
                value={email}
                disabled
                className="mt-2 w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-950 px-4 py-3 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">About / study goals</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="e.g. Preparing for finals, focusing on Physics and Chemistry..."
                className="mt-2 w-full min-h-[100px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold transition"
              >
                <Save size={18} /> Save changes
              </button>
              {savedMessage && <span className="text-sm text-emerald-600">{savedMessage}</span>}
            </div>
          </form>

          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 card-shadow">
            <h2 className="text-2xl font-semibold mb-4">Your activity</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-4">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSubjects}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Subjects</p>
              </div>
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-4">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedTopics}/{stats.totalTopics}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Topics done</p>
              </div>
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-4">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dailyTasks?.length || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Daily tasks</p>
              </div>
              <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-4">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diaryEntries?.length || 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Diary entries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
