import { useState, useEffect } from 'react'
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import OTPInput from './OTPInput'
import { sendOtp, verifyOtp, registerUser } from '../utils/authStorage'

interface SignupProps {
  switchToLogin: () => void
  onSuccess?: (email: string) => void
}

type Step = 'input' | 'otp' | 'password'

export default function Signup({ switchToLogin, onSuccess }: SignupProps) {
  const [step, setStep] = useState<Step>('input')

  // Inputs
  const [email, setEmail] = useState('')

  // OTP State
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpInvalid, setOtpInvalid] = useState(false)
  const [otpSuccess, setOtpSuccess] = useState(false)
  const [timer, setTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [attempts, setAttempts] = useState(0)

  // Password Setup
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  // Feedback & Mood
  const [selectedMood, setSelectedMood] = useState('😊')
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const identifier = email.trim()

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    } else if (timer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [step, timer])

  // Password Validation Criteria
  const hasMinLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length
  const getStrengthBarColor = () => {
    if (strengthScore <= 2) return 'bg-rose-500'
    if (strengthScore <= 4) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  // Handlers
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    setInfoMessage(null)

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setIsSendingOtp(true)
    try {
      await sendOtp(identifier)
      setStep('otp')
      setTimer(60)
      setCanResend(false)
      setAttempts(0)
      setInfoMessage(`Verification code sent to ${identifier}`)
    } catch (err) {
      setError((err as Error).message || 'Failed to send verification code. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleOtpComplete = async (enteredOtp: string) => {
    if (attempts >= 5) {
      setError('Maximum attempts exceeded. Please request a new verification code.')
      return
    }

    setError(null)
    setIsVerifyingOtp(true)
    setOtpInvalid(false)

    try {
      await verifyOtp(identifier, enteredOtp)
      setOtpSuccess(true)
      setTimeout(() => {
        setStep('password')
        setInfoMessage('Code verified! Now create a secure password.')
      }, 600)
    } catch (err) {
      setOtpInvalid(true)
      setAttempts((prev) => prev + 1)
      setError((err as Error).message || 'Invalid verification code. Please try again.')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid) {
      setError('Please ensure your password meets all the security requirements.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }

    setIsCreatingAccount(true)
    try {
      await registerUser({
        email: identifier,
        password,
        mood: selectedMood,
      })
      if (onSuccess) {
        onSuccess(identifier)
      } else {
        switchToLogin()
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to create account. Please try again.')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/80 rounded-[32px] p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3">
            <Sparkles size={14} /> Student Platform Signup
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Your Account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            {step === 'input' && 'Verify your email address to begin.'}
            {step === 'otp' && 'Enter the 6-digit verification code sent to your email.'}
            {step === 'password' && 'Set up your password and personalize your profile.'}
          </p>
        </div>

        {/* Step Progression Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              step === 'input' ? 'w-10 bg-blue-600' : 'w-4 bg-emerald-500'
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              step === 'otp' ? 'w-10 bg-blue-600' : step === 'password' ? 'w-4 bg-emerald-500' : 'w-4 bg-slate-200 dark:bg-slate-800'
            }`}
          />
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              step === 'password' ? 'w-10 bg-blue-600' : 'w-4 bg-slate-200 dark:bg-slate-800'
            }`}
          />
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {infoMessage && !error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 text-sm">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: METHOD & IDENTIFIER */}
        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Email Address
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
                <Mail size={18} className="text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-base placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50"
            >
              <span>{isSendingOtp ? 'Sending verification code...' : 'Continue with Verification'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Code sent to <span className="font-bold text-blue-600 dark:text-blue-400">{identifier}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep('input')
                  setError(null)
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
              >
                Change email
              </button>
            </div>

            <div className="py-4">
              <OTPInput
                length={6}
                onComplete={handleOtpComplete}
                disabled={isVerifyingOtp || otpSuccess}
                isInvalid={otpInvalid}
                isLoading={isVerifyingOtp}
                isSuccess={otpSuccess}
              />
            </div>

            {/* Resend & Timer */}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                {timer > 0 ? (
                  <span>Resend code in <strong className="text-slate-700 dark:text-slate-200">{timer}s</strong></span>
                ) : (
                  'Didn’t receive the code?'
                )}
              </span>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={!canResend || isSendingOtp}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 flex items-center gap-1.5"
              >
                <RotateCcw size={14} /> Resend OTP
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PASSWORD SETUP & MOOD */}
        {step === 'password' && (
          <form onSubmit={handleCreateAccount} className="space-y-6">
            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Create Password
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
                <Lock size={18} className="text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex h-1.5 w-full gap-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-full flex-1 transition-all duration-300 ${
                          lvl <= strengthScore ? getStrengthBarColor() : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-semibold' : ''}`}>
                      {hasMinLength ? <CheckCircle2 size={13} /> : <XCircle size={13} />} 8+ Characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-semibold' : ''}`}>
                      {hasUpper ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Uppercase
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-semibold' : ''}`}>
                      {hasLower ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Lowercase
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-semibold' : ''}`}>
                      {hasNumber ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Number
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-semibold' : ''}`}>
                      {hasSpecial ? <CheckCircle2 size={13} /> : <XCircle size={13} />} Special Character
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Confirm Password
              </label>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/15 transition-all">
                <Lock size={18} className="text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full bg-transparent text-slate-900 dark:text-white outline-none text-base placeholder:text-slate-400"
                />
                {confirmPassword && (
                  <span>
                    {passwordsMatch ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="text-rose-500" />
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Study Mood Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Choose Your Study Vibe
              </label>
              <div className="flex gap-3 justify-between">
                {['😊', '🚀', '🧠', '🎯', '🔥', '✨'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedMood(emoji)}
                    className={`h-12 w-12 text-2xl rounded-2xl border transition-all ${
                      selectedMood === emoji
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 scale-110 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isPasswordValid || !passwordsMatch || isCreatingAccount}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              <span>{isCreatingAccount ? 'Setting up your account...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={switchToLogin}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}
