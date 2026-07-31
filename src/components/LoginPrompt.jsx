import { ArrowRightCircle } from 'lucide-react'

function LoginPrompt() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl border border-dashed border-blue-200 bg-blue-50/80 p-6 text-center text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] font-semibold">Login</p>
        <p className="mt-2 text-base">Use your happy mood emoji instead of a normal sign in button.</p>
      </div>
      <ArrowRightCircle size={26} />
    </div>
  )
}

export default LoginPrompt
