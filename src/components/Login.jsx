import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { GoogleLogin } from '@react-oauth/google'
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react'
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  const getErrorMessage = (err) => {
    if (typeof err === 'string') return err
    if (typeof err?.message === 'string') return err.message
    if (typeof err?.response?.data?.message === 'string') return err.response.data.message
    if (typeof err?.response?.data?.error === 'string') return err.response.data.error
    return 'Authentication failed. Please check your credentials.'
  }

  const handleChange = (field, value) => {
    dispatch(setLoginDraft({ [field]: value }))
    setError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const result = await loginUser({ email, password })
      const userEmail = result.email
      const userData = result.data || { subjects: [], dailyTasks: [], diaryEntries: [], profile: { name: '', bio: '', avatar: null } }
      dispatch(setCurrentUserEmail(userEmail))
      saveActiveUserEmail(userEmail)
      dispatch(resetLoginDraft())
      onAuthSuccess(userEmail, userData)
    } catch (authError) {
      setError(getErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await loginGoogleUser(credentialResponse.credential)
      const userEmail = result.email
      const userData = result.data || { subjects: [], dailyTasks: [], diaryEntries: [], profile: { name: '', bio: '', avatar: null } }
      dispatch(setCurrentUserEmail(userEmail))
      saveActiveUserEmail(userEmail)
      dispatch(resetLoginDraft())
      onAuthSuccess(userEmail, userData)
    } catch (authError) {
      setError(getErrorMessage(authError))
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

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
      setNewPassword('')
      setConfirmPassword('')
    } catch (authError) {
      setError(getErrorMessage(authError))
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200/70 bg-white/90 p-4 shadow-[0_28px_80px_-32px_rgba(37,99,235,0.45)] backdrop-blur md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] bg-white p-6 md:p-8">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                <ShieldCheck size={28} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Secure access</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Welcome back</h1>
                <p className="mt-2 max-w-md text-sm text-slate-500 sm:text-base">Sign in to continue managing your study notes, diary reflections, and daily tasks with confidence.</p>
              </div>
            </div>

            <form onSubmit={resetMode ? handlePasswordReset : handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                  <Mail size={18} className="text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              {!resetMode && (
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                    <Lock size={18} className="text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </label>
              )}

              {resetMode && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">New Password</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                      <Lock size={18} className="text-slate-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Create a new password"
                        className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm Password</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
                      <Lock size={18} className="text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirm your new password"
                        className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </label>
                </>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>
              )}
              {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMessage}</div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.01] hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span>{isSubmitting ? 'Signing in…' : resetMode ? 'Reset password' : 'Sign in securely'}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setResetMode((prev) => !prev)
                  setError('')
                  setSuccessMessage('')
                }}
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                {resetMode ? 'Back to sign in' : 'Forgot password?'}
              </button>
              <span className="flex-1 border-t border-slate-200" />
            </div>

            {!resetMode && (
              <>
                <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
                  <span className="flex-1 border-t border-slate-200" />
                  <span>or continue with</span>
                  <span className="flex-1 border-t border-slate-200" />
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
                      className="inline-flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-400 opacity-60"
                    >
                      Continue with Google
                    </button>
                    <p className="mt-2 text-xs text-slate-400">Google sign-in is not configured yet. Add a Google OAuth client ID to enable it.</p>
                  </div>
                )}

                <div className="mt-6 text-center text-sm text-slate-500">
                  <button type="button" onClick={switchToSignup} className="font-semibold text-blue-600 transition hover:text-blue-700">
                    Create an account instead
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="rounded-[28px] bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-6 text-white md:p-8">
            <div className="flex items-center gap-3 text-blue-100">
              <Sparkles size={20} />
              <span className="text-xs font-semibold uppercase tracking-[0.35em]">Productivity mode</span>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-5">
              <h2 className="text-2xl font-semibold">Everything in one calm workspace.</h2>
              <p className="mt-3 text-sm leading-6 text-blue-50/85">Your study tracker keeps notes, chapter progress, and daily tasks aligned in a single secure dashboard tailored to you.</p>
            </div>

            <div className="mt-5 space-y-3 text-sm text-blue-50/90">
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                <ShieldCheck size={18} className="text-cyan-200" />
                <span>Private login with graceful fallback for production deployments.</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
                <Sparkles size={18} className="text-cyan-200" />
                <span>Cleaner onboarding and a polished sign-in experience.</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default LoginPage