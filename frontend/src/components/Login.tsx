import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { GoogleLogin } from '@react-oauth/google'
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  RotateCcw
} from 'lucide-react'
import { setCurrentUserEmail, resetLoginDraft } from '../store/authSlice'
import {
  loginUser,
  loginGoogleUser,
  resetPassword,
  saveActiveUserEmail,
  sendOtp,
  verifyOtp,
  loginWithOtp
} from '../utils/authStorage'
import OTPInput from './OTPInput'
import type { UserData } from '../types'

interface LoginProps {
  onAuthSuccess: (email: string, data: UserData) => void
  switchToSignup: () => void
}

type LoginMode = 'password' | 'otp' | 'forgot'

export default function LoginPage({ onAuthSuccess, switchToSignup }: LoginProps) {
  const dispatch = useDispatch()
  const [mode, setMode] = useState<LoginMode>('password')

  // Input states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Forgot password & OTP reset states
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpInvalid, setOtpInvalid] = useState(false)

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

  const identifier = email.trim()

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    } else if (timer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [otpSent, timer])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!identifier) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await loginUser({ email: identifier, password })
      const userEmail = result.email
      const userData = result.data || {
        subjects: [],
        dailyTasks: [],
        diaryEntries: [],
        calendarTasks: [],
        roadmap: null,
        profile: { name: '', bio: '', avatar: null },
      }
      dispatch(setCurrentUserEmail(userEmail))
      saveActiveUserEmail(userEmail)
      dispatch(resetLoginDraft())
      onAuthSuccess(userEmail, userData)
    } catch (err) {
      setError((err as Error).message || 'Invalid credentials. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendOtp = async () => {
    setError(null)
    setSuccessMessage(null)
    if (!identifier) {
      setError('Please enter your email address.')
      return
    }

    setIsSubmitting(true)
    try {
      await sendOtp(identifier)
      setOtpSent(true)
      setTimer(60)
      setCanResend(false)
      setSuccessMessage(`Verification code sent to ${identifier}`)
    } catch (err) {
      setError((err as Error).message || 'Failed to send verification code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOtpLoginComplete = async (enteredOtp: string) => {
    setError(null)
    setIsVerifyingOtp(true)
    setOtpInvalid(false)

    try {
      if (mode === 'otp') {
        const result = await loginWithOtp(identifier, enteredOtp)
        const userEmail = result.email
        const userData = result.data || {
          subjects: [],
          dailyTasks: [],
          diaryEntries: [],
          calendarTasks: [],
          roadmap: null,
          profile: { name: '', bio: '', avatar: null },
        }
        dispatch(setCurrentUserEmail(userEmail))
        saveActiveUserEmail(userEmail)
        dispatch(resetLoginDraft())
        onAuthSuccess(userEmail, userData)
      } else if (mode === 'forgot') {
        await verifyOtp(identifier, enteredOtp)
        setOtpVerified(true)
        setSuccessMessage('Code verified! Enter your new password below.')
      }
    } catch (err) {
      setOtpInvalid(true)
      setError((err as Error).message || 'Invalid verification code.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({ email: identifier, newPassword })
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.')
      setMode('password')
      setOtpSent(false)
      setOtpVerified(false)
      setPassword('')
    } catch (err) {
      setError((err as Error).message || 'Failed to update password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const result = await loginGoogleUser(credentialResponse.credential)
      const userEmail = result.email
      const userData = result.data || {
        subjects: [],
        dailyTasks: [],
        diaryEntries: [],
        calendarTasks: [],
        roadmap: null,
        profile: { name: '', bio: '', avatar: null },
      }
      dispatch(setCurrentUserEmail(userEmail))
      saveActiveUserEmail(userEmail)
      dispatch(resetLoginDraft())
      onAuthSuccess(userEmail, userData)
    } catch (err) {
      setError((err as Error).message || 'Google sign-in failed.')
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <Sparkles size={14} /> Student Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'forgot' ? 'Reset Password' : 'Sign in to Student Tracker'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {mode === 'password' && 'Enter your account details to access your academic dashboard.'}
            {mode === 'otp' && 'Sign in quickly without a password using an email code.'}
            {mode === 'forgot' && 'Verify your account identity to set a new password.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && !error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode Selector (Password vs OTP) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('password')
                setError(null)
              }}
              className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'password'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Lock size={15} /> Password Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('otp')
                setError(null)
              }}
              className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                mode === 'otp'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <KeyRound size={15} /> OTP One-Click
            </button>
          </div>
        )}

        {/* Identifier Field */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Email Address
          </label>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
            <Mail size={18} className="text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-base placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* 1. PASSWORD MODE */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot')
                    setOtpSent(false)
                    setOtpVerified(false)
                    setError(null)
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
                <Lock size={18} className="text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-base placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* 2. OTP LOGIN MODE */}
        {mode === 'otp' && (
          <div className="space-y-6">
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <span>{isSubmitting ? 'Sending verification code...' : 'Send 6-Digit Login Code'}</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enter code sent to <strong className="text-blue-600 dark:text-blue-400">{identifier}</strong>
                  </p>
                </div>
                <OTPInput
                  length={6}
                  onComplete={handleOtpLoginComplete}
                  disabled={isVerifyingOtp}
                  isInvalid={otpInvalid}
                  isLoading={isVerifyingOtp}
                />
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">
                    {timer > 0 ? `Resend in ${timer}s` : 'Didn’t receive code?'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!canResend || isSubmitting}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Resend
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot' && (
          <div className="space-y-5">
            {!otpSent ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <span>{isSubmitting ? 'Sending reset code...' : 'Send Password Reset Code'}</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setMode('password')}
                  className="w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Back to sign in
                </button>
              </div>
            ) : !otpVerified ? (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enter code sent to <strong className="text-blue-600 dark:text-blue-400">{identifier}</strong>
                  </p>
                </div>
                <OTPInput
                  length={6}
                  onComplete={handleOtpLoginComplete}
                  disabled={isVerifyingOtp}
                  isInvalid={otpInvalid}
                  isLoading={isVerifyingOtp}
                />
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">
                    {timer > 0 ? `Resend in ${timer}s` : 'Didn’t receive code?'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!canResend || isSubmitting}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Resend
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 transition-all"
                >
                  {isSubmitting ? 'Updating password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Google OAuth Option */}
        {mode === 'password' && (
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
            {googleConfigured ? (
              <div className="flex justify-center [&>div]:w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in was cancelled or failed.')}
                  width="100%"
                  shape="pill"
                  text="signin_with"
                />
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400">
                Secured with end-to-end encrypted session keys.
              </p>
            )}
          </div>
        )}

        {/* Switch to Signup */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Don’t have an account yet?{' '}
          <button
            type="button"
            onClick={switchToSignup}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  )
}