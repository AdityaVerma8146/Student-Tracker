import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UserPlus, Mail, Lock, Smile } from 'lucide-react'
import { setSignupDraft, resetSignupDraft } from '../store/authSlice'
import { registerUser } from '../utils/authStorage'

const signupMoods = ['😊', '😃', '😌', '😎', '🤩', '😇']

function Signup({ switchToLogin }) {
  const dispatch = useDispatch()
  const signupDraft = useSelector((state) => state.auth.signupDraft)
  const [selectedMood, setSelectedMood] = useState(signupMoods[0])
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (signupDraft.mood) {
      setSelectedMood(signupDraft.mood)
    }
  }, [signupDraft.mood])

  const handleChange = (field, value) => {
    dispatch(setSignupDraft({ [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!signupDraft.email.trim() || !signupDraft.password.trim()) {
      setError('Email and password are required.')
      return
    }
    try {
      await registerUser({ email: signupDraft.email, password: signupDraft.password, mood: selectedMood })
      dispatch(resetSignupDraft())
      setSubmitted(true)
      setError('')
    } catch (authError) {
      setError(authError.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Create Your Account</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Sign up with a mood emoji so your tracker feels personal and secure.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 card-shadow">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-300 mb-6">
            <UserPlus size={28} />
            <div>
              <h2 className="text-2xl font-semibold">Join the study planner</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your private profile stores your own subjects, diary, and daily habits.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Email address</span>
              <div className="mt-2 flex items-center gap-3 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
                <Mail size={18} className="text-gray-500 dark:text-gray-400" />
                <input
                  type="email"
                  value={signupDraft.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</span>
              <div className="mt-2 flex items-center gap-3 rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3">
                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                <input
                  type="password"
                  value={signupDraft.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full bg-transparent outline-none text-gray-900 dark:text-white"
                />
              </div>
            </label>

            <div>
              <p className="text-sm font-semibold mb-3">Choose your signup mood</p>
              <div className="flex flex-wrap gap-3">
                {signupMoods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setSelectedMood(mood)}
                    className={`rounded-3xl px-4 py-3 border text-xl transition ${selectedMood === mood ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:border-blue-400' : 'border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-4 text-lg font-semibold transition"
            >
              <Smile size={18} /> Sign up with {selectedMood}
            </button>
          </form>

          {submitted && (
            <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-700/40 dark:bg-green-900/20 dark:text-green-100">
              <p className="font-semibold">Account created!</p>
              <p className="mt-1 text-sm">You joined with {selectedMood}. Use your email and password to sign in now.</p>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <button type="button" onClick={switchToLogin} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
              Sign in here
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-violet-600 text-white rounded-3xl p-8 card-shadow">
          <h3 className="text-2xl font-semibold mb-4">Why sign up?</h3>
          <ul className="space-y-3 text-sm leading-6">
            <li>• Personalize the app with a mood emoji at signup.</li>
            <li>• Save your study reflections in Diary.</li>
            <li>• Keep your progress and tasks in one place.</li>
          </ul>
          <div className="mt-8 rounded-3xl border border-white/20 bg-white/10 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-100 mb-3">Your mood</p>
            <div className="text-6xl">{selectedMood}</div>
            <p className="mt-4 text-sm text-blue-100">This emoji represents how you want to feel while organizing your days.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
