import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GoogleLogin } from '@react-oauth/google'
import { LogIn, Lock } from 'lucide-react'
import { setLoginDraft, setCurrentUserEmail, resetLoginDraft } from '../store/authSlice'
import { loginUser, loginGoogleUser, resetPassword, saveActiveUserEmail } from '../utils/authStorage'

function LoginPage({ onAuthSuccess, switchToSignup }) {
  const dispatch = useDispatch()
  const loginDraft = useSelector((state) => state.auth.loginDraft)
  const { email, password } = loginDraft
  const [error, setError] = useState('')
  const [resetMode, setResetMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  const handleChange = (field, value) => {
    dispatch(setLoginDraft({ [field]: value }))
    setError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    try {
      const result = await loginUser({ email, password })
      const userEmail = result.email
      const userData = result.data || { subjects: [], dailyTasks: [], diaryEntries: [] }
      dispatch(setCurrentUserEmail(userEmail))
      saveActiveUserEmail(userEmail)
      dispatch(resetLoginDraft())
      onAuthSuccess(userEmail, userData)
    } catch (authError) {
      setError(authError.message)
    }
  }

  // GoogleLogin renders Google's real "Sign in with Google" button. Clicking
  // it opens Google's own account chooser (the actual browser/Google
  // session picker) and returns a signed ID token for whichever account the
  // user picks — nothing here is hardcoded to one email anymore.
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await loginGoogleUser(credentialResponse.credential)
      const userEmail = result.email
      const userData = result.data || { subjects: [], dailyTasks: [], diaryEntries: [] }
      dispatch(setCurrentUserEmail(userEmail))
      saveActiveUserEmail(userEmail)
      dispatch(resetLoginDraft())
      onAuthSuccess(userEmail, userData)
    } catch (authError) {
      setError(authError.message)
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      setError('Please enter the email address for your account.')
      return
    }
    if (!newPassword.trim() || newPassword !== confirmPassword) {
      setError('Please enter matching new passwords.')
      return
    }
    try {
      await resetPassword({ email, newPassword })
      setSuccessMessage('Password updated. You can sign in now.')
      setResetMode(false)
      setError('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (authError) {
      setError(authError.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="rounded-[2rem] bg-white dark:bg-gray-900 p-10 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="rounded-3xl bg-blue-600 text-white p-4">
            <LogIn size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Secure login so only you can view your study notes.</p>
          </div>
        </div>

        <form onSubmit={resetMode ? handlePasswordReset : handleSubmit} className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
              placeholder="your@email.com"
              className="mt-3 w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {!resetMode && (
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                placeholder="Enter your password"
                className="mt-3 w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {resetMode && (
            <>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">New Password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter a new password"
                  className="mt-3 w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your new password"
                  className="mt-3 w-full rounded-3xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 px-5 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}

          <button
            type="submit"
            className="w-full rounded-3xl bg-blue-600 px-5 py-4 text-white text-lg font-semibold transition hover:bg-blue-700"
          >
            {resetMode ? 'Reset password' : 'Sign in securely'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
          <button
            type="button"
            onClick={() => setResetMode((prev) => !prev)}
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {resetMode ? 'Back to sign in' : 'Forgot password?'}
          </button>
          <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        </div>

        {!resetMode && (
          <>
            <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
              <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span>or continue with</span>
              <span className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>

            {googleConfigured ? (
              <div className="mt-6 flex justify-center [&>div]:w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed. Please try again.')}
                  width="100%"
                  shape="pill"
                  text="continue_with"
                />
              </div>
            ) : (
              <div className="mt-6">
                <button
                  type="button"
                  disabled
                  title="Google sign-in is not configured yet (missing VITE_GOOGLE_CLIENT_ID)."
                  className="inline-flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-3xl border border-gray-200 bg-white px-5 py-4 text-sm font-semibold text-gray-400 opacity-50 dark:border-gray-700 dark:bg-gray-950"
                >
                  Continue with Google
                </button>
                <p className="mt-2 text-xs text-gray-400">
                  Google sign-in isn't set up yet. Add a Google OAuth client ID to enable it.
                </p>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <button type="button" onClick={switchToSignup} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                Create an account instead
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LoginPage
