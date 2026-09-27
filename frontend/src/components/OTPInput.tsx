import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface OTPInputProps {
  length?: number
  onComplete: (otp: string) => void
  disabled?: boolean
  isInvalid?: boolean
  isLoading?: boolean
  isSuccess?: boolean
}

export default function OTPInput({
  length = 6,
  onComplete,
  disabled = false,
  isInvalid = false,
  isLoading = false,
  isSuccess = false,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!disabled && !isLoading && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [disabled, isLoading])

  useEffect(() => {
    if (isInvalid) {
      // Clear inputs when invalid so user can re-enter quickly
      const timer = setTimeout(() => {
        setOtp(new Array(length).fill(''))
        inputRefs.current[0]?.focus()
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isInvalid, length])

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    if (!val && e.target.value !== '') return

    const newOtp = [...otp]
    newOtp[index] = val.slice(-1)
    setOtp(newOtp)

    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const combined = newOtp.join('')
    if (combined.length === length) {
      onComplete(combined)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      const newOtp = [...otp]
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i]
      }
      setOtp(newOtp)
      const nextIdx = Math.min(pasted.length, length - 1)
      inputRefs.current[nextIdx]?.focus()
      if (pasted.length === length) {
        onComplete(pasted)
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`flex justify-center gap-2 sm:gap-3 ${isInvalid ? 'animate-shake' : ''}`}>
        {otp.map((digit, index) => {
          let borderClass = 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20'
          if (isInvalid) {
            borderClass = 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-600 focus:border-rose-500 focus:ring-rose-500/20'
          } else if (isSuccess) {
            borderClass = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-600'
          } else if (digit) {
            borderClass = 'border-blue-500 bg-blue-50/20 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          }

          return (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled || isLoading || isSuccess}
              aria-label={`Digit ${index + 1} of verification code`}
              className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-2xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm outline-none transition-all duration-200 disabled:opacity-50 ${borderClass}`}
            />
          )
        })}
      </div>
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 animate-pulse">
          <Loader2 size={14} className="animate-spin" /> Verifying code...
        </div>
      )}
      {isSuccess && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 size={14} /> Verified successfully
        </div>
      )}
    </div>
  )
}
