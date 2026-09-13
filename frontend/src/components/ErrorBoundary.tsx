import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches any uncaught error thrown while rendering the app (a bad API
 * response shaped unexpectedly, a null field the UI didn't guard against,
 * etc.) and shows a recoverable screen instead of the blank white page
 * React 18 leaves behind by default when nothing catches the error.
 *
 * This intentionally sits once at the very top of the tree (see main.tsx)
 * so no single view can ever take the whole app down silently.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the real error in the console so it's actually debuggable —
    // this is what a bug report / browser devtools screenshot should show,
    // instead of just "the screen went white".
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This screen hit an unexpected error. Your data is safe — try again, and if it keeps happening,
              use "Report a Problem" to let us know what you were doing.
            </p>
          </div>
          <p className="text-xs font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 break-words">
            {error.message}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold btn-primary"
            >
              <RotateCcw size={14} /> Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-700"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    )
  }
}
